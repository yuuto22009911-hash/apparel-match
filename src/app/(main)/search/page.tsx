'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { USER_TYPES, PREFECTURES, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Profile } from '@/lib/types';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import StartChatButton from '@/components/chat/StartChatButton';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    }>
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [userType, setUserType] = useState(searchParams.get('user_type') || '');
  const [prefecture, setPrefecture] = useState(searchParams.get('prefecture') || '');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase.from('profiles').select('*', { count: 'exact' }).eq('is_public', true);
      if (userType) query = query.eq('user_type', userType);
      if (prefecture) query = query.eq('prefecture', prefecture);
      if (keyword) query = query.or(`display_name.ilike.%${keyword}%,bio.ilike.%${keyword}%,company_name.ilike.%${keyword}%`);
      const offset = (currentPage - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1).order('created_at', { ascending: false });
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

  useEffect(() => { fetchProfiles(); }, [userType, prefecture, keyword, currentPage]);

  const inputStyle = {
    background: 'var(--surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  } as React.CSSProperties;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>ユーザー検索</h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>アパレル関係者を探してパートナーを見つけましょう</p>
      </div>

      {/* Filters */}
      <div className="rounded-xl p-5" style={{ background: 'var(--surface)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>ユーザー種別</label>
            <select value={userType} onChange={(e) => { setUserType(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}>
              <option value="">すべて</option>
              {Object.entries(USER_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>都道府県</label>
            <select value={prefecture} onChange={(e) => { setPrefecture(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}>
              <option value="">すべて</option>
              {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>キーワード</label>
            <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }} placeholder="名前、企業など"
              className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2" style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties} />
          </div>
          <div className="flex items-end">
            <button onClick={() => setCurrentPage(1)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'white' }}>
              <Search className="w-4 h-4" /> 検索
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>{error}</div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          {profiles.length > 0 ? (
            <>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {totalCount}件中 {(currentPage - 1) * pageSize + 1}〜{Math.min(currentPage * pageSize, totalCount)}件
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {profiles.map((profile) => (
                  <div key={profile.id} className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)' }}>
                    <Link href={`/profile/${profile.id}`} className="block p-5">
                      <div className="flex items-start justify-between mb-3">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt={profile.display_name} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold" style={{ background: 'var(--surface-3)', color: 'var(--accent-light)' }}>
                            {profile.display_name.charAt(0)}
                          </div>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-light)' }}>
                          {USER_TYPES[profile.user_type]}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{profile.display_name}</h3>

                      <div className="text-xs mb-3 space-y-0.5" style={{ color: 'var(--text-muted)' }}>
                        {profile.prefecture && <p>{profile.prefecture}{profile.city ? ` ${profile.city}` : ''}</p>}
                        {profile.company_name && <p>{profile.company_name}</p>}
                      </div>

                      {profile.bio && <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{profile.bio}</p>}

                      {profile.skills && profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {profile.skills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                              {skill}
                            </span>
                          ))}
                          {profile.skills.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                              +{profile.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </Link>

                    {/* Action bar */}
                    {currentUserId && currentUserId !== profile.id && (
                      <div className="px-5 pb-4 flex gap-2">
                        <StartChatButton targetUserId={profile.id} compact={false} />
                        <Link href={`/profile/${profile.id}`} className="flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-medium"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                          プロフィール
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
                    style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                    <ChevronLeft className="w-4 h-4" /> 前へ
                  </button>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-30"
                    style={{ background: 'var(--surface)', color: 'var(--text-secondary)' }}>
                    次へ <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)' }}>
              <Search className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--surface-3)' }} />
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>検索結果がありません</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>条件を変更して再度検索してください</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
