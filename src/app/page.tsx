import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <div className="lp-page">
      {/* Navigation */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <Link href="/" className="lp-logo-link">
            <img src="/vestie-logo.svg" alt="VESTIE" className="lp-logo-img" />
            <span className="lp-logo-text">VESTIE</span>
          </Link>
          <div className="lp-nav-actions">
            <Link href="/login" className="lp-link-login">ログイン</Link>
            <Link href="/register" className="lp-btn-primary">無料登録</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            アパレル業界特化のマッチング
          </div>
          <h1 className="lp-hero-title">
            つくる人と、<br />
            <span className="lp-gradient-text">届ける人を結ぶ</span>
          </h1>
          <p className="lp-hero-desc">
            デザイナー、パタンナー、縫製職人、生地屋、OEM。
            <br className="lp-br-desktop" />
            アパレルに関わるすべてのプロフェッショナルが出会い、仕事が生まれる場所。
          </p>
          <div className="lp-hero-actions">
            <Link href="/register" className="lp-btn-hero-primary">
              無料で始める
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="lp-arrow-icon">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/login" className="lp-btn-hero-secondary">ログイン</Link>
          </div>
        </div>
        {/* Decorative blobs */}
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
      </section>

      {/* How it works */}
      <section className="lp-section lp-how">
        <div className="lp-section-inner">
          <p className="lp-section-label">How it works</p>
          <h2 className="lp-section-title">3ステップで始められる</h2>
          <div className="lp-steps-grid">
            {[
              { step: '01', title: 'プロフィール登録', desc: 'あなたのスキル・実績・得意分野を登録。ポートフォリオで魅力をアピール。', icon: '✏️' },
              { step: '02', title: '検索 & マッチング', desc: 'カテゴリ・スキル・エリアで絞り込み。最適なパートナーがすぐに見つかる。', icon: '🔍' },
              { step: '03', title: 'チャットで仕事開始', desc: 'リアルタイムチャットで条件を詰めて、すぐにプロジェクト開始。', icon: '💬' },
            ].map((s) => (
              <div key={s.step} className="lp-step-card">
                <div className="lp-step-number">{s.step}</div>
                <div className="lp-step-icon">{s.icon}</div>
                <h3 className="lp-step-title">{s.title}</h3>
                <p className="lp-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="lp-section lp-features">
        <div className="lp-section-inner">
          <p className="lp-section-label">Features</p>
          <h2 className="lp-section-title">VESTIEの特徴</h2>
          <div className="lp-features-grid">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                ),
                title: 'スマート検索',
                desc: 'カテゴリ・スキル・地域で絞り込み。プロフィールを見て直接アプローチ。',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/>
                  </svg>
                ),
                title: '案件ボード',
                desc: '依頼を投稿すれば提案が届く。職人は登録するだけで仕事に出会える。',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                ),
                title: 'リアルタイムチャット',
                desc: '1対1もグループも対応。メール通知で見逃さない。',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                title: '信頼性の可視化',
                desc: 'レビューと評価で信用をスコア化。安心して取引できる。',
              },
            ].map((f, i) => (
              <div key={i} className="lp-feature-card">
                <div className="lp-feature-icon">{f.icon}</div>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User types */}
      <section className="lp-section lp-users">
        <div className="lp-section-inner">
          <p className="lp-section-label">For Professionals</p>
          <h2 className="lp-section-title">すべてのアパレルプロフェッショナルのために</h2>
          <div className="lp-user-tags">
            {[
              { label: 'デザイナー', emoji: '🎨' },
              { label: 'パタンナー', emoji: '📐' },
              { label: '縫製職人', emoji: '🧵' },
              { label: '生地屋', emoji: '🧶' },
              { label: 'ブランド', emoji: '👗' },
              { label: '工場 / OEM', emoji: '🏭' },
            ].map((t) => (
              <span key={t.label} className="lp-user-tag">
                <span className="lp-tag-emoji">{t.emoji}</span>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="lp-section lp-cta">
        <div className="lp-section-inner">
          <div className="lp-cta-card">
            <h2 className="lp-cta-title">さあ、始めましょう</h2>
            <p className="lp-cta-desc">
              無料で登録。あなたのスキルを必要としている人がいます。
            </p>
            <Link href="/register" className="lp-btn-hero-primary">
              アカウントを作成
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="lp-arrow-icon">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src="/vestie-logo.svg" alt="VESTIE" className="lp-footer-logo" />
            <span className="lp-footer-name">VESTIE</span>
          </div>
          <p className="lp-footer-copy">&copy; 2026 VESTIE. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
