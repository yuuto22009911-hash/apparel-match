'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Inquiry, Profile } from '@/lib/types';
import { INQUIRY_STATUSES } from '@/lib/constants';
import { Mail, AlertCircle } from 'lucide-react';

export default function InquiriesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [receivedInquiries, setReceivedInquiries] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sentInquiries, setSentInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  // Fetch inquiries
  const fetchInquiries = async () => {
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

      setCurrentUserId(user.id);

      // Fetch received inquiries
      const { data: received, error: receivedError } = await supabase
        .from('inquiries')
        .select(
          `
          id,
          from_user_id,
          to_user_id,
          subject,
          message,
          status,
          created_at,
          from_profile:profiles!from_user_id (id, display_name, avatar_url),
          to_profile:profiles!to_user_id (id, display_name, avatar_url)
        `
        )
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false });

      if (receivedError) throw receivedError;

      // Fetch sent inquiries
      const { data: sent, error: sentError } = await supabase
        .from('inquiries')
        .select(
          `
          id,
          from_user_id,
          to_user_id,
          subject,
          message,
          status,
          created_at,
          from_profile:profiles!from_user_id (id, display_name, avatar_url),
          to_profile:profiles!to_user_id (id, display_name, avatar_url)
        `
        )
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false });

      if (sentError) throw sentError;

      setReceivedInquiries(received || []);
      setSentInquiries(sent || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '問い合わせ取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return 'bg-red-100 text-red-800';
      case 'read':
        return 'bg-slate-100 text-slate-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return '昨日';
    } else {
      return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
    }
  };

  const displayInquiries = activeTab === 'received' ? receivedInquiries : sentInquiries;
  const isEmptyState = displayInquiries.length === 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">問い合わせ</h1>
        <p className="text-slate-600">
          受信・送信した問い合わせを確認できます
        </p>
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

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('received')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'received'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          受信 ({receivedInquiries.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-3 font-semibold border-b-2 transition-colors duration-200 ${
            activeTab === 'sent'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          送信 ({sentInquiries.length})
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Results */}
      {!loading && (
        <>
          {!isEmptyState ? (
            <div className="space-y-3">
              {displayInquiries.map((inquiry) => {
                const otherProfile =
                  activeTab === 'received' ? inquiry.from_profile : inquiry.to_profile;

                return (
                  <Link
                    key={inquiry.id}
                    href={`/inquiries/${inquiry.id}`}
                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                  >
                    <div className="p-6 flex items-center justify-between gap-4">
                      {/* Left Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">
                          {inquiry.subject}
                        </h3>

                        {/* User Info */}
                        {otherProfile && (
                          <div className="flex items-center gap-2 mb-3">
                            {otherProfile.avatar_url ? (
                              <img
                                src={otherProfile.avatar_url}
                                alt={otherProfile.display_name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold">
                                {otherProfile.display_name.charAt(0)}
                              </div>
                            )}
                            <span className="text-sm text-slate-600">
                              {activeTab === 'received' ? 'より:' : 'へ:'}{' '}
                              <span className="font-semibold text-slate-900">
                                {otherProfile.display_name}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Message Preview */}
                        <p className="text-sm text-slate-600 line-clamp-1">
                          {inquiry.message}
                        </p>
                      </div>

                      {/* Right Content */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Status Badge */}
                        <span
                          className={`px-3 py-1 text-sm font-semibold rounded-full whitespace-nowrap ${getStatusBadge(
                            inquiry.status
                          )}`}
                        >
                          {INQUIRY_STATUSES[inquiry.status as keyof typeof INQUIRY_STATUSES]}
                        </span>

                        {/* Date */}
                        <div className="text-sm text-slate-500 text-right w-12">
                          {formatDate(inquiry.created_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <Mail className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {activeTab === 'received' ? '受信メッセージはありません' : '送信メッセージはありません'}
              </h3>
              <p className="text-slate-600">
                {activeTab === 'received'
                  ? 'まだ問い合わせを受け取っていません'
                  : 'まだ問い合わせを送信していません'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
