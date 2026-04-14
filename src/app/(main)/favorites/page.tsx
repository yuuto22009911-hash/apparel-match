'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile, FavoriteWithProfile } from '@/lib/types';
import { USER_TYPES } from '@/lib/constants';
import { Heart, AlertCircle } from 'lucide-react';

export default function FavoritesPage() {
  const router = useRouter();
  const supabase = createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Fetch favorites
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('favorites')
        .select(
          `
          id,
          user_id,
          target_user_id,
          created_at,
          target_profile:profiles!target_user_id (*)
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setFavorites(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'お気に入り取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  // Handle remove favorite
  const handleRemoveFavorite = async (favoriteId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setRemovingId(favoriteId);

      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (deleteError) throw deleteError;

      // Update local state
      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'お気に入り削除に失敗しました');
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">お気に入り</h1>
        <p className="text-slate-600">
          保存したユーザープロフィールを確認できます
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">エラー</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && !error && (
        <>
          {favorites.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-900">{favorites.length}</span>
                  件のお気に入り
                </p>
              </div>

              {/* Favorites Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((favorite) => {
                  const profile = favorite.target_profile;
                  return (
                    <Link
                      key={favorite.id}
                      href={`/profile/${profile.id}`}
                      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                    >
                      <div className="p-6">
                        {/* Avatar and Remove Button */}
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

                          {/* Remove Button */}
                          <button
                            onClick={(e) => handleRemoveFavorite(favorite.id, e)}
                            disabled={removingId === favorite.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            title="お気に入りから削除"
                          >
                            <Heart
                              className="w-6 h-6 fill-current"
                              strokeWidth={0}
                            />
                          </button>
                        </div>

                        {/* User Type Badge */}
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full mb-3">
                          {USER_TYPES[profile.user_type as keyof typeof USER_TYPES] || profile.user_type}
                        </span>

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
                            {profile.skills.slice(0, 3).map((skill: string, idx: number) => (
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
                  );
                })}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                お気に入りはまだありません
              </h3>
              <p className="text-slate-600 mb-6">
                検索してユーザーをお気に入りに追加しましょう
              </p>
              <Link
                href="/search"
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
              >
                ユーザーを検索
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
