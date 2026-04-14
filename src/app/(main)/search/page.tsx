'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { USER_TYPES, PREFECTURES, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Profile } from '@/lib/types';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>}>
      <SearchContent />
    </Suspense>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filter states
  const [userType, setUserType] = useState(searchParams.get('user_type') || '');
  const [prefecture, setPrefecture] = useState(searchParams.get('prefecture') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Fetch profiles with filters
  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .eq('is_public', true);

      // Apply filters
      if (userType) {
        query = query.eq('user_type', userType);
      }
      if (prefecture) {
        query = query.eq('prefecture', prefecture);
      }
      if (keyword) {
        query = query.or(
          `display_name.ilike.%${keyword}%,bio.ilike.%${keyword}%,company_name.ilike.%${keyword}%`
        );
      }

      // Pagination
      const offset = (currentPage - 1) * pageSize;
      query = query
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });

      const { data, count, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setProfiles(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : '検索に失敗しました');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch when filters or page changes
  useEffect(() => {
    fetchProfiles();
  }, [userType, prefecture, keyword, currentPage]);

  // Handle search with filters reset to page 1
  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">ユーザー検索</h1>
        <p className="text-slate-600">
          アパレル関係者を探して、協力できるパートナーを見つけましょう
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* User Type Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              ユーザー種別
            </label>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {Object.entries(USER_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Prefecture Filter */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              都道府県
            </label>
            <select
              value={prefecture}
              onChange={(e) => setPrefecture(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">すべて</option>
              {PREFECTURES.map((pref) => (
                <option key={pref} value={pref}>
                  {pref}
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              キーワード
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="名前、企業など"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              検索
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          {profiles.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="text-sm text-slate-600">
                {totalCount > 0 && (
                  <p>
                    全<span className="font-semibold text-slate-900">{totalCount}</span>
                    件中 {(currentPage - 1) * pageSize + 1} 〜{' '}
                    {Math.min(currentPage * pageSize, totalCount)}件を表示
                  </p>
                )}
              </div>

              {/* Profile Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {profiles.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profile/${profile.id}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Avatar */}
                      <div className="flex items-start justify-between mb-4">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt={profile.display_name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-slate-600 font-semibold">
                              {profile.display_name.charAt(0)}
                            </span>
                          </div>
                        )}

                        {/* User Type Badge */}
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          {USER_TYPES[profile.user_type]}
                        </span>
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-slate-900 mb-1">
                        {profile.display_name}
                      </h3>

                      {/* Prefecture and Company */}
                      <div className="text-sm text-slate-600 mb-4 space-y-1">
                        {profile.prefecture && (
                          <p>{profile.prefecture}{profile.city ? ` ${profile.city}` : ''}</p>
                        )}
                        {profile.company_name && (
                          <p className="font-medium">{profile.company_name}</p>
                        )}
                      </div>

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                          {profile.bio}
                        </p>
                      )}

                      {/* Skills Tags */}
                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {profile.skills.slice(0, 3).map((skill, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {profile.skills.length > 3 && (
                            <span className="inline-block px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                              +{profile.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    前へ
                  </button>

                  <div className="text-sm text-slate-600 font-semibold">
                    {currentPage} / {totalPages}ページ
                  </div>

                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    次へ
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                検索結果がありません
              </h3>
              <p className="text-slate-600">
                条件に合うユーザーが見つかりませんでした。条件を変更して再度検索してください。
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
