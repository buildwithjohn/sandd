"use client";
import { useState } from "react";
import Link from "next/link";
import VideoPlayer from "@/components/video/VideoPlayer";
import QuizEngine from "@/components/quiz/QuizEngine";
import {
  ChevronLeft, ChevronRight, FileText,
  BookOpen, CheckCircle, MessageSquare
} from "lucide-react";
import type { Quiz } from "@/types";

// Mock data — in production, fetch lesson by ID from Supabase
const mockLesson = {
  id: "l4",
  title: "The Role of Prophecy in the Church Today",
  course_title: "Introduction to NT Prophecy",
  course_slug: "intro-nt-prophecy",
  bunny_video_id: "abc123def456", // Replace with real Bunny.net video ID
  duration_seconds: 1080,
  notes_url: "/notes/nt-prophecy-lesson4.pdf",
  prev: { id: "l3", title: "OT vs NT Prophecy" },
  next: { id: "l5", title: "Prophecy & Edification" },
};

// Mock quiz — in production, fetch from getQuizForLesson(lessonId)
const mockQuiz: Quiz = {
  id: "q1",
  lesson_id: "l4",
  title: "Lesson 4 Quiz",
  passing_score: 70,
  questions: [
    {
      id: "qq1", quiz_id: "q1", order_index: 0,
      question: "According to 1 Corinthians 14:3, what are the three purposes of New Testament prophecy?",
      options: [
        "Prediction, Warning, Judgment",
        "Edification, Exhortation, Comfort",
        "Teaching, Rebuking, Correcting",
        "Healing, Deliverance, Blessing",
      ],
      correct_index: 1,
    },
    {
      id: "qq2", quiz_id: "q1", order_index: 1,
      question: "How does NT prophecy differ from OT prophecy in terms of authority?",
      options: [
        "NT prophecy carries the same absolute authority as Scripture",
        "NT prophecy is infallible and should never be questioned",
        "NT prophecy is subject to evaluation and testing by the church",
        "NT prophecy only applies to ordained ministers",
      ],
      correct_index: 2,
    },
    {
      id: "qq3", quiz_id: "q1", order_index: 2,
      question: "Who can prophesy under the New Covenant according to Acts 2:17?",
      options: [
        "Only ordained prophets",
        "Only male church leaders",
        "Sons, daughters, young men, old men, servants",
        "Only those with the office of prophet",
      ],
      correct_index: 2,
    },
  ],
};

type Tab = "video" | "notes" | "quiz";

export default function LessonPage() {
  const [completed, setCompleted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("video");

  // Mock student ID — in production from auth
  const studentId = "mock-student-id";

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      {/* Lesson Nav */}
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link
            href={`/portal/courses/${mockLesson.course_slug}`}
            className="flex items-center gap-1.5 text-slate-400 hover:text-brand-600 text-sm flex-shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">{mockLesson.course_title}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <h1 className="font-medium text-brand-900 text-sm text-center truncate">
            {mockLesson.title}
          </h1>
          {completed && (
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium flex-shrink-0">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Done</span>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main content — left/center */}
          <div className="lg:col-span-2 space-y-5">
            {/* Tab switcher */}
            <div className="flex gap-1 bg-white rounded-xl border border-blue-100 p-1 shadow-card">
              {([
                { id: "video", icon: BookOpen, label: "Lesson" },
                { id: "notes", icon: FileText, label: "Notes" },
                { id: "quiz", icon: MessageSquare, label: "Quiz" },
              ] as { id: Tab; icon: typeof BookOpen; label: string }[]).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === t.id
                      ? "bg-brand-700 text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* VIDEO TAB */}
            {activeTab === "video" && (
              <div>
                <VideoPlayer
                  bunnyVideoId={mockLesson.bunny_video_id}
                  lessonId={mockLesson.id}
                  studentId={studentId}
                  initialProgress={0}
                  onComplete={() => setCompleted(true)}
                  title={mockLesson.title}
                />
                <div className="bg-white rounded-xl border border-blue-100 shadow-card p-4 mt-4">
                  <h2 className="font-display text-brand-900 text-lg font-medium mb-1">
                    {mockLesson.title}
                  </h2>
                  <p className="text-slate-400 text-sm">
                    {mockLesson.course_title} · {Math.floor(mockLesson.duration_seconds / 60)} min
                  </p>
                  {completed && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 flex items-center gap-2 text-green-700 text-sm">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      Lesson complete! Take the quiz or move to the next lesson.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === "notes" && (
              <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6">
                <h2 className="font-display text-brand-900 text-lg font-medium mb-4">Lesson Notes</h2>
                <div className="border border-blue-100 rounded-xl p-4 bg-brand-50/30 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-100 border border-brand-200 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-brand-900">Lesson 4 Notes.pdf</div>
                      <div className="text-xs text-slate-400 mt-0.5">Study guide · PDF</div>
                    </div>
                  </div>
                  <a
                    href={mockLesson.notes_url}
                    download
                    className="bg-brand-700 hover:bg-brand-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Download
                  </a>
                </div>
                {/* Inline notes summary */}
                <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
                  <div>
                    <h3 className="font-medium text-brand-900 mb-1">Key Scripture</h3>
                    <p className="bg-brand-50 border-l-4 border-brand-400 px-4 py-2 rounded-r-lg italic">
                      "But the one who prophesies speaks to people for their strengthening, encouraging and comfort." — 1 Cor. 14:3
                    </p>
                  </div>
                  <div>
                    <h3 className="font-medium text-brand-900 mb-1">Summary Points</h3>
                    <ul className="space-y-2 list-none">
                      {[
                        "NT prophecy serves the church — it builds up, not tears down",
                        "Every prophetic word should be weighed, not blindly accepted",
                        "The spirit of the prophet is subject to the prophet (1 Cor 14:32)",
                        "Prophecy is available to all Spirit-filled believers, not just 'prophets'",
                      ].map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* QUIZ TAB */}
            {activeTab === "quiz" && (
              <QuizEngine
                quiz={mockQuiz}
                studentId={studentId}
                previousAttempt={null}
                onPassed={() => setCompleted(true)}
              />
            )}
          </div>

          {/* Sidebar — right */}
          <div className="space-y-4">
            {/* Navigation */}
            <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-4 space-y-2">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Navigation</h3>
              {mockLesson.prev && (
                <Link
                  href={`/portal/lessons/${mockLesson.prev.id}`}
                  className="flex items-center gap-2 p-3 rounded-xl border border-blue-100 hover:border-brand-300 hover:bg-brand-50 transition-all text-sm text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Previous</div>
                    <div className="truncate font-medium text-brand-900 text-xs mt-0.5">{mockLesson.prev.title}</div>
                  </div>
                </Link>
              )}
              {mockLesson.next && (
                <Link
                  href={`/portal/lessons/${mockLesson.next.id}`}
                  className="flex items-center gap-2 p-3 rounded-xl border border-blue-100 hover:border-brand-300 hover:bg-brand-50 transition-all text-sm text-slate-600"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wide">Next</div>
                    <div className="truncate font-medium text-brand-900 text-xs mt-0.5">{mockLesson.next.title}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </Link>
              )}
            </div>

            {/* Quick tips */}
            <div className="bg-brand-950 rounded-2xl p-4">
              <h3 className="text-brand-300 text-xs font-medium uppercase tracking-wider mb-3">Study Tips</h3>
              <ul className="space-y-2.5">
                {[
                  "Watch the full video before taking the quiz",
                  "Download the notes PDF for offline study",
                  "You can retake the quiz as many times as needed",
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-brand-400 text-xs leading-relaxed">
                    <span className="text-brand-600 mt-0.5">→</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
