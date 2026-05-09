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
      const { data: ass } = await supabase.from("assessments")
        .select("*, courses(title, year)")
        .eq("is_published", true)
        .order("created_at");

      const yearAssessments = ass?.filter((a: any) => a.courses?.year === (profile?.current_year ?? 1)) ?? [];
      setAssessments(yearAssessments);

      if (yearAssessments.length > 0) {
        const { data: subs } = await supabase.from("assessment_submissions")
          .select("*").eq("student_id", user.id)
          .in("assessment_id", yearAssessments.map((a: any) => a.id));
        const subMap: Record<string, any> = {};
        subs?.forEach((s: any) => { subMap[s.assessment_id] = s; });
        setSubmissions(subMap);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PortalShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A2E] mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Assessments
          </h1>
          <p className="text-[#9B9B9B] text-sm font-sans">Your course assessments and exams.</p>
        </div>

        {loading ? (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center">
            <p className="text-[#9B9B9B] text-sm font-sans">Loading...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Star className="w-10 h-10 text-[#E8E2D9] mx-auto mb-3" />
            <p className="text-[#1A1A2E] text-sm font-semibold mb-1" style={{ fontFamily: "'Georgia', serif" }}>No assessments yet</p>
            <p className="text-[#9B9B9B] text-xs font-sans">Assessments will appear here when published by your instructor.</p>
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
                    className={`block bg-white border rounded-2xl p-5 hover:shadow-md transition-all group ${
                      isGraded ? "border-green-200" : isSubmitted ? "border-[#D4A85C]/30" : "border-[#E8E2D9]"
                    }`} style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isGraded ? "bg-green-50 border border-green-200" : isSubmitted ? "bg-[#D4A85C]/10 border border-[#D4A85C]/20" : "bg-[#F5F0E8] border border-[#E8E2D9]"
                      }`}>
                        {isGraded ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                         isSubmitted ? <Clock className="w-5 h-5 text-[#D4A85C]" /> :
                         <Star className="w-5 h-5 text-[#8B7355]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[#8B7355] text-[10px] uppercase tracking-widest font-sans mb-0.5">{a.courses?.title}</div>
                        <div className="text-[#1A1A2E] text-sm font-semibold group-hover:text-[#D4A85C] transition-colors" style={{ fontFamily: "'Georgia', serif" }}>
                          {a.title}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[#9B9B9B] text-xs font-sans">{a.total_marks} marks</span>
                          {a.due_date && (
                            <span className="text-[#9B9B9B] text-xs font-sans flex items-center gap-1">
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
                            <div className="text-[#9B9B9B] text-[10px] font-sans">Graded</div>
                          </div>
                        )}
                        {isSubmitted && (
                          <span className="text-[#D4A85C] text-xs font-semibold font-sans">Pending Grade</span>
                        )}
                        {!sub && (
                          <span className="text-[#1A1A2E] text-xs font-semibold font-sans bg-[#1A1A2E] text-white px-3 py-1.5 rounded-full">
                            Start
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-[#D4D0C8] group-hover:text-[#D4A85C] transition-colors" />
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
