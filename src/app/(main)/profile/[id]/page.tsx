import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Profile, Portfolio, ProfileWithPortfolios } from '@/lib/types';
import { USER_TYPES } from '@/lib/constants';
import FavoriteButton from '@/components/profile/FavoriteButton';
import StartChatButton from '@/components/chat/StartChatButton';

export const metadata = {
  title: 'プロフィール',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(`*, portfolios:portfolios(*)`)
    .eq('id', id)
    .single();

  if (profileError || !profile) notFound();

  const typedProfile = profile as ProfileWithPortfolios;
  const isOwnProfile = user?.id === id;

  if (!isOwnProfile && !typedProfile.is_public) notFound();

  const userTypeLabel = USER_TYPES[typedProfile.user_type as keyof typeof USER_TYPES];
  const location = [typedProfile.prefecture, typedProfile.city].filter(Boolean).join(' ');

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Profile Header */}
      <div className="glass p-8 animate-fade-in">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="avatar-ring">
              {typedProfile.avatar_url ? (
                <img src={typedProfile.avatar_url} alt={typedProfile.display_name}
                  className="w-28 h-28 rounded-full object-cover" />
              ) : (
                <div className="w-28 h-28 rounded-full flex items-center justify-center text-3xl font-bold"
                  style={{ background: 'var(--surface-solid-2)', color: 'var(--accent-light)' }}>
                  {typedProfile.display_name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                  {typedProfile.display_name}
                </h1>
                <span className="tag">{userTypeLabel}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {isOwnProfile ? (
                  <Link href="/profile/edit" className="btn-primary px-5 py-2.5 text-sm">
                    プロフィール編集
                  </Link>
                ) : (
                  <>
                    {user && <StartChatButton targetUserId={id} />}
                    <FavoriteButton targetUserId={id} />
                    <Link href={`/inquiry/${id}`} className="btn-glass px-4 py-2.5 text-sm">
                      問い合わせ
                    </Link>
                    <Link href={`/report/${id}`} className="px-3 py-2.5 rounded-xl text-xs font-medium transition-colors"
                      style={{ color: 'var(--text-muted)' }}>
                      通報
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Bio */}
            {typedProfile.bio && (
              <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{typedProfile.bio}</p>
            )}

            {/* Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {location && (
                <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  {location}
                </div>
              )}
              {typedProfile.company_name && (
                <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  {typedProfile.company_name}
                </div>
              )}
              {typedProfile.experience_years !== null && (
                <div className="flex items-center gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  経験 {typedProfile.experience_years}年
                </div>
              )}
              {typedProfile.website_url && (
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <a href={typedProfile.website_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-light)' }}>
                    ウェブサイト
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        {typedProfile.skills && typedProfile.skills.length > 0 && (
          <div className="mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
            <h2 className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>スキル</h2>
            <div className="flex flex-wrap gap-2">
              {typedProfile.skills.map((skill) => (
                <span key={skill} className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Portfolio */}
      {typedProfile.portfolios && typedProfile.portfolios.length > 0 ? (
        <div className="glass p-8 animate-fade-in animate-fade-in-delay-1">
          <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>ポートフォリオ</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(typedProfile.portfolios as Portfolio[]).map((portfolio) => (
              <Link key={portfolio.id} href={`/portfolio/${portfolio.id}`}
                className="group rounded-2xl overflow-hidden transition-all hover:ring-1"
                style={{ background: 'var(--surface-solid-2)', '--tw-ring-color': 'var(--border-light)' } as React.CSSProperties}>
                <div className="aspect-square overflow-hidden">
                  {portfolio.image_urls && portfolio.image_urls.length > 0 ? (
                    <img src={portfolio.image_urls[0]} alt={portfolio.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{portfolio.title}</h3>
                  {portfolio.description && (
                    <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{portfolio.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass p-16 text-center animate-fade-in animate-fade-in-delay-1">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>ポートフォリオがまだ登録されていません</p>
        </div>
      )}
    </div>
  );
}
