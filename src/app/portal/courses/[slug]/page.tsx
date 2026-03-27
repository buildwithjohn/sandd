"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BookOpen, Bell, ChevronRight, CheckCircle, PlayCircle, Clock, FileText, Lock } from "lucide-react";

// Mock course data — replace with getLessonsForCourse(courseId, studentId)
const courseData: Record<string, {
  title: string; icon: string; scripture: string; credits: number;
  description: string;
  lessons: { id: string; title: string; duration: string; status: string; has_notes: boolean; has_quiz: boolean }[]
}> = {
  "intro-nt-prophecy": {
    title: "Introduction to NT Prophecy",
    icon: "📖",
    scripture: "1 Cor. 14:3",
    credits: 3,
    description: "This course lays the foundation for understanding how New Testament prophecy differs from Old Testament prophecy, and what role it plays in the church today.",
    lessons: [
      { id: "l1", title: "Welcome & Course Overview", duration: "8 min", status: "completed", has_notes: true, has_quiz: false },
      { id: "l2", title: "What is New Testament Prophecy?", duration: "22 min", status: "completed", has_notes: true, has_quiz: true },
      { id: "l3", title: "Old Testament vs New Testament Prophecy", duration: "28 min", status: "completed", has_notes: true, has_quiz: true },
      { id: "l4", title: "The Role of Prophecy in the Church Today", duration: "18 min", status: "in_progress", has_notes: true, has_quiz: false },
      { id: "l5", title: "Prophecy and Edification (1 Cor 14:3)", duration: "20 min", status: "not_started", has_notes: false, has_quiz: true },
      { id: "l6", title: "Weighing Prophetic Words", duration: "16 min", status: "not_started", has_notes: true, has_quiz: false },
      { id: "l7", title: "Corporate Prophecy in the Local Church", duration: "24 min", status: "not_started", has_notes: true, has_quiz: true },
      { id: "l8", title: "Summary & Course Assessment", duration: "12 min", status: "not_started", has_notes: false, has_quiz: true },
    ],
  },
};

const statusConfig: Record<string, { icon: typeof CheckCircle; label: string; className: string; iconClass: string }> = {
  completed: { icon: CheckCircle, label: "Completed", className: "text-green-600", iconClass: "text-green-500" },
  in_progress: { icon: PlayCircle, label: "In Progress", className: "text-brand-600", iconClass: "text-brand-500" },
  not_started: { icon: Clock, label: "Not Started", className: "text-slate-400", iconClass: "text-slate-300" },
};

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const course = courseData[slug] ?? courseData["intro-nt-prophecy"];

  const completed = course.lessons.filter(l => l.status === "completed").length;
  const total = course.lessons.length;
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/portal/courses" className="text-slate-400 hover:text-brand-600 flex items-center gap-1 text-sm">
              ← My Courses
            </Link>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-medium text-xs">AO</div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Course header */}
        <div className="bg-brand-950 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-800 border border-brand-700 flex items-center justify-center text-3xl flex-shrink-0">
              {course.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-brand-400 text-xs font-medium uppercase tracking-wider mb-1">
                Year 1 · {course.credits} credits · {course.scripture}
              </div>
              <h1 className="font-display text-white text-2xl font-medium mb-2">{course.title}</h1>
              <p className="text-brand-300 text-sm leading-relaxed">{course.description}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-5 pt-4 border-t border-brand-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-brand-400 text-xs">{completed} of {total} lessons complete</span>
              <span className="text-brand-300 text-xs font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 bg-brand-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lessons list */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-blue-50">
            <h2 className="font-display text-brand-900 text-lg font-medium">
              Course Lessons
            </h2>
          </div>
          <div>
            {course.lessons.map((lesson, index) => {
              const s = statusConfig[lesson.status];
              const StatusIcon = s.icon;
              const isLocked = index > 0 &&
                course.lessons[index - 1].status === "not_started" &&
                lesson.status === "not_started";

              return (
                <Link
                  key={lesson.id}
                  href={isLocked ? "#" : `/portal/lessons/${lesson.id}`}
                  className={`flex items-center gap-4 px-5 py-4 border-b border-blue-50 last:border-0 transition-colors ${
                    isLocked
                      ? "opacity-40 cursor-not-allowed"
                      : "hover:bg-brand-50/40 cursor-pointer"
                  }`}
                  onClick={(e) => isLocked && e.preventDefault()}
                >
                  {/* Lesson number / status icon */}
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    lesson.status === "completed"
                      ? "border-green-300 bg-green-50"
                      : lesson.status === "in_progress"
                      ? "border-brand-400 bg-brand-50"
                      : "border-slate-200 bg-white"
                  }`}>
                    {isLocked
                      ? <Lock className="w-3.5 h-3.5 text-slate-400" />
                      : <StatusIcon className={`w-4 h-4 ${s.iconClass}`} />
                    }
                  </div>

                  {/* Lesson info */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${
                      lesson.status === "completed" ? "text-slate-500" : "text-brand-900"
                    }`}>
                      {index + 1}. {lesson.title}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-slate-400">{lesson.duration}</span>
                      {lesson.has_notes && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <FileText className="w-2.5 h-2.5" /> Notes
                        </span>
                      )}
                      {lesson.has_quiz && (
                        <span className="text-xs text-amber-500 font-medium">Quiz</span>
                      )}
                    </div>
                  </div>

                  {/* Status label */}
                  <span className={`text-xs font-medium flex-shrink-0 ${s.className}`}>
                    {lesson.status === "in_progress" ? "Continue →" : s.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
