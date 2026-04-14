import { createClient } from '@/lib/supabase/server';
import { Users, AlertCircle, Clock } from 'lucide-react';

export const metadata = {
  title: 'ダッシュボード - 管理パネル',
};

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Fetch stats
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  const { count: pendingUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  const { count: pendingReports } = await supabase
    .from('reports')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  return (
    <div className="min-h-screen">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          ダッシュボード
        </h1>
        <p className="text-lg text-slate-600">
          システムの概要と統計情報
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                総ユーザー数
              </p>
              <p className="text-4xl font-bold text-slate-900">
                {totalUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending Approval Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                承認待ちユーザー
              </p>
              <p className="text-4xl font-bold text-slate-900">
                {pendingUsers || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Pending Reports Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 mb-1">
                未対応通報数
              </p>
              <p className="text-4xl font-bold text-slate-900">
                {pendingReports || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12 bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">
          クイックアクション
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/admin/users"
            className="flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            <Users className="w-5 h-5 mr-2" />
            ユーザー管理を表示
          </a>

          <a
            href="/admin/reports"
            className="flex items-center justify-center px-6 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            通報管理を表示
          </a>
        </div>
      </div>
    </div>
  );
}
