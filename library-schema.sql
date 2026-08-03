-- ============================================================
-- SandD Prophetic School — LIBRARY (permanent recordings archive)
-- Run this ONCE in your Supabase SQL Editor.
-- Purely additive: creates two NEW tables. Nothing existing is
-- altered — courses, lessons, course_resources, assessments are
-- all untouched, so the Course Builder keeps working as-is.
-- ============================================================

-- A Library item = one recording/teaching that students can access forever.
-- It can carry a video (YouTube), an audio file, and any number of PDF /
-- reading materials (see library_materials below).
CREATE TABLE IF NOT EXISTS library_items (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT NOT NULL DEFAULT 'Live Class',   -- Live Class, Teaching, Extra Material, ...
  youtube_video_id  TEXT,        -- 11-char YouTube id (optional)
  audio_url         TEXT,        -- Supabase Storage URL (optional)
  order_index       INTEGER DEFAULT 0,
  is_published      BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Extra readings / handouts attached to a Library item (many per item).
CREATE TABLE IF NOT EXISTS library_materials (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS library_materials_item_idx ON library_materials(item_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Enrolled students are authenticated users, so published items are
-- readable by any signed-in user (same pattern as published courses).
-- Admins manage everything.
-- ============================================================
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published library items"
  ON library_items FOR SELECT
  USING (is_published = TRUE AND auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage library items"
  ON library_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));

CREATE POLICY "Authenticated users can view library materials"
  ON library_materials FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM library_items i
      WHERE i.id = library_materials.item_id AND i.is_published = TRUE
    )
  );

CREATE POLICY "Admins can manage library materials"
  ON library_materials FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')));
