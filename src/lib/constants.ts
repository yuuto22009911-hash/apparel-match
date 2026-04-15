// ユーザー種別（Phase 3 拡張）
export const USER_TYPES = {
  designer: 'デザイナー',
  patternmaker: 'パタンナー',
  seamstress: '縫製職人',
  fabric: '生地屋',
  brand: 'ブランド',
  factory: '工場 / OEM',
} as const;

export type UserType = keyof typeof USER_TYPES;

// 都道府県
export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;

// ポートフォリオカテゴリ
export const PORTFOLIO_CATEGORIES = {
  womenswear: 'レディース',
  menswear: 'メンズ',
  kidswear: 'キッズ',
  accessories: 'アクセサリー',
  sportswear: 'スポーツウェア',
  uniforms: 'ユニフォーム',
  other: 'その他',
} as const;

// ポートフォリオ アイテムカテゴリ
export const ITEM_CATEGORIES = {
  onepiece: 'ワンピース',
  jacket: 'ジャケット',
  knit: 'ニット',
  bag: 'バッグ',
  pants: 'パンツ',
  skirt: 'スカート',
  shirt: 'シャツ',
  coat: 'コート',
  other: 'その他',
} as const;

// ポートフォリオ 役割
export const PORTFOLIO_ROLES = {
  pattern: 'パターン作成',
  sewing: '縫製',
  design: 'デザイン',
  oem: 'OEM管理',
  fabric_sourcing: '生地手配',
  other: 'その他',
} as const;

// クライアントタイプ
export const CLIENT_TYPES = {
  brand: 'ブランド',
  individual: '個人デザイナー',
  manufacturer: 'アパレルメーカー',
  other: 'その他',
} as const;

// 案件カテゴリ
export const JOB_CATEGORIES = {
  pattern: 'パターン作成',
  sewing: '縫製',
  fabric: '生地手配',
  oem: 'OEM / 量産',
  other: 'その他',
} as const;

export type JobCategory = keyof typeof JOB_CATEGORIES;

// 案件ステータス
export const JOB_STATUSES = {
  open: '募集中',
  in_progress: '進行中',
  completed: '完了',
  cancelled: 'キャンセル',
} as const;

export type JobStatus = keyof typeof JOB_STATUSES;

// 提案ステータス
export const PROPOSAL_STATUSES = {
  pending: '審査中',
  accepted: '採用',
  rejected: '不採用',
  withdrawn: '取り下げ',
} as const;

export type ProposalStatus = keyof typeof PROPOSAL_STATUSES;

// スキルタグ
export const SKILL_TAGS = [
  'レディース', 'メンズ', 'キッズ',
  'ワンピース', 'ジャケット', 'ニット', 'デニム', 'バッグ', 'パンツ', 'スカート',
  '小ロット対応', 'サンプル対応', '量産対応',
  'パターン修正', 'グレーディング',
  'オーガニック素材', 'サステナブル',
  'CAD対応', '3Dパターン', '手縫い',
] as const;

// 専門カテゴリ
export const SPECIALTY_CATEGORIES = {
  pattern: 'パターン',
  sewing: '縫製',
  fabric: '生地',
  oem: 'OEM',
  design: 'デザイン',
  brand_management: 'ブランド運営',
} as const;

// 問い合わせステータス
export const INQUIRY_STATUSES = {
  unread: '未読',
  read: '既読',
  replied: '返信済み',
  closed: 'クローズ',
} as const;

// 通報理由
export const REPORT_REASONS = {
  spam: 'スパム',
  harassment: '嫌がらせ',
  fake_profile: '偽プロフィール',
  inappropriate_content: '不適切なコンテンツ',
  other: 'その他',
} as const;

// 通報ステータス
export const REPORT_STATUSES = {
  pending: '未対応',
  reviewed: '確認中',
  resolved: '解決済み',
  dismissed: '却下',
} as const;

// プロフィールステータス
export const PROFILE_STATUSES = {
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
  banned: 'BAN',
} as const;

// 通知タイプ
export const NOTIFICATION_TYPES = {
  chat_message: '新着メッセージ',
  inquiry_received: '問い合わせ受信',
  favorite_added: 'お気に入り追加',
  profile_approved: 'プロフィール承認',
  profile_rejected: 'プロフィール却下',
  report_resolved: '通報対応完了',
  job_proposal_received: '提案受信',
  proposal_accepted: '提案採用',
  review_received: 'レビュー受信',
} as const;

// ページネーション
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;
