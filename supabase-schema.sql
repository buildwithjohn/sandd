-- ============================================================
-- SandD Prophetic School — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  church TEXT,
  city TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'instructor', 'mentor')),
  enrollment_status TEXT DEFAULT 'pending' CHECK (enrollment_status IN ('pending', 'active', 'suspended', 'graduated')),
  current_year INTEGER DEFAULT 1 CHECK (current_year IN (1, 2)),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COURSES
-- ============================================================
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL CHECK (year IN (1, 2)),
  credits INTEGER NOT NULL DEFAULT 2,
  scripture_reference TEXT,
  icon TEXT DEFAULT '📖',
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert all 10 courses from the founding document
INSERT INTO courses (slug, title, description, year, credits, scripture_reference, icon, order_index, is_published) VALUES
('intro-nt-prophecy', 'Introduction to NT Prophecy', 'Covers differences between Old and New Testament prophecy, role of prophecy in the church.', 1, 3, '1 Cor. 14:3', '📖', 1, true),
('person-holy-spirit', 'The Person and Work of the Holy Spirit', 'Explores the Holy Spirit''s role in prophecy and discernment.', 1, 3, 'John 14–16', '🕊️', 2, true),
('biblical-hermeneutics', 'Biblical Hermeneutics', 'Teaches sound Bible interpretation to avoid eisegesis.', 1, 3, '2 Tim. 2:15', '📜', 3, true),
('spirituality-vs-spiritism', 'Spirituality vs. Spiritism', 'Addresses biblical warnings against spiritism.', 1, 2, '1 John 4:1–6', '⚠️', 4, true),
('prayer-intimacy', 'Prayer and Intimacy with God', 'Cultivates a lifestyle of prayer and worship.', 1, 2, 'Ps. 27:4', '🙏', 5, true),
('character-ethics', 'Character and Ethics in Prophetic Ministry', 'Emphasizes integrity and accountability.', 1, 2, '1 Tim. 3:1–7', '⚖️', 6, true),
('advanced-prophetic', 'Advanced Prophetic Ministry', 'Covers prophetic intercession, visions, and corporate prophecy.', 2, 3, NULL, '🔥', 7, false),
('discernment-deliverance', 'Discernment and Deliverance', 'Teaches spiritual warfare and deliverance.', 2, 3, 'Mark 16:17', '🛡️', 8, false),
('new-covenant-theology', 'Theology of the New Covenant', 'Explores grace and freedom in Christ.', 2, 3, 'Heb. 8:6–13', '✝️', 9, false),
('leadership-prophetic', 'Leadership in Prophetic Ministry', 'Prepares students to mentor others and serve church leadership.', 2, 2, NULL, '👑', 10, false),
('prophetic-evangelism', 'Prophetic Evangelism', 'Equips students to use prophecy in outreach.', 2, 2, 'Acts 8:26–40', '🌍', 11, false);

-- ============================================================
-- LESSONS (video lessons per course)
-- ============================================================
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,           -- Bunny.net stream URL
  bunny_video_id TEXT,      -- Bunny.net video ID for embed
  duration_seconds INTEGER,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  notes_url TEXT,           -- PDF notes download link
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Welcome Module (special first lesson, accessible before enrollment)
INSERT INTO lessons (course_id, title, description, order_index, is_published)
SELECT id, 'Welcome to S&D Prophetic School', 'Prophet Abiodun Sule introduces the heart and vision of this school. Watch this before anything else.', 0, true
FROM courses WHERE slug = 'intro-nt-prophecy';

-- ============================================================
-- ENROLLMENTS (student ↔ course)
-- ============================================================
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, course_id)
);

-- ============================================================
-- LESSON PROGRESS
-- ============================================================
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  watch_percent INTEGER DEFAULT 0 CHECK (watch_percent BETWEEN 0 AND 100),
  completed_at TIMESTAMPTZ,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- ["option A", "option B", "option C", "option D"]
  correct_index INTEGER NOT NULL, -- 0-based index
  order_index INTEGER DEFAULT 0
);

CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  answers JSONB, -- student's answers
  attempted_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assignment_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_url TEXT,
  text_response TEXT,
  grade INTEGER,
  feedback TEXT,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'returned')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  graded_at TIMESTAMPTZ,
  UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- APPLICATIONS (admissions)
-- ============================================================
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  church TEXT NOT NULL,
  city TEXT,
  testimony TEXT NOT NULL,
  recommendation_url TEXT, -- uploaded PDF
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  admin_notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  is_pinned BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles: students see own, admins see all
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses: published visible to all authenticated users
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view published courses" ON courses FOR SELECT USING (
  is_published = true AND auth.uid() IS NOT NULL
);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Lessons: enrolled students can view published lessons
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view lessons for enrolled courses" ON lessons FOR SELECT USING (
  is_published = true AND (
    EXISTS (
      SELECT 1 FROM enrollments
      WHERE student_id = auth.uid() AND course_id = lessons.course_id
    )
    OR order_index = 0 -- Welcome module is always accessible
  )
);
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Progress: students see own only
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can manage own progress" ON lesson_progress FOR ALL USING (auth.uid() = student_id);

-- Applications: public insert, admin read all
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit application" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all applications" ON applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Announcements: all authenticated users can read
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read announcements" ON announcements FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Student'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-enroll Year 1 students in all Year 1 courses when activated
CREATE OR REPLACE FUNCTION auto_enroll_year1(student_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO enrollments (student_id, course_id)
  SELECT student_uuid, id FROM courses WHERE year = 1 AND is_published = true
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
