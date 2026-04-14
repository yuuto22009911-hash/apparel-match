'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { REPORT_REASONS } from '@/lib/constants';
import type { ReportReason, ApiResponse, Report } from '@/lib/types';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function ReportPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;
  const supabase = createClient();

  const [reason, setReason] = useState<ReportReason>('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      if (user.id === userId) {
        router.push('/');
        return;
      }

      setCurrentUser(user.id);
    };

    checkAuth();
  }, [userId, router, supabase]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!currentUser) {
      setError('認証が必要です');
      return;
    }

    if (!reason) {
      setError('理由を選択してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reported_user_id: userId,
          reason,
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const result = (await response.json()) as ApiResponse<null>;
        throw new Error(result.error?.message || '通報の送信に失敗しました');
      }

      setSuccess(true);

      // Reset form
      setReason('spam');
      setDescription('');

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通報の送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
      >
        <ArrowLeft className="w-5 h-5" />
        戻る
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">ユーザーを通報</h1>
        <p className="text-slate-600">
          問題のあるユーザーを管理者に報告してください
        </p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex items-start gap-4">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-1">通報しました</h3>
            <p className="text-green-700 text-sm">
              ご報告ありがとうございます。管理者が確認いたします。
            </p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">エラー</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Reason Select */}
          <div>
            <label htmlFor="reason" className="block text-sm font-semibold text-slate-900 mb-2">
              通報理由 <span className="text-red-600">*</span>
            </label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              disabled={loading}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {Object.entries(REPORT_REASONS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              問題の内容に最も適した理由を選択してください
            </p>
          </div>

          {/* Description Textarea */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              詳細説明 <span className="text-slate-500">(任意)</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="具体的な状況や根拠があれば記入してください"
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed resize-none transition-colors duration-200"
            />
            <p className="text-xs text-slate-500 mt-1">
              最大 2000 文字まで入力できます
            </p>
          </div>

          {/* Warning Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <span className="font-semibold">注意:</span> 虚偽の通報は利用規約に違反します。
              慎重にご報告ください。
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200"
            >
              {loading ? '送信中...' : '通報を送信'}
            </button>
            <Link
              href="/"
              className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold rounded-lg transition-colors duration-200"
            >
              キャンセル
            </Link>
          </div>
        </form>
      </div>

      {/* Information Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">ご利用ガイド</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• 通報内容は厳密に確認されます</li>
          <li>• 虚偽の通報は処罰の対象となる可能性があります</li>
          <li>• 通報者の個人情報は対象ユーザーに開示されません</li>
          <li>• 確認後、メール等でご連絡することはございません</li>
        </ul>
      </div>
    </div>
  );
}
