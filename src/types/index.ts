// ============================================================
// SandD Platform — Core TypeScript Types
// ============================================================

export type UserRole = 'student' | 'admin' | 'instructor' | 'mentor'
export type EnrollmentStatus = 'pending' | 'active' | 'suspended' | 'graduated'
export type LessonStatus = 'not_started' | 'in_progress' | 'completed'
export type ApplicationStatus = 'pending' | 'reviewing' | 'accepted' | 'rejected'
export type SubmissionStatus = 'submitted' | 'graded' | 'returned'

export interface Profile {
  id: string
  full_name: string
  email: string
  phone?: string
  church?: string
  city?: string
  role: UserRole
  enrollment_status: EnrollmentStatus
  current_year: 1 | 2
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  slug: string
  title: string
  description?: string
  year: 1 | 2
  credits: number
  scripture_reference?: string
  icon: string
  order_index: number
  is_published: boolean
  created_at: string
  // computed
  progress?: number
  lesson_count?: number
  completed_lessons?: number
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string
  video_url?: string
  bunny_video_id?: string
  duration_seconds?: number
  order_index: number
  is_published: boolean
  notes_url?: string
  created_at: string
  // computed
  progress?: LessonProgress
}

export interface LessonProgress {
  id: string
  student_id: string
  lesson_id: string
  status: LessonStatus
  watch_percent: number
  completed_at?: string
  last_watched_at: string
}

export interface Enrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  completed_at?: string
}

export interface Quiz {
  id: string
  lesson_id?: string
  course_id?: string
  title: string
  passing_score: number
  questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  quiz_id: string
  question: string
  options: string[]
  correct_index: number
  order_index: number
}

export interface QuizAttempt {
  id: string
  student_id: string
  quiz_id: string
  score: number
  passed: boolean
  answers?: number[]
  attempted_at: string
}

export interface Assignment {
  id: string
  course_id: string
  title: string
  description?: string
  due_date?: string
  created_at: string
}

export interface AssignmentSubmission {
  id: string
  assignment_id: string
  student_id: string
  file_url?: string
  text_response?: string
  grade?: number
  feedback?: string
  status: SubmissionStatus
  submitted_at: string
  graded_at?: string
}

export interface Application {
  id: string
  full_name: string
  email: string
  phone?: string
  church: string
  city?: string
  testimony: string
  recommendation_url?: string
  status: ApplicationStatus
  admin_notes?: string
  applied_at: string
  reviewed_at?: string
}

export interface Announcement {
  id: string
  title: string
  body: string
  author_id?: string
  is_pinned: boolean
  published_at: string
  author?: Profile
}

// Dashboard summary types
export interface StudentDashboardStats {
  active_courses: number
  completed_lessons: number
  quiz_average: number
  total_credits: number
}

export interface AdminDashboardStats {
  total_students: number
  active_students: number
  pending_applications: number
  total_videos: number
  total_courses: number
}
