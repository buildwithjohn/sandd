"use client";
export const dynamic = 'force-dynamic';
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { FileDown, Calendar, BookOpen, Award } from "lucide-react";

const docs = [
  {
    icon: Calendar,
    title: "Academic Calendar 2026",
    desc: "Full Year 1 schedule — module dates, live sessions, taster sessions, Student Time Out with Prophet Sule, and exam periods.",
    url: "/downloads/SandD-Academic-Calendar-2026.pdf",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: BookOpen,
    title: "School Brochure 2026",
    desc: "Complete overview of the school — vision, mission, curriculum, leadership, and how to get involved.",
    url: "/downloads/SandD-School-Brochure-2026.pdf",
    color: "theme-accent",
    bg: "bg-[#D4A85C]/10 border-[#D4A85C]/20",
  },
  {
    icon: Award,
    title: "Admission Letter",
    desc: "Your personal admission letter with your student number. Print or save as PDF.",
    url: "/portal/admission",
    isInternal: true,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
];

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

export default function DocumentsPage() {
  return (
    <PortalShell>
      <div className="space-y-5">
        <motion.div variants={rise()} initial="hidden" animate="visible">
          <h1 className="text-2xl font-semibold theme-text mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            School Documents
          </h1>
          <p className="theme-text-muted text-sm font-sans">Download official school documents and your admission letter.</p>
        </motion.div>

        <div className="space-y-3">
          {docs.map((doc, i) => (
            <motion.div key={doc.title} variants={rise(i * 0.1)} initial="hidden" animate="visible">
              <div className="theme-bg-elevated rounded-2xl border theme-border p-5 flex items-center gap-4 hover:border-[#D4A85C]/40 transition-all"
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${doc.bg}`}>
                  <doc.icon className={`w-5 h-5 ${doc.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="theme-text text-sm font-semibold mb-0.5" style={{ fontFamily: "'Georgia', serif" }}>
                    {doc.title}
                  </div>
                  <p className="theme-text-muted text-xs font-sans leading-relaxed">{doc.desc}</p>
                </div>
                {doc.isInternal ? (
                  <a href={doc.url}
                    className="flex-shrink-0 flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white text-xs font-semibold font-sans px-4 py-2.5 rounded-xl transition-all">
                    <FileDown className="w-3.5 h-3.5" /> View
                  </a>
                ) : (
                  <a href={doc.url} download
                    className="flex-shrink-0 flex items-center gap-1.5 bg-[#1A1A2E] hover:bg-[#2A2A4E] text-white text-xs font-semibold font-sans px-4 py-2.5 rounded-xl transition-all">
                    <FileDown className="w-3.5 h-3.5" /> Download
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={rise(0.3)} initial="hidden" animate="visible"
          className="rounded-2xl border border-[#D4A85C]/20 bg-[#D4A85C]/[0.04] p-5 text-center">
          <p className="text-[#5C4A2A] text-xs font-sans leading-relaxed" style={{ fontFamily: "'Georgia', serif" }}>
            All documents are official publications of the Sons and Daughters of Prophets Prophetic Training School.<br />
            For enquiries contact the Registrar: <a href="mailto:sandd@abiodunsule.uk" className="theme-accent hover:underline">sandd@abiodunsule.uk</a>
          </p>
        </motion.div>
      </div>
    </PortalShell>
  );
}
