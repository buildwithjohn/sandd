-- ============================================================
-- SEED: Hermeneutics live class (Day 2 + Day 3) into the Library
-- Run this AFTER library-schema.sql. Safe to run more than once
-- (it won't create duplicates). The teaching-note PDF is added
-- separately via Admin -> Library (it needs a file upload).
-- ============================================================

INSERT INTO library_items (title, description, category, youtube_video_id, order_index, is_published)
SELECT 'Hermeneutics — Day 2',
       'Teaching on Biblical Hermeneutics with Rev. Nathan Galadima Sunday. Session 2 of the live class.',
       'Live Class', 'wgbrOWGVoo8', 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM library_items WHERE youtube_video_id = 'wgbrOWGVoo8');

INSERT INTO library_items (title, description, category, youtube_video_id, order_index, is_published)
SELECT 'Hermeneutics — Day 3',
       'Teaching on Biblical Hermeneutics with Rev. Nathan Galadima Sunday. Session 3 of the live class.',
       'Live Class', '2BJ3fpbdvPo', 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM library_items WHERE youtube_video_id = '2BJ3fpbdvPo');
