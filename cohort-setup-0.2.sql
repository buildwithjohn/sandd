-- ============================================================
-- Rename the existing cohort to "Cohort 0.1" and open a new,
-- separate "Cohort 0.2" for registration. The 173 existing
-- students stay in Cohort 0.1; all NEW registrations + waitlist
-- admits are stamped Cohort 0.2 (full separation via cohort_id).
-- ============================================================
BEGIN;

-- 1) Existing intake -> Cohort 0.1 (and release its "current" flag)
UPDATE cohorts SET name = 'Cohort 0.1', is_current = FALSE WHERE is_current = TRUE;

-- 2) New intake -> Cohort 0.2, current + open for registration
INSERT INTO cohorts (name, status, is_current, registration_opens_at, starts_at)
VALUES ('Cohort 0.2', 'registration', TRUE, NOW(), NOW());

-- 3) Open the public /apply registration form
INSERT INTO school_settings (key, value) VALUES ('registration_open', 'true')
  ON CONFLICT (key) DO UPDATE SET value = 'true', updated_at = NOW();

COMMIT;
