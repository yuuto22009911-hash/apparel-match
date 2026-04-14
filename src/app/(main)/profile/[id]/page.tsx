import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Profile, Portfolio, ProfileWithPortfolios } from '@/lib/types';
import { USER_TYPES } from '@/lib/constants';
import FavoriteButton from '@/components/profile/FavoriteButton';

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

  // Fetch profile with portfolios
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      `
      *,
      portfolios:portfolios(*)
    `
    )
    .eq('id', id)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  const typedProfile = profile as ProfileWithPortfolios;
  const isOwnProfile = user?.id === id;

  // Check if profile is public (unless viewing own profile)
  if (!isOwnProfile && !typedProfile.is_public) {
    notFound();
  }

  const userTypeLabel = USER_TYPES[typedProfile.user_type as keyof typeof USER_TYPES];
  const location = [typedProfile.prefecture, typedProfile.city]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {typedProfile.avatar_url ? (
                <img
                  src={typedProfile.avatar_url}
                  alt={typedProfile.display_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-300 flex items-center justify-center border-4 border-blue-500">
                  <svg
                    className="w-16 h-16 text-slate-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {typedProfile.display_name}
                  </h1>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                      {userTypeLabel}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {isOwnProfile ? (
                    <Link
                      href="/profile/edit"
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      プロフィール編集
                    </Link>
                  ) : (
                    <>
                      <FavoriteButton targetUserId={id} />
                      <Link
                        href={`/inquiry/${id}`}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                      >
                        問い合わせる
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              {typedProfile.bio && (
                <p className="text-slate-600 mb-4">{typedProfile.bio}</p>
              )}

              {/* Location, Website, etc. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {location && (
                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-2 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>{location}</span>
                  </div>
                )}

                {typedProfile.company_name && (
                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-2 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>{typedProfile.company_name}</span>
                  </div>
                )}

                {typedProfile.experience_years !== null && (
                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-2 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{typedProfile.experience_years} 年の経験</span>
                  </div>
                )}

                {typedProfile.website_url && (
                  <div className="flex items-center text-slate-600">
                    <svg
                      className="w-5 h-5 mr-2 text-slate-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    <a
                      href={typedProfile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      ウェブサイト
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          {typedProfile.skills && typedProfile.skills.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                スキル
              </h2>
              <div className="flex flex-wrap gap-2">
                {typedProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-slate-100 text-slate-800 text-sm font-medium rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Portfolio Section */}
        {typedProfile.portfolios && typedProfile.portfolios.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">
              ポートフォリオ
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(typedProfile.portfolios as Portfolio[]).map((portfolio) => (
                <Link
                  key={portfolio.id}
                  href={`/portfolio/${portfolio.id}`}
                  className="group"
                >
                  <div className="bg-slate-100 rounded-lg overflow-hidden mb-4 aspect-square">
                    {portfolio.image_urls && portfolio.image_urls.length > 0 ? (
                      <img
                        src={portfolio.image_urls[0]}
                        alt={portfolio.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-12 h-12 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {portfolio.title}
                  </h3>
                  {portfolio.description && (
                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                      {portfolio.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {(!typedProfile.portfolios || typedProfile.portfolios.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-slate-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-slate-600">
              ポートフォリオがまだ登録されていません
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
