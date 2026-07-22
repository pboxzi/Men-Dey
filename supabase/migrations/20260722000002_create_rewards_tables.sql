-- Portal Rewards table: items fans can redeem with loyalty points
CREATE TABLE IF NOT EXISTS portal_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🎁',
  cost INTEGER NOT NULL DEFAULT 100,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Loyalty Points table: tracks each user's point balance
CREATE TABLE IF NOT EXISTS loyalty_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_loyalty_points_user ON loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_portal_rewards_active ON portal_rewards(active);

-- RLS policies
ALTER TABLE portal_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;

-- Portal Rewards: everyone can read, admin can manage
CREATE POLICY "Public can view active rewards" ON portal_rewards
  FOR SELECT USING (active = true);

CREATE POLICY "Admin can view all rewards" ON portal_rewards
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin can insert rewards" ON portal_rewards
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update rewards" ON portal_rewards
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete rewards" ON portal_rewards
  FOR DELETE USING (is_admin());

-- Loyalty Points: users can read own, admin can manage all
CREATE POLICY "Users can read own points" ON loyalty_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can read all points" ON loyalty_points
  FOR SELECT USING (is_admin());

CREATE POLICY "Admin can insert points" ON loyalty_points
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admin can update points" ON loyalty_points
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admin can delete points" ON loyalty_points
  FOR DELETE USING (is_admin());

-- Seed initial rewards
INSERT INTO portal_rewards (title, description, icon, cost) VALUES
  ('Sanctuary Shield', 'A digital badge showing your dedication to the community cause.', '🛡️', 250),
  ('Kindness Crown', 'Reserved for those who have demonstrated extraordinary generosity.', '👑', 500),
  ('Wisdom Scroll', 'A personalized digital note from the community archives.', '📜', 300),
  ('Guardian Star', 'An exclusive badge for active community guardians and volunteers.', '⭐', 400),
  ('Harmony Bell', 'A collectible token representing peace and unity in the sanctuary.', '🔔', 200),
  ('Legacy Torch', 'A rare badge honoring long-term members who keep the flame alive.', '🔥', 750)
ON CONFLICT DO NOTHING;
