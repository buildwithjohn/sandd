"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { Star, CheckCircle, Clock, ChevronRight, AlertCircle } from "lucide-react";

export default function AssessmentsListPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }

      const { data: profile } = await supabase.from("profiles").select("current_year").eq("id", user.id).single();

      // 1) All published assessments
      const { data: published } = await supabase.from("assessments")
        .select("*, courses(title, year)")
        .eq("is_published", true)
        .order("created_at");

      // 2) The student's submissions (incl. those for now-unpublished assessments)
      const { data: subs } = await supabase.from("assessment_submissions")
        .select("*").eq("student_id", user.id)
        .order("submitted_at", { ascending: false });

      const subMap: Record<string, any> = {};
      // Keep the latest submission per assessment_id (handles duplicate rows safely)
      (subs ?? []).forEach((s: any) => { if (!subMap[s.assessment_id]) subMap[s.assessment_id] = s; });

      // 3) Fetch assessments the student has submitted but that aren't in `published`
      const publishedIds = new Set((published ?? []).map((a: any) => a.id));
      const missingIds = Object.keys(subMap).filter(id => !publishedIds.has(id));
      let extras: any[] = [];
      if (missingIds.length > 0) {
        const { data } = await supabase.from("assessments")
          .select("*, courses(title, year)")
          .in("id", missingIds);
        extras = data ?? [];
      }

      // 4) Combine, filter by student's year, sort.
      //    Exception: always keep assessments the student already submitted,
      //    regardless of year, so a submitted exam can never silently disappear.
      const submittedIds = new Set(Object.keys(subMap));
      const studentYear = profile?.current_year ?? 1;
      const combined = [...(published ?? []), ...extras]
        .filter((a: any) => a.courses?.year === studentYear || submittedIds.has(a.id))
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setAssessments(combined);
      setSubmissions(subMap);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PortalShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold theme-text mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Assessments
          </h1>
          <p className="theme-text-muted text-sm font-sans">Your course assessments and exams.</p>
        </div>

        {loading ? (
          <div className="theme-bg-elevated border theme-border rounded-2xl p-12 text-center">
            <p className="theme-text-muted text-sm font-sans">Loading...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="theme-bg-elevated border theme-border rounded-2xl p-12 text-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Star className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
            <p className="theme-text text-sm font-semibold mb-1" style={{ fontFamily: "'Georgia', serif" }}>No assessments yet</p>
            <p className="theme-text-muted text-xs font-sans">Assessments will appear here when published by your instructor.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assessments.map((a, i) => {
              const sub    = submissions[a.id];
              const isGraded    = sub?.status === "graded" && sub?.results_released;
              const isSubmitted = sub && !isGraded;
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                  <Link href={`/portal/assessments/${a.id}`}
                    className={`block theme-bg-elevated border rounded-2xl p-5 hover:shadow-md transition-all group ${
                      isGraded ? "border-green-200" : isSubmitted ? "border-[#D4A85C]/30" : "theme-border"
                    }`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isGraded ? "bg-green-50 border border-green-200" : isSubmitted ? "bg-[#D4A85C]/10 border border-[#D4A85C]/20" : "theme-bg-subtle border theme-border"
                      }`}>
                        {isGraded ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                         isSubmitted ? <Clock className="w-5 h-5 theme-accent" /> :
                         <Star className="w-5 h-5 theme-accent" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="theme-accent text-[10px] uppercase tracking-widest font-sans mb-0.5">{a.courses?.title}</div>
                        <div className="theme-text text-sm font-semibold group-hover:theme-accent transition-colors" style={{ fontFamily: "'Georgia', serif" }}>
                          {a.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="theme-text-muted text-xs font-sans">{a.total_marks} marks</span>
                          {a.due_date && (
                            <span className="theme-text-muted text-xs font-sans flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Due {new Date(a.due_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isGraded && (
                          <div className="text-right">
                            <div className="text-green-600 text-sm font-bold">{sub.total_score}/{a.total_marks}</div>
                            <div className="theme-text-muted text-[10px] font-sans">Graded</div>
                          </div>
                        )}
                        {isSubmitted && (
                          <span className="theme-accent text-xs font-semibold font-sans">Pending Grade</span>
                        )}
                        {!sub && (
                          <span className="theme-text text-xs font-semibold font-sans bg-[#1A1A2E] text-white px-3 py-1.5 rounded-full">
                            Start
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:theme-accent transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
