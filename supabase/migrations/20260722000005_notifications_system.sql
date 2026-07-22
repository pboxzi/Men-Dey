-- Extend notification_type enum (skip if already exists)
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'experience';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'event';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'reward';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'announcement';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'status_change';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add columns if missing
DO $$ BEGIN
  ALTER TABLE notifications ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT false;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE notifications ADD COLUMN link TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
