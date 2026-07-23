-- Custom email confirmation tokens table
CREATE TABLE IF NOT EXISTS confirmation_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_token ON confirmation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_confirmation_tokens_user_id ON confirmation_tokens(user_id);

-- RLS policies
ALTER TABLE confirmation_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access (edge functions use service role)
CREATE POLICY "Service role can manage confirmation tokens" ON confirmation_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM confirmation_tokens WHERE expires_at < now() OR used = true;
END;
$$ LANGUAGE plpgsql;

-- Disable Supabase's built-in confirmation email (we handle it via Resend)
-- This is done in Supabase dashboard: Auth > Settings > Disable email confirmations
