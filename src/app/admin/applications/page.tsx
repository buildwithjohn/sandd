"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Eye, AlertCircle } from "lucide-react";

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  church: string;
  city?: string;
  testimony: string;
  status: string;
  applied_at: string;
  admin_notes?: string;
}

const statusMap: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending:   { label: "Pending",   cls: "bg-amber-900/40 text-amber-300 border border-amber-700",  icon: Clock        },
  accepted:  { label: "Accepted",  cls: "bg-green-900/40 text-green-300 border border-green-700",  icon: CheckCircle  },
  rejected:  { label: "Rejected",  cls: "bg-red-900/40 text-red-300 border border-red-700",        icon: XCircle      },
  reviewing: { label: "Reviewing", cls: "bg-brand-900/40 text-brand-300 border border-brand-700",  icon: AlertCircle  },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("applications")
        .select("*")
        .order("applied_at", { ascending: false });
      setApplications(data ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === "all" ? applications : applications.filter(a => a.status === filter);
  const pendingCount = applications.filter(a => a.status === "pending").length;

  async function updateStatus(id: string, status: string) {
    setUpdating(true);
    try {
      if (status === "accepted") {
        const res = await fetch("/api/admin/accept-student", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: id }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success(`${data.message} — welcome email sent.`);
      } else {
        const supabase = createClient();
        await supabase.from("applications").update({
          status,
          admin_notes: notes,
          reviewed_at: new Date().toISOString(),
        }).eq("id", id);
        toast.success("Application rejected.");
      }
      setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      setExpanded(null);
      setNotes("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <AdminShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl text-white font-medium">Applications</h1>
            <p className="text-gray-500 text-sm mt-1">{pendingCount} pending review</p>
          </div>
          <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
            {["all","pending","accepted","rejected"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f ? "bg-brand-700 text-white" : "text-gray-400 hover:text-white"
                }`}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <p className="text-gray-500 text-sm">No applications found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => {
              const s = statusMap[a.status] ?? statusMap.pending;
              const StatusIcon = s.icon;
              return (
                <div key={a.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-brand-900 border border-brand-800 flex items-center justify-center font-display font-semibold text-brand-300 flex-shrink-0">
                      {a.full_name.split(" ").map(n => n[0]).slice(0,2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm">{a.full_name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{a.church} · {a.city} · Applied {new Date(a.applied_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0 ${s.cls}`}>
                      <StatusIcon className="w-3 h-3" /> {s.label}
                    </span>
                    <button onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                      className="flex items-center gap-1 text-brand-400 hover:text-brand-300 text-xs font-medium flex-shrink-0">
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                  </div>

                  {expanded === a.id && (
                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                        <div><span className="text-gray-500">Email: </span><span className="text-gray-300">{a.email}</span></div>
                        <div><span className="text-gray-500">Phone: </span><span className="text-gray-300">{a.phone ?? "—"}</span></div>
                      </div>
                      <div className="mb-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Testimony</div>
                        <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300 leading-relaxed max-h-40 overflow-y-auto">
                          {a.testimony}
                        </div>
                      </div>
                      {a.status === "pending" && (
                        <>
                          <div className="mb-4">
                            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1.5">Admin Notes (optional)</label>
                            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                              placeholder="Internal notes..."
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500 resize-none" />
                          </div>
                          <div className="flex gap-3">
                            <button onClick={() => updateStatus(a.id, "rejected")} disabled={updating}
                              className="flex-1 border border-red-800 text-red-400 font-medium text-sm py-2.5 rounded-xl hover:bg-red-950 flex items-center justify-center gap-1.5 transition-colors">
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                            <button onClick={() => updateStatus(a.id, "accepted")} disabled={updating}
                              className="flex-1 bg-green-700 hover:bg-green-600 text-white font-medium text-sm py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors">
                              <CheckCircle className="w-4 h-4" /> {updating ? "Processing..." : "Accept & Enroll"}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
