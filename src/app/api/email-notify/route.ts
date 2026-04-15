import { NextRequest, NextResponse } from 'next/server';
import { sendMessageNotification } from '@/lib/email';

/**
 * Smart email notification endpoint.
 * Called after a chat message is sent.
 * Uses a 30-minute cooldown per recipient so they don't get spammed.
 *
 * Body: { recipientId, recipientEmail, recipientName, senderName, messagePreview, roomId }
 */

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

// In-memory cooldown map (per-process; resets on deploy — acceptable for this use case)
const lastNotifiedMap = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const {
      recipientId,
      recipientEmail,
      recipientName,
      senderName,
      messagePreview,
      roomId,
    } = await request.json();

    if (!recipientId || !recipientEmail || !senderName || !roomId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Cooldown check — don't send if notified within 30 minutes
    const now = Date.now();
    const lastNotified = lastNotifiedMap.get(recipientId) || 0;
    if (now - lastNotified < COOLDOWN_MS) {
      return NextResponse.json({ skipped: true, reason: 'cooldown' });
    }

    await sendMessageNotification({
      toEmail: recipientEmail,
      toName: recipientName || 'ユーザー',
      senderName,
      messagePreview: messagePreview || 'メッセージが届きました',
      chatUrl: `/chat/${roomId}`,
      unreadCount: 1,
    });

    // Update cooldown
    lastNotifiedMap.set(recipientId, now);

    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('Email notification error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
