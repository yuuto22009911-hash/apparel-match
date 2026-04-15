-- ============================================
-- Email Notification System - DB Migration
-- ============================================

-- Add email and notification preference columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;

-- Sync existing user emails from auth.users into profiles
UPDATE profiles
SET email = au.email
FROM auth.users au
WHERE profiles.id = au.id
  AND profiles.email IS NULL;

-- Create a trigger to auto-populate email on new profile creation
CREATE OR REPLACE FUNCTION sync_email_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email := (SELECT email FROM auth.users WHERE id = NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_email ON profiles;
CREATE TRIGGER trg_sync_email
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_email_from_auth();

-- Index for quick notification lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications
  ON profiles(id) WHERE email_notifications = true;
