'use client';

import { useState } from 'react';
import { Share2, Link2, Check, X as XIcon } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  compact?: boolean;
}

export default function ShareButton({ title, text, url, compact = false }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || title;

  const handleShare = async () => {
    // Try native Web Share API first (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch {
        // User cancelled or not supported, fall through to menu
      }
    }
    // Fallback: show share menu
    setShowMenu(true);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => { setCopied(false); setShowMenu(false); }, 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => { setCopied(false); setShowMenu(false); }, 1500);
    }
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    setShowMenu(false);
  };

  const shareToLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(lineUrl, '_blank');
    setShowMenu(false);
  };

  if (compact) {
    return (
      <>
        <button onClick={handleShare}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}
          title="共有">
          <Share2 className="w-4 h-4" />
        </button>
        {showMenu && <ShareMenu onClose={() => setShowMenu(false)} onCopy={copyToClipboard} onTwitter={shareToTwitter} onLine={shareToLine} copied={copied} />}
      </>
    );
  }

  return (
    <>
      <button onClick={handleShare}
        className="btn-glass flex items-center gap-2 px-4 py-2.5 text-sm">
        <Share2 className="w-4 h-4" /> 共有
      </button>
      {showMenu && <ShareMenu onClose={() => setShowMenu(false)} onCopy={copyToClipboard} onTwitter={shareToTwitter} onLine={shareToLine} copied={copied} />}
    </>
  );
}

function ShareMenu({ onClose, onCopy, onTwitter, onLine, copied }: {
  onClose: () => void;
  onCopy: () => void;
  onTwitter: () => void;
  onLine: () => void;
  copied: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)' }} />
      <div
        className="relative w-full max-w-lg rounded-t-3xl overflow-hidden animate-fade-in"
        style={{ background: 'var(--surface-solid)', borderTop: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface-3)' }} />
        </div>

        <div className="px-5 pb-2">
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>共有</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 grid grid-cols-3 gap-4">
          {/* Copy Link */}
          <button onClick={onCopy} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-colors"
              style={{ background: copied ? 'rgba(52,211,153,0.15)' : 'var(--surface-2)' }}>
              {copied ? (
                <Check className="w-6 h-6" style={{ color: 'var(--success)' }} />
              ) : (
                <Link2 className="w-6 h-6" style={{ color: 'var(--text-secondary)' }} />
              )}
            </div>
            <span className="text-[10px] font-medium" style={{ color: copied ? 'var(--success)' : 'var(--text-muted)' }}>
              {copied ? 'コピー済み' : 'リンクをコピー'}
            </span>
          </button>

          {/* X (Twitter) */}
          <button onClick={onTwitter} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--text-secondary)' }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>X</span>
          </button>

          {/* LINE */}
          <button onClick={onLine} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#06C755' }}>
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
            </div>
            <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>LINE</span>
          </button>
        </div>

        <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }} />
      </div>
    </div>
  );
}
