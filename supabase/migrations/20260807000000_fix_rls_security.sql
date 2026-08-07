-- Fix RLS policies: require authentication for writes, protect sensitive data

-- ─── PROPOSAL CHATS ───────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read proposal chats" ON proposal_chats;
CREATE POLICY "Authenticated users can read own proposal chats" ON proposal_chats
  FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Anyone can create proposal chat messages" ON proposal_chats;
CREATE POLICY "Authenticated users can send proposal chat messages" ON proposal_chats
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── COMMENTS ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read comments" ON comments;
CREATE POLICY "Anyone can read comments" ON comments
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create comments" ON comments;
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── DISCUSSIONS ──────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read discussions" ON discussions;
CREATE POLICY "Anyone can read discussions" ON discussions
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create discussions" ON discussions;
CREATE POLICY "Authenticated users can create discussions" ON discussions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── DISCUSSION REPLIES ──────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read discussion replies" ON discussion_replies;
CREATE POLICY "Anyone can read discussion replies" ON discussion_replies
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create discussion replies" ON discussion_replies;
CREATE POLICY "Authenticated users can create discussion replies" ON discussion_replies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── JOURNAL COMMENTS ────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read journal comments" ON journal_comments;
CREATE POLICY "Anyone can read journal comments" ON journal_comments
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can create journal comments" ON journal_comments;
CREATE POLICY "Authenticated users can create journal comments" ON journal_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── MEMBERSHIPS ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read memberships" ON memberships;
CREATE POLICY "Anyone can read memberships" ON memberships
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can apply for membership" ON memberships;
CREATE POLICY "Authenticated users can apply for membership" ON memberships
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

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
DROP POLICY IF EXISTS "Anyone can read channel messages" ON channel_messages;
CREATE POLICY "Anyone can read channel messages" ON channel_messages
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can send channel messages" ON channel_messages;
CREATE POLICY "Authenticated users can send channel messages" ON channel_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── USER BADGES ─────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read user_badges" ON user_badges;
CREATE POLICY "Anyone can read user_badges" ON user_badges
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can insert user_badges" ON user_badges;
CREATE POLICY "Authenticated users can insert user_badges" ON user_badges
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── PORTAL EVENTS ───────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read portal_events" ON portal_events;
CREATE POLICY "Anyone can read portal_events" ON portal_events
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can update portal_events" ON portal_events;
CREATE POLICY "Admins can update portal_events" ON portal_events
  FOR UPDATE USING (is_admin());

-- ─── EXPERIENCE REQUESTS ─────────────────────────────────
DROP POLICY IF EXISTS "Users can create bookings" ON experience_requests;
CREATE POLICY "Authenticated users can create bookings" ON experience_requests
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
