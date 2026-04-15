'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Star } from 'lucide-react';

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  profiles: Profile;
}

interface ReviewListProps {
  userId: string;
}

export default function ReviewList({ userId }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id, profiles!reviews_reviewer_id_fkey(*)')
        .eq('reviewee_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      const reviewData = (data as unknown as ReviewData[]) || [];
      setReviews(reviewData);
      if (reviewData.length > 0) {
        const avg = reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length;
        setAvgRating(Math.round(avg * 10) / 10);
      }
      setLoading(false);
    };
    fetchReviews();
  }, [userId]);

  if (loading) return null;
  if (reviews.length === 0) return null;

  return (
    <div className="glass p-8 animate-fade-in animate-fade-in-delay-2">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>レビュー</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-4 h-4"
                fill={avgRating >= star ? 'var(--warning)' : avgRating >= star - 0.5 ? 'var(--warning)' : 'none'}
                stroke={avgRating >= star - 0.5 ? 'var(--warning)' : 'var(--text-muted)'}
                strokeWidth={1.5} />
            ))}
          </div>
          <span className="text-sm font-bold" style={{ color: 'var(--warning)' }}>{avgRating}</span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({reviews.length}件)</span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center justify-between mb-2">
              <Link href={`/profile/${review.reviewer_id}`} className="flex items-center gap-2 group">
                {review.profiles?.avatar_url ? (
                  <img src={review.profiles.avatar_url} alt={review.profiles.display_name}
                    className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ background: 'var(--surface-solid-2)', color: 'var(--accent-light)' }}>
                    {review.profiles?.display_name?.charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium group-hover:underline" style={{ color: 'var(--text-primary)' }}>
                  {review.profiles?.display_name}
                </span>
              </Link>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="w-3 h-3"
                      fill={review.rating >= star ? 'var(--warning)' : 'none'}
                      stroke={review.rating >= star ? 'var(--warning)' : 'var(--text-muted)'}
                      strokeWidth={1.5} />
                  ))}
                </div>
                <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
                  {new Date(review.created_at).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </div>
            {review.comment && (
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{review.comment}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
