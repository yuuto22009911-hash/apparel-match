import { MessageSquare, Users } from 'lucide-react';
import ChatListSkeleton from '@/components/chat/ChatListSkeleton';

/**
 * /chat へのナビゲーション中に Next.js が自動表示するローディング画面。
 * クライアント JS のロードを待たずに ヘッダ＋スケルトン が描画されるため、
 * 「白画面 → 内容」の体感ジャンプが消える。
 */
export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>チャット</h1>
        <div className="flex gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium opacity-80"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            <MessageSquare className="w-4 h-4" />
            新しいチャット
          </div>
          <div
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium opacity-80"
            style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <Users className="w-4 h-4" />
            グループ
          </div>
        </div>
      </div>
      <ChatListSkeleton count={6} />
    </div>
  );
}
