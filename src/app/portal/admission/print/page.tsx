"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase";
import { Printer } from "lucide-react";

function PrintContent() {
  const searchParams = useSearchParams();
  const [student, setStudent] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.close(); return; }
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!profile) return;
      setStudent({ ...profile, email: user.email });
      setReady(true);
    }
    load();
  }, []);

  useEffect(() => {
    if (ready && student) {
      // Small delay to let images load, then auto-open print dialog
      const t = setTimeout(() => { window.print(); }, 1200);
      return () => clearTimeout(t);
    }
  }, [ready, student]);

  if (!student) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: "Arial" }}>
      <p style={{ color: "#888" }}>Preparing your letter...</p>
    </div>
  );

  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const admissionDate = new Date(student.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const studentNumber = student.student_number || "SANDD/2026/—";

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: white; }
        @media print {
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { size: A4 portrait; margin: 0; }
          .no-print { display: none !important; }
        }
        .no-print {
          position: fixed; bottom: 20px; right: 20px;
          background: #1A1A2E; color: white; border: none;
          padding: 10px 20px; border-radius: 8px; cursor: pointer;
          font-family: Arial; font-size: 13px; z-index: 999;
        }
      `}</style>

      <button className="no-print" onClick={() => window.print()}
        style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        <Printer size={16} /> Print / Save as PDF
      </button>

      {/* Full A4 letter */}
      <div style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", background: "white", fontFamily: "Georgia, 'Times New Roman', serif" }}>

        {/* Navy header */}
        <div style={{ background: "#1A1A2E", padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <img src="/assets/logo.png" alt="Logo" style={{ width: "56px", height: "56px", borderRadius: "12px" }} />
            <div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "15px", lineHeight: 1.3 }}>Sons and Daughters of Prophets</div>
              <div style={{ color: "white", fontWeight: "700", fontSize: "15px", lineHeight: 1.3 }}>Prophetic Training School</div>
              <div style={{ color: "#D4A85C", fontSize: "11px", fontFamily: "Arial, sans-serif", marginTop: "3px" }}>Treasures in Clay Ministries</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", fontFamily: "Arial", textTransform: "uppercase", letterSpacing: "2px" }}>Student Number</div>
            <div style={{ color: "#D4A85C", fontSize: "14px", fontFamily: "monospace", marginTop: "4px", fontWeight: "700" }}>{studentNumber}</div>
          </div>
        </div>

        {/* Gold strip */}
        <div style={{ height: "5px", background: "linear-gradient(to right, #B8860B, #F5D4A0, #B8860B)" }} />

        {/* Body */}
        <div style={{ padding: "44px 48px" }}>

          <p style={{ color: "#888", fontSize: "13px", fontFamily: "Arial, sans-serif", marginBottom: "28px" }}>{today}</p>

          <p style={{ fontWeight: "700", fontSize: "16px", marginBottom: "4px" }}>{student.full_name}</p>
          {student.church && <p style={{ color: "#555", fontSize: "13px", fontFamily: "Arial", margin: "0 0 2px 0" }}>{student.church}</p>}
          {student.city && <p style={{ color: "#555", fontSize: "13px", fontFamily: "Arial", margin: "0 0 28px 0" }}>{student.city}</p>}

          <div style={{ borderLeft: "5px solid #B8860B", paddingLeft: "16px", marginBottom: "32px" }}>
            <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 5px 0" }}>LETTER OF ADMISSION — 2026 COHORT</p>
            <p style={{ fontWeight: "700", fontSize: "15px", margin: "0" }}>SONS AND DAUGHTERS OF PROPHETS PROPHETIC TRAINING SCHOOL</p>
          </div>

          <p style={{ fontSize: "14px", marginBottom: "18px" }}>Dear <strong>{student.full_name?.split(" ")[0]}</strong>,</p>

          <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "16px", textAlign: "justify", color: "#333" }}>
            On behalf of the Founder and Dean, <strong>Prophet Abiodun Sule</strong>, and the entire faculty
            of the Sons and Daughters of Prophets Prophetic Training School, I am delighted to formally
            inform you that your application for admission into the <strong>2026 Cohort — Year 1</strong> has
            been reviewed and approved.
          </p>

          <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "16px", textAlign: "justify", color: "#333" }}>
            You are hereby admitted as a student of this school with effect from your registration date
            of <strong>{admissionDate}</strong>. You have been enrolled in the Year 1 programme leading to
            the <strong>Certificate in Prophetic Ministry</strong>. Your student number
            is <strong>{studentNumber}</strong> — please quote this in all correspondence with the school.
          </p>

          {/* Details table */}
          <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0", fontSize: "12px", fontFamily: "Arial, sans-serif" }}>
            <tbody>
              {[
                ["Student Number",  studentNumber],
                ["Student Name",    student.full_name],
                ["Student Email",   student.email],
                ["Programme",       "Certificate in Prophetic Ministry — Year 1"],
                ["Cohort",          "2026 Cohort"],
                ["Date of Admission", admissionDate],
                ["Mode of Study",   "Online — Portal & Live Zoom Sessions"],
                ["Tuition",         "Free of Charge"],
              ].map(([label, value], i) => (
                <tr key={label} style={{ background: i % 2 === 0 ? "#F8F6F2" : "white" }}>
                  <td style={{ padding: "9px 14px", fontWeight: "600", color: "#8B7355", width: "36%", borderBottom: "1px solid #E8E2D9" }}>{label}</td>
                  <td style={{ padding: "9px 14px", color: "#111", borderBottom: "1px solid #E8E2D9" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "16px", textAlign: "justify", color: "#333" }}>
            School orientation will be held on <strong>Thursday, 7th May 2026</strong> via Zoom.
            Your first module opens on <strong>Sunday, 10th May 2026 at 8:00am</strong>. Please ensure
            you have logged in to your student portal and joined the official community Telegram group
            before orientation.
          </p>

          <p style={{ fontSize: "13px", lineHeight: "1.9", marginBottom: "28px", textAlign: "justify", color: "#333" }}>
            We believe your admission is not by accident. God has a purpose for your prophetic calling,
            and this school exists to help you fulfil it. We look forward to journeying with you.
          </p>

          {/* Signature */}
          <div style={{ marginBottom: "6px" }}>
            <img src="/assets/john-signature.png" alt="Signature"
              style={{ width: "120px", height: "56px", objectFit: "contain", filter: "contrast(1.3)" }} />
          </div>
          <div style={{ borderTop: "1px solid #E8E2D9", paddingTop: "12px" }}>
            <p style={{ fontWeight: "700", fontSize: "15px", margin: "0 0 3px 0" }}>John Ayomide Akinola</p>
            <p style={{ fontSize: "12px", color: "#666", fontFamily: "Arial", margin: "0 0 2px 0" }}>Registrar</p>
            <p style={{ fontSize: "12px", color: "#666", fontFamily: "Arial", margin: "0 0 2px 0" }}>Sons and Daughters of Prophets Prophetic Training School</p>
            <p style={{ fontSize: "12px", color: "#666", fontFamily: "Arial", margin: "0" }}>Treasures in Clay Ministries</p>
          </div>

          <div style={{ marginTop: "32px", paddingTop: "16px", borderTop: "1px solid #E8E2D9", textAlign: "center" }}>
            <p style={{ fontSize: "10px", color: "#AAA", fontFamily: "Arial" }}>
              Official Admission Letter · {studentNumber} · Sons and Daughters of Prophets Prophetic Training School · sandd.abiodunsule.uk
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#1A1A2E", padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "10px", fontFamily: "Arial" }}>sandd.abiodunsule.uk</span>
          <span style={{ color: "rgba(212,168,92,0.6)", fontSize: "10px", fontFamily: "Arial", fontStyle: "italic" }}>
            &ldquo;But the one who prophesies speaks to people for their strengthening, encouraging and comfort.&rdquo; — 1 Cor 14:3
          </span>
        </div>
      </div>
    </>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "#888", fontFamily: "Arial" }}>Loading...</p>
      </div>
    }>
      <PrintContent />
    </Suspense>
  );
}
