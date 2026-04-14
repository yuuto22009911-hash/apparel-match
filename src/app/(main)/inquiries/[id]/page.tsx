'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Inquiry, Profile } from '@/lib/types';
import { USER_TYPES } from '@/lib/constants';
import { AlertCircle, X } from 'lucide-react';

interface InquiryDetail {
  id: string;
  from_user_id: string;
  to_user_id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from_profile: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  to_profile: any;
}

export default function InquiryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const inquiryId = params.id as string;

  const [inquiry, setInquiry] = useState<InquiryDetail | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch inquiry detail and current user
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        setCurrentUserId(user.id);

        // Fetch inquiry with profiles
        const { data: inquiryData, error: inquiryError } = await supabase
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
            from_profile:profiles!from_user_id (*),
            to_profile:profiles!to_user_id (*)
          `
          )
          .eq('id', inquiryId)
          .single();

        if (inquiryError || !inquiryData) {
          setError('問い合わせが見つかりません');
          return;
        }

        setInquiry(inquiryData);

        // Update status to 'read' if current user is recipient and status is 'unread'
        if (
          inquiryData.to_user_id === user.id &&
          inquiryData.status === 'unread'
        ) {
          await supabase
            .from('inquiries')
            .update({ status: 'read' })
            .eq('id', inquiryId);

          // Update local state
          setInquiry((prev) =>
            prev ? { ...prev, status: 'read' } : null
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データ取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [inquiryId]);

  // Handle mark as closed
  const handleMarkClosed = async () => {
    if (!inquiry || !currentUserId) return;

    // Only recipient can close
    if (inquiry.to_user_id !== currentUserId) {
      setError('この操作を実行する権限がありません');
      return;
    }

    try {
      setClosing(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('inquiries')
        .update({ status: 'closed' })
        .eq('id', inquiryId);

      if (updateError) throw updateError;

      // Update local state
      setInquiry((prev) =>
        prev ? { ...prev, status: 'closed' } : null
      );

      // Redirect to inquiries list
      router.push('/inquiries');
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作に失敗しました');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !inquiry) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">エラー</h3>
          <p className="text-red-700 text-sm">{error || '問い合わせが見つかりません'}</p>
        </div>
      </div>
    );
  }

  const isCurrentUserRecipient = inquiry.to_user_id === currentUserId;
  const fromProfile = inquiry.from_profile;
  const toProfile = inquiry.to_profile;

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {inquiry.subject}
          </h1>
          <p className="text-slate-600">
            {new Date(inquiry.created_at).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
        >
          <X className="w-6 h-6 text-slate-600" />
        </button>
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

      {/* From/To Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* From User */}
        {fromProfile && (
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase">
              差出人
            </h3>
            <Link
              href={`/profile/${fromProfile.id}`}
              className="block hover:opacity-75 transition-opacity duration-200"
            >
              <div className="flex items-start gap-4">
                {fromProfile.avatar_url ? (
                  <img
                    src={fromProfile.avatar_url}
                    alt={fromProfile.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="font-semibold text-slate-600">
                      {fromProfile.display_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900">
                    {fromProfile.display_name}
                  </p>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded mt-2">
                    {USER_TYPES[fromProfile.user_type as keyof typeof USER_TYPES] || fromProfile.user_type}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* To User */}
        {toProfile && (
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase">
              宛先
            </h3>
            <Link
              href={`/profile/${toProfile.id}`}
              className="block hover:opacity-75 transition-opacity duration-200"
            >
              <div className="flex items-start gap-4">
                {toProfile.avatar_url ? (
                  <img
                    src={toProfile.avatar_url}
                    alt={toProfile.display_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="font-semibold text-slate-600">
                      {toProfile.display_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-bold text-slate-900">
                    {toProfile.display_name}
                  </p>
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded mt-2">
                    {USER_TYPES[toProfile.user_type as keyof typeof USER_TYPES] || toProfile.user_type}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-2 uppercase">
          ステータス
        </h3>
        <div className="flex items-center gap-4">
          <span
            className={`px-4 py-2 text-sm font-semibold rounded-full ${
              inquiry.status === 'unread'
                ? 'bg-red-100 text-red-800'
                : inquiry.status === 'read'
                  ? 'bg-slate-100 text-slate-800'
                  : inquiry.status === 'replied'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
            }`}
          >
            {inquiry.status === 'unread'
              ? '未読'
              : inquiry.status === 'read'
                ? '既読'
                : inquiry.status === 'replied'
                  ? '返信済み'
                  : 'クローズ'}
          </span>
        </div>
      </div>

      {/* Message */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-4 uppercase">
          メッセージ
        </h3>
        <p className="text-slate-700 whitespace-pre-wrap">
          {inquiry.message}
        </p>
      </div>

      {/* Actions */}
      {isCurrentUserRecipient && inquiry.status !== 'closed' && (
        <div className="flex gap-4">
          <button
            onClick={handleMarkClosed}
            disabled={closing}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {closing ? 'クローズ中...' : 'クローズ'}
          </button>

          <button
            onClick={() => router.back()}
            className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors duration-200"
          >
            戻る
          </button>
        </div>
      )}

      {/* View as Read-Only */}
      {!isCurrentUserRecipient && (
        <button
          onClick={() => router.back()}
          className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors duration-200"
        >
          戻る
        </button>
      )}
    </div>
  );
}
