-- RLS policies for notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
DROP POLICY IF EXISTS "Users read own notifications" ON notifications;
CREATE POLICY "Users read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own notifications (for client-side triggers)
DROP POLICY IF EXISTS "Users insert own notifications" ON notifications;
CREATE POLICY "Users insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Also allow service role inserts (for Edge Function / admin)
DROP POLICY IF EXISTS "Service role inserts notifications" ON notifications;
CREATE POLICY "Service role inserts notifications" ON notifications
  FOR INSERT WITH CHECK (true);
