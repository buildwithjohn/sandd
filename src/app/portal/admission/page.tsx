"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { ExternalLink, Printer } from "lucide-react";

export default function AdmissionLetterPage() {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!profile) return;
      setStudent({ ...profile, email: user.email });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <PortalShell>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" />
      </div>
    </PortalShell>
  );

  const studentNumber = student.student_number || "SANDD/2026/—";
  const admissionDate = new Date(student.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <PortalShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A2E] mb-1" style={{ fontFamily: "'Georgia', serif" }}>
              Admission Letter
            </h1>
            <p className="text-[#9B9B9B] text-sm font-sans">
              Student No: <span className="text-[#D4A85C] font-semibold">{studentNumber}</span>
            </p>
          </div>
          <a
            href={`/portal/admission/print?id=${student.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white text-xs font-semibold font-sans px-5 py-2.5 rounded-xl transition-all">
            <Printer className="w-3.5 h-3.5" /> Open & Print / Save PDF
          </a>
        </div>

        {/* Preview card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
          <LetterPreview student={student} admissionDate={admissionDate} studentNumber={studentNumber} />
        </motion.div>

        <div className="bg-[#FAF9F6] border border-[#E8E2D9] rounded-2xl p-4 flex items-start gap-3">
          <ExternalLink className="w-4 h-4 text-[#D4A85C] flex-shrink-0 mt-0.5" />
          <p className="text-[#6B6B6B] text-xs font-sans leading-relaxed">
            Click <strong>&quot;Open &amp; Print / Save PDF&quot;</strong> above to open your letter in a new tab.
            Then press <strong>Ctrl+P</strong> (or Cmd+P on Mac), choose <strong>&quot;Save as PDF&quot;</strong> as destination, and click Save.
          </p>
        </div>
      </div>
    </PortalShell>
  );
}

function LetterPreview({ student, admissionDate, studentNumber }: any) {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div style={{ fontFamily: "Georgia, serif", fontSize: "13px", color: "#111" }}>
      {/* Header */}
      <div style={{ background: "#1A1A2E", padding: "24px 36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <img src="/assets/logo.png" alt="Logo" style={{ width: "48px", height: "48px", borderRadius: "10px" }} />
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "13px" }}>Sons and Daughters of Prophets</div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "13px" }}>Prophetic Training School</div>
            <div style={{ color: "#D4A85C", fontSize: "10px", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>Treasures in Clay Ministries</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", fontFamily: "Arial", textTransform: "uppercase", letterSpacing: "2px" }}>Student Number</div>
          <div style={{ color: "#D4A85C", fontSize: "12px", fontFamily: "monospace", marginTop: "2px" }}>{studentNumber}</div>
        </div>
      </div>
      <div style={{ height: "4px", background: "linear-gradient(to right, #D4A85C, #F5D4A0, #D4A85C)" }} />

      {/* Body */}
      <div style={{ padding: "32px 36px" }}>
        <p style={{ color: "#888", fontSize: "12px", fontFamily: "Arial", marginBottom: "20px" }}>{today}</p>
        <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 3px 0" }}>{student.full_name}</p>
        {student.church && <p style={{ color: "#555", fontSize: "12px", fontFamily: "Arial", margin: "0 0 2px 0" }}>{student.church}</p>}
        {student.city && <p style={{ color: "#555", fontSize: "12px", fontFamily: "Arial", margin: "0 0 20px 0" }}>{student.city}</p>}
        <div style={{ borderLeft: "4px solid #D4A85C", paddingLeft: "12px", marginBottom: "24px" }}>
          <p style={{ fontWeight: "700", fontSize: "13px", margin: "0 0 3px 0" }}>LETTER OF ADMISSION — 2026 COHORT</p>
          <p style={{ fontWeight: "700", fontSize: "13px", margin: "0" }}>SONS AND DAUGHTERS OF PROPHETS PROPHETIC TRAINING SCHOOL</p>
        </div>
        <p style={{ fontSize: "13px", marginBottom: "14px" }}>Dear <strong>{student.full_name?.split(" ")[0]}</strong>,</p>
        <p style={{ fontSize: "12px", lineHeight: "1.8", marginBottom: "12px", textAlign: "justify", color: "#333" }}>
          On behalf of the Founder and Dean, <strong>Prophet Abiodun Sule</strong>, and the entire faculty of the Sons and Daughters of Prophets Prophetic Training School, I am delighted to formally inform you that your application for admission into the <strong>2026 Cohort — Year 1</strong> has been reviewed and approved.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "11px", fontFamily: "Arial" }}>
          {[["Student Number", studentNumber], ["Student Name", student.full_name], ["Student Email", student.email], ["Programme", "Certificate in Prophetic Ministry — Year 1"], ["Date of Admission", admissionDate], ["Mode of Study", "Online — Portal & Live Zoom Sessions"], ["Tuition", "Free of Charge"]].map(([l, v], i) => (
            <tr key={l} style={{ background: i % 2 === 0 ? "#F8F6F2" : "white" }}>
              <td style={{ padding: "7px 12px", fontWeight: "600", color: "#8B7355", width: "36%", borderBottom: "1px solid #E8E2D9" }}>{l}</td>
              <td style={{ padding: "7px 12px", color: "#111", borderBottom: "1px solid #E8E2D9" }}>{v}</td>
            </tr>
          ))}
        </table>
        <div style={{ marginTop: "20px", paddingTop: "12px", borderTop: "1px solid #E8E2D9" }}>
          <img src="/assets/john-signature.png" alt="Signature" style={{ width: "100px", height: "48px", objectFit: "contain" }} />
          <p style={{ fontWeight: "700", fontSize: "13px", margin: "6px 0 2px 0" }}>John Ayomide Akinola</p>
          <p style={{ fontSize: "11px", color: "#666", fontFamily: "Arial", margin: "0" }}>Registrar · S&D Prophetic Training School · Treasures in Clay Ministries</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#1A1A2E", padding: "12px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", fontFamily: "Arial" }}>sandd.abiodunsule.uk</span>
        <span style={{ color: "rgba(212,168,92,0.6)", fontSize: "9px", fontFamily: "Arial", fontStyle: "italic" }}>
          &ldquo;But the one who prophesies speaks to people for their strengthening, encouraging and comfort.&rdquo; — 1 Cor 14:3
        </span>
      </div>
    </div>
  );
}
