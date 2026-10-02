-- ============================================================
-- S&D — COMMS AUTOMATION (idempotency log + switches)
-- Run once in Supabase SQL Editor. Additive.
-- ============================================================

-- Records every automated email so it's never sent twice.
CREATE TABLE IF NOT EXISTS comms_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  automation_key TEXT NOT NULL,          -- welcome_d3 | exam_<assessmentId> | year2_unlock | inactivity
  sent_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS comms_log_lookup ON comms_log(student_id, automation_key, sent_at DESC);

ALTER TABLE comms_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins manage comms_log" ON comms_log;
CREATE POLICY "admins manage comms_log" ON comms_log FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin'))
);
GRANT ALL ON comms_log TO anon, authenticated, service_role;

-- Automations are OFF until explicitly enabled from Admin → Automations.
-- Stored as school_settings keys (value 'true'/'false'):
--   auto_welcome, auto_exam, auto_year2, auto_inactivity
INSERT INTO school_settings (key, value) VALUES
  ('auto_welcome','false'), ('auto_exam','false'), ('auto_year2','false'), ('auto_inactivity','false')
ON CONFLICT (key) DO NOTHING;
