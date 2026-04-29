/**
 * チャット詳細画面のスケルトン。
 * - ヘッダ・メッセージ4件・入力欄を「実画面と同じ寸法」で先出し
 * - 自分/相手のメッセージを左右に分けて雰囲気を再現
 */
export default function ChatRoomSkeleton() {
  const messages = [
    { mine: false, w: '60%' },
    { mine: true, w: '50%' },
    { mine: false, w: '75%' },
    { mine: true, w: '40%' },
  ];

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header skeleton */}
      <div
        className="flex items-center gap-3 pb-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="skeleton-block w-8 h-8 rounded-lg" />
        <div className="skeleton-block w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="skeleton-block h-3.5 w-32 rounded" />
          <div className="skeleton-block h-2.5 w-20 rounded" />
        </div>
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-y-auto py-4 px-1 space-y-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.mine ? 'justify-end' : 'justify-start'} animate-fade-in`}
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'forwards' }}
          >
            <div
              className="skeleton-block h-9 rounded-2xl"
              style={{ width: m.w, maxWidth: '78%' }}
            />
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="flex-shrink-0 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="skeleton-block flex-1 h-11 rounded-full" />
          <div className="skeleton-block w-11 h-11 rounded-full" />
        </div>
      </div>
    </div>
  );
}
