'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Heart,
  MessageSquare,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  MessagesSquare,
  Shield,
  Home,
} from 'lucide-react';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadNotifications(count || 0);

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      if (profile?.is_admin) setIsAdmin(true);
    };
    fetchCounts();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const navItems = [
    { href: '/dashboard', label: 'ホーム', icon: Home },
    { href: '/search', label: '検索', icon: Search },
    { href: '/chat', label: 'チャット', icon: MessagesSquare },
    {
      href: '/notifications',
      label: '通知',
      icon: Bell,
      badge: unreadNotifications > 0 ? unreadNotifications : undefined,
    },
    { href: '/favorites', label: 'お気に入り', icon: Heart },
    { href: '/profile/edit', label: 'プロフィール', icon: User },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 glass-strong" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
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
                    if (!active) {
                      e.currentTarget.style.background = 'var(--surface-2)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }
                  }}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
                      style={{ background: 'var(--accent)', color: 'white', boxShadow: '0 0 8px var(--accent-glow)' }}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            {isAdmin && (
              <Link href="/admin" className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
                style={{ color: 'var(--warning)' }}>
                <Shield className="w-4 h-4" />
                <span>管理</span>
              </Link>
            )}
          </nav>

          {/* Desktop Logout */}
          <div className="hidden md:flex items-center">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.background = 'rgba(248,113,113,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut className="w-4 h-4" />
              <span>ログアウト</span>
            </button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex items-center gap-1">
            <Link href="/notifications" className="relative inline-flex items-center justify-center p-2 rounded-xl"
              style={{ color: 'var(--text-secondary)' }}>
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] flex items-center justify-center rounded-full text-[8px] font-bold"
                  style={{ background: 'var(--accent)', color: 'white' }}>
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>
            <button onClick={toggleMenu} className="inline-flex items-center justify-center p-2 rounded-xl"
              style={{ color: 'var(--text-secondary)' }} aria-label="メニューを開く">
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-3" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={closeMenu}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                    style={{
                      color: active ? 'var(--accent-light)' : 'var(--text-secondary)',
                      background: active ? 'var(--accent-subtle)' : 'transparent',
                    }}>
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-[10px] font-bold px-1"
                        style={{ background: 'var(--accent)', color: 'white' }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link href="/admin" onClick={closeMenu}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium"
                  style={{ color: 'var(--warning)' }}>
                  <Shield className="w-4 h-4" />
                  <span>管理パネル</span>
                </Link>
              )}
              <button
                onClick={() => { closeMenu(); handleLogout(); }}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium disabled:opacity-40"
                style={{ color: 'var(--danger)' }}>
                <LogOut className="w-4 h-4" />
                <span>ログアウト</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
