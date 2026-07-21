-- RLS Policies for Supabase-only architecture
-- Idempotent: drops existing policies before creating

-- Enable RLS on all tables (idempotent)
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS experience_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS proposal_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fan_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fan_creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fan_creation_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS fan_creation_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS channel_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS communication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS journey_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS portal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS membership_applications ENABLE ROW LEVEL SECURITY;

-- Helper: check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ─── PROFILES ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

-- ─── EXPERIENCES ──────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read published experiences" ON experiences;
CREATE POLICY "Anyone can read published experiences" ON experiences
  FOR SELECT USING (
    is_admin() OR (
      EXISTS (
        SELECT 1 FROM experiences e2
        WHERE e2.id = experiences.id
        AND (
          e2.details IS NULL
          OR array_length(e2.details, 1) IS NULL
          OR (e2.details[1]::jsonb ->> 'published')::boolean IS NOT FALSE
        )
        AND (e2.details[1]::jsonb ->> 'archived')::boolean IS NOT TRUE
      )
    )
  );
DROP POLICY IF EXISTS "Admins can insert experiences" ON experiences;
CREATE POLICY "Admins can insert experiences" ON experiences
  FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "Admins can update experiences" ON experiences;
CREATE POLICY "Admins can update experiences" ON experiences
  FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "Admins can delete experiences" ON experiences;
CREATE POLICY "Admins can delete experiences" ON experiences
  FOR DELETE USING (is_admin());

-- ─── EXPERIENCE REQUESTS (bookings) ───────────────────────
DROP POLICY IF EXISTS "Users can read own bookings" ON experience_requests;
CREATE POLICY "Users can read own bookings" ON experience_requests
  FOR SELECT USING (user_id = auth.uid()::text OR is_admin());
DROP POLICY IF EXISTS "Users can create bookings" ON experience_requests;
CREATE POLICY "Users can create bookings" ON experience_requests
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update bookings" ON experience_requests;
CREATE POLICY "Admins can update bookings" ON experience_requests
  FOR UPDATE USING (is_admin());

-- ─── REQUESTS (proposals) ─────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read requests" ON requests;
CREATE POLICY "Anyone can read requests" ON requests
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create requests" ON requests;
CREATE POLICY "Anyone can create requests" ON requests
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update requests" ON requests;
CREATE POLICY "Admins can update requests" ON requests
  FOR UPDATE USING (is_admin());

-- ─── PROPOSAL CHATS ───────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read proposal chats" ON proposal_chats;
CREATE POLICY "Anyone can read proposal chats" ON proposal_chats
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create proposal chat messages" ON proposal_chats;
CREATE POLICY "Anyone can create proposal chat messages" ON proposal_chats
  FOR INSERT WITH CHECK (true);

-- ─── ORDERS ───────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read orders" ON orders;
CREATE POLICY "Anyone can read orders" ON orders
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- ─── POSTS (community highlights) ─────────────────────────
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
CREATE POLICY "Anyone can read posts" ON posts
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create posts" ON posts;
CREATE POLICY "Anyone can create posts" ON posts
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update posts" ON posts;
CREATE POLICY "Anyone can update posts" ON posts
  FOR UPDATE USING (true);

-- ─── COMMENTS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
CREATE POLICY "Anyone can create comments" ON comments
  FOR INSERT WITH CHECK (true);

-- ─── DISCUSSIONS ──────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read discussions" ON discussions;
CREATE POLICY "Anyone can read discussions" ON discussions
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create discussions" ON discussions;
CREATE POLICY "Anyone can create discussions" ON discussions
  FOR INSERT WITH CHECK (true);

-- ─── DISCUSSION REPLIES ──────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read discussion replies" ON discussion_replies;
CREATE POLICY "Anyone can read discussion replies" ON discussion_replies
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create discussion replies" ON discussion_replies;
CREATE POLICY "Anyone can create discussion replies" ON discussion_replies
  FOR INSERT WITH CHECK (true);

-- ─── JOURNAL COMMENTS ────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read journal comments" ON journal_comments;
CREATE POLICY "Anyone can read journal comments" ON journal_comments
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create journal comments" ON journal_comments;
CREATE POLICY "Anyone can create journal comments" ON journal_comments
  FOR INSERT WITH CHECK (true);

-- ─── SUBSCRIBERS ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read subscribers" ON subscribers;
CREATE POLICY "Anyone can read subscribers" ON subscribers
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Anyone can subscribe" ON subscribers;
CREATE POLICY "Anyone can subscribe" ON subscribers
  FOR INSERT WITH CHECK (true);

-- ─── MEMBERSHIPS ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read memberships" ON memberships;
CREATE POLICY "Anyone can read memberships" ON memberships
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can apply for membership" ON memberships;
CREATE POLICY "Anyone can apply for membership" ON memberships
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update memberships" ON memberships;
CREATE POLICY "Admins can update memberships" ON memberships
  FOR UPDATE USING (is_admin());

-- ─── MEMBERSHIP APPLICATIONS ─────────────────────────────
DROP POLICY IF EXISTS "Admins can read membership_applications" ON membership_applications;
CREATE POLICY "Admins can read membership_applications" ON membership_applications
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Anyone can apply membership_applications" ON membership_applications;
CREATE POLICY "Anyone can apply membership_applications" ON membership_applications
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can update membership_applications" ON membership_applications;
CREATE POLICY "Admins can update membership_applications" ON membership_applications
  FOR UPDATE USING (is_admin());

-- ─── FAN NOTIFICATIONS ───────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read fan notifications" ON fan_notifications;
CREATE POLICY "Anyone can read fan notifications" ON fan_notifications
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create fan notifications" ON fan_notifications;
CREATE POLICY "Anyone can create fan notifications" ON fan_notifications
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update fan notifications" ON fan_notifications;
CREATE POLICY "Anyone can update fan notifications" ON fan_notifications
  FOR UPDATE USING (true);

-- ─── FAN CREATIONS ───────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read fan creations" ON fan_creations;
CREATE POLICY "Anyone can read fan creations" ON fan_creations
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create fan creations" ON fan_creations;
CREATE POLICY "Anyone can create fan creations" ON fan_creations
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can update fan creations" ON fan_creations;
CREATE POLICY "Anyone can update fan creations" ON fan_creations
  FOR UPDATE USING (true);

-- ─── FAN CREATION COMMENTS ───────────────────────────────
DROP POLICY IF EXISTS "Anyone can read fan creation comments" ON fan_creation_comments;
CREATE POLICY "Anyone can read fan creation comments" ON fan_creation_comments
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create fan creation comments" ON fan_creation_comments;
CREATE POLICY "Anyone can create fan creation comments" ON fan_creation_comments
  FOR INSERT WITH CHECK (true);

-- ─── FAN CREATION REACTIONS ─────────────────────────────
DROP POLICY IF EXISTS "Anyone can read fan creation reactions" ON fan_creation_reactions;
CREATE POLICY "Anyone can read fan creation reactions" ON fan_creation_reactions
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create fan creation reactions" ON fan_creation_reactions;
CREATE POLICY "Anyone can create fan creation reactions" ON fan_creation_reactions
  FOR INSERT WITH CHECK (true);

-- ─── CHANNEL MESSAGES ────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read channel messages" ON channel_messages;
CREATE POLICY "Anyone can read channel messages" ON channel_messages
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can send channel messages" ON channel_messages;
CREATE POLICY "Anyone can send channel messages" ON channel_messages
  FOR INSERT WITH CHECK (true);

-- ─── ADMIN TABLES (admin only) ───────────────────────────
DROP POLICY IF EXISTS "Admins can read admin_notifications" ON admin_notifications;
CREATE POLICY "Admins can read admin_notifications" ON admin_notifications
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage admin_notifications" ON admin_notifications;
CREATE POLICY "Admins can manage admin_notifications" ON admin_notifications
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can read admin_events" ON admin_events;
CREATE POLICY "Admins can read admin_events" ON admin_events
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage admin_events" ON admin_events;
CREATE POLICY "Admins can manage admin_events" ON admin_events
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can read communication_logs" ON communication_logs;
CREATE POLICY "Admins can read communication_logs" ON communication_logs
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admins can manage communication_logs" ON communication_logs;
CREATE POLICY "Admins can manage communication_logs" ON communication_logs
  FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Admins can read donations" ON donations;
CREATE POLICY "Admins can read donations" ON donations
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Anyone can create donations" ON donations;
CREATE POLICY "Anyone can create donations" ON donations
  FOR INSERT WITH CHECK (true);

-- ─── PORTAL TABLES (public read, auth write) ─────────────
DROP POLICY IF EXISTS "Anyone can read user_badges" ON user_badges;
CREATE POLICY "Anyone can read user_badges" ON user_badges
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert user_badges" ON user_badges;
CREATE POLICY "Anyone can insert user_badges" ON user_badges
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read journey_log" ON journey_log;
CREATE POLICY "Anyone can read journey_log" ON journey_log
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert journey_log" ON journey_log;
CREATE POLICY "Anyone can insert journey_log" ON journey_log
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can read portal_events" ON portal_events;
CREATE POLICY "Anyone can read portal_events" ON portal_events
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update portal_events" ON portal_events;
CREATE POLICY "Anyone can update portal_events" ON portal_events
  FOR UPDATE USING (true);
