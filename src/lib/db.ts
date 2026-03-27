import { createClient } from './supabase'
import type {
  Course, Lesson, LessonProgress, Enrollment,
  Quiz, QuizAttempt, Profile, Announcement,
  StudentDashboardStats
} from '@/types'

// ============================================================
// COURSES
// ============================================================

export async function getPublishedCourses(): Promise<Course[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('order_index')
  if (error) throw error
  return data
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getCoursesWithProgress(studentId: string): Promise<Course[]> {
  const supabase = createClient()

  // Get all enrolled courses for this student
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId)

  const courseIds = enrollments?.map(e => e.course_id) ?? []
  if (courseIds.length === 0) return []

  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .in('id', courseIds)
    .order('order_index')

  if (!courses) return []

  // For each course, get lesson count + completed count
  const enriched = await Promise.all(courses.map(async (course) => {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', course.id)
      .eq('is_published', true)

    const lessonIds = lessons?.map(l => l.id) ?? []

    const { data: completed } = await supabase
      .from('lesson_progress')
      .select('id')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .in('lesson_id', lessonIds)

    const lesson_count = lessonIds.length
    const completed_lessons = completed?.length ?? 0
    const progress = lesson_count > 0
      ? Math.round((completed_lessons / lesson_count) * 100)
      : 0

    return { ...course, lesson_count, completed_lessons, progress }
  }))

  return enriched
}

// ============================================================
// LESSONS
// ============================================================

export async function getLessonsForCourse(
  courseId: string,
  studentId?: string
): Promise<Lesson[]> {
  const supabase = createClient()
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('order_index')
  if (error) throw error
  if (!lessons) return []

  if (!studentId) return lessons

  // Attach progress for each lesson
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', studentId)
    .in('lesson_id', lessons.map(l => l.id))

  const progressMap = new Map(progressData?.map(p => [p.lesson_id, p]) ?? [])

  return lessons.map(lesson => ({
    ...lesson,
    progress: progressMap.get(lesson.id) ?? null,
  }))
}

export async function getLessonById(lessonId: string): Promise<Lesson | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('lessons')
    .select('*, courses(title, slug, year)')
    .eq('id', lessonId)
    .single()
  if (error) return null
  return data
}

// ============================================================
// PROGRESS TRACKING
// ============================================================

export async function upsertLessonProgress(
  studentId: string,
  lessonId: string,
  watchPercent: number
): Promise<void> {
  const supabase = createClient()
  const status = watchPercent >= 90
    ? 'completed'
    : watchPercent > 0
    ? 'in_progress'
    : 'not_started'

  await supabase
    .from('lesson_progress')
    .upsert({
      student_id: studentId,
      lesson_id: lessonId,
      watch_percent: watchPercent,
      status,
      last_watched_at: new Date().toISOString(),
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    }, { onConflict: 'student_id,lesson_id' })
}

export async function getLessonProgress(
  studentId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('student_id', studentId)
    .eq('lesson_id', lessonId)
    .single()
  return data
}

// ============================================================
// QUIZZES
// ============================================================

export async function getQuizForLesson(lessonId: string): Promise<Quiz | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .eq('lesson_id', lessonId)
    .single()
  if (error) return null
  return data
}

export async function getQuizForCourse(courseId: string): Promise<Quiz | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('quizzes')
    .select('*, quiz_questions(*)')
    .eq('course_id', courseId)
    .is('lesson_id', null)
    .single()
  if (error) return null
  return data
}

export async function submitQuizAttempt(
  studentId: string,
  quizId: string,
  answers: number[],
  questions: { correct_index: number }[],
  passingScore: number
): Promise<QuizAttempt> {
  const supabase = createClient()
  const correct = answers.filter((a, i) => a === questions[i]?.correct_index).length
  const score = Math.round((correct / questions.length) * 100)
  const passed = score >= passingScore

  const { data, error } = await supabase
    .from('quiz_attempts')
    .insert({
      student_id: studentId,
      quiz_id: quizId,
      score,
      passed,
      answers,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getBestQuizAttempt(
  studentId: string,
  quizId: string
): Promise<QuizAttempt | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('student_id', studentId)
    .eq('quiz_id', quizId)
    .order('score', { ascending: false })
    .limit(1)
    .single()
  return data
}

// ============================================================
// DASHBOARD STATS
// ============================================================

export async function getStudentDashboardStats(
  studentId: string
): Promise<StudentDashboardStats> {
  const supabase = createClient()

  const [{ count: active_courses }, { data: progress }, { data: attempts }] =
    await Promise.all([
      supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId),
      supabase
        .from('lesson_progress')
        .select('status')
        .eq('student_id', studentId),
      supabase
        .from('quiz_attempts')
        .select('score')
        .eq('student_id', studentId),
    ])

  const completed_lessons = progress?.filter(p => p.status === 'completed').length ?? 0
  const scores = attempts?.map(a => a.score) ?? []
  const quiz_average = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  // Get enrolled courses to sum credits
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('courses(credits)')
    .eq('student_id', studentId)

  const total_credits = enrollments?.reduce(
    (sum: number, e: any) => sum + (e.courses?.credits ?? 0), 0
  ) ?? 0

  return {
    active_courses: active_courses ?? 0,
    completed_lessons,
    quiz_average,
    total_credits,
  }
}

// ============================================================
// ANNOUNCEMENTS
// ============================================================

export async function getAnnouncements(): Promise<Announcement[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('announcements')
    .select('*, author:profiles(full_name)')
    .order('is_pinned', { ascending: false })
    .order('published_at', { ascending: false })
    .limit(10)
  if (error) throw error
  return data ?? []
}
