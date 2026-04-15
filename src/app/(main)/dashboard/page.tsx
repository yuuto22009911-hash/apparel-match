import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Profile } from '@/lib/types';

export const metadata = {
  title: 'ダッシュボード',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect('/profile/edit');
  }

  const { count: portfolioCount } = await supabase
    .from('portfolios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: favoriteCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', user.id);

  const { data: inquiries, count: unreadCount } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact' })
    .eq('to_user_id', user.id)
    .eq('status', 'unread');

  const typedProfile = profile as Profile;

  const statusBanner = () => {
    if (typedProfile.status === 'pending') {
      return (
        <div className="mb-8 glass p-5 flex items-start gap-3 animate-fade-in" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(251,191,36,0.1)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--warning)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>プロフィール承認待ち</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              管理者が確認中です。承認されるとすべての機能が利用できます。
            </p>
          </div>
        </div>
      );
    }
    if (typedProfile.status === 'rejected') {
      return (
        <div className="mb-8 glass p-5 flex items-start gap-3 animate-fade-in" style={{ borderColor: 'rgba(248,113,113,0.2)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.1)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--danger)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>プロフィール非承認</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>プロフィールを修正して再提出してください。</p>
            <Link href="/profile/edit" className="btn-primary inline-block mt-3 px-4 py-1.5 text-xs">
              修正する
            </Link>
          </div>
        </div>
      );
    }
    if (typedProfile.status === 'banned') {
      return (
        <div className="mb-8 glass p-5 flex items-start gap-3 animate-fade-in" style={{ borderColor: 'var(--border)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface-2)' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>アカウント停止</h3>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>利用規約違反によりアカウントが停止されました。</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const stats = [
    { label: 'ポートフォリオ', value: portfolioCount || 0, gradient: 'linear-gradient(135deg, #7c5bf0, #a78bfa)' },
    { label: 'お気に入りされた', value: favoriteCount || 0, gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
    { label: '未読メッセージ', value: unreadCount || 0, gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  ];

  const quickActions = [
    { href: '/search', label: 'パートナーを探す', desc: '最適な人材を検索', icon: '🔍' },
    { href: '/portfolio/new', label: 'ポートフォリオ追加', desc: '作品を公開する', icon: '📸' },
    { href: '/chat', label: 'メッセージ', desc: 'チャットを確認', icon: '💬' },
    { href: '/profile/edit', label: 'プロフィール', desc: '情報を編集する', icon: '✏️' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {statusBanner()}

      {/* Welcome */}
      <div className="mb-10 animate-fade-in">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {typedProfile.display_name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          ようこそ、Apparel Match へ
        </p>
      </div>

      {/* Stats — Bento style */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={stat.label} className={`glass glass-hover stat-card p-6 animate-fade-in animate-fade-in-delay-${i + 1}`}>
            <p className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p className="text-4xl font-bold" style={{ background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions — Bento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action, i) => (
          <Link key={action.href} href={action.href}
            className={`glass glass-hover p-5 block group animate-fade-in animate-fade-in-delay-${Math.min(i + 1, 4)}`}>
            <div className="text-2xl mb-3">{action.icon}</div>
            <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
              {action.label}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* Recent Inquiries */}
      {inquiries && inquiries.length > 0 && (
        <div className="glass p-6 animate-fade-in animate-fade-in-delay-3">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>最新の問い合わせ</h2>
            <Link href="/inquiries" className="text-xs font-medium" style={{ color: 'var(--accent-light)' }}>
              すべて見る →
            </Link>
          </div>
          <div className="space-y-2">
            {inquiries.slice(0, 3).map((inquiry) => (
              <div key={inquiry.id} className="flex items-center justify-between p-4 rounded-xl transition-colors"
                style={{ background: 'var(--surface-2)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{inquiry.subject}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{inquiry.message}</p>
                </div>
                <span className="ml-3 tag flex-shrink-0">未読</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
