-- Add 'name' column to channel_messages for channel routing
ALTER TABLE IF EXISTS channel_messages ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'general';

-- Create index for fast channel lookups
CREATE INDEX IF NOT EXISTS idx_channel_messages_name ON channel_messages(name);
