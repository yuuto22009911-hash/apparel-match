import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Profile, Inquiry } from '@/lib/types';

export const metadata = {
  title: 'ダッシュボード',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch current user's profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    redirect('/profile/edit');
  }

  // Fetch portfolio count
  const { count: portfolioCount } = await supabase
    .from('portfolios')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Fetch favorite count
  const { count: favoriteCount } = await supabase
    .from('favorites')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', user.id);

  // Fetch unread inquiries
  const { data: inquiries, count: unreadCount } = await supabase
    .from('inquiries')
    .select('*', { count: 'exact' })
    .eq('to_user_id', user.id)
    .eq('status', 'unread');

  const typedProfile = profile as Profile;

  const statusBanner = () => {
    if (typedProfile.status === 'pending') {
      return (
        <div className="mb-8 p-6 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-yellow-800">承認待ち</h3>
              <p className="text-yellow-700 mt-1">
                あなたのプロフィールは現在、管理者による承認を待っています。承認されるまで、一部の機能が制限される場合があります。
              </p>
            </div>
          </div>
        </div>
      );
    }
    if (typedProfile.status === 'rejected') {
      return (
        <div className="mb-8 p-6 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-red-800">プロフィールが承認されませんでした</h3>
              <p className="text-red-700 mt-1">
                プロフィールの内容を修正して再提出してください。ご不明な点がございましたら、管理者にお問い合わせください。
              </p>
              <Link href="/profile/edit" className="inline-block mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors">
                プロフィールを修正する
              </Link>
            </div>
          </div>
        </div>
      );
    }
    if (typedProfile.status === 'banned') {
      return (
        <div className="mb-8 p-6 rounded-lg bg-slate-100 border border-slate-300">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-slate-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-slate-800">アカウントが停止されています</h3>
              <p className="text-slate-700 mt-1">
                お使いのアカウントは利用規約違反により停止されました。詳細は管理者にお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Status Banner */}
        {statusBanner()}

        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            いらっしゃいませ、{typedProfile.display_name}さん
          </h1>
          <p className="text-lg text-slate-600">
            ダッシュボードへようこそ
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Portfolio Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  ポートフォリオ数
                </p>
                <p className="text-4xl font-bold text-slate-900">
                  {portfolioCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
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
            </div>
          </div>

          {/* Favorites Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-pink-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  お気に入りされた数
                </p>
                <p className="text-4xl font-bold text-slate-900">
                  {favoriteCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-pink-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Unread Inquiries Stats Card */}
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">
                  未読問い合わせ数
                </p>
                <p className="text-4xl font-bold text-slate-900">
                  {unreadCount || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            クイックアクション
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/profile/edit"
              className="flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              プロフィール編集
            </Link>

            <Link
              href="/portfolio/add"
              className="flex items-center justify-center px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              ポートフォリオ追加
            </Link>

            <Link
              href="/search"
              className="flex items-center justify-center px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors duration-200"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              ユーザー検索
            </Link>
          </div>
        </div>

        {/* Recent Inquiries Preview */}
        {inquiries && inquiries.length > 0 && (
          <div className="mt-12 bg-white rounded-lg shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                最新の問い合わせ
              </h2>
              <Link
                href="/inquiries"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                すべて見る
              </Link>
            </div>
            <div className="space-y-4">
              {inquiries.slice(0, 3).map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">
                      {inquiry.subject}
                    </p>
                    <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                      {inquiry.message}
                    </p>
                  </div>
                  <div className="ml-4">
                    <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full">
                      未読
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
