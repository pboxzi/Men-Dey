-- Fan-Admin direct messaging table
CREATE TABLE IF NOT EXISTS fan_admin_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'General Inquiry',
  status TEXT NOT NULL DEFAULT 'active',
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fan_admin_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES fan_admin_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'admin')),
  text TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_fan_admin_conv_user ON fan_admin_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_fan_admin_conv_status ON fan_admin_conversations(status);
CREATE INDEX IF NOT EXISTS idx_fan_admin_msg_conv ON fan_admin_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_fan_admin_msg_read ON fan_admin_messages(read);

-- RLS policies
ALTER TABLE fan_admin_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_admin_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: users see own, admin sees all
CREATE POLICY "Users can view own conversations" ON fan_admin_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all conversations" ON fan_admin_conversations
  FOR SELECT USING (is_admin());

CREATE POLICY "Users can create conversations" ON fan_admin_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update conversations" ON fan_admin_conversations
  FOR UPDATE USING (is_admin());

-- Messages: users see own conv messages, admin sees all
CREATE POLICY "Users can view own conv messages" ON fan_admin_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fan_admin_conversations
      WHERE id = conversation_id AND (user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "Users can insert in own conv" ON fan_admin_messages
  FOR INSERT WITH CHECK (
    sender = 'user' AND EXISTS (
      SELECT 1 FROM fan_admin_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can insert in any conv" ON fan_admin_messages
  FOR INSERT WITH CHECK (sender = 'admin' AND is_admin());

CREATE POLICY "Admin can update messages" ON fan_admin_messages
  FOR UPDATE USING (is_admin());
