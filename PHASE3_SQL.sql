-- ============================================
-- Phase 3 完全SQL — Supabase SQL Editorで実行
-- ============================================

-- ===== 1. プロフィール拡張フィールド =====
-- (instagram_url, twitter_url, sns_url は Phase 3-1 で追加済みの場合はスキップ)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitter_url TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sns_url TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty_category TEXT;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS available_for_work BOOLEAN DEFAULT true;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS min_budget INTEGER;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ===== 2. ポートフォリオ拡張フィールド =====
DO $$ BEGIN
  ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS item_category TEXT;
  ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS role TEXT;
  ALTER TABLE portfolios ADD COLUMN IF NOT EXISTS client_type TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ===== 3. 案件テーブル =====
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min INTEGER,
  budget_max INTEGER,
  deadline DATE,
  tags TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  prefecture TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===== 4. 案件提案テーブル =====
CREATE TABLE IF NOT EXISTS job_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  proposer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  proposed_price INTEGER,
  proposed_deadline DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, proposer_id)
);

-- ===== 5. レビューテーブル =====
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, reviewer_id)
);

-- ===== 6. RLS ポリシー: jobs =====
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobs_select" ON jobs;
CREATE POLICY "jobs_select" ON jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "jobs_insert" ON jobs;
CREATE POLICY "jobs_insert" ON jobs FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "jobs_update" ON jobs;
CREATE POLICY "jobs_update" ON jobs FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "jobs_delete" ON jobs;
CREATE POLICY "jobs_delete" ON jobs FOR DELETE USING (auth.uid() = owner_id);

-- ===== 7. RLS ポリシー: job_proposals =====
ALTER TABLE job_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "proposals_select" ON job_proposals;
CREATE POLICY "proposals_select" ON job_proposals FOR SELECT
  USING (
    auth.uid() = proposer_id OR
    auth.uid() IN (SELECT owner_id FROM jobs WHERE id = job_id)
  );

DROP POLICY IF EXISTS "proposals_insert" ON job_proposals;
CREATE POLICY "proposals_insert" ON job_proposals FOR INSERT
  WITH CHECK (auth.uid() = proposer_id);

DROP POLICY IF EXISTS "proposals_update" ON job_proposals;
CREATE POLICY "proposals_update" ON job_proposals FOR UPDATE
  USING (
    auth.uid() = proposer_id OR
    auth.uid() IN (SELECT owner_id FROM jobs WHERE id = job_id)
  );

-- ===== 8. RLS ポリシー: reviews =====
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert" ON reviews;
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- ===== 9. updated_at自動更新トリガー =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS jobs_updated_at ON jobs;
CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== 10. インデックス =====
CREATE INDEX IF NOT EXISTS idx_jobs_owner ON jobs(owner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposals_job ON job_proposals(job_id);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON job_proposals(proposer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job ON reviews(job_id);
