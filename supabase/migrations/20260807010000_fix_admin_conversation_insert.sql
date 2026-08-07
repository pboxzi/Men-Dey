-- Fix: allow admin to create conversations for any user
CREATE POLICY "Admin can create conversations" ON fan_admin_conversations
  FOR INSERT WITH CHECK (is_admin());
