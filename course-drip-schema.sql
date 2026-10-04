-- ============================================================================
-- COURSE DRIP — per-cohort sequential course schedule (14-day drip)
-- Run once in the Supabase SQL editor. Safe to re-run (idempotent).
-- ============================================================================

-- 1) Rename the course (keeps the same slug so existing links keep working)
UPDATE courses
SET title = 'Understanding Spirituality'
WHERE title ILIKE 'Spirituality%Spiritism%';

-- 2) Per-cohort course schedule table
CREATE TABLE IF NOT EXISTS cohort_courses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id      UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  course_id      UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position       INT  NOT NULL DEFAULT 0,              -- order in the track
  status         TEXT NOT NULL DEFAULT 'locked'
                   CHECK (status IN ('locked','open','closed')),
  opens_at       TIMESTAMPTZ,                          -- when it became open
  closes_at      TIMESTAMPTZ,                          -- auto-closes at this time
  duration_days  INT  NOT NULL DEFAULT 14,             -- drip length
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (cohort_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_cohort_courses_cohort ON cohort_courses(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_courses_status ON cohort_courses(status);

-- RLS: the schedule is not sensitive — any signed-in user may read it;
-- only the service role (used by our admin/cron endpoints) may write.
ALTER TABLE cohort_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cohort_courses_read ON cohort_courses;
CREATE POLICY cohort_courses_read ON cohort_courses
  FOR SELECT TO authenticated USING (true);

-- 3) Seed every cohort with all courses, in order, all LOCKED to start.
INSERT INTO cohort_courses (cohort_id, course_id, position, status, duration_days)
SELECT c.id,
       co.id,
       ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY co.year, co.order_index),
       'locked',
       14
FROM cohorts c
CROSS JOIN courses co
ON CONFLICT (cohort_id, course_id) DO NOTHING;

-- 4) Cohort 0.1 is mid-programme — reflect reality from the current global
--    is_closed flags: courses already closed → 'closed'; the first still-open
--    course (Understanding Spirituality) → 'open' for the next 14 days.
UPDATE cohort_courses t
SET status = 'closed'
FROM cohorts c, courses co
WHERE t.cohort_id = c.id
  AND t.course_id = co.id
  AND c.name ILIKE '%0.1%'
  AND co.is_closed = true;

WITH first_open AS (
  SELECT t.id
  FROM cohort_courses t
  JOIN cohorts c  ON c.id  = t.cohort_id
  JOIN courses co ON co.id = t.course_id
  WHERE c.name ILIKE '%0.1%'
    AND co.is_closed = false
  ORDER BY t.position ASC
  LIMIT 1
)
UPDATE cohort_courses t
SET status = 'open',
    opens_at = now(),
    closes_at = now() + interval '14 days'
FROM first_open f
WHERE t.id = f.id;

-- Cohort 0.2 (and any not-yet-started cohort) stays fully locked until you
-- open its first course from the admin Course Schedule.

-- 5) Verify
SELECT c.name AS cohort, co.title AS course, t.position, t.status,
       t.opens_at, t.closes_at
FROM cohort_courses t
JOIN cohorts c  ON c.id  = t.cohort_id
JOIN courses co ON co.id = t.course_id
ORDER BY c.name, t.position;
