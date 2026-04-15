'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { JOB_CATEGORIES } from '@/lib/constants';
import type { Job } from '@/lib/types';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ProposePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    message: '',
    proposed_price: '',
    proposed_deadline: '',
  });

  useEffect(() => {
    const fetchJob = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !data) { router.push('/jobs'); return; }
      if (data.owner_id === user.id) { router.push(`/jobs/${id}`); return; }
      if (data.status !== 'open') { router.push(`/jobs/${id}`); return; }

      // Check if already proposed
      const { data: existing } = await supabase
        .from('job_proposals')
        .select('id')
        .eq('job_id', id)
        .eq('proposer_id', user.id)
        .maybeSingle();

      if (existing) { router.push(`/jobs/${id}`); return; }

      setJob(data as Job);
      setLoading(false);
    };
    fetchJob();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!formData.message.trim()) throw new Error('メッセージを入力してください');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインしてください');

      const { error: dbError } = await supabase.from('job_proposals').insert({
        job_id: id,
        proposer_id: user.id,
        message: formData.message.trim(),
        proposed_price: formData.proposed_price ? parseInt(formData.proposed_price) : null,
        proposed_deadline: formData.proposed_deadline || null,
      });

      if (dbError) throw new Error(`提案に失敗: ${dbError.message}`);
      router.push(`/jobs/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:border-transparent";
  const inputStyle = { background: 'var(--surface-solid-2)', color: 'var(--text-primary)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties;

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <button onClick={() => router.push(`/jobs/${id}`)}
        className="flex items-center gap-1.5 text-sm font-medium transition-colors mb-6 animate-fade-in"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft className="w-4 h-4" /> 案件に戻る
      </button>

      {/* Job Summary */}
      <div className="glass p-5 mb-6 animate-fade-in">
        <span className="tag mb-2 inline-block">{JOB_CATEGORIES[job.category as keyof typeof JOB_CATEGORIES]}</span>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{job.title}</h2>
      </div>

      {/* Proposal Form */}
      <div className="mb-6 animate-fade-in animate-fade-in-delay-1">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>提案を送る</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          あなたのスキルと経験をアピールして提案しましょう
        </p>
      </div>

      <form onSubmit={handleSubmit} className="glass p-8 space-y-6 animate-fade-in animate-fade-in-delay-2">
        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>メッセージ *</label>
          <textarea id="message" value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="自己紹介、実績、この案件への適性などを具体的に記入してください"
            rows={6} className={inputClass + " resize-none"} style={inputStyle} disabled={isSubmitting} />
        </div>

        {/* Price + Deadline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="proposed_price" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>提示金額（円）</label>
            <input type="number" id="proposed_price" value={formData.proposed_price}
              onChange={(e) => setFormData(prev => ({ ...prev, proposed_price: e.target.value }))}
              placeholder="例: 50000" min="0"
              className={inputClass} style={inputStyle} disabled={isSubmitting} />
          </div>
          <div>
            <label htmlFor="proposed_deadline" className="block text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>提示納期</label>
            <input type="date" id="proposed_deadline" value={formData.proposed_deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, proposed_deadline: e.target.value }))}
              className={inputClass} style={inputStyle} disabled={isSubmitting} />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.15)' }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.push(`/jobs/${id}`)} disabled={isSubmitting}
            className="btn-glass flex-1 py-3 text-sm disabled:opacity-40">
            キャンセル
          </button>
          <button type="submit" disabled={isSubmitting}
            className="btn-primary flex-1 py-3 text-sm disabled:opacity-40 flex items-center justify-center gap-2">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? '送信中...' : '提案を送る'}
          </button>
        </div>
      </form>
    </div>
  );
}
