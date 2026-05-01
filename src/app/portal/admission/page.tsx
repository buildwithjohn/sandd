"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { Download, Printer } from "lucide-react";

export default function AdmissionLetterPage() {
  const router  = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
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

  function handlePrint() {
    window.print();
  }

  if (loading) return (
    <PortalShell>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" />
      </div>
    </PortalShell>
  );

  const admissionDate = new Date(student.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const refNumber = `SANDD/2026/${String(student.full_name?.split(" ")[1]?.[0] ?? "X").toUpperCase()}/${new Date(student.created_at).getTime().toString().slice(-5)}`;

  return (
    <PortalShell>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #admission-letter, #admission-letter * { visibility: visible !important; }
          #admission-letter { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; padding: 40px !important; background: white !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="space-y-5">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A2E]" style={{ fontFamily: "'Georgia', serif" }}>
              Admission Letter
            </h1>
            <p className="text-[#9B9B9B] text-sm font-sans mt-0.5">Your official admission letter — print or save as PDF</p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <button onClick={handlePrint}
              className="flex items-center gap-2 bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white text-xs font-semibold font-sans px-4 py-2.5 rounded-xl transition-all">
              <Printer className="w-3.5 h-3.5" /> Print / Save PDF
            </button>
          </div>
        </div>

        {/* Letter */}
        <motion.div id="admission-letter" ref={printRef}
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)", fontFamily: "Georgia, serif" }}>

          {/* Header bar */}
          <div className="bg-[#1A1A2E] px-10 py-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/assets/logo.png" alt="S&D Logo" width={52} height={52} className="rounded-xl" />
              <div>
                <div className="text-white font-bold text-sm" style={{ fontFamily: "Georgia, serif" }}>
                  Sons and Daughters of Prophets
                </div>
                <div className="text-white font-bold text-sm" style={{ fontFamily: "Georgia, serif" }}>
                  Prophetic Training School
                </div>
                <div className="text-[#D4A85C] text-xs font-sans mt-0.5">Treasures in Clay Ministries</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white/40 text-[10px] font-sans uppercase tracking-widest">Reference</div>
              <div className="text-[#D4A85C] text-sm font-mono mt-0.5">{refNumber}</div>
            </div>
          </div>

          {/* Gold strip */}
          <div className="h-1.5 bg-gradient-to-r from-[#D4A85C] via-[#F5D4A0] to-[#D4A85C]" />

          {/* Body */}
          <div className="px-10 py-10">

            {/* Date */}
            <p className="text-[#9B9B9B] text-sm font-sans mb-8">
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            {/* Recipient */}
            <p className="text-[#1A1A2E] font-bold text-base mb-1">{student.full_name}</p>
            {student.church && <p className="text-[#6B6B6B] text-sm font-sans">{student.church}</p>}
            {student.city && <p className="text-[#6B6B6B] text-sm font-sans mb-8">{student.city}</p>}

            {/* Subject */}
            <div className="border-l-4 border-[#D4A85C] pl-4 mb-8">
              <p className="text-[#1A1A2E] font-bold text-base">
                LETTER OF ADMISSION — 2026 COHORT
              </p>
              <p className="text-[#1A1A2E] font-bold text-base">
                SONS AND DAUGHTERS OF PROPHETS PROPHETIC TRAINING SCHOOL
              </p>
            </div>

            {/* Salutation */}
            <p className="text-[#1A1A2E] text-sm leading-relaxed mb-5">
              Dear <strong>{student.full_name?.split(" ")[0]}</strong>,
            </p>

            {/* Body paragraphs */}
            <div className="space-y-4 text-[#333333] text-sm leading-[1.9]">
              <p>
                On behalf of the Founder and Dean, <strong>Prophet Abiodun Sule</strong>, and the entire faculty
                of the Sons and Daughters of Prophets Prophetic Training School, I am delighted to formally
                inform you that your application for admission into the <strong>2026 Cohort — Year 1</strong> has been
                reviewed and approved.
              </p>
              <p>
                You are hereby admitted as a student of this school with effect from
                your registration date of <strong>{admissionDate}</strong>. You have been enrolled in the
                Year 1 programme leading to the <strong>Certificate in Prophetic Ministry</strong>.
              </p>

              {/* Details table */}
              <div className="my-6 border border-[#E8E2D9] rounded-xl overflow-hidden">
                {[
                  ["Student Name", student.full_name],
                  ["Student Email", student.email],
                  ["Programme", "Certificate in Prophetic Ministry — Year 1"],
                  ["Cohort", "2026 Cohort"],
                  ["Date of Admission", admissionDate],
                  ["Mode of Study", "Online — Portal & Live Zoom Sessions"],
                  ["Tuition", "Free of Charge"],
                ].map(([label, value], i) => (
                  <div key={label} className={`flex items-start gap-4 px-5 py-3 ${
                    i % 2 === 0 ? "bg-[#F8F6F2]" : "bg-white"
                  } ${i < 6 ? "border-b border-[#E8E2D9]" : ""}`}>
                    <span className="text-[#8B7355] text-xs font-sans font-semibold w-36 flex-shrink-0 pt-0.5">{label}</span>
                    <span className="text-[#1A1A2E] text-xs font-sans">{value}</span>
                  </div>
                ))}
              </div>

              <p>
                School orientation will be held on <strong>Thursday, 7th May 2026</strong> via Zoom.
                Your first module opens on <strong>Sunday, 10th May 2026 at 8:00am</strong>.
                Please ensure you have logged in to your student portal and joined the official
                community Telegram group before orientation.
              </p>
              <p>
                This school is built on the conviction that God is raising a generation of New Testament
                prophets who are biblically grounded, spiritually discerning, and humbly accountable.
                We believe your admission is not by accident — God has a purpose for your prophetic calling,
                and this school exists to help you fulfil it.
              </p>
              <p>
                We look forward to journeying with you.
              </p>
            </div>

            {/* Signature block */}
            <div className="mt-10 grid grid-cols-1 gap-8">
              <div>
                <div className="mb-1">
                  <Image src="/assets/john-signature.png" alt="Signature"
                    width={120} height={56} className="object-contain" style={{ filter: "contrast(1.2)" }} />
                </div>
                <div className="border-t border-[#E8E2D9] pt-3">
                  <p className="text-[#1A1A2E] font-bold text-sm">John Ayomide Akinola</p>
                  <p className="text-[#6B6B6B] text-xs font-sans mt-0.5">Registrar</p>
                  <p className="text-[#6B6B6B] text-xs font-sans">Sons and Daughters of Prophets Prophetic Training School</p>
                  <p className="text-[#6B6B6B] text-xs font-sans">Treasures in Clay Ministries</p>
                </div>
              </div>
            </div>

            {/* Official stamp area */}
            <div className="mt-8 pt-6 border-t border-[#E8E2D9]">
              <p className="text-[#C4BDB2] text-[10px] font-sans text-center">
                This is an official letter of admission issued by S&D Prophetic Training School.
                Reference: {refNumber} · sandd.abiodunsule.uk
              </p>
            </div>
          </div>

          {/* Footer bar */}
          <div className="bg-[#1A1A2E] px-10 py-4 flex items-center justify-between">
            <p className="text-white/30 text-[10px] font-sans">sandd.abiodunsule.uk</p>
            <p className="text-[#D4A85C]/60 text-[10px] font-sans italic">
              &ldquo;But the one who prophesies speaks to people for their strengthening, encouraging and comfort.&rdquo; — 1 Cor 14:3
            </p>
          </div>
        </motion.div>
      </div>
    </PortalShell>
  );
}
