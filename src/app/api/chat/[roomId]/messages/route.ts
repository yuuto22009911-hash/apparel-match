import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import type { ChatMessage } from '@/lib/types';
import { sendMessageNotification } from '@/lib/email';

// In-memory cooldown map (30 min per recipient)
const COOLDOWN_MS = 30 * 60 * 1000;
const lastNotifiedMap = new Map<string, number>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    // Verify user is a participant in this room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Chat room not found' } },
        { status: 404 }
      );
    }

    if (room.user1_id !== user.id && room.user2_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'User is not a participant in this room' } },
        { status: 403 }
      );
    }

    // Fetch messages for this room
    const { data: messages, error: messagesError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Mark unread messages from the other user as read
    const otherUserId = room.user1_id === user.id ? room.user2_id : room.user1_id;

    const { error: updateError } = await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('room_id', roomId)
      .eq('sender_id', otherUserId)
      .eq('is_read', false);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
    }

    return NextResponse.json({ data: messages || [] });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch messages' } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'content is required and must be non-empty' } },
        { status: 400 }
      );
    }

    // Verify user is a participant in this room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (roomError || !room) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Chat room not found' } },
        { status: 404 }
      );
    }

    if (room.user1_id !== user.id && room.user2_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'User is not a participant in this room' } },
        { status: 403 }
      );
    }

    // Insert the message
    const { data: message, error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        content: content.trim(),
        is_read: false,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update the chat room's last_message and last_message_at
    const { error: updateError } = await supabase
      .from('chat_rooms')
      .update({
        last_message: content.trim(),
        last_message_at: new Date().toISOString(),
      })
      .eq('id', roomId);

    if (updateError) {
      console.error('Error updating chat room:', updateError);
    }

    // Send email notification directly (no fire-and-forget)
    let emailDebug: Record<string, unknown> = { attempted: false };
    try {
      const recipientId = room.user1_id === user.id ? room.user2_id : room.user1_id;
      emailDebug.recipientId = recipientId;

      if (recipientId) {
        // Cooldown check
        const now = Date.now();
        const lastNotified = lastNotifiedMap.get(recipientId) || 0;
        const withinCooldown = (now - lastNotified) < COOLDOWN_MS;
        emailDebug.withinCooldown = withinCooldown;

        if (!withinCooldown) {
          const [senderRes, recipientRes] = await Promise.all([
            supabase.from('profiles').select('display_name').eq('id', user.id).single(),
            supabase.from('profiles').select('display_name, email, email_notifications').eq('id', recipientId).single(),
          ]);

          emailDebug.senderData = senderRes.data;
          emailDebug.senderError = senderRes.error?.message;
          emailDebug.recipientData = { email: recipientRes.data?.email ? '***' : null, notifications: recipientRes.data?.email_notifications, name: recipientRes.data?.display_name };
          emailDebug.recipientError = recipientRes.error?.message;

          const senderName = senderRes.data?.display_name || 'ユーザー';
          const recipient = recipientRes.data;

          if (recipient?.email && recipient.email_notifications !== false) {
            emailDebug.attempted = true;
            emailDebug.hasApiKey = !!process.env.RESEND_API_KEY;
            emailDebug.usingFallback = !process.env.RESEND_API_KEY;
            await sendMessageNotification({
              toEmail: recipient.email,
              toName: recipient.display_name || 'ユーザー',
              senderName,
              messagePreview: content.trim(),
              chatUrl: `/chat/${roomId}`,
              unreadCount: 1,
            });
            lastNotifiedMap.set(recipientId, now);
            emailDebug.sent = true;
          } else {
            emailDebug.skipped = !recipient?.email ? 'no_email' : 'notifications_off';
          }
        }
      }
    } catch (emailErr) {
      emailDebug.error = emailErr instanceof Error ? emailErr.message : String(emailErr);
      console.error('Email notification error:', emailErr);
    }

    return NextResponse.json({ data: message as ChatMessage, _emailDebug: emailDebug }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to send message' } },
      { status: 500 }
    );
  }
}
