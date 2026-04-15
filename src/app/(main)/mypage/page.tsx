'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { USER_TYPES } from '@/lib/constants';
import type { Profile } from '@/lib/types';
import {
  User, FileText, Heart, Image, Settings, LogOut,
  HelpCircle, Shield, ChevronRight, Briefcase, Star,
  MoreHorizontal, X, Bell, MapPin,
} from 'lucide-react';

export default function MyPage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ portfolios: 0, favorites: 0, jobs: 0, reviews: 0, avgRating: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', user.id).maybeSingle();

      if (!profileData) { router.push('/profile/edit'); return; }

      const p = profileData as Profile;
      setProfile(p);
      if (p.is_admin) setIsAdmin(true);

      const [
        { count: portfolioCount },
        { count: favoriteCount },
        { count: jobCount },
        { data: reviewData },
      ] = await Promise.all([
        supabase.from('portfolios').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('target_user_id', user.id),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('owner_id', user.id),
        supabase.from('reviews').select('rating').eq('reviewee_id', user.id),
      ]);

      const reviews = (reviewData || []) as { rating: number }[];
      const avg = reviews.length > 0
        ? Math.round(reviews.reduce((s, r) => s + r.rating, 0) / reviews.length * 10) / 10
        : 0;

      setStats({
        portfolios: portfolioCount || 0,
        favorites: favoriteCount || 0,
        jobs: jobCount || 0,
        reviews: reviews.length,
        avgRating: avg,
      });
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (!profile) return null;

  const menuItems = [
    { href: '/profile/edit', label: 'プロフィール編集', icon: Settings },
    { href: '/portfolio/new', label: 'ポートフォリオ追加', icon: Image },
    { href: '/jobs/my', label: 'マイ案件', icon: Briefcase },
    { href: '/favorites', label: 'お気に入り', icon: Heart },
    { href: '/notifications', label: '通知', icon: Bell },
    { href: '/inquiries', label: '問い合わせ', icon: FileText },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-5">
      {/* Profile Card */}
      <div className="glass p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <Link href={`/profile/${profile.id}`} className="flex items-center gap-4 group">
            {profile.avatar_url ? (
              <div className="avatar-ring">
                <img src={profile.avatar_url} alt={profile.display_name} className="w-16 h-16 rounded-full object-cover" />
              </div>
            ) : (
              <div className="avatar-ring">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                  style={{ background: 'var(--surface-solid-2)', color: 'var(--accent-light)' }}>
                  {profile.display_name.charAt(0)}
                </div>
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                {profile.display_name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="tag">{USER_TYPES[profile.user_type]}</span>
                {profile.prefecture && (
                  <span className="flex items-center gap-0.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <MapPin className="w-2.5 h-2.5" /> {profile.prefecture}
                  </span>
                )}
              </div>
            </div>
          </Link>
          <button onClick={() => setShowMenu(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: 'var(--text-muted)', background: 'var(--surface-2)' }}>
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '作品', value: stats.portfolios },
            { label: '被お気に入り', value: stats.favorites },
            { label: '案件', value: stats.jobs },
            { label: '評価', value: stats.avgRating > 0 ? `${stats.avgRating}` : '-', sub: stats.reviews > 0 ? `(${stats.reviews})` : '' },
          ].map((s) => (
            <div key={s.label} className="text-center p-2.5 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {s.value}{s.label === '評価' && stats.avgRating > 0 && <Star className="w-3 h-3 inline ml-0.5 -mt-0.5" fill="var(--warning)" stroke="var(--warning)" />}
              </p>
              <p className="text-[9px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {s.label} {'sub' in s && s.sub}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="glass overflow-hidden animate-fade-in animate-fade-in-delay-1">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-4 px-5 py-4 transition-colors"
              style={{
                borderBottom: i < menuItems.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface-2)' }}>
                <Icon className="w-4.5 h-4.5" style={{ color: 'var(--text-secondary)', width: '18px', height: '18px' }} />
              </div>
              <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
            </Link>
          );
        })}
      </div>

      {/* View Profile Button */}
      <Link href={`/profile/${profile.id}`}
        className="glass glass-hover flex items-center justify-center gap-2 p-4 text-sm font-medium animate-fade-in animate-fade-in-delay-2"
        style={{ color: 'var(--accent-light)' }}>
        <User className="w-4 h-4" /> 公開プロフィールを見る
      </Link>

      {/* 3-dot Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setShowMenu(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)' }} />
          <div
            className="relative w-full max-w-lg rounded-t-3xl overflow-hidden animate-fade-in"
            style={{
              background: 'var(--surface-solid)',
              borderTop: '1px solid var(--border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface-3)' }} />
            </div>

            <div className="px-4 pb-2">
              <div className="flex items-center justify-between px-2 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>設定</h3>
                <button onClick={() => setShowMenu(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-4 py-2 space-y-1">
              {isAdmin && (
                <Link href="/admin" onClick={() => setShowMenu(false)}
                  className="flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                  <Shield className="w-5 h-5" style={{ color: 'var(--warning)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--warning)' }}>管理パネル</span>
                </Link>
              )}
              <Link href="/profile/edit" onClick={() => setShowMenu(false)}
                className="flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <Settings className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>アカウント設定</span>
              </Link>
              <button
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <HelpCircle className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>ヘルプ</span>
              </button>
              <button onClick={() => { setShowMenu(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                <LogOut className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>ログアウト</span>
              </button>
            </div>

            <div style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' }} />
          </div>
        </div>
      )}
    </div>
  );
}
