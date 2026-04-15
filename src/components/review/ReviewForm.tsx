'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, Loader2 } from 'lucide-react';

interface ReviewFormProps {
  jobId: string;
  revieweeId: string;
  revieweeName: string;
  onComplete: () => void;
}

export default function ReviewForm({ jobId, revieweeId, revieweeName, onComplete }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('評価を選択してください'); return; }

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインしてください');

      const { error: dbError } = await supabase.from('reviews').insert({
        job_id: jobId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment: comment.trim() || null,
      });

      if (dbError) throw new Error(`レビュー投稿に失敗: ${dbError.message}`);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 rounded-2xl space-y-4" style={{ background: 'var(--surface-2)' }}>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        {revieweeName} さんを評価
      </h3>

      {/* Star Rating */}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className="w-7 h-7"
              fill={(hoveredRating || rating) >= star ? 'var(--warning)' : 'none'}
              stroke={(hoveredRating || rating) >= star ? 'var(--warning)' : 'var(--text-muted)'}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="コメント（任意）"
        rows={3}
        className="w-full px-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:border-transparent resize-none"
        style={{ background: 'var(--surface-solid-2)', color: 'var(--text-primary)', borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
        disabled={isSubmitting}
      />

      {error && (
        <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting || rating === 0}
        className="btn-primary w-full py-2.5 text-sm disabled:opacity-40 flex items-center justify-center gap-2"
      >
        {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {isSubmitting ? '送信中...' : 'レビューを送信'}
      </button>
    </form>
  );
}
