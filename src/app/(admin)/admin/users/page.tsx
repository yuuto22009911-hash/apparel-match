'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { USER_TYPES, PROFILE_STATUSES } from '@/lib/constants';
import { CheckCircle, XCircle, Ban } from 'lucide-react';
import type { Profile } from '@/lib/types';

type ProfileStatus = 'pending' | 'approved' | 'rejected' | 'banned';

export default function UserManagementPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProfileStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter((u) => u.status === statusFilter));
    }
  }, [statusFilter, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setUsers((data as Profile[]) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの取得に失敗しました');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: ProfileStatus) => {
    try {
      setActionInProgress(userId);
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: newStatus })
        .eq('id', userId);

      if (updateError) throw updateError;

      setUsers((prevUsers) =>
        prevUsers.map((u) =>
          u.id === userId ? { ...u, status: newStatus } : u
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ユーザーの更新に失敗しました');
      console.error('Error updating user:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadgeColor = (status: ProfileStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'banned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">ユーザー情報を読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          ユーザー管理
        </h1>
        <p className="text-lg text-slate-600">
          全ユーザーの管理と承認処理
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          すべて ({users.length})
        </button>
        {(Object.entries(PROFILE_STATUSES) as Array<[ProfileStatus, string]>).map(
          ([key, label]) => {
            const count = users.filter((u) => u.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === key
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {label} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden overflow-x-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-600">
            ユーザーが見つかりません
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  表示名
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  ユーザータイプ
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  ステータス
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  登録日
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                  アクション
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {user.display_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {USER_TYPES[user.user_type] || user.user_type}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        user.status as ProfileStatus
                      )}`}
                    >
                      {PROFILE_STATUSES[user.status as ProfileStatus] || user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {user.status !== 'approved' && (
                        <button
                          onClick={() => updateUserStatus(user.id, 'approved')}
                          disabled={actionInProgress === user.id}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <CheckCircle className="w-3 h-3" />
                          承認
                        </button>
                      )}
                      {user.status !== 'rejected' && user.status !== 'banned' && (
                        <button
                          onClick={() => updateUserStatus(user.id, 'rejected')}
                          disabled={actionInProgress === user.id}
                          className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <XCircle className="w-3 h-3" />
                          却下
                        </button>
                      )}
                      {user.status !== 'banned' && (
                        <button
                          onClick={() => updateUserStatus(user.id, 'banned')}
                          disabled={actionInProgress === user.id}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Ban className="w-3 h-3" />
                          BAN
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
