"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { toast } from "sonner";
import { Zap, Loader2, Eye, Play, Mail, Clock, GraduationCap, UserMinus } from "lucide-react";

const AUTOMATIONS = [
  { key: "auto_welcome",    rk: "welcome",    icon: Mail,          title: "Welcome follow-up",  desc: "A 'getting started' email ~3 days after a student is admitted." },
  { key: "auto_exam",       rk: "exam",       icon: Clock,         title: "Exam-due reminders", desc: "Reminds enrolled students who haven't submitted an assessment due within 2 days." },
  { key: "auto_year2",      rk: "year2",      icon: GraduationCap, title: "Year-2 unlock",      desc: "When a student finishes all Year-1 lessons: unlocks Year 2 + emails them." },
  { key: "auto_inactivity", rk: "inactivity", icon: UserMinus,     title: "Inactivity nudge",   desc: "Nudges active students who haven't signed in for 14+ days (at most every 14 days)." },
];

export default function AutomationsPage() {
  const [sw, setSw] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [report, setReport] = useState<any>(null);
  const [reportMode, setReportMode] = useState<"dryrun" | "run" | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/automations");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSw(data.switches || {});
    } catch (err: any) { toast.error(err.message || "Could not load. Run automations-schema.sql?"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function toggle(key: string, value: boolean) {
    setSw(s => ({ ...s, [key]: value }));
    const res = await fetch("/api/admin/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "toggle", key, value }) });
    if (!res.ok) { setSw(s => ({ ...s, [key]: !value })); toast.error("Could not save."); }
    else toast.success(value ? "Automation on" : "Automation off");
  }

  async function act(action: "dryrun" | "run") {
    if (action === "run" && !confirm("Run all enabled automations now? This sends real emails.")) return;
    setBusy(action); setReport(null);
    try {
      const res = await fetch("/api/admin/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReport(data.report || {}); setReportMode(action);
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(null); }
  }

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#D4A85C]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "'Georgia', serif" }}>Automations</h1>
            <p className="text-white/40 text-sm font-sans">Scheduled emails. Run automatically once a day — only the ones switched on.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : (
          <>
            <div className="space-y-2">
              {AUTOMATIONS.map(a => (
                <div key={a.key} className="glass-dark glass-edge rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                    <a.icon className="w-4 h-4 text-[#D4A85C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white/90 text-sm font-semibold font-sans">{a.title}</div>
                    <div className="text-white/40 text-xs font-sans mt-0.5">{a.desc}</div>
                  </div>
                  <button onClick={() => toggle(a.key, !sw[a.key])}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${sw[a.key] ? "bg-[#D4A85C]" : "bg-white/15"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${sw[a.key] ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => act("dryrun")} disabled={!!busy}
                className="flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white/80 text-sm font-semibold font-sans px-4 py-2.5 rounded-xl transition-all">
                {busy === "dryrun" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />} Preview (dry run)
              </button>
              <button onClick={() => act("run")} disabled={!!busy}
                className="flex items-center gap-2 bg-[#D4A85C] hover:bg-[#c39a4f] disabled:opacity-50 text-[#0D1320] text-sm font-semibold font-sans px-4 py-2.5 rounded-xl transition-all">
                {busy === "run" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run now
              </button>
            </div>

            {report && (
              <div className="glass-dark glass-edge rounded-2xl p-5">
                <div className="text-white/50 text-xs tracking-[0.15em] uppercase font-sans mb-3">
                  {reportMode === "dryrun" ? "Dry run — what would send now" : "Run complete"}
                </div>
                {Object.keys(report).length === 0 ? (
                  <p className="text-white/40 text-sm font-sans">Nothing to send right now{reportMode === "dryrun" ? " (dry run ignores the on/off switches)" : " (check the switches are on)"}.</p>
                ) : (
                  <div className="space-y-2">
                    {AUTOMATIONS.filter(a => report[a.rk]).map(a => (
                      <div key={a.rk} className="flex items-center justify-between text-sm font-sans bg-white/[0.03] rounded-lg px-3 py-2">
                        <span className="text-white/80">{a.title}</span>
                        <span className="text-white/50">
                          {reportMode === "dryrun"
                            ? `${report[a.rk].planned} would send`
                            : `${report[a.rk].sent} sent${report[a.rk].planned > report[a.rk].sent ? ` (of ${report[a.rk].planned}; rest next run)` : ""}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <p className="text-white/25 text-xs font-sans text-center">Each email is sent once per student · capped per run to protect delivery · idempotent.</p>
          </>
        )}
      </div>
    </AdminShell>
  );
}
