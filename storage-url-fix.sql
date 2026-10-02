-- ============================================================
-- Repoint stored Storage URLs from the OLD (deleted) Supabase project
-- to the NEW one. The files were copied during the migration; only the
-- saved full-URL strings still carry the old project ref. Idempotent.
-- OLD: whokqpklfdwqlyxidduw.supabase.co  ->  NEW: zrygjkwrrlvymtcapaef.supabase.co
-- ============================================================
BEGIN;

UPDATE profiles SET avatar_url =
  replace(avatar_url, 'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co')
  WHERE avatar_url LIKE '%whokqpklfdwqlyxidduw%';

UPDATE courses SET notes_url =
  replace(notes_url, 'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co')
  WHERE notes_url LIKE '%whokqpklfdwqlyxidduw%';

UPDATE course_resources SET file_url =
  replace(file_url, 'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co')
  WHERE file_url LIKE '%whokqpklfdwqlyxidduw%';

UPDATE library_items SET audio_url =
  replace(audio_url, 'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co')
  WHERE audio_url LIKE '%whokqpklfdwqlyxidduw%';

UPDATE library_materials SET file_url =
  replace(file_url, 'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co')
  WHERE file_url LIKE '%whokqpklfdwqlyxidduw%';

UPDATE lessons SET
  audio_url      = replace(audio_url,      'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co'),
  slides_url     = replace(slides_url,     'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co'),
  attachment_url = replace(attachment_url, 'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co'),
  notes_url      = replace(notes_url,      'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co')
  WHERE audio_url      LIKE '%whokqpklfdwqlyxidduw%'
     OR slides_url     LIKE '%whokqpklfdwqlyxidduw%'
     OR attachment_url LIKE '%whokqpklfdwqlyxidduw%'
     OR notes_url      LIKE '%whokqpklfdwqlyxidduw%';

UPDATE applications SET recommendation_url =
  replace(recommendation_url, 'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co')
  WHERE recommendation_url LIKE '%whokqpklfdwqlyxidduw%';

UPDATE assignment_submissions SET file_url =
  replace(file_url, 'whokqpklfdwqlyxidduw.supabase.co', 'zrygjkwrrlvymtcapaef.supabase.co')
  WHERE file_url LIKE '%whokqpklfdwqlyxidduw%';

COMMIT;
