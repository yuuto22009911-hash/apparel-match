-- ============================================
-- Phase 4: グループチャット対応マイグレーション
-- 既存の 1:1 チャットは温存しつつ、グループ機能を追加する
-- 全て冪等（idempotent）に書いてある
-- ============================================

-- ===== 1. chat_rooms 拡張 =====
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_group  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS name      TEXT;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS icon_url  TEXT;

-- グループは user2_id を持たないので NULL 許容にする
ALTER TABLE chat_rooms ALTER COLUMN user2_id DROP NOT NULL;

-- 古い UNIQUE(user1_id, user2_id) は順序依存で実用性が低い。
-- 1:1 のみ "順序非依存" の部分ユニークインデックスに置き換える。
ALTER TABLE chat_rooms DROP CONSTRAINT IF EXISTS chat_rooms_user1_id_user2_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_chat_rooms_direct_pair
  ON chat_rooms (LEAST(user1_id, user2_id), GREATEST(user1_id, user2_id))
  WHERE is_group = false AND user1_id IS NOT NULL AND user2_id IS NOT NULL;

-- ===== 2. chat_room_members =====
CREATE TABLE IF NOT EXISTS chat_room_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_room_members_room ON chat_room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_room_members_user ON chat_room_members(user_id);

ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- ===== 3. RLS 用ヘルパー関数（SECURITY DEFINER でRLS無限再帰を回避）=====
CREATE OR REPLACE FUNCTION is_chat_room_member(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = p_room_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION is_chat_room_owner(p_room_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = p_room_id AND user_id = p_user_id AND role = 'owner'
  );
$$;

-- ===== 4. chat_rooms RLS 更新 =====
DROP POLICY IF EXISTS "Users can view own chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Users can view participated rooms" ON chat_rooms;
CREATE POLICY "Users can view participated rooms"
  ON chat_rooms FOR SELECT
  USING (
    auth.uid() = user1_id
    OR auth.uid() = user2_id
    OR is_chat_room_member(id, auth.uid())
  );

DROP POLICY IF EXISTS "Authenticated users can create chat rooms" ON chat_rooms;
CREATE POLICY "Authenticated users can create chat rooms"
  ON chat_rooms FOR INSERT
  WITH CHECK (
    -- 1:1 はどちらか一方が自分
    (is_group = false AND (auth.uid() = user1_id OR auth.uid() = user2_id))
    -- グループは作成者(user1_id)が自分
    OR (is_group = true AND auth.uid() = user1_id)
  );

DROP POLICY IF EXISTS "Participants can update chat rooms" ON chat_rooms;
CREATE POLICY "Participants can update chat rooms"
  ON chat_rooms FOR UPDATE
  USING (
    auth.uid() = user1_id
    OR auth.uid() = user2_id
    OR is_chat_room_member(id, auth.uid())
  );

-- ===== 5. chat_room_members RLS =====
DROP POLICY IF EXISTS "Members can view members of joined rooms" ON chat_room_members;
CREATE POLICY "Members can view members of joined rooms"
  ON chat_room_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_chat_room_member(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owner or self can join" ON chat_room_members;
CREATE POLICY "Owner or self can join"
  ON chat_room_members FOR INSERT
  WITH CHECK (
    -- 自分自身を追加 (グループ作成時の owner レコード等)
    user_id = auth.uid()
    -- もしくはルームのオーナーが他メンバーを追加
    OR is_chat_room_owner(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "Members can leave or owner can remove" ON chat_room_members;
CREATE POLICY "Members can leave or owner can remove"
  ON chat_room_members FOR DELETE
  USING (
    user_id = auth.uid()
    OR is_chat_room_owner(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "Owner can change member role" ON chat_room_members;
CREATE POLICY "Owner can change member role"
  ON chat_room_members FOR UPDATE
  USING (is_chat_room_owner(room_id, auth.uid()));

-- ===== 6. chat_messages RLS をグループ対応に再定義 =====
DROP POLICY IF EXISTS "Room participants can view messages" ON chat_messages;
CREATE POLICY "Room participants can view messages"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
        AND (chat_rooms.user1_id = auth.uid() OR chat_rooms.user2_id = auth.uid())
    )
    OR is_chat_room_member(room_id, auth.uid())
  );

DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Members can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      EXISTS (
        SELECT 1 FROM chat_rooms
        WHERE chat_rooms.id = chat_messages.room_id
          AND (chat_rooms.user1_id = auth.uid() OR chat_rooms.user2_id = auth.uid())
      )
      OR is_chat_room_member(room_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Recipients can mark messages as read" ON chat_messages;
CREATE POLICY "Room participants can update messages"
  ON chat_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
        AND (chat_rooms.user1_id = auth.uid() OR chat_rooms.user2_id = auth.uid())
    )
    OR is_chat_room_member(room_id, auth.uid())
  );

-- ===== 7. Realtime: chat_room_members もリアルタイム配信に追加 =====
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
