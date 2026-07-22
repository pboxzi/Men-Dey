-- Add insert policy for authenticated users on notifications
DROP POLICY IF EXISTS "Users insert own notifications" ON notifications;
CREATE POLICY "Users insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
