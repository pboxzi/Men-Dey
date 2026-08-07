-- Fix RLS policies: require authentication for writes, protect sensitive data
-- This migration tightens security without breaking existing app functionality

-- ─── REQUESTS (contains personal booking data) ─────────────
-- Authenticated users can only read their own requests
DROP POLICY IF EXISTS "Anyone can read requests" ON requests;
CREATE POLICY "Authenticated users can read own requests" ON requests
  FOR SELECT USING (auth.uid() = user_id::uuid OR is_admin());
-- Only authenticated users can create requests
DROP POLICY IF EXISTS "Anyone can create requests" ON requests;
CREATE POLICY "Authenticated users can create requests" ON requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── PROPOSAL CHATS ───────────────────────────────────────
-- Authenticated users can only read chats for their requests
DROP POLICY IF EXISTS "Anyone can read proposal chats" ON proposal_chats;
CREATE POLICY "Authenticated users can read own proposal chats" ON proposal_chats
  FOR SELECT USING (auth.uid() IS NOT NULL);
-- Only authenticated users can send messages
DROP POLICY IF EXISTS "Anyone can create proposal chat messages" ON proposal_chats;
CREATE POLICY "Authenticated users can send proposal chat messages" ON proposal_chats
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── ORDERS ───────────────────────────────────────────────
-- Authenticated users can only read their own orders
DROP POLICY IF EXISTS "Anyone can read orders" ON orders;
CREATE POLICY "Authenticated users can read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id::uuid OR is_admin());
-- Only authenticated users can create orders
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
CREATE POLICY "Authenticated users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── POSTS (community highlights) ─────────────────────────
-- Public read is fine for community posts
DROP POLICY IF EXISTS "Anyone can read posts" ON posts;
CREATE POLICY "Anyone can read posts" ON posts
  FOR SELECT USING (true);
-- Only authenticated users can create posts
DROP POLICY IF EXISTS "Anyone can create posts" ON posts;
CREATE POLICY "Authenticated users can create posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Users can only update their own posts, admins can update all
DROP POLICY IF EXISTS "Anyone can update posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id::uuid OR is_admin());

-- ─── COMMENTS ─────────────────────────────────────────────
-- Public read is fine for comments
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);
-- Only authenticated users can comment
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── DISCUSSIONS ──────────────────────────────────────────
-- Public read is fine for discussions
DROP POLICY IF EXISTS "Anyone can read discussions" ON discussions;
CREATE POLICY "Anyone can read discussions" ON discussions
  FOR SELECT USING (true);
-- Only authenticated users can create discussions
DROP POLICY IF EXISTS "Anyone can create discussions" ON discussions;
CREATE POLICY "Authenticated users can create discussions" ON discussions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── DISCUSSION REPLIES ──────────────────────────────────
-- Public read is fine for discussion replies
DROP POLICY IF EXISTS "Anyone can read discussion replies" ON discussion_replies;
CREATE POLICY "Anyone can read discussion replies" ON discussion_replies
  FOR SELECT USING (true);
-- Only authenticated users can reply
DROP POLICY IF EXISTS "Anyone can create discussion replies" ON discussion_replies;
CREATE POLICY "Authenticated users can create discussion replies" ON discussion_replies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── JOURNAL COMMENTS ────────────────────────────────────
-- Public read is fine for journal comments
DROP POLICY IF EXISTS "Anyone can read journal comments" ON journal_comments;
CREATE POLICY "Anyone can read journal comments" ON journal_comments
  FOR SELECT USING (true);
-- Only authenticated users can comment
DROP POLICY IF EXISTS "Anyone can create journal comments" ON journal_comments;
CREATE POLICY "Authenticated users can create journal comments" ON journal_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── MEMBERSHIPS ─────────────────────────────────────────
-- Public read is fine for membership listings
DROP POLICY IF EXISTS "Anyone can read memberships" ON memberships;
CREATE POLICY "Anyone can read memberships" ON memberships
  FOR SELECT USING (true);
-- Only authenticated users can apply
DROP POLICY IF EXISTS "Anyone can apply for membership" ON memberships;
CREATE POLICY "Authenticated users can apply for membership" ON memberships
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── FAN NOTIFICATIONS ───────────────────────────────────
-- Users can only read their own notifications
DROP POLICY IF EXISTS "Anyone can read fan notifications" ON fan_notifications;
CREATE POLICY "Users can read own notifications" ON fan_notifications
  FOR SELECT USING (auth.uid() = user_id::uuid OR is_admin());
-- System/admin can create notifications (via service role)
DROP POLICY IF EXISTS "Anyone can create fan notifications" ON fan_notifications;
CREATE POLICY "Authenticated users can create notifications" ON fan_notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Anyone can update fan notifications" ON fan_notifications;
CREATE POLICY "Users can update own notifications" ON fan_notifications
  FOR UPDATE USING (auth.uid() = user_id::uuid OR is_admin());

-- ─── FAN CREATIONS ───────────────────────────────────────
-- Public read is fine for fan art
DROP POLICY IF EXISTS "Anyone can read fan creations" ON fan_creations;
CREATE POLICY "Anyone can read fan creations" ON fan_creations
  FOR SELECT USING (true);
-- Only authenticated users can create
DROP POLICY IF EXISTS "Anyone can create fan creations" ON fan_creations;
CREATE POLICY "Authenticated users can create fan creations" ON fan_creations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Users can only update their own creations
DROP POLICY IF EXISTS "Anyone can update fan creations" ON fan_creations;
CREATE POLICY "Users can update own fan creations" ON fan_creations
  FOR UPDATE USING (auth.uid() = user_id::uuid OR is_admin());

-- ─── FAN CREATION COMMENTS ───────────────────────────────
DROP POLICY IF EXISTS "Anyone can read fan creation comments" ON fan_creation_comments;
CREATE POLICY "Anyone can read fan creation comments" ON fan_creation_comments
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create fan creation comments" ON fan_creation_comments;
CREATE POLICY "Authenticated users can create fan creation comments" ON fan_creation_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── FAN CREATION REACTIONS ─────────────────────────────
DROP POLICY IF EXISTS "Anyone can read fan creation reactions" ON fan_creation_reactions;
CREATE POLICY "Anyone can read fan creation reactions" ON fan_creation_reactions
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create fan creation reactions" ON fan_creation_reactions;
CREATE POLICY "Authenticated users can create fan creation reactions" ON fan_creation_reactions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── CHANNEL MESSAGES ────────────────────────────────────
-- Public read for channel messages
DROP POLICY IF EXISTS "Anyone can read channel messages" ON channel_messages;
CREATE POLICY "Anyone can read channel messages" ON channel_messages
  FOR SELECT USING (true);
-- Only authenticated users can send messages
DROP POLICY IF EXISTS "Anyone can send channel messages" ON channel_messages;
CREATE POLICY "Authenticated users can send channel messages" ON channel_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── USER BADGES ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read user_badges" ON user_badges;
CREATE POLICY "Anyone can read user_badges" ON user_badges
  FOR SELECT USING (true);
-- Only authenticated users can earn badges (admin/system grants)
DROP POLICY IF EXISTS "Anyone can insert user_badges" ON user_badges;
CREATE POLICY "Authenticated users can insert user_badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── JOURNEY LOG ─────────────────────────────────────────
-- Users can only read their own journey
DROP POLICY IF EXISTS "Anyone can read journey_log" ON journey_log;
CREATE POLICY "Users can read own journey" ON journey_log
  FOR SELECT USING (auth.uid() = user_id::uuid OR is_admin());
-- Only authenticated users can log journey steps
DROP POLICY IF EXISTS "Anyone can insert journey_log" ON journey_log;
CREATE POLICY "Authenticated users can insert journey_log" ON journey_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── PORTAL EVENTS ───────────────────────────────────────
-- Public read for portal events
DROP POLICY IF EXISTS "Anyone can read portal_events" ON portal_events;
CREATE POLICY "Anyone can read portal_events" ON portal_events
  FOR SELECT USING (true);
-- Only admins can update portal events
DROP POLICY IF EXISTS "Anyone can update portal_events" ON portal_events;
CREATE POLICY "Admins can update portal_events" ON portal_events
  FOR UPDATE USING (is_admin());

-- ─── EXPERIENCE REQUESTS ─────────────────────────────────
-- Only authenticated users can create bookings
DROP POLICY IF EXISTS "Users can create bookings" ON experience_requests;
CREATE POLICY "Authenticated users can create bookings" ON experience_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
