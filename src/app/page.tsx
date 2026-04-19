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
            <Link href="/register" className="lp-btn-primary">無料で始める</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">
            <span className="lp-badge-dot" />
            アパレル業界特化のマッチングプラットフォーム
          </div>
          <h1 className="lp-hero-title">
            ファッションの<br className="lp-br-mobile" />想いを、
            <span className="lp-gradient-text">つなぐ</span>
          </h1>
          <p className="lp-hero-desc">
            デザイナー、パタンナー、縫製職人、生地屋、OEM——
            <br className="lp-br-desktop" />
            アパレルに関わるすべてのプロが出会い、仕事が生まれる場所。
          </p>
          <div className="lp-hero-actions">
            <Link href="/register" className="lp-btn-hero-primary">
              無料で始める
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="lp-arrow-icon">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/login" className="lp-btn-hero-secondary">ログインはこちら</Link>
          </div>

          {/* Trust indicators under hero */}
          <div className="lp-hero-trust">
            <span className="lp-trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              完全無料
            </span>
            <span className="lp-trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              安心・安全
            </span>
            <span className="lp-trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              最短30秒で登録
            </span>
          </div>
        </div>
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
      </section>

      {/* Value Props — Quick summary */}
      <section className="lp-section lp-stats-section">
        <div className="lp-section-inner">
          <div className="lp-stats-grid">
            {[
              { value: '¥0', label: '完全無料', sub: '基本機能はすべて無料で利用可能' },
              { value: '30秒', label: 'かんたん登録', sub: 'メールアドレスだけですぐ始められる' },
              { value: '6職種', label: '幅広い対応', sub: 'デザイナーから工場まで全カバー' },
            ].map((s) => (
              <div key={s.label} className="lp-stat-item">
                <div className="lp-stat-value">{s.value}</div>
                <div className="lp-stat-label">{s.label}</div>
                <div className="lp-stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="lp-section lp-problem">
        <div className="lp-section-inner">
          <p className="lp-section-label">Problem</p>
          <h2 className="lp-section-title">こんなお悩みありませんか？</h2>
          <div className="lp-problem-grid">
            {[
              { emoji: '😰', text: '信頼できる縫製工場が見つからない' },
              { emoji: '🔍', text: '自分のスキルに合った案件を探すのが大変' },
              { emoji: '💬', text: '取引相手の実績や評判がわからない' },
              { emoji: '⏰', text: 'マッチングまでに時間がかかりすぎる' },
            ].map((p, i) => (
              <div key={i} className="lp-problem-card">
                <span className="lp-problem-emoji">{p.emoji}</span>
                <p className="lp-problem-text">{p.text}</p>
              </div>
            ))}
          </div>
          <div className="lp-solution-arrow">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
          </div>
          <div className="lp-solution-banner">
            <span className="lp-solution-text">
              VESTIEがすべて解決します
            </span>
          </div>
        </div>
      </section>

      {/* Features — Detailed */}
      <section className="lp-section lp-features">
        <div className="lp-section-inner">
          <p className="lp-section-label">Features</p>
          <h2 className="lp-section-title">VESTIEが選ばれる理由</h2>
          <div className="lp-features-list">
            {[
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                ),
                title: 'スマート検索',
                desc: 'カテゴリ・スキル・地域で絞り込み。プロフィールと実績を確認してから直接アプローチ。',
                highlight: 'カテゴリ・スキル・地域対応',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a4 4 0 0 0-8 0v2"/></svg>
                ),
                title: '案件ボード',
                desc: '依頼を投稿すれば提案が届く。職人は登録するだけで仕事に出会える。',
                highlight: '投稿するだけで提案が届く',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                ),
                title: 'リアルタイムチャット',
                desc: '1対1もグループも対応。メール通知で大事なメッセージを見逃さない。',
                highlight: 'グループチャット対応',
              },
              {
                icon: (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                ),
                title: '信頼性の可視化',
                desc: 'レビューと評価で信用をスコア化。安心して取引できる。',
                highlight: 'レビュー・評価システム搭載',
              },
            ].map((f, i) => (
              <div key={i} className="lp-feature-row">
                <div className="lp-feature-icon-wrap">{f.icon}</div>
                <div className="lp-feature-content">
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-desc">{f.desc}</p>
                  <span className="lp-feature-highlight">{f.highlight}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="lp-section lp-how">
        <div className="lp-section-inner">
          <p className="lp-section-label">How it works</p>
          <h2 className="lp-section-title">かんたん3ステップ</h2>
          <div className="lp-steps-grid">
            {[
              { step: '1', title: 'プロフィール登録', desc: 'スキル・実績・得意分野を登録。ポートフォリオであなたの魅力をアピール。', icon: '✏️' },
              { step: '2', title: '検索 & マッチング', desc: 'カテゴリ・スキル・エリアで絞り込み。理想のパートナーがすぐ見つかる。', icon: '🔍' },
              { step: '3', title: 'チャットで仕事開始', desc: 'リアルタイムチャットで条件を確認。スピーディにプロジェクト開始。', icon: '🚀' },
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

      {/* User types */}
      <section className="lp-section lp-users">
        <div className="lp-section-inner">
          <p className="lp-section-label">For Professionals</p>
          <h2 className="lp-section-title">あなたの「得意」を活かせる場所</h2>
          <div className="lp-user-cards-grid">
            {[
              { label: 'デザイナー', emoji: '🎨', desc: 'コレクション・商品デザインの仕事を受注' },
              { label: 'パタンナー', emoji: '📐', desc: 'パターン作成の依頼をダイレクトに' },
              { label: '縫製職人', emoji: '🧵', desc: '技術を必要とするブランドと直接つながる' },
              { label: '生地屋', emoji: '🧶', desc: '素材を探しているデザイナーにアプローチ' },
              { label: 'ブランド', emoji: '👗', desc: '信頼できるパートナーをスピーディに発見' },
              { label: '工場 / OEM', emoji: '🏭', desc: '製造キャパシティを効率的にフル活用' },
            ].map((t) => (
              <div key={t.label} className="lp-user-card">
                <span className="lp-user-emoji">{t.emoji}</span>
                <span className="lp-user-label">{t.label}</span>
                <span className="lp-user-desc">{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why VESTIE — instead of fake testimonials */}
      <section className="lp-section lp-testimonials">
        <div className="lp-section-inner">
          <p className="lp-section-label">Why VESTIE</p>
          <h2 className="lp-section-title">既存の方法との違い</h2>
          <div className="lp-testimonial-grid">
            {[
              { icon: '❌', before: '知り合いの紹介頼み', after: 'スキル・地域・カテゴリで検索して自分で見つける', label: 'パートナー探し' },
              { icon: '❌', before: '実績や信頼性が不明', after: 'レビュー・評価で取引前に確認できる', label: '信頼性' },
              { icon: '❌', before: 'メールや電話で時間がかかる', after: 'リアルタイムチャットですぐにやり取り', label: 'コミュニケーション' },
            ].map((t, i) => (
              <div key={i} className="lp-testimonial-card">
                <div className="lp-compare-label">{t.label}</div>
                <div className="lp-compare-before"><span className="lp-compare-icon">{t.icon}</span> {t.before}</div>
                <div className="lp-compare-arrow">↓</div>
                <div className="lp-compare-after"><span className="lp-compare-icon">✅</span> {t.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="lp-section lp-faq">
        <div className="lp-section-inner lp-faq-inner">
          <p className="lp-section-label">FAQ</p>
          <h2 className="lp-section-title">よくある質問</h2>
          <div className="lp-faq-list">
            {[
              { q: '利用料金はかかりますか？', a: '基本機能はすべて無料でご利用いただけます。プロフィール作成、検索、チャット、案件投稿など主要機能に費用はかかりません。' },
              { q: 'どんな人が登録していますか？', a: 'デザイナー、パタンナー、縫製職人、生地屋、ブランド、OEM工場など、アパレル業界のあらゆるプロフェッショナルが登録しています。' },
              { q: '個人でも登録できますか？', a: 'はい、個人・法人問わずご登録いただけます。フリーランスのデザイナーや個人の職人の方も多数ご利用中です。' },
              { q: '取引の安全性は？', a: 'レビュー・評価システムによる信頼性の可視化、プロフィール認証機能などで安心してお取引いただけます。' },
            ].map((item, i) => (
              <details key={i} className="lp-faq-item">
                <summary className="lp-faq-question">{item.q}</summary>
                <p className="lp-faq-answer">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="lp-section lp-cta">
        <div className="lp-section-inner">
          <div className="lp-cta-card">
            <h2 className="lp-cta-title">あなたの「つくる力」を、<br />必要としている人がいます</h2>
            <p className="lp-cta-desc">
              登録は無料・最短30秒。今すぐVESTIEで新しいつながりを見つけましょう。
            </p>
            <Link href="/register" className="lp-btn-hero-primary lp-btn-cta-final">
              無料でアカウントを作成
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="lp-arrow-icon">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <p className="lp-cta-note">クレジットカード不要 ・ いつでも退会可能</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <img src="/vestie-logo.svg" alt="VESTIE" className="lp-footer-logo" />
              <span className="lp-footer-name">VESTIE</span>
            </div>
            <p className="lp-footer-tagline">アパレル業界のマッチングプラットフォーム</p>
          </div>
          <div className="lp-footer-bottom">
            <p className="lp-footer-copy">&copy; 2026 VESTIE. All rights reserved.</p>
            <div className="lp-footer-links">
              <Link href="/login" className="lp-footer-link">ログイン</Link>
              <Link href="/register" className="lp-footer-link">無料登録</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
