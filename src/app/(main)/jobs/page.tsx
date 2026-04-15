'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { JOB_CATEGORIES, JOB_STATUSES, PREFECTURES, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import type { Job, Profile } from '@/lib/types';
import { Search, Plus, ChevronLeft, ChevronRight, MapPin, Calendar, Banknote, Clock } from 'lucide-react';

interface JobWithOwner extends Job {
  profiles: Profile;
}

export default function JobsPage() {
  const supabase = createClient();
  const [jobs, setJobs] = useState<JobWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [category, setCategory] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = DEFAULT_PAGE_SIZE;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('jobs')
        .select('*, profiles!owner_id(*)', { count: 'exact' })
        .eq('status', 'open');

      if (category) query = query.eq('category', category);
      if (prefecture) query = query.eq('prefecture', prefecture);
      if (keyword) query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);

      const offset = (currentPage - 1) * pageSize;
      query = query.range(offset, offset + pageSize - 1).order('created_at', { ascending: false });

      const { data, count } = await query;
      setJobs((data as JobWithOwner[]) || []);
      setTotalCount(count || 0);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, [category, prefecture, keyword, currentPage]);

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `¥${min.toLocaleString()} 〜 ¥${max.toLocaleString()}`;
    if (min) return `¥${min.toLocaleString()} 〜`;
    return `〜 ¥${max!.toLocaleString()}`;
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:border-transparent";
  const inputStyle = { background: 'var(--surface-solid-2)', color: 'var(--text-primary)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>案件ボード</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>募集中の案件を探して提案しよう</p>
        </div>
        {currentUserId && (
          <Link href="/jobs/new" className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
            <Plus className="w-4 h-4" /> 案件を投稿
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="glass p-6 animate-fade-in animate-fade-in-delay-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>カテゴリ</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setCurrentPage(1); }}
              className={inputClass} style={inputStyle}>
              <option value="">すべて</option>
              {Object.entries(JOB_CATEGORIES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>エリア</label>
            <select value={prefecture} onChange={(e) => { setPrefecture(e.target.value); setCurrentPage(1); }}
              className={inputClass} style={inputStyle}>
              <option value="">全国</option>
              {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>キーワード</label>
            <input type="text" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCurrentPage(1); }}
              placeholder="タイトル、説明..."
              className={inputClass} style={inputStyle} />
          </div>
          <div className="flex items-end">
            <button onClick={() => setCurrentPage(1)}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm">
              <Search className="w-4 h-4" /> 検索
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {jobs.length > 0 ? (
            <>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {totalCount}件の募集中案件
              </p>
              <div className="space-y-4">
                {jobs.map((job, i) => {
                  const budget = formatBudget(job.budget_min, job.budget_max);
                  return (
                    <Link key={job.id} href={`/jobs/${job.id}`}
                      className={`glass glass-hover block p-6 animate-fade-in animate-fade-in-delay-${Math.min(i % 4 + 1, 4)}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="tag">{JOB_CATEGORIES[job.category as keyof typeof JOB_CATEGORIES] || job.category}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{ background: 'rgba(52,211,153,0.1)', color: 'var(--success)', border: '1px solid rgba(52,211,153,0.2)' }}>
                              {JOB_STATUSES[job.status as keyof typeof JOB_STATUSES]}
                            </span>
                          </div>
                          <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{job.title}</h3>
                          <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>{job.description}</p>

                          <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                            {budget && (
                              <span className="flex items-center gap-1">
                                <Banknote className="w-3.5 h-3.5" /> {budget}
                              </span>
                            )}
                            {job.deadline && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {new Date(job.deadline).toLocaleDateString('ja-JP')}
                              </span>
                            )}
                            {job.prefecture && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> {job.prefecture}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> {new Date(job.created_at).toLocaleDateString('ja-JP')}
                            </span>
                          </div>

                          {job.tags && job.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {job.tags.map((tag, idx) => (
                                <span key={idx} className="px-2.5 py-0.5 rounded-full text-[10px] font-medium"
                                  style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Owner */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {job.profiles?.avatar_url ? (
                            <img src={job.profiles.avatar_url} alt={job.profiles.display_name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                              style={{ background: 'var(--surface-solid-2)', color: 'var(--accent-light)' }}>
                              {job.profiles?.display_name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{job.profiles?.display_name}</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="btn-glass flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-30">
                    <ChevronLeft className="w-4 h-4" /> 前へ
                  </button>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{currentPage} / {totalPages}</span>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="btn-glass flex items-center gap-1.5 px-4 py-2.5 text-sm disabled:opacity-30">
                    次へ <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="glass p-16 text-center">
              <Search className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
              <p className="text-base font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>募集中の案件がありません</p>
              <p className="text-xs mb-6" style={{ color: 'var(--text-muted)' }}>新しい案件を投稿して、パートナーを見つけましょう</p>
              {currentUserId && (
                <Link href="/jobs/new" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm">
                  <Plus className="w-4 h-4" /> 案件を投稿する
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
