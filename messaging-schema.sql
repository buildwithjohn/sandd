-- ============================================================
-- S&D — MESSAGING HUB (in-app two-way conversations)
-- Run once in Supabase SQL Editor. Additive.
-- Writes go through service-role API routes (which also set unread flags
-- and send email), so RLS here only governs READS + admin management.
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject          TEXT NOT NULL DEFAULT 'Message',
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  last_message_at  TIMESTAMPTZ DEFAULT NOW(),
  last_snippet     TEXT,
  admin_unread     BOOLEAN DEFAULT FALSE,
  student_unread   BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS conversations_student_idx  ON conversations(student_id);
CREATE INDEX IF NOT EXISTS conversations_lastmsg_idx  ON conversations(last_message_at DESC);

CREATE TABLE IF NOT EXISTS messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role      TEXT NOT NULL CHECK (sender_role IN ('student','admin')),
  sender_id        UUID REFERENCES profiles(id),
  body             TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, created_at);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own or admin: view conversations" ON conversations;
CREATE POLICY "own or admin: view conversations" ON conversations FOR SELECT USING (
  student_id = auth.uid()
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);
DROP POLICY IF EXISTS "admins manage conversations" ON conversations;
CREATE POLICY "admins manage conversations" ON conversations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

DROP POLICY IF EXISTS "own or admin: view messages" ON messages;
CREATE POLICY "own or admin: view messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.student_id = auth.uid()
           OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')))
  )
);
DROP POLICY IF EXISTS "admins manage messages" ON messages;
CREATE POLICY "admins manage messages" ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);

GRANT ALL ON conversations TO anon, authenticated, service_role;
GRANT ALL ON messages      TO anon, authenticated, service_role;
