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
} from 'lucide-react';

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  chat_message: <MessageSquare className="w-4 h-4" />,
  inquiry_received: <MessageSquare className="w-4 h-4" />,
  favorite_added: <Heart className="w-4 h-4" />,
  profile_approved: <CheckCircle className="w-4 h-4" />,
  profile_rejected: <XCircle className="w-4 h-4" />,
  report_resolved: <AlertTriangle className="w-4 h-4" />,
};

const ICON_COLORS: Record<string, string> = {
  chat_message: '#6366f1',
  inquiry_received: '#6366f1',
  favorite_added: '#ec4899',
  profile_approved: '#22c55e',
  profile_rejected: '#f59e0b',
  report_resolved: '#8b5cf6',
};

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const response = await fetch('/api/notifications');
      if (!response.ok) throw new Error('通知の取得に失敗しました');
      const result = await response.json();
      setNotifications(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラー');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAllAsRead = async () => {
    try {
      setMarking(true);
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch {
      setError('通知更新に失敗しました');
    } finally {
      setMarking(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '今';
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--surface-3)', borderTopColor: 'var(--accent)' }} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>通知</h1>
          {unreadCount > 0 && (
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>未読 {unreadCount}件</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={marking}
            className="px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-40"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            すべて既読
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)' }}>{error}</div>
      )}

      {notifications.length > 0 ? (
        <div className="rounded-xl overflow-hidden divide-y" style={{ background: 'var(--surface)' }}>
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-start gap-3 px-4 py-3"
              style={{
                background: notification.is_read ? 'transparent' : 'rgba(99,102,241,0.05)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5" style={{ background: 'var(--surface-2)', color: ICON_COLORS[notification.type] || 'var(--text-muted)' }}>
                {NOTIFICATION_ICONS[notification.type] || <Bell className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{notification.title}</p>
                {notification.body && (
                  <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{notification.body}</p>
                )}
                {notification.link && (
                  <Link href={notification.link} className="text-xs font-medium mt-1 inline-block" style={{ color: 'var(--accent)' }}>
                    詳細を見る
                  </Link>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-2">
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{formatDate(notification.created_at)}</span>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl p-12 text-center" style={{ background: 'var(--surface)' }}>
          <Bell className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>通知はありません</p>
        </div>
      )}
    </div>
  );
}
