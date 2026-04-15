import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Profile, Inquiry } from '@/lib/types';

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
        <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--warning)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--warning)' }}>承認待ち</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              プロフィールは管理者による承認を待っています。
            </p>
          </div>
        </div>
      );
    }
    if (typedProfile.status === 'rejected') {
      return (
        <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--danger)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>非承認</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>プロフィールを修正して再提出してください。</p>
            <Link href="/profile/edit" className="inline-block mt-2 px-3 py-1 rounded-md text-xs font-medium" style={{ background: 'var(--danger)', color: 'white' }}>
              プロフィールを修正
            </Link>
          </div>
        </div>
      );
    }
    if (typedProfile.status === 'banned') {
      return (
        <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>アカウント停止</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>利用規約違反によりアカウントが停止されました。</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const stats = [
    { label: 'ポートフォリオ', value: portfolioCount || 0, color: '#6366f1' },
    { label: 'お気に入りされた数', value: favoriteCount || 0, color: '#ec4899' },
    { label: '未読問い合わせ', value: unreadCount || 0, color: '#f59e0b' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {statusBanner()}

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {typedProfile.display_name}
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ダッシュボード</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl p-5" style={{ background: 'var(--surface)', borderLeft: `3px solid ${stat.color}` }}>
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl p-6" style={{ background: 'var(--surface)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>クイックアクション</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/profile/edit" className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all" style={{ background: 'var(--accent)', color: 'white' }}>
            プロフィール編集
          </Link>
          <Link href="/portfolio/add" className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
            ポートフォリオ追加
          </Link>
          <Link href="/search" className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all" style={{ background: 'var(--surface-2)', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
            ユーザー検索
          </Link>
        </div>
      </div>

      {/* Recent Inquiries */}
      {inquiries && inquiries.length > 0 && (
        <div className="mt-6 rounded-xl p-6" style={{ background: 'var(--surface)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>最新の問い合わせ</h2>
            <Link href="/inquiries" className="text-xs font-medium" style={{ color: 'var(--accent)' }}>すべて見る</Link>
          </div>
          <div className="space-y-2">
            {inquiries.slice(0, 3).map((inquiry) => (
              <div key={inquiry.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{inquiry.subject}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{inquiry.message}</p>
                </div>
                <span className="ml-3 px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--warning)' }}>
                  未読
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
