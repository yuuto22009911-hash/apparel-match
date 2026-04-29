/**
 * チャットリストのスケルトン。
 * - 行高は実コンポーネントと同じ 72px に固定 → CLS=0
 * - シマーは prefers-reduced-motion で停止（globals.css 側で対応）
 * - スタッガー fade-in で「順次出現」させ、待ち時間の体感を短くする
 */
export default function ChatListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3.5 animate-fade-in"
          style={{
            borderBottom: i < count - 1 ? '1px solid var(--border)' : 'none',
            animationDelay: `${i * 60}ms`,
            animationFillMode: 'forwards',
          }}
        >
          {/* avatar */}
          <div className="skeleton-block flex-shrink-0 w-12 h-12 rounded-full" />
          {/* text */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div
                className="skeleton-block h-3.5 rounded"
                style={{ width: `${50 + ((i * 13) % 35)}%` }}
              />
              <div className="skeleton-block h-2.5 w-10 rounded flex-shrink-0" />
            </div>
            <div
              className="skeleton-block h-3 rounded"
              style={{ width: `${65 + ((i * 7) % 25)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
