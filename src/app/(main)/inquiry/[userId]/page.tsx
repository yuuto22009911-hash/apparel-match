'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { USER_TYPES } from '@/lib/constants';
import { Send, AlertCircle } from 'lucide-react';

export default function InquiryPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const userId = params.userId as string;

  const [targetProfile, setTargetProfile] = useState<Profile | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // Fetch target user profile and current user
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

        setCurrentUser({ id: user.id });

        // Fetch target profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError || !profile) {
          setError('ユーザーが見つかりません');
          return;
        }

        setTargetProfile(profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'データ取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !subject.trim() || !message.trim()) {
      setError('件名とメッセージを入力してください');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const { error: insertError } = await supabase.from('inquiries').insert([
        {
          from_user_id: currentUser.id,
          to_user_id: userId,
          subject: subject.trim(),
          message: message.trim(),
          status: 'unread',
        },
      ]);

      if (insertError) throw insertError;

      // Redirect to inquiries page
      router.push('/inquiries');
    } catch (err) {
      setError(err instanceof Error ? err.message : '問い合わせ送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !targetProfile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-900">エラー</h3>
          <p className="text-red-700 text-sm">{error || 'ユーザーが見つかりません'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">問い合わせを送信</h1>
        <p className="text-slate-600">
          以下のユーザーに問い合わせを送信します
        </p>
      </div>

      {/* Target User Info */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <div className="flex items-start gap-4">
          {targetProfile.avatar_url ? (
            <img
              src={targetProfile.avatar_url}
              alt={targetProfile.display_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
              <span className="text-slate-600 font-semibold text-lg">
                {targetProfile.display_name.charAt(0)}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-xl font-bold text-slate-900">
              {targetProfile.display_name}
            </h2>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full mt-2">
              {USER_TYPES[targetProfile.user_type]}
            </span>
            {targetProfile.company_name && (
              <p className="text-slate-600 mt-2">{targetProfile.company_name}</p>
            )}
          </div>
        </div>
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

      {/* Inquiry Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* Subject Field */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
              件名 <span className="text-red-600">*</span>
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="例：パターンメイキングのご相談"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            />
          </div>

          {/* Message Field */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
              メッセージ <span className="text-red-600">*</span>
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="詳細な内容を入力してください"
              rows={8}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={submitting}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting || !subject.trim() || !message.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            {submitting ? '送信中...' : '送信'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            disabled={submitting}
            className="px-6 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors duration-200 disabled:opacity-50"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
