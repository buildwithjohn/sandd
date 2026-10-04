"use client";
export const dynamic = "force-dynamic";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, Play, CheckCircle, ChevronRight, Clock, CalendarPlus } from "lucide-react";
import { daysLeft } from "@/lib/courseState";

interface Row {
  id: string; course_id: string; position: number; status: "locked" | "open" | "closed";
  opens_at: string | null; closes_at: string | null; duration_days: number; title: string; year: number;
}
interface Cohort { id: string; name: string; is_current: boolean; status: string; scheduled_start_at?: string | null; }

export default function CourseSchedulePage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [track, setTrack] = useState<Record<string, Row[]>>({});
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [startDate, setStartDate] = useState("");

  async function load() {
    const res = await fetch("/api/admin/course-schedule");
    const data = await res.json();
    if (res.ok) {
      setCohorts(data.cohorts ?? []);
      setTrack(data.track ?? {});
      setSelected(s => s || data.cohorts?.find((c: Cohort) => c.is_current)?.id || data.cohorts?.[0]?.id || "");
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function act(payload: any, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/course-schedule", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(data.message || "Updated.");
      await load();
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  const rows = (track[selected] ?? []).slice().sort((a, b) => a.position - b.position);
  const active = rows.find(r => r.status === "open");
  const done = rows.filter(r => r.status === "closed").length;
  const selCohort = cohorts.find(c => c.id === selected);
  const notStarted = !active && done === 0;
  const nextLocked = rows.find(r => r.status === "locked");
  const promoting = !!active && !!nextLocked && nextLocked.year > active.year;
  const advanceMsg = !active
    ? "Open the first course for this cohort?"
    : promoting
      ? `"${active.title}" is the last course of Year ${active.year}. Advancing PROMOTES this cohort to Year ${nextLocked!.year} (the Diploma). Continue?`
      : `Close "${active.title}" and open the next course for this cohort?`;

  return (
    <AdminShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="kinetic-display text-3xl text-white mb-1">Course Schedule</h1>
          <p className="text-white/40 text-sm font-sans">
            Each course runs for 14 days, then auto-closes and the next opens. Advance, hold or reopen any course per cohort.
          </p>
        </div>

        {/* Cohort tabs */}
        <div className="flex flex-wrap gap-2">
          {cohorts.map(c => (
            <button key={c.id} onClick={() => setSelected(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold font-sans transition-all ${
                selected === c.id ? "grad-hero text-white" : "ksurface-d text-white/60 hover:text-white"
              }`}>
              {c.name}{c.is_current ? " · current" : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="ksurface-d p-12 text-center text-white/40 text-sm">Loading schedule…</div>
        ) : rows.length === 0 ? (
          <div className="ksurface-d p-10 text-center">
            <p className="text-white/60 text-sm font-sans mb-1">No schedule for this cohort yet.</p>
            <p className="text-white/35 text-xs font-sans">Run <code className="text-[#E0A64E]">course-drip-schema.sql</code> to seed the track.</p>
          </div>
        ) : (
          <>
            {/* Summary + advance */}
            <div className="ksurface-d p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-white/40 text-[10px] uppercase tracking-widest font-sans mb-1">Currently active</div>
                <div className="text-white font-semibold text-sm truncate">{active ? active.title : "— none open —"}</div>
                <div className="text-white/40 text-xs font-sans mt-0.5">
                  {done} of {rows.length} completed{active && active.closes_at ? ` · ${daysLeft(active.closes_at)} days left` : ""}
                </div>
              </div>
              <button disabled={busy} onClick={() => act({ action: "advance", cohortId: selected }, advanceMsg)}
                className="grad-btn text-white text-xs font-semibold font-sans px-5 py-2.5 rounded-full disabled:opacity-50 flex-shrink-0 flex items-center gap-1.5">
                {promoting ? "Promote to Year 2 →" : active ? "Advance →" : "Start cohort"}
              </button>
            </div>

            {/* Scheduled auto-start (only before a cohort has begun) */}
            {notStarted && (
              <div className="ksurface-d p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-3.5 h-3.5 text-[#E0A64E]" />
                  <span className="text-white/50 text-[10px] uppercase tracking-widest font-sans">Auto-start</span>
                </div>
                {selCohort?.scheduled_start_at ? (
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-white/70 text-sm font-sans">
                      Opens the first course automatically on{" "}
                      <span className="text-white font-semibold">
                        {new Date(selCohort.scheduled_start_at).toLocaleString("en-NG", { dateStyle: "long", timeStyle: "short" })}
                      </span>.
                    </p>
                    <button disabled={busy}
                      onClick={() => act({ action: "setStart", cohortId: selected, startsAt: null }, "Clear the scheduled start date?")}
                      className="text-[10px] font-semibold font-sans px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/50 hover:text-white transition-all flex-shrink-0">
                      Clear
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="flex-1">
                      <p className="text-white/50 text-xs font-sans mb-2">
                        Pick a date &amp; time and the cohort opens its first course on its own. Leave it and start manually anytime with &ldquo;Start cohort&rdquo;.
                      </p>
                      <input type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white font-sans focus:outline-none focus:border-[#E0A64E]/50 [color-scheme:dark]" />
                    </div>
                    <button disabled={busy || !startDate}
                      onClick={() => act({ action: "setStart", cohortId: selected, startsAt: new Date(startDate).toISOString() })}
                      className="grad-btn text-white text-xs font-semibold font-sans px-5 py-2.5 rounded-full disabled:opacity-40 flex-shrink-0">
                      Schedule start
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Track */}
            <div className="space-y-2">
              {rows.map((r) => {
                const num = String(r.position).padStart(2, "0");
                const d = daysLeft(r.closes_at);
                return (
                  <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className="ksurface-d p-4 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                      r.status === "open" ? "grad-hero border-transparent"
                      : r.status === "closed" ? "bg-green-500/10 border-green-500/25"
                      : "bg-white/5 border-white/10"
                    }`}>
                      {r.status === "open" ? <Play className="w-4 h-4 text-white" fill="currentColor" />
                        : r.status === "closed" ? <CheckCircle className="w-4 h-4 text-green-400" />
                        : <Lock className="w-4 h-4 text-white/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white/30 text-[11px] font-mono">{num}</span>
                        <span className="text-white text-sm font-semibold truncate">{r.title}</span>
                      </div>
                      <div className="text-white/35 text-[11px] font-sans mt-0.5">
                        {r.status === "open" && (d != null ? `Active · ${d} day${d === 1 ? "" : "s"} left · closes ${new Date(r.closes_at!).toLocaleDateString("en-NG", { dateStyle: "medium" })}` : "Active")}
                        {r.status === "closed" && "Completed · read-only recordings"}
                        {r.status === "locked" && "Locked"}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {r.status === "locked" && (
                        <button disabled={busy} onClick={() => act({ action: "open", id: r.id }, `Open "${r.title}" now (14-day timer starts)?`)}
                          className="text-[10px] font-semibold font-sans px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/[0.08] transition-all">Open</button>
                      )}
                      {r.status === "open" && (
                        <>
                          <button disabled={busy} onClick={() => act({ action: "extend", id: r.id, days: 7 })}
                            title="Extend 7 days"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all"><CalendarPlus className="w-3.5 h-3.5" /></button>
                          <button disabled={busy} onClick={() => act({ action: "close", id: r.id }, `Close "${r.title}" now? Its exam will lock; recordings stay available.`)}
                            className="text-[10px] font-semibold font-sans px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-orange-400 hover:bg-orange-500/10 transition-all">Close</button>
                        </>
                      )}
                      {r.status === "closed" && (
                        <button disabled={busy} onClick={() => act({ action: "reopen", id: r.id }, `Reopen "${r.title}"?`)}
                          className="text-[10px] font-semibold font-sans px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all">Reopen</button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
