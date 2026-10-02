-- ============================================================
-- S&D — COHORT ENGINE
-- Additive. Adds a named, trackable cohort entity so intake can be
-- opened/closed and students grouped per intake year.
-- ============================================================

CREATE TABLE IF NOT EXISTS cohorts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    TEXT NOT NULL,
  status                  TEXT NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft','registration','active','closed','graduated')),
  registration_opens_at   TIMESTAMPTZ,
  registration_closes_at  TIMESTAMPTZ,
  starts_at               TIMESTAMPTZ,
  ends_at                 TIMESTAMPTZ,
  is_current              BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- At most one "current" cohort at a time.
CREATE UNIQUE INDEX IF NOT EXISTS cohorts_one_current ON cohorts (is_current) WHERE is_current = TRUE;

-- Which cohort a student belongs to.
ALTER TABLE profiles  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id);
-- Which cohort a waitlist signup is waiting for (nullable; set when admitted).
ALTER TABLE waitlist  ADD COLUMN IF NOT EXISTS cohort_id UUID REFERENCES cohorts(id);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view cohorts" ON cohorts;
CREATE POLICY "Authenticated can view cohorts" ON cohorts
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins manage cohorts" ON cohorts;
CREATE POLICY "Admins manage cohorts" ON cohorts
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

GRANT ALL ON cohorts TO anon, authenticated, service_role;

-- ============================================================
-- Seed: the existing intake, and backfill current students into it.
-- (Runs once; guarded so re-running is safe.)
-- ============================================================
DO $$
DECLARE v_cohort uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cohorts) THEN
    INSERT INTO cohorts (name, status, is_current, starts_at)
    VALUES ('2026 Cohort', 'active', TRUE, NOW())
    RETURNING id INTO v_cohort;

    UPDATE profiles SET cohort_id = v_cohort
    WHERE role = 'student' AND cohort_id IS NULL;
  END IF;
END $$;
