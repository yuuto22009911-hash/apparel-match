# アパレルマッチングプラットフォーム — 全体設計書

## コンセプト

アパレル業界のサプライチェーンをつなぐマッチングプラットフォーム。
デザイナーが最適なパートナー（パタンナー・縫製・生地屋・OEM）を見つけ、
パタンナーや職人が認知され仕事を得られる場所。

**競合との差別化**: nutte（縫製のみ）に対し、パタンナー・生地屋・OEMまでアパレル全工程をカバー。

---

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Next.js 16.2.3 (App Router) |
| バックエンド | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| ホスティング | Vercel |
| メール | Resend (noreply@monofloras.com) |
| ドメイン | monofloras.com (お名前.com) |

---

## ユーザー種別

| key | 表示名 | 役割 |
|-----|--------|------|
| designer | デザイナー | 依頼する側。パートナーを探す |
| patternmaker | パタンナー | パターン作成の専門家 |
| seamstress | 縫製職人 / 個人縫製 | 縫製を請け負う個人・小規模事業者 |
| fabric | 生地屋 | 生地の提供・販売 |
| brand | ブランド | ブランド運営者 |
| factory | 工場 / OEM | 量産・OEM対応 |

> ※ Phase 3 で seamstress, fabric を追加（constants.ts の USER_TYPES を拡張）

---

## フェーズ構成

### Phase 1（完了）— 基盤

- ユーザー登録・メール確認・ログイン
- プロフィール（表示名・自己紹介・都道府県・スキル・ポートフォリオ）
- ユーザー検索（種別・地域・キーワード）
- お気に入り
- 問い合わせ（フォーム形式）
- 通知
- 管理者ダッシュボード（ユーザー承認・通報管理）

### Phase 2（完了）— コミュニケーション強化

- LINE風チャット（1:1 + グループ）
- リアルタイムメッセージ（Supabase Realtime）
- 既読表示・日付セパレーター・オプティミスティックUI
- ダークテーマUI（全ページ）
- プロフィール/検索からのチャット開始ボタン

### Phase 3（次に実装）— マッチング本格化

以下5機能を追加し、「仕事が回るプラットフォーム」へ進化させる。

---

## Phase 3 機能詳細

### 3-1. 案件ボード（Jobs Board）

デザイナーが仕事を投稿し、職人・業者が提案する仕組み。
プラットフォームの核となる機能。

**データベース: `jobs` テーブル**

```sql
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'pattern', 'sewing', 'fabric', 'oem', 'other'
  budget_min INTEGER,      -- 予算下限（円）
  budget_max INTEGER,      -- 予算上限（円）
  deadline DATE,           -- 納期
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  prefecture TEXT,         -- 希望地域
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**データベース: `job_proposals` テーブル**

```sql
CREATE TABLE job_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  proposer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  proposed_price INTEGER,   -- 提示金額
  proposed_deadline DATE,   -- 提示納期
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, proposer_id)
);
```

**ページ構成**

| ルート | 内容 |
|--------|------|
| `/jobs` | 案件一覧（フィルター: カテゴリ, 予算, 地域） |
| `/jobs/new` | 案件投稿フォーム |
| `/jobs/[id]` | 案件詳細 + 提案一覧（オーナーのみ） |
| `/jobs/[id]/propose` | 提案フォーム |
| `/jobs/my` | 自分の投稿した案件 / 提案した案件 |

**フロー**
1. デザイナーが案件を投稿（タイトル・説明・カテゴリ・予算・納期）
2. 職人・業者が案件一覧で閲覧し、提案を送る
3. デザイナーが提案を比較し、承認 → チャットで詳細を詰める
4. 完了後にお互いをレビュー

---

### 3-2. 専門カテゴリ＆スキルタグ検索

既存の検索を強化し、業界特化の絞り込みを可能にする。

**プロフィールに追加するフィールド**

```sql
ALTER TABLE profiles ADD COLUMN specialty_category TEXT;
-- 'pattern', 'sewing', 'fabric', 'oem', 'design', 'brand_management'

ALTER TABLE profiles ADD COLUMN available_for_work BOOLEAN DEFAULT true;
-- 仕事を受けられる状態かどうか

ALTER TABLE profiles ADD COLUMN min_budget INTEGER;
-- 最低受注金額の目安

ALTER TABLE profiles ADD COLUMN instagram_url TEXT;
ALTER TABLE profiles ADD COLUMN twitter_url TEXT;
ALTER TABLE profiles ADD COLUMN sns_url TEXT;
-- SNSリンク（3-4で詳述）
```

**スキルタグの拡充**（constants.ts に追加）

```typescript
export const SKILL_TAGS = {
  // アイテム
  'ワンピース': 'ワンピース',
  'ジャケット': 'ジャケット',
  'ニット': 'ニット',
  'デニム': 'デニム',
  'バッグ': 'バッグ',
  // 対応
  '小ロット対応': '小ロット対応',
  'サンプル対応': 'サンプル対応',
  '量産対応': '量産対応',
  'パターン修正': 'パターン修正',
  // ターゲット
  'レディース': 'レディース',
  'メンズ': 'メンズ',
  'キッズ': 'キッズ',
} as const;
```

**検索UI改善**
- カテゴリフィルター（パタンナー/縫製/生地/OEM）
- スキルタグ複数選択
- 「仕事受付中」フィルター
- 予算帯フィルター

---

### 3-3. レビュー・評価

案件完了後にお互いを評価する仕組み。信頼の可視化。

**データベース: `reviews` テーブル**

```sql
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);
```

**プロフィールに表示**
- 平均評価（★4.8 のように表示）
- レビュー件数
- 直近のレビューコメント

**ルール**
- 案件ステータスが `completed` の場合のみレビュー可能
- 案件のオーナーと承認された提案者のみが互いをレビュー可能
- 投稿後の編集・削除は不可

---

### 3-4. SNSリンク

プロフィールに外部SNS・Webサイトのリンクを追加。
既存の活動実績への導線を作る。

**追加フィールド（3-2のALTERに含む）**
- `instagram_url` — Instagramプロフィール
- `twitter_url` — X（Twitter）プロフィール
- `sns_url` — その他Webサイト/ポートフォリオサイト

**既存の `website_url` と合わせて、プロフィールに4つのリンクアイコンを表示**

表示: Instagram / X / Webサイト / その他リンク
→ 各アイコンをタップで外部サイトへ遷移（target="_blank"）

---

### 3-5. ポートフォリオ強化

既存のポートフォリオ機能を拡張し、実績をより魅力的に見せる。

**追加フィールド**

```sql
ALTER TABLE portfolios ADD COLUMN item_category TEXT;
-- 'onepiece', 'jacket', 'knit', 'bag', 'pants', 'skirt', 'other'

ALTER TABLE portfolios ADD COLUMN role TEXT;
-- 'パターン作成', '縫製', 'デザイン', 'OEM管理'（この案件での自分の役割）

ALTER TABLE portfolios ADD COLUMN client_type TEXT;
-- 'ブランド', '個人デザイナー', 'アパレルメーカー'
```

**表示改善**
- ポートフォリオ詳細ページ（画像スワイプ + 説明 + タグ）
- プロフィールページでのグリッド表示を改善（Instagram風）
- カテゴリ別フィルター

---

## 追加ルート一覧（Phase 3）

```
src/app/(main)/
├── jobs/
│   ├── page.tsx              # 案件一覧
│   ├── new/page.tsx          # 案件投稿
│   ├── my/page.tsx           # マイ案件（投稿・提案）
│   └── [id]/
│       ├── page.tsx          # 案件詳細
│       └── propose/page.tsx  # 提案フォーム
```

## 追加API（Phase 3）

```
src/app/api/
├── jobs/
│   ├── route.ts              # GET: 一覧, POST: 作成
│   └── [id]/
│       ├── route.ts          # GET: 詳細, PATCH: 更新
│       └── proposals/
│           └── route.ts      # GET: 提案一覧, POST: 提案作成
├── reviews/
│   └── route.ts              # POST: レビュー作成
```

---

## 追加 TypeScript 型（types.ts に追加）

```typescript
// ========== Phase 3 Types ==========

export interface Job {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  category: JobCategory;
  budget_min: number | null;
  budget_max: number | null;
  deadline: string | null;
  tags: string[];
  status: JobStatus;
  prefecture: string | null;
  created_at: string;
  updated_at: string;
}

export type JobCategory = 'pattern' | 'sewing' | 'fabric' | 'oem' | 'other';
export type JobStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export interface JobWithOwner extends Job {
  owner: Profile;
  proposal_count?: number;
}

export interface JobProposal {
  id: string;
  job_id: string;
  proposer_id: string;
  message: string;
  proposed_price: number | null;
  proposed_deadline: string | null;
  status: ProposalStatus;
  created_at: string;
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface JobProposalWithProfile extends JobProposal {
  proposer: Profile;
}

export interface Review {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ReviewWithProfile extends Review {
  reviewer: Profile;
  job: Job;
}
```

---

## 追加 Constants（constants.ts に追加）

```typescript
// 案件カテゴリ
export const JOB_CATEGORIES = {
  pattern: 'パターン作成',
  sewing: '縫製',
  fabric: '生地手配',
  oem: 'OEM / 量産',
  other: 'その他',
} as const;

// 案件ステータス
export const JOB_STATUSES = {
  open: '募集中',
  in_progress: '進行中',
  completed: '完了',
  cancelled: 'キャンセル',
} as const;

// 提案ステータス
export const PROPOSAL_STATUSES = {
  pending: '審査中',
  accepted: '採用',
  rejected: '不採用',
  withdrawn: '取り下げ',
} as const;

// ユーザー種別（拡張）
export const USER_TYPES = {
  designer: 'デザイナー',
  patternmaker: 'パタンナー',
  seamstress: '縫製職人',
  fabric: '生地屋',
  brand: 'ブランド',
  factory: '工場 / OEM',
} as const;

// スキルタグ
export const SKILL_TAGS = [
  'レディース', 'メンズ', 'キッズ',
  'ワンピース', 'ジャケット', 'ニット', 'デニム', 'バッグ', 'パンツ', 'スカート',
  '小ロット対応', 'サンプル対応', '量産対応',
  'パターン修正', 'グレーディング',
  'オーガニック素材', 'サステナブル',
] as const;
```

---

## RLS ポリシー（Phase 3）

```sql
-- jobs: 誰でも閲覧可、作成は認証ユーザー、更新・削除はオーナーのみ
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (true);
CREATE POLICY "jobs_insert" ON jobs FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (auth.uid() = owner_id);

-- job_proposals: 案件オーナーと提案者が閲覧可
ALTER TABLE job_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proposals_select" ON job_proposals FOR SELECT
  USING (
    auth.uid() = proposer_id OR
    auth.uid() IN (SELECT owner_id FROM jobs WHERE id = job_id)
  );
CREATE POLICY "proposals_insert" ON job_proposals FOR INSERT
  WITH CHECK (auth.uid() = proposer_id);
CREATE POLICY "proposals_update" ON job_proposals FOR UPDATE
  USING (
    auth.uid() IN (SELECT owner_id FROM jobs WHERE id = job_id)
  );

-- reviews: 誰でも閲覧可、作成は案件関係者のみ
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);
```

---

## 実装順序

| 順 | 機能 | 理由 |
|----|------|------|
| 1 | SNSリンク + プロフィール拡張 | 最も簡単。既存ページの改修のみ |
| 2 | スキルタグ + 検索強化 | プロフィール改修と同時に進められる |
| 3 | ポートフォリオ強化 | 既存機能の拡張 |
| 4 | 案件ボード | 新規テーブル + 新規ページ。最大の目玉 |
| 5 | レビュー・評価 | 案件ボード完成後に実装 |

---

## デプロイ情報

| 項目 | 値 |
|------|-----|
| GitHub | yuuto22009911-hash/apparel-match |
| Vercel URL | https://apparel-match-bojj.vercel.app |
| Supabase | tvgwqwqvitplvykqfjks |
| ドメイン | monofloras.com |
| SMTP | Resend (noreply@monofloras.com) |
