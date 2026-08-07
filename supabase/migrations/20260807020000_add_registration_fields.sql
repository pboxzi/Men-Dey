-- Add registration fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS how_heard_about TEXT DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_thing TEXT DEFAULT '';

-- Add registration fields to confirmation_tokens (to store until confirmed)
ALTER TABLE confirmation_tokens ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '';
ALTER TABLE confirmation_tokens ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Global';
ALTER TABLE confirmation_tokens ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '';
ALTER TABLE confirmation_tokens ADD COLUMN IF NOT EXISTS how_heard_about TEXT DEFAULT '';
ALTER TABLE confirmation_tokens ADD COLUMN IF NOT EXISTS favorite_thing TEXT DEFAULT '';
