-- Ask Gillian: Live chat system between fans and Gillian

-- Conversations: one per fan
CREATE TABLE IF NOT EXISTS ask_gillian_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('active', 'waiting', 'closed')),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Messages: individual chat messages
CREATE TABLE IF NOT EXISTS ask_gillian_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ask_gillian_conversations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'gillian')),
  text TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Status: Gillian's availability (single row)
CREATE TABLE IF NOT EXISTS ask_gillian_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'away')),
  message TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default status
INSERT INTO ask_gillian_status (status, message) VALUES ('available', 'Hello! I am between rehearsals right now. Ask me anything.')
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE ask_gillian_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ask_gillian_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ask_gillian_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Conversations: users can read/create their own, admin can read all
DROP POLICY IF EXISTS "Users can read own conversations" ON ask_gillian_conversations;
CREATE POLICY "Users can read own conversations" ON ask_gillian_conversations
  FOR SELECT USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "Users can create own conversation" ON ask_gillian_conversations;
CREATE POLICY "Users can create own conversation" ON ask_gillian_conversations
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can update conversations" ON ask_gillian_conversations;
CREATE POLICY "Admin can update conversations" ON ask_gillian_conversations
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- Messages: users can read messages in their own conversations, admin can read all
DROP POLICY IF EXISTS "Users can read own conversation messages" ON ask_gillian_messages;
CREATE POLICY "Users can read own conversation messages" ON ask_gillian_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM ask_gillian_conversations
      WHERE id = conversation_id AND (user_id = auth.uid() OR is_admin())
    )
  );

DROP POLICY IF EXISTS "Users can send messages in own conversation" ON ask_gillian_messages;
CREATE POLICY "Users can send messages in own conversation" ON ask_gillian_messages
  FOR INSERT WITH CHECK (
    sender = 'user' AND EXISTS (
      SELECT 1 FROM ask_gillian_conversations
      WHERE id = conversation_id AND user_id = auth.uid() AND status != 'closed'
    )
  );

DROP POLICY IF EXISTS "Admin can send messages" ON ask_gillian_messages;
CREATE POLICY "Admin can send messages" ON ask_gillian_messages
  FOR INSERT WITH CHECK (sender = 'gillian' AND is_admin());

DROP POLICY IF EXISTS "Admin can update messages" ON ask_gillian_messages;
CREATE POLICY "Admin can update messages" ON ask_gillian_messages
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

-- Status: anyone can read, only admin can update
DROP POLICY IF EXISTS "Anyone can read gillian status" ON ask_gillian_status;
CREATE POLICY "Anyone can read gillian status" ON ask_gillian_status
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin can update gillian status" ON ask_gillian_status;
CREATE POLICY "Admin can update gillian status" ON ask_gillian_status
  FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admin can insert gillian status" ON ask_gillian_status;
CREATE POLICY "Admin can insert gillian status" ON ask_gillian_status
  FOR INSERT WITH CHECK (is_admin());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ask_gillian_conv_user ON ask_gillian_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ask_gillian_conv_status ON ask_gillian_conversations(status);
CREATE INDEX IF NOT EXISTS idx_ask_gillian_msg_conv ON ask_gillian_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ask_gillian_msg_created ON ask_gillian_messages(created_at);
