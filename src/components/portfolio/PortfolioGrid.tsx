'use client';

import { Portfolio } from '@/lib/types';
import { PortfolioCard } from './PortfolioCard';
import Link from 'next/link';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface PortfolioGridProps {
  portfolios: Portfolio[];
  editable?: boolean;
}

export function PortfolioGrid({ portfolios, editable = false }: PortfolioGridProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (portfolios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            ポートフォリオがありません
          </h3>
          <p className="text-slate-600 mb-6">
            {editable
              ? 'まだポートフォリオを作成していません。新しいポートフォリオを作成して、あなたの作品を紹介しましょう。'
              : 'このユーザーはまだポートフォリオを公開していません。'}
          </p>
          {editable && (
            <Link
              href="/portfolio/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors"
            >
              新しいポートフォリオを作成
            </Link>
          )}
        </div>
      </div>
    );
  }

  const handleDeleteClick = (portfolioId: string) => {
    setDeleteId(portfolioId);
  };

  const handleDelete = async (portfolioId: string) => {
    setIsDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('portfolios')
        .delete()
        .eq('id', portfolioId);

      if (error) {
        console.error('削除エラー:', error);
      } else {
        router.refresh();
        setDeleteId(null);
      }
    } catch (err) {
      console.error('削除エラー:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              削除してもよろしいですか？
            </h3>
            <p className="text-slate-600 mb-6">
              このポートフォリオを削除します。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.map(portfolio => (
          <div key={portfolio.id} className="group relative">
            {/* Portfolio Card */}
            <PortfolioCard portfolio={portfolio} />

            {/* Edit/Delete Buttons (editable mode) */}
            {editable && (
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/portfolio/${portfolio.id}/edit`}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-colors"
                  title="編集"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDeleteClick(portfolio.id)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-colors"
                  title="削除"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
