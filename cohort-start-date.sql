-- Scheduled auto-start for a cohort. When set and reached, the daily cron
-- opens the cohort's first course automatically. NULL = no auto-start (you
-- start it manually). Run once in the Supabase SQL editor.
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS scheduled_start_at TIMESTAMPTZ;
