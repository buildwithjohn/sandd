"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { Printer } from "lucide-react";

export default function AdmissionLetterPage() {
  const router   = useRouter();
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

  const admissionDate = new Date(student.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const studentNumber = student.student_number || "SANDD/2026/—";

  return (
    <PortalShell>
      {/* Full-page print CSS — captures everything */}
      <style>{`
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body > * { display: none !important; }
          #print-root { display: block !important; position: fixed !important; inset: 0 !important; z-index: 99999 !important; background: white !important; overflow: visible !important; }
          #print-root * { display: revert !important; }
          .no-print { display: none !important; }
          @page { size: A4 portrait; margin: 0; }
        }
        #print-root { display: none; }
        @media print { #print-root { display: block; } }
      `}</style>

      {/* Hidden full-page print version */}
      <div id="print-root">
        <AdmissionLetterContent student={student} admissionDate={admissionDate} studentNumber={studentNumber} />
      </div>

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A2E]" style={{ fontFamily: "'Georgia', serif" }}>
              Admission Letter
            </h1>
            <p className="text-[#9B9B9B] text-sm font-sans mt-0.5">
              Student No: <span className="text-[#D4A85C] font-semibold">{studentNumber}</span>
            </p>
          </div>
          <button onClick={() => window.print()}
            className="no-print flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white text-xs font-semibold font-sans px-5 py-2.5 rounded-xl transition-all">
            <Printer className="w-3.5 h-3.5" /> Print / Save as PDF
          </button>
        </div>

        {/* Preview */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-sm">
          <AdmissionLetterContent student={student} admissionDate={admissionDate} studentNumber={studentNumber} />
        </motion.div>

        <p className="text-[#9B9B9B] text-xs font-sans text-center no-print">
          Click &quot;Print / Save as PDF&quot; → choose &quot;Save as PDF&quot; in the print dialog to download your letter.
        </p>
      </div>
    </PortalShell>
  );
}

function AdmissionLetterContent({ student, admissionDate, studentNumber }: {
  student: any; admissionDate: string; studentNumber: string;
}) {
  return (
    <div style={{
      fontFamily: "Georgia, 'Times New Roman', serif",
      background: "white",
      color: "#111",
      width: "100%",
    }}>
      {/* Navy header */}
      <div style={{ background: "#1A1A2E", padding: "28px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <img src="/assets/logo.png" alt="Logo" style={{ width: "52px", height: "52px", borderRadius: "10px" }} />
          <div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Sons and Daughters of Prophets</div>
            <div style={{ color: "white", fontWeight: "700", fontSize: "14px" }}>Prophetic Training School</div>
            <div style={{ color: "#D4A85C", fontSize: "11px", fontFamily: "Arial, sans-serif", marginTop: "2px" }}>Treasures in Clay Ministries</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", fontFamily: "Arial", textTransform: "uppercase", letterSpacing: "2px" }}>Student Number</div>
          <div style={{ color: "#D4A85C", fontSize: "13px", fontFamily: "monospace", marginTop: "2px" }}>{studentNumber}</div>
        </div>
      </div>

      {/* Gold strip */}
      <div style={{ height: "5px", background: "linear-gradient(to right, #D4A85C, #F5D4A0, #D4A85C)" }} />

      {/* Body */}
      <div style={{ padding: "36px 40px" }}>
        {/* Date */}
        <p style={{ color: "#888", fontSize: "13px", fontFamily: "Arial, sans-serif", marginBottom: "24px" }}>
          {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>

        {/* Recipient */}
        <p style={{ fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>{student.full_name}</p>
        {student.church && <p style={{ color: "#555", fontSize: "13px", fontFamily: "Arial", margin: "0 0 2px 0" }}>{student.church}</p>}
        {student.city && <p style={{ color: "#555", fontSize: "13px", fontFamily: "Arial", margin: "0 0 24px 0" }}>{student.city}</p>}

        {/* Subject */}
        <div style={{ borderLeft: "4px solid #D4A85C", paddingLeft: "14px", marginBottom: "28px" }}>
          <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 4px 0" }}>LETTER OF ADMISSION — 2026 COHORT</p>
          <p style={{ fontWeight: "700", fontSize: "14px", margin: "0" }}>SONS AND DAUGHTERS OF PROPHETS PROPHETIC TRAINING SCHOOL</p>
        </div>

        {/* Salutation */}
        <p style={{ fontSize: "14px", marginBottom: "16px" }}>
          Dear <strong>{student.full_name?.split(" ")[0]}</strong>,
        </p>

        {/* Paragraphs */}
        <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "14px", textAlign: "justify" }}>
          On behalf of the Founder and Dean, <strong>Prophet Abiodun Sule</strong>, and the entire faculty
          of the Sons and Daughters of Prophets Prophetic Training School, I am delighted to formally
          inform you that your application for admission into the <strong>2026 Cohort — Year 1</strong> has been
          reviewed and approved.
        </p>
        <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "14px", textAlign: "justify" }}>
          You are hereby admitted as a student of this school with effect from your registration date
          of <strong>{admissionDate}</strong>. You have been enrolled in the Year 1 programme leading to
          the <strong>Certificate in Prophetic Ministry</strong>. Your student number is <strong>{studentNumber}</strong> — please
          quote this in all correspondence with the school.
        </p>

        {/* Details table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "18px", fontSize: "12px", fontFamily: "Arial, sans-serif" }}>
          {[
            ["Student Number", studentNumber],
            ["Student Name", student.full_name],
            ["Student Email", student.email],
            ["Programme", "Certificate in Prophetic Ministry — Year 1"],
            ["Cohort", "2026 Cohort"],
            ["Date of Admission", admissionDate],
            ["Mode of Study", "Online — Portal & Live Zoom Sessions"],
            ["Tuition", "Free of Charge"],
          ].map(([label, value], i) => (
            <tr key={label} style={{ background: i % 2 === 0 ? "#F8F6F2" : "white" }}>
              <td style={{ padding: "8px 14px", fontWeight: "600", color: "#8B7355", width: "38%", borderBottom: "1px solid #E8E2D9" }}>{label}</td>
              <td style={{ padding: "8px 14px", color: "#111", borderBottom: "1px solid #E8E2D9" }}>{value}</td>
            </tr>
          ))}
        </table>

        <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "14px", textAlign: "justify" }}>
          School orientation will be held on <strong>Thursday, 7th May 2026</strong> via Zoom.
          Your first module opens on <strong>Sunday, 10th May 2026 at 8:00am</strong>.
          Please ensure you have logged in to your student portal and joined the official
          community Telegram group before orientation.
        </p>
        <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "14px", textAlign: "justify" }}>
          This school is built on the conviction that God is raising a generation of New Testament
          prophets who are biblically grounded, spiritually discerning, and humbly accountable.
          We believe your admission is not by accident — God has a purpose for your prophetic calling,
          and this school exists to help you fulfil it.
        </p>
        <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "28px" }}>
          We look forward to journeying with you.
        </p>

        {/* Signature */}
        <div style={{ marginBottom: "8px" }}>
          <img src="/assets/john-signature.png" alt="Signature"
            style={{ width: "110px", height: "52px", objectFit: "contain", filter: "contrast(1.3)" }} />
        </div>
        <div style={{ borderTop: "1px solid #E8E2D9", paddingTop: "10px" }}>
          <p style={{ fontWeight: "700", fontSize: "14px", margin: "0 0 2px 0" }}>John Ayomide Akinola</p>
          <p style={{ fontSize: "12px", color: "#666", fontFamily: "Arial", margin: "0 0 2px 0" }}>Registrar</p>
          <p style={{ fontSize: "12px", color: "#666", fontFamily: "Arial", margin: "0 0 2px 0" }}>Sons and Daughters of Prophets Prophetic Training School</p>
          <p style={{ fontSize: "12px", color: "#666", fontFamily: "Arial", margin: "0" }}>Treasures in Clay Ministries</p>
        </div>

        {/* Official note */}
        <div style={{ marginTop: "28px", paddingTop: "14px", borderTop: "1px solid #E8E2D9", textAlign: "center" }}>
          <p style={{ fontSize: "10px", color: "#AAA", fontFamily: "Arial", margin: "0" }}>
            This is an official letter of admission. Student No: {studentNumber} · sandd.abiodunsule.uk
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: "#1A1A2E", padding: "14px 40px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", fontFamily: "Arial" }}>sandd.abiodunsule.uk</span>
        <span style={{ color: "rgba(212,168,92,0.6)", fontSize: "10px", fontFamily: "Arial", fontStyle: "italic" }}>
          &ldquo;But the one who prophesies speaks to people for their strengthening, encouraging and comfort.&rdquo; — 1 Cor 14:3
        </span>
      </div>
    </div>
  );
}
