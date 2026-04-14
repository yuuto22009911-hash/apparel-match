'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { REPORT_REASONS, REPORT_STATUSES } from '@/lib/constants';
import { Eye, CheckCircle, Trash2, MessageSquare } from 'lucide-react';
import type { Report, Profile } from '@/lib/types';

type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

interface ReportWithDetails extends Report {
  reporter?: Profile;
  reported_user?: Profile;
}

export default function ReportManagementPage() {
  const [reports, setReports] = useState<ReportWithDetails[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [showNoteInput, setShowNoteInput] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredReports(reports);
    } else {
      setFilteredReports(
        reports.filter((r) => r.status === statusFilter)
      );
    }
  }, [statusFilter, reports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: fetchError } = await supabase
        .from('reports')
        .select(
          `
          *,
          reporter:reporter_id(id, display_name, avatar_url),
          reported_user:reported_user_id(id, display_name, avatar_url)
        `
        )
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setReports((data as any[]) || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通報情報の取得に失敗しました');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateReportStatus = async (reportId: string, newStatus: ReportStatus) => {
    try {
      setActionInProgress(reportId);
      const supabase = createClient();
      const updateData: Record<string, any> = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }
      const { error: updateError } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (updateError) throw updateError;

      setReports((prevReports) =>
        prevReports.map((r) =>
          r.id === reportId ? { ...r, status: newStatus } : r
        )
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '通報の更新に失敗しました');
      console.error('Error updating report:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const updateAdminNote = async (reportId: string, note: string) => {
    try {
      setActionInProgress(reportId);
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('reports')
        .update({ admin_note: note })
        .eq('id', reportId);

      if (updateError) throw updateError;

      setReports((prevReports) =>
        prevReports.map((r) =>
          r.id === reportId ? { ...r, admin_note: note } : r
        )
      );
      setShowNoteInput({ ...showNoteInput, [reportId]: false });
      setNoteInput({ ...noteInput, [reportId]: '' });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'メモの更新に失敗しました');
      console.error('Error updating note:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const getStatusBadgeColor = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'dismissed':
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-600">通報情報を読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          通報管理
        </h1>
        <p className="text-lg text-slate-600">
          ユーザー通報の管理と対応
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
          すべて ({reports.length})
        </button>
        {(Object.entries(REPORT_STATUSES) as Array<[ReportStatus, string]>).map(
          ([key, label]) => {
            const count = reports.filter((r) => r.status === key).length;
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

      {/* Reports List */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="p-8 text-center text-slate-600 bg-white rounded-lg">
            通報がありません
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-lg shadow-md p-6 border-l-4 border-slate-300"
            >
              {/* Report Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {report.reported_user?.display_name || 'Unknown'} への通報
                    </h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                        report.status as ReportStatus
                      )}`}
                    >
                      {REPORT_STATUSES[report.status as ReportStatus] || report.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">
                    通報者: {report.reporter?.display_name || 'Unknown'} • 報告理由: {REPORT_REASONS[report.reason] || report.reason}
                  </p>
                </div>
              </div>

              {/* Report Details */}
              <div className="mb-4 space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">説明</p>
                  <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">
                    {report.description || '説明なし'}
                  </p>
                </div>
                <div className="text-xs text-slate-500">
                  通報日時: {formatDate(report.created_at)}
                  {report.resolved_at && (
                    <> • 対応日時: {formatDate(report.resolved_at)}</>
                  )}
                </div>
              </div>

              {/* Admin Notes Section */}
              {report.admin_note && (
                <div className="mb-4 p-3 bg-slate-50 rounded border border-slate-200">
                  <p className="text-xs font-medium text-slate-600 mb-1">管理者メモ</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">
                    {report.admin_note}
                  </p>
                </div>
              )}

              {/* Add/Edit Note */}
              {showNoteInput[report.id] && (
                <div className="mb-4">
                  <textarea
                    value={noteInput[report.id] || ''}
                    onChange={(e) =>
                      setNoteInput({ ...noteInput, [report.id]: e.target.value })
                    }
                    placeholder="管理者メモを入力..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() =>
                        updateAdminNote(report.id, noteInput[report.id] || '')
                      }
                      disabled={actionInProgress === report.id}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={() =>
                        setShowNoteInput({ ...showNoteInput, [report.id]: false })
                      }
                      className="px-3 py-1 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded text-xs font-medium transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {report.status !== 'reviewed' && (
                  <button
                    onClick={() => updateReportStatus(report.id, 'reviewed')}
                    disabled={actionInProgress === report.id}
                    className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    確認中
                  </button>
                )}
                {report.status !== 'resolved' && report.status !== 'dismissed' && (
                  <>
                    <button
                      onClick={() => updateReportStatus(report.id, 'resolved')}
                      disabled={actionInProgress === report.id}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      解決済み
                    </button>
                    <button
                      onClick={() => updateReportStatus(report.id, 'dismissed')}
                      disabled={actionInProgress === report.id}
                      className="flex items-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      却下
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setShowNoteInput({ ...showNoteInput, [report.id]: !showNoteInput[report.id] });
                    setNoteInput({ ...noteInput, [report.id]: report.admin_note || '' });
                  }}
                  className="flex items-center gap-1 px-3 py-2 bg-slate-300 hover:bg-slate-400 text-slate-800 rounded text-sm font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  メモ
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
