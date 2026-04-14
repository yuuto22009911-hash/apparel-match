'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/lib/types';
import {
  Bell,
  MessageSquare,
  Heart,
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  chat_message: <MessageSquare className="w-5 h-5" />,
  inquiry_received: <MessageSquare className="w-5 h-5" />,
  favorite_added: <Heart className="w-5 h-5" />,
  profile_approved: <CheckCircle className="w-5 h-5" />,
  profile_rejected: <XCircle className="w-5 h-5" />,
  report_resolved: <AlertTriangle className="w-5 h-5" />,
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
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

      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('通知の取得に失敗しました');
      }

      const result = await response.json();
      setNotifications(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarking(true);
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('通知の更新に失敗しました');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : '通知更新に失敗しました');
    } finally {
      setMarking(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return '今';
    } else if (diffMins < 60) {
      return `${diffMins}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Get icon color based on type
  const getIconColor = (type: string) => {
    switch (type) {
      case 'chat_message':
      case 'inquiry_received':
        return 'text-blue-600';
      case 'favorite_added':
        return 'text-red-600';
      case 'profile_approved':
        return 'text-green-600';
      case 'profile_rejected':
        return 'text-orange-600';
      case 'report_resolved':
        return 'text-purple-600';
      default:
        return 'text-slate-600';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">通知</h1>
          <p className="text-slate-600">
            {unreadCount > 0 ? `未読通知: ${unreadCount}件` : '通知一覧'}
          </p>
        </div>

        {/* Mark All as Read Button */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={marking}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors duration-200"
          >
            既読にする
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">エラー</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Notifications List */}
      {!loading && (
        <>
          {notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-lg border transition-colors duration-200 p-4 ${
                    notification.is_read
                      ? 'bg-white border-slate-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 mt-1 ${getIconColor(notification.type)}`}
                    >
                      {NOTIFICATION_ICONS[notification.type] || (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">
                        {notification.title}
                      </h3>

                      {notification.body && (
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                          {notification.body}
                        </p>
                      )}

                      {/* Link if available */}
                      {notification.link && (
                        <Link
                          href={notification.link}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
                        >
                          詳細を見る →
                        </Link>
                      )}
                    </div>

                    {/* Time and Read Indicator */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-slate-500 mb-2">
                        {formatDate(notification.created_at)}
                      </p>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                通知はありません
              </h3>
              <p className="text-slate-600">
                新しい通知がここに表示されます
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
