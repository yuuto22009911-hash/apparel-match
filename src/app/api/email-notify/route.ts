import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { sendMessageNotification } from '@/lib/email';

/**
 * Smart email notification endpoint.
 * Called after a chat message is sent.
 * Uses a 30-minute cooldown per recipient so they don't get spammed.
 *
 * Body: { recipientId: string, senderName: string, messagePreview: string, roomId: string }
 */

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// In-memory cooldown map (per-process; resets on deploy — acceptable for this use case)
const lastNotifiedMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const { recipientId, senderName, messagePreview, roomId } = await request.json();

    if (!recipientId || !senderName || !roomId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Cooldown check — don't send if notified within 30 minutes
    const now = Date.now();
    const lastNotified = lastNotifiedMap.get(recipientId) || 0;
    if (now - lastNotified < COOLDOWN_MS) {
      return NextResponse.json({ skipped: true, reason: 'cooldown' });
    }

    const supabase = await createClient();

    // Get recipient profile (email from auth.users via profiles join is not directly accessible,
    // so we use the service role or fetch from auth)
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, email, email_notifications')
      .eq('id', recipientId)
      .single();

    if (!profile?.email) {
      return NextResponse.json({ skipped: true, reason: 'no_email' });
    }

    // Respect user's notification preference
    if (profile.email_notifications === false) {
      return NextResponse.json({ skipped: true, reason: 'notifications_disabled' });
    }

    // Count total unread messages for this user
    const { count: unreadCount } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', recipientId)
      // We check messages in rooms where the user is a participant
      // For simplicity, we'll just use the count from this specific trigger
      ;

    await sendMessageNotification({
      toEmail: profile.email,
      toName: profile.display_name,
      senderName,
      messagePreview: messagePreview || 'メッセージが届きました',
      chatUrl: `/chat/${roomId}`,
      unreadCount: unreadCount || 1,
    });

    // Update cooldown
    lastNotifiedMap.set(recipientId, now);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
