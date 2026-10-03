"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { toast } from "sonner";
import {
  Users, Plus, Loader2, CircleCheck, Lock, Unlock, UserPlus, Star, Copy, X,
} from "lucide-react";

interface Cohort {
  id: string; name: string; status: string; is_current: boolean;
  student_count: number; starts_at: string | null; created_at: string;
}
interface Enrolled { name: string; email: string; studentNumber: string; password: string; }

const STATUS_STYLE: Record<string, string> = {
  draft:        "bg-white/10 text-white/50 border-white/15",
  registration: "bg-green-500/15 text-green-300 border-green-500/30",
  active:       "bg-[#D4A85C]/15 text-[#D4A85C] border-[#D4A85C]/30",
  closed:       "bg-white/10 text-white/40 border-white/15",
  graduated:    "bg-purple-500/15 text-purple-300 border-purple-500/30",
};
const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all";

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [creating, setCreating] = useState(false);
  const [admitResult, setAdmitResult] = useState<Enrolled[] | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/cohorts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setCohorts(data.cohorts || []);
      setWaitlistCount(data.waitlistCount || 0);
      setRegistrationOpen(!!data.registrationOpen);
    } catch (err: any) {
      toast.error(err.message || "Could not load cohorts. Have you run cohort-schema.sql?");
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const current = cohorts.find(c => c.is_current) || null;

  async function act(id: string, action: string, label: string) {
    setBusy(id + action);
    try {
      const res = await fetch("/api/admin/cohorts", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(label);
      await load();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(null); }
  }

  async function createCohort() {
    if (!newName.trim()) { toast.error("Enter a cohort name."); return; }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/cohorts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, starts_at: newStart || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Cohort created.");
      setNewName(""); setNewStart("");
      await load();
    } catch (err: any) { toast.error(err.message); }
    finally { setCreating(false); }
  }

  async function admitWaitlist() {
    if (!current) { toast.error("Set a current cohort first."); return; }
    if (!confirm(`Admit all ${waitlistCount} waitlisted people into "${current.name}"? This creates accounts and emails each of them their login.`)) return;
    setBusy("admit");
    try {
      const res = await fetch("/api/admin/enroll-waitlist", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setAdmitResult(data.enrolled || []);
      toast.success(`Admitted ${data.enrolled?.length ?? 0} students into ${current.name}.`);
      await load();
    } catch (err: any) { toast.error(err.message); }
    finally { setBusy(null); }
  }

  const fmt = (s: string | null) => s ? new Date(s).toLocaleDateString("en-NG", { dateStyle: "medium" }) : "—";

  return (
    <AdminShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#D4A85C]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>Cohorts</h1>
            <p className="text-white/40 text-sm font-sans">Open intake, admit the waitlist, and track each year's students.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-white/40 text-sm py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : (
          <>
            {/* Current cohort / intake control */}
            {current ? (
              <div className="ksurface-d p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="w-4 h-4 text-[#D4A85C]" fill="currentColor" />
                      <span className="text-white/90 text-lg font-semibold" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>{current.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-sans ${STATUS_STYLE[current.status] || STATUS_STYLE.draft}`}>{current.status}</span>
                    </div>
                    <div className="text-white/40 text-xs font-sans">Current intake · starts {fmt(current.starts_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold text-white tabular-nums" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>{current.student_count}</div>
                    <div className="text-white/40 text-[10px] uppercase tracking-wider font-sans">Students</div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  {/* Registration toggle */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-white/80 text-sm font-semibold font-sans flex items-center gap-1.5">
                        {registrationOpen ? <Unlock className="w-3.5 h-3.5 text-green-400" /> : <Lock className="w-3.5 h-3.5 text-white/40" />}
                        Registration {registrationOpen ? "Open" : "Closed"}
                      </div>
                      <div className="text-white/35 text-xs font-sans mt-0.5">Public /apply form</div>
                    </div>
                    <button
                      onClick={() => act(current.id, registrationOpen ? "close_registration" : "open_registration", registrationOpen ? "Registration closed." : "Registration open!")}
                      disabled={busy === current.id + (registrationOpen ? "close_registration" : "open_registration")}
                      className={`text-xs font-semibold font-sans px-3.5 py-2 rounded-full transition-all ${registrationOpen ? "bg-white/10 text-white/70 hover:bg-white/15" : "bg-[#D4A85C] text-[#0D1320] hover:bg-[#c39a4f]"}`}>
                      {registrationOpen ? "Close" : "Open intake"}
                    </button>
                  </div>

                  {/* Waitlist admit */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-center justify-between">
                    <div>
                      <div className="text-white/80 text-sm font-semibold font-sans flex items-center gap-1.5">
                        <UserPlus className="w-3.5 h-3.5 text-[#D4A85C]" /> {waitlistCount} on waitlist
                      </div>
                      <div className="text-white/35 text-xs font-sans mt-0.5">Admit into {current.name}</div>
                    </div>
                    <button onClick={admitWaitlist} disabled={busy === "admit" || waitlistCount === 0}
                      className="text-xs font-semibold font-sans px-3.5 py-2 rounded-full bg-[#D4A85C] text-[#0D1320] hover:bg-[#c39a4f] disabled:opacity-40 transition-all flex items-center gap-1.5">
                      {busy === "admit" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Admit all
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ksurface-d p-6 text-center text-white/50 text-sm font-sans">
                No current cohort set. Create one below (or run <code className="text-[#D4A85C]">cohort-schema.sql</code> if cohorts don't load), then mark it current.
              </div>
            )}

            {/* Admit results */}
            {admitResult && admitResult.length > 0 && (
              <div className="ksurface-d p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-green-400 text-xs tracking-[0.15em] uppercase font-sans flex items-center gap-1.5">
                    <CircleCheck className="w-3.5 h-3.5" /> {admitResult.length} admitted — login details (emailed to each)
                  </div>
                  <button onClick={() => setAdmitResult(null)} className="text-white/30 hover:text-white/60"><X className="w-4 h-4" /></button>
                </div>
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {admitResult.map((e) => (
                    <div key={e.email} className="flex items-center gap-3 text-xs font-sans bg-white/[0.03] rounded-lg px-3 py-2">
                      <span className="text-white/80 flex-1 truncate">{e.name || e.email}</span>
                      <span className="text-white/40 font-mono">{e.studentNumber}</span>
                      <span className="text-[#D4A85C] font-mono">{e.password}</span>
                      <button onClick={() => { navigator.clipboard?.writeText(`${e.email} / ${e.password}`); toast.success("Copied"); }}
                        className="text-white/30 hover:text-white/70"><Copy className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Create cohort */}
            <div className="ksurface-d p-5">
              <div className="text-white/50 text-xs tracking-[0.15em] uppercase font-sans mb-3">New cohort</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. 2027 Cohort" className={inp} />
                <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)} className={`${inp} sm:w-48`} />
                <button onClick={createCohort} disabled={creating}
                  className="flex items-center justify-center gap-2 bg-[#D4A85C] hover:bg-[#c39a4f] disabled:opacity-50 text-[#0D1320] text-sm font-semibold font-sans px-5 py-3 rounded-xl transition-all whitespace-nowrap">
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
                </button>
              </div>
            </div>

            {/* All cohorts */}
            <div>
              <div className="text-white/50 text-xs tracking-[0.15em] uppercase font-sans mb-3">All cohorts ({cohorts.length})</div>
              <div className="space-y-2">
                {cohorts.map(c => (
                  <div key={c.id} className="glass-dark glass-edge rounded-xl p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white/90 text-sm font-semibold font-sans" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>{c.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-sans ${STATUS_STYLE[c.status] || STATUS_STYLE.draft}`}>{c.status}</span>
                        {c.is_current && <span className="text-[10px] text-[#D4A85C] flex items-center gap-0.5 font-sans"><Star className="w-3 h-3" fill="currentColor" /> current</span>}
                      </div>
                      <div className="text-white/35 text-xs font-sans mt-0.5">{c.student_count} student{c.student_count !== 1 ? "s" : ""} · starts {fmt(c.starts_at)}</div>
                    </div>
                    {!c.is_current && (
                      <button onClick={() => act(c.id, "set_current", `${c.name} is now the current cohort.`)}
                        disabled={busy === c.id + "set_current"}
                        className="text-xs font-sans text-white/50 hover:text-[#D4A85C] border border-white/10 hover:border-[#D4A85C]/40 px-3 py-1.5 rounded-full transition-all whitespace-nowrap">
                        Make current
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
