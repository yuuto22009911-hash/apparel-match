import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="relative min-h-screen overflow-hidden noise">
      {/* Background orbs */}
      <div className="orb orb-1" style={{ top: '-10%', left: '-5%' }} />
      <div className="orb orb-2" style={{ top: '40%', right: '-10%' }} />
      <div className="orb orb-3" style={{ bottom: '-5%', left: '30%' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 sm:px-10 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-accent-sm"
            style={{ background: 'var(--accent)' }}>
            <span className="text-white text-sm font-bold tracking-tight">AM</span>
          </div>
          <span className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Apparel Match
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium rounded-xl"
            style={{ color: 'var(--text-secondary)' }}>
            ログイン
          </Link>
          <Link href="/register" className="btn-primary px-5 py-2 text-sm">
            無料登録
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pt-20 sm:pt-32 pb-20">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
            style={{ background: 'var(--accent-subtle)', color: 'var(--accent-light)', border: '1px solid rgba(124,91,240,0.15)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-light)' }} />
            アパレル業界特化のマッチング
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span style={{ color: 'var(--text-primary)' }}>つくる人と、</span>
            <br />
            <span className="gradient-text">届ける人を結ぶ</span>
          </h1>

          <p className="text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            デザイナー、パタンナー、縫製職人、生地屋、OEM。
            <br className="hidden sm:block" />
            アパレルに関わるすべてのプロフェッショナルが出会い、仕事が生まれる場所。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn-primary px-8 py-3.5 text-sm font-medium animate-pulse-glow">
              無料で始める
            </Link>
            <Link href="/login" className="btn-glass px-8 py-3.5 text-sm font-medium">
              ログイン
            </Link>
          </div>
        </div>

        {/* Feature cards — Bento Grid */}
        <div className="mt-28 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in animate-fade-in-delay-2">
          {[
            {
              icon: '🔍',
              title: '最適なパートナーを発見',
              desc: 'カテゴリ・スキル・地域で絞り込み、求めていた人材に出会える',
            },
            {
              icon: '💼',
              title: '案件ボードで仕事が回る',
              desc: '依頼を投稿すれば提案が届く。職人は登録するだけで仕事に出会える',
            },
            {
              icon: '💬',
              title: 'シームレスなコミュニケーション',
              desc: 'リアルタイムチャットで素早くやり取り。グループチャットも対応',
            },
          ].map((f, i) => (
            <div key={i} className="glass glass-hover p-6 sm:p-8">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* User types */}
        <div className="mt-20 text-center animate-fade-in animate-fade-in-delay-3">
          <p className="text-xs uppercase tracking-widest font-medium mb-6" style={{ color: 'var(--text-muted)' }}>
            すべてのアパレルプロフェッショナルのために
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['デザイナー', 'パタンナー', '縫製職人', '生地屋', 'ブランド', '工場 / OEM'].map((t) => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center animate-fade-in animate-fade-in-delay-4">
          <div className="glass p-10 sm:p-14 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              さあ、始めましょう
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              無料で登録。あなたのスキルを必要としている人がいます。
            </p>
            <Link href="/register" className="btn-primary px-8 py-3.5 text-sm font-medium inline-block">
              アカウントを作成
            </Link>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 text-center" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            &copy; 2026 Apparel Match. All rights reserved.
          </p>
        </footer>
      </main>
    </div>
  );
}
