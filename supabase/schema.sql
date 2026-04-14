-- ============================================
-- アパレルマッチングプラットフォーム
-- フェーズ1 データベーススキーマ
-- ============================================

-- ========== profiles ==========
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type       TEXT NOT NULL CHECK (user_type IN ('designer', 'patternmaker', 'brand', 'factory')),
  display_name    TEXT NOT NULL,
  avatar_url      TEXT,
  bio             TEXT,
  prefecture      TEXT,
  city            TEXT,
  website_url     TEXT,
  skills          TEXT[] DEFAULT '{}',
  experience_years INTEGER,
  company_name    TEXT,
  is_public       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 公開プロフィールは誰でも閲覧可能
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (is_public = true);

-- 自分のプロフィールは常に閲覧可能
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 自分のプロフィールのみ作成可能
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- updated_at の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ========== portfolios ==========
CREATE TABLE portfolios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  image_urls      TEXT[] NOT NULL DEFAULT '{}',
  category        TEXT,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- 公開ユーザーのポートフォリオは全員閲覧可能
CREATE POLICY "Portfolios of public profiles are viewable"
  ON portfolios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE profiles.id = portfolios.user_id AND profiles.is_public = true
    )
  );

-- 自分のポートフォリオは常に閲覧可能
CREATE POLICY "Users can view own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のポートフォリオのみ作成可能
CREATE POLICY "Users can insert own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のポートフォリオのみ更新可能
CREATE POLICY "Users can update own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

-- 自分のポートフォリオのみ削除可能
CREATE POLICY "Users can delete own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ========== favorites ==========
CREATE TABLE favorites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_user_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, target_user_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 自分のお気に入りのみ閲覧可能
CREATE POLICY "Users can view own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- 自分のお気に入りのみ追加可能
CREATE POLICY "Users can insert own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 自分のお気に入りのみ削除可能
CREATE POLICY "Users can delete own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);


-- ========== inquiries ==========
CREATE TABLE inquiries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  message         TEXT NOT NULL,
  status          TEXT DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'replied', 'closed')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_inquiries_to_user ON inquiries(to_user_id);
CREATE INDEX idx_inquiries_from_user ON inquiries(from_user_id);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 送信者または受信者のみ閲覧可能
CREATE POLICY "Users can view own inquiries"
  ON inquiries FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- 認証済みユーザーが問い合わせを送信可能
CREATE POLICY "Authenticated users can send inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- 受信者のみステータス更新可能
CREATE POLICY "Recipients can update inquiry status"
  ON inquiries FOR UPDATE
  USING (auth.uid() = to_user_id);


-- ========== Storage ==========
-- Supabase Dashboard で以下のバケットを作成:
-- 1. avatars（公開バケット）
-- 2. portfolios（公開バケット）

-- ========== 新規登録時に profiles を自動作成するトリガー ==========
-- 注意: このトリガーは最低限の空プロフィールを作成する
-- ユーザーは登録後にプロフィール編集画面で詳細を入力する

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'designer'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'ユーザー')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
