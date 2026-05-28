-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default',
  title TEXT NOT NULL DEFAULT 'New Chat',
  model_used TEXT NOT NULL DEFAULT 'mimo-v2.5-pro',
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL DEFAULT '',
  tool_calls JSONB,
  tool_call_id TEXT,
  token_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for messages lookup by conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at);

-- Function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(conv_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE conversations
  SET message_count = message_count + 1,
      updated_at = NOW()
  WHERE id = conv_id;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies (allow service role full access)
CREATE POLICY "Service role can manage conversations"
  ON conversations
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage messages"
  ON messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
