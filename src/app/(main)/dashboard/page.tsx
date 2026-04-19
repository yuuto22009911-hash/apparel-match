import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Profile, Job } from '@/lib/types';
import { USER_TYPES, JOB_CATEGORIES } from '@/lib/constants';

export const metadata = { title: 'ホーム' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (profileError || !profile) redirect('/profile/edit');

  const typedProfile = profile as Profile;

  // Fetch latest open jobs (the "hook" — variable reward)
  const { data: recentJobs } = await supabase
    .from('jobs')
    .select('*, profiles!owner_id(display_name, avatar_url)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(5);

  // Fetch newest users (social proof)
  const { data: newUsers } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, user_type, prefecture, skills')
    .eq('is_public', true)
    .neq('id', user.id)
    .order('created_at', { ascending: false })
    .limit(8);

  // Quick stats
  const [{ count: portfolioCount }, { count: favoriteCount }, { count: unreadCount }] = await Promise.all([
    supabase.from('portfolios').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('target_user_id', user.id),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }).eq('to_user_id', user.id).eq('status', 'unread'),
  ]);

  const statusBanner = () => {
    if (typedProfile.status === 'pending') {
      return (
        <div className="mb-5 glass p-4 flex items-center gap-3 animate-fade-in" style={{ borderColor: 'rgba(251,191,36,0.2)' }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--warning)' }} />
          <p className="text-xs font-medium" style={{ color: 'var(--warning)' }}>プロフィール承認待ち — 管理者が確認中です</p>
        </div>
      );
    }
    if (typedProfile.status === 'rejected') {
      return (
        <div className="mb-5 glass p-4 flex items-center gap-3 animate-fade-in" style={{ borderColor: 'rgba(248,113,113,0.2)' }}>
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: 'var(--danger)' }} />
          <div className="flex-1">
            <p className="text-xs font-medium" style={{ color: 'var(--danger)' }}>プロフィール非承認</p>
          </div>
          <Link href="/profile/edit" className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)' }}>修正する</Link>
        </div>
      );
    }
    return null;
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `¥${min.toLocaleString()}〜¥${max.toLocaleString()}`;
    if (min) return `¥${min.toLocaleString()}〜`;
    return `〜¥${max!.toLocaleString()}`;
  };

  // === Profile Completion (Goal Gradient Effect) ===
  const completionItems = [
    { label: 'プロフィール写真', done: !!typedProfile.avatar_url, href: '/profile/edit' },
    { label: '自己紹介', done: !!typedProfile.bio && typedProfile.bio.length > 10, href: '/profile/edit' },
    { label: 'スキル設定', done: !!typedProfile.skills && typedProfile.skills.length >= 1, href: '/profile/edit' },
    { label: '地域設定', done: !!typedProfile.prefecture, href: '/profile/edit' },
    { label: 'ポートフォリオ', done: (portfolioCount || 0) > 0, href: '/portfolio/new' },
  ];
  const completedCount = completionItems.filter(i => i.done).length;
  const completionPct = Math.round((completedCount / completionItems.length) * 100);
  const nextAction = completionItems.find(i => !i.done);

  // === Onboarding Checklist (Zeigarnik Effect) ===
  const onboardingSteps = [
    { label: 'プロフィール写真を追加', done: !!typedProfile.avatar_url, href: '/profile/edit' },
    { label: 'スキルを設定する', done: !!typedProfile.skills && typedProfile.skills.length >= 1, href: '/profile/edit' },
    { label: '自己紹介を書く', done: !!typedProfile.bio && typedProfile.bio.length > 10, href: '/profile/edit' },
    { label: '案件を見てみる', done: (recentJobs?.length || 0) > 0 ? true : false, href: '/jobs' },
    { label: 'パートナーをお気に入り', done: false, href: '/search' }, // Track via favorites count from user
  ];
  // Check if user has favorited anyone
  const { count: myFavCount } = await supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  onboardingSteps[4].done = (myFavCount || 0) > 0;
  const allOnboardingDone = onboardingSteps.every(s => s.done);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
      {statusBanner()}

      {/* Greeting — compact */}
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
          {typedProfile.display_name}さん
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          新しいパートナーや案件をチェックしよう
        </p>
      </div>

      {/* Profile Completion Bar (Goal Gradient Effect) */}
      {completionPct < 100 && (
        <div className="glass p-5 animate-fade-in" style={{ borderColor: 'rgba(124,91,240,0.15)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              プロフィール完成度
            </span>
            <span className="text-xs font-bold" style={{ color: 'var(--accent-light)' }}>{completionPct}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${completionPct}%`,
                background: completionPct >= 80 ? 'var(--success)' : 'linear-gradient(90deg, var(--accent), var(--accent-light))',
              }}
            />
          </div>
          {nextAction && (
            <Link href={nextAction.href} className="flex items-center gap-2 mt-3 text-xs font-medium" style={{ color: 'var(--accent-light)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
              次のステップ: {nextAction.label}を追加
            </Link>
          )}
        </div>
      )}

      {/* Onboarding Checklist (Zeigarnik Effect + Commitment) */}
      {!allOnboardingDone && (
        <div className="glass p-5 animate-fade-in animate-fade-in-delay-1" style={{ borderColor: 'rgba(52,211,153,0.1)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              はじめてのVESTIE
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--success)' }}>
              {onboardingSteps.filter(s => s.done).length}/{onboardingSteps.length}
            </span>
          </div>
          <div className="space-y-2">
            {onboardingSteps.map((step, i) => (
              <Link key={i} href={step.href}
                className="flex items-center gap-3 py-1.5 group">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                  style={step.done
                    ? { background: 'var(--success)', color: '#fff' }
                    : { border: '1.5px solid var(--border-light)' }
                  }>
                  {step.done && '✓'}
                </div>
                <span className="text-xs font-medium"
                  style={{
                    color: step.done ? 'var(--text-muted)' : 'var(--text-secondary)',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}>
                  {step.label}
                </span>
                {!step.done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: 'var(--accent-light)' }}>
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mini Stats Row */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in animate-fade-in-delay-1">
        {[
          { label: '作品', value: portfolioCount || 0, gradient: 'linear-gradient(135deg, #7c5bf0, #a78bfa)' },
          { label: '被お気に入り', value: favoriteCount || 0, gradient: 'linear-gradient(135deg, #ec4899, #f472b6)' },
          { label: '未読', value: unreadCount || 0, gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
        ].map((stat) => (
          <div key={stat.label} className="glass p-4 text-center">
            <p className="text-2xl font-bold" style={{ background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {stat.value}
            </p>
            <p className="text-[10px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Latest Jobs — the "hook" */}
      <section className="animate-fade-in animate-fade-in-delay-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>新着案件</h2>
          <Link href="/jobs" className="text-xs font-medium" style={{ color: 'var(--accent-light)' }}>すべて見る →</Link>
        </div>
        {recentJobs && recentJobs.length > 0 ? (
          <div className="space-y-3">
            {(recentJobs as (Job & { profiles: { display_name: string; avatar_url: string | null } })[]).map((job) => {
              const budget = formatBudget(job.budget_min, job.budget_max);
              return (
                <Link key={job.id} href={`/jobs/${job.id}`} className="glass glass-hover block p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--accent-subtle)' }}>
                      <span className="text-xs font-bold" style={{ color: 'var(--accent-light)' }}>
                        {JOB_CATEGORIES[job.category as keyof typeof JOB_CATEGORIES]?.charAt(0) || '他'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{job.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        <span>{JOB_CATEGORIES[job.category as keyof typeof JOB_CATEGORIES]}</span>
                        {budget && <span>{budget}</span>}
                        {job.prefecture && <span>{job.prefecture}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="glass p-8 text-center">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>まだ案件がありません</p>
            <Link href="/jobs/new" className="inline-block mt-3 btn-primary px-5 py-2 text-xs">案件を投稿する</Link>
          </div>
        )}
      </section>

      {/* New Users — social proof */}
      <section className="animate-fade-in animate-fade-in-delay-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>新着パートナー</h2>
          <Link href="/search" className="text-xs font-medium" style={{ color: 'var(--accent-light)' }}>すべて見る →</Link>
        </div>
        {newUsers && newUsers.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {(newUsers as Pick<Profile, 'id' | 'display_name' | 'avatar_url' | 'user_type' | 'prefecture' | 'skills'>[]).map((u) => (
              <Link key={u.id} href={`/profile/${u.id}`}
                className="glass glass-hover flex-shrink-0 p-4 text-center"
                style={{ width: '130px' }}>
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt={u.display_name} className="w-12 h-12 rounded-full mx-auto object-cover mb-2" />
                ) : (
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center text-sm font-bold mb-2"
                    style={{ background: 'var(--surface-solid-2)', color: 'var(--accent-light)' }}>
                    {u.display_name.charAt(0)}
                  </div>
                )}
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{u.display_name}</p>
                <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {USER_TYPES[u.user_type]}
                </p>
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {/* Quick Action — Post a Job */}
      <Link href="/jobs/new" className="glass glass-hover block p-5 text-center animate-fade-in animate-fade-in-delay-4"
        style={{ borderColor: 'rgba(124,91,240,0.15)' }}>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--accent-light)' }}>パートナーを募集しませんか？</p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>案件を投稿して、最適な職人・業者を見つけましょう</p>
      </Link>
    </div>
  );
}
