-- Add admin community management features
-- Pinned posts, flagging system

ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS flagged boolean DEFAULT false;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS flag_reason text DEFAULT '';

ALTER TABLE discussions ADD COLUMN IF NOT EXISTS pinned boolean DEFAULT false;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS flagged boolean DEFAULT false;

ALTER TABLE fan_creations ADD COLUMN IF NOT EXISTS flagged boolean DEFAULT false;
ALTER TABLE fan_creations ADD COLUMN IF NOT EXISTS flag_reason text DEFAULT '';
