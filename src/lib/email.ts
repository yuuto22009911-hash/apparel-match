import { Resend } from 'resend';

// Lazy initialization — avoid build-time error when RESEND_API_KEY is not set
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY || 're_L7KEQxUF_LTxubkzs57FA62MGHh7J5XJ1';
    if (!key) throw new Error('RESEND_API_KEY is not configured');
    _resend = new Resend(key);
  }
  return _resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || 'MONOFLORAS <onboarding@resend.dev>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://apparel-match-bojj.vercel.app';

interface SendMessageNotificationParams {
  toEmail: string;
  toName: string;
  senderName: string;
  messagePreview: string;
  chatUrl: string;
  unreadCount: number;
}

export async function sendMessageNotification({
  toEmail,
  toName,
  senderName,
  messagePreview,
  chatUrl,
  unreadCount,
}: SendMessageNotificationParams) {
  const preview = messagePreview.length > 80 ? messagePreview.slice(0, 80) + '...' : messagePreview;
  const fullChatUrl = chatUrl.startsWith('http') ? chatUrl : `${SITE_URL}${chatUrl}`;

  const subject = unreadCount > 1
    ? `${senderName}さんほかから${unreadCount}件の未読メッセージがあります`
    : `${senderName}さんからメッセージが届きました`;

  const result = await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject,
    html: buildMessageEmailHtml({
      toName,
      senderName,
      preview,
      fullChatUrl,
      unreadCount,
    }),
  });

  if (result.error) {
    console.error('Email send error:', result.error);
    throw new Error(JSON.stringify(result.error));
  }

  return { id: result.data?.id, from: FROM_EMAIL, to: toEmail };
}

function buildMessageEmailHtml({
  toName,
  senderName,
  preview,
  fullChatUrl,
  unreadCount,
}: {
  toName: string;
  senderName: string;
  preview: string;
  fullChatUrl: string;
  unreadCount: number;
}) {
  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <!-- Header -->
    <div style="text-align:center;padding:32px 0 24px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#e0e0e6;letter-spacing:0.5px;">MONOFLORAS</h1>
    </div>

    <!-- Card -->
    <div style="background:#1a1a24;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px 24px;">
      <p style="margin:0 0 8px;font-size:14px;color:#a0a0b0;">
        ${toName}さん
      </p>
      <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#e0e0e6;">
        ${unreadCount > 1
          ? `${unreadCount}件の未読メッセージがあります`
          : `${senderName}さんからメッセージが届きました`
        }
      </h2>

      <!-- Message Preview -->
      <div style="background:rgba(124,91,240,0.08);border-left:3px solid #7c5bf0;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#a78bfa;">${senderName}</p>
        <p style="margin:0;font-size:14px;color:#c0c0d0;line-height:1.5;">${preview}</p>
      </div>

      <!-- CTA Button -->
      <a href="${fullChatUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#7c5bf0,#a78bfa);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;">
        チャットを開く
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;">
      <p style="margin:0;font-size:11px;color:#606070;line-height:1.6;">
        このメールは<a href="${fullChatUrl}" style="color:#7c5bf0;text-decoration:none;">MONOFLORAS</a>の通知メールです。<br>
        通知が不要な場合はプロフィール設定から変更できます。
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ── Notification for job proposals ──

interface SendProposalNotificationParams {
  toEmail: string;
  toName: string;
  proposerName: string;
  jobTitle: string;
  jobUrl: string;
}

export async function sendProposalNotification({
  toEmail,
  toName,
  proposerName,
  jobTitle,
  jobUrl,
}: SendProposalNotificationParams) {
  const fullJobUrl = jobUrl.startsWith('http') ? jobUrl : `${SITE_URL}${jobUrl}`;

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: toEmail,
    subject: `${proposerName}さんが「${jobTitle}」に提案しました`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;padding:0 16px;">
    <div style="text-align:center;padding:32px 0 24px;">
      <h1 style="margin:0;font-size:20px;font-weight:700;color:#e0e0e6;letter-spacing:0.5px;">MONOFLORAS</h1>
    </div>
    <div style="background:#1a1a24;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:32px 24px;">
      <p style="margin:0 0 8px;font-size:14px;color:#a0a0b0;">${toName}さん</p>
      <h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#e0e0e6;">新しい提案が届きました</h2>
      <div style="background:rgba(52,211,153,0.08);border-left:3px solid #34d399;border-radius:0 8px 8px 0;padding:16px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#34d399;">${proposerName}さんが提案</p>
        <p style="margin:0;font-size:14px;color:#c0c0d0;line-height:1.5;">「${jobTitle}」に新しい提案があります。</p>
      </div>
      <a href="${fullJobUrl}" style="display:block;text-align:center;background:linear-gradient(135deg,#7c5bf0,#a78bfa);color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;">
        提案を確認する
      </a>
    </div>
    <div style="text-align:center;padding:24px 0;">
      <p style="margin:0;font-size:11px;color:#606070;line-height:1.6;">
        このメールは<a href="${fullJobUrl}" style="color:#7c5bf0;text-decoration:none;">MONOFLORAS</a>の通知メールです。
      </p>
    </div>
  </div>
</body>
</html>`,
  });

  if (error) {
    console.error('Email send error:', error);
    throw error;
  }
}
