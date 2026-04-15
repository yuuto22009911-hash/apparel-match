'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Search, Heart, User, LogOut, Bell, MessagesSquare,
  Shield, Home, FileText, Settings, HelpCircle, ChevronDown,
  Briefcase, Image as ImageIcon,
} from 'lucide-react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ count }, { data: profile }] = await Promise.all([
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        supabase.from('profiles').select('is_admin, avatar_url, display_name').eq('id', user.id).single(),
      ]);
      setUnreadNotifications(count || 0);
      if (profile?.is_admin) setIsAdmin(true);
      if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile?.display_name) setDisplayName(profile.display_name);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const desktopNavItems = [
    { href: '/dashboard', label: 'ホーム', icon: Home },
    { href: '/search', label: '検索', icon: Search },
    { href: '/jobs', label: '案件', icon: FileText },
    { href: '/chat', label: 'チャット', icon: MessagesSquare },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50" style={{
      background: 'rgba(8, 8, 14, 0.85)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/dashboard" className="flex-shrink-0 flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-shadow group-hover:glow-accent-sm"
              style={{ background: 'var(--accent)' }}>
              <span className="text-white text-xs font-bold tracking-tight">AM</span>
            </div>
            <span className="hidden sm:inline text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Apparel Match
            </span>
          </Link>

          {/* Desktop Navigation — center */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    color: active ? 'var(--accent-light)' : 'var(--text-muted)',
                    background: active ? 'var(--accent-subtle)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-primary)'; }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }
                  }}
                >
                  <Icon className="w-4 h-4" strokeWidth={active ? 2.5 : 1.5} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right — notifications + avatar dropdown */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/notifications" className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
              <Bell className="w-[18px] h-[18px]" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold"
                  style={{ background: 'var(--accent)', color: 'white' }}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Avatar Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { if (!showDropdown) e.currentTarget.style.background = 'transparent'; }}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'var(--surface-solid-2)', color: 'var(--accent-light)' }}>
                    {displayName.charAt(0) || 'U'}
                  </div>
                )}
                <ChevronDown className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden shadow-2xl"
                  style={{ background: 'var(--surface-solid)', border: '1px solid var(--border)' }}>
                  <div className="py-2">
                    {[
                      { href: '/mypage', label: 'マイページ', icon: User },
                      { href: '/profile/edit', label: 'プロフィール編集', icon: Settings },
                      { href: '/portfolio/new', label: 'ポートフォリオ追加', icon: ImageIcon },
                      { href: '/jobs/my', label: 'マイ案件', icon: Briefcase },
                      { href: '/favorites', label: 'お気に入り', icon: Heart },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setShowDropdown(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                          style={{ color: 'var(--text-primary)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                          <Icon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                          {item.label}
                        </Link>
                      );
                    })}
                    {isAdmin && (
                      <Link href="/admin" onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                        style={{ color: 'var(--warning)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                        <Shield className="w-4 h-4" /> 管理パネル
                      </Link>
                    )}
                    <div className="my-1" style={{ borderTop: '1px solid var(--border)' }} />
                    <button
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors w-full"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <HelpCircle className="w-4 h-4" /> ヘルプ
                    </button>
                    <button onClick={handleLogout} disabled={isLoggingOut}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors w-full disabled:opacity-40"
                      style={{ color: 'var(--danger)' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.05)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                      <LogOut className="w-4 h-4" /> ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Right — notification only */}
          <div className="md:hidden flex items-center gap-1">
            <Link href="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-xl"
              style={{ color: 'var(--text-secondary)' }}>
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold"
                  style={{ background: 'var(--accent)', color: 'white' }}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
