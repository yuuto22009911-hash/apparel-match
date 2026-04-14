'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart } from 'lucide-react';

interface FavoriteButtonProps {
  targetUserId: string;
}

export default function FavoriteButton({ targetUserId }: FavoriteButtonProps) {
  const supabase = createClient();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTogglingLoading, setIsTogglingLoading] = useState(false);

  // Check if already favorited on mount
  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data } = await supabase
          .from('favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('target_user_id', targetUserId)
          .single();

        setIsFavorited(!!data);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavorite();
  }, [supabase, targetUserId]);

  const handleToggleFavorite = async () => {
    setIsTogglingLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return;
      }

      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('target_user_id', targetUserId);

        if (error) {
          console.error('Error removing favorite:', error);
          setIsTogglingLoading(false);
          return;
        }

        setIsFavorited(false);
      } else {
        // Add favorite
        const { error } = await supabase.from('favorites').insert({
          user_id: user.id,
          target_user_id: targetUserId,
          created_at: new Date().toISOString(),
        });

        if (error) {
          console.error('Error adding favorite:', error);
          setIsTogglingLoading(false);
          return;
        }

        setIsFavorited(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsTogglingLoading(false);
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className="px-6 py-2 bg-slate-300 text-slate-700 font-semibold rounded-lg cursor-not-allowed"
      >
        <Heart className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isTogglingLoading}
      className={`px-6 py-2 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
        isFavorited
          ? 'bg-pink-600 hover:bg-pink-700 text-white'
          : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Heart
        className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`}
      />
      {isFavorited ? 'お気に入り済み' : 'お気に入り追加'}
    </button>
  );
}
