'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, PlusCircle, MessageCircle, User } from 'lucide-react';

const tabs = [
  { href: '/dashboard', label: 'ホーム', icon: Home },
  { href: '/search', label: '検索', icon: Search },
  { href: '/jobs', label: '案件', icon: PlusCircle },
  { href: '/chat', label: 'チャット', icon: MessageCircle },
  { href: '/mypage', label: 'マイページ', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/mypage') return pathname === '/mypage' || pathname.startsWith('/profile') || pathname.startsWith('/favorites');
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(8, 8, 14, 0.92)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center justify-around h-14 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.href);
          const isCenter = tab.href === '/jobs';

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors"
              style={{ color: active ? 'var(--accent-light)' : 'var(--text-muted)' }}
            >
              {isCenter ? (
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center -mt-3 transition-all"
                  style={{
                    background: active ? 'var(--accent)' : 'var(--surface-solid-2)',
                    boxShadow: active ? '0 4px 16px var(--accent-glow)' : 'none',
                  }}
                >
                  <Icon className="w-5 h-5" style={{ color: active ? 'white' : 'var(--text-muted)' }} strokeWidth={active ? 2.5 : 1.5} />
                </div>
              ) : (
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
              )}
              <span className="text-[9px] font-medium leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
      {/* Safe area for notched phones */}
      <div className="h-safe-area" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  );
}
