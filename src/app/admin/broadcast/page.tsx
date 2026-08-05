"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { toast } from "sonner";
import { Mail, Send, Loader2, Users, CheckCircle, AlertCircle } from "lucide-react";

const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all";

export default function BroadcastPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ total: number; sent: number; failed: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/broadcast-email")
      .then(r => r.json())
      .then(d => { if (typeof d.count === "number") setCount(d.count); })
      .catch(() => {});
  }, []);

  async function send() {
    if (!subject.trim() || !message.trim()) { toast.error("Enter a subject and a message."); return; }
    if (!confirm(`Send this email to all ${count ?? ""} students now? This cannot be undone.`)) return;

    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setResult(data);
      if (data.failed === 0) toast.success(`Email sent to ${data.sent} students.`);
      else toast.warning(`Sent to ${data.sent}, ${data.failed} failed.`);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AdminShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#D4A85C]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "'Georgia', serif" }}>Email Students</h1>
            <p className="text-white/40 text-sm font-sans">Send an email to every student. They are BCC'd, so addresses stay private.</p>
          </div>
        </div>

        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-white/60 text-sm font-sans bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5">
            <Users className="w-4 h-4 text-[#D4A85C]" />
            {count === null ? "Counting recipients…" : <><span className="text-white font-semibold">{count}</span>&nbsp;student{count === 1 ? "" : "s"} will receive this email</>}
          </div>

          <div>
            <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Hermeneutics Exam Now Open" className={inp} />
          </div>

          <div>
            <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={9}
              placeholder={"Write your message here.\n\nLine breaks are preserved. A branded header, a 'Open the Student Portal' button, and the school footer are added automatically."}
              className={inp} />
            <p className="text-white/20 text-xs font-sans mt-1">Plain text — links and formatting are wrapped in the school's branded email template.</p>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button onClick={send} disabled={sending || count === 0}
              className="flex items-center gap-2 bg-[#D4A85C] hover:bg-[#c39a4f] disabled:opacity-50 text-[#0D1320] text-sm font-semibold font-sans px-5 py-2.5 rounded-xl transition-all">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? "Sending…" : `Send to ${count ?? "all"} students`}
            </button>
          </div>
        </div>

        {result && (
          <div className={`rounded-2xl border p-5 flex items-start gap-3 ${
            result.failed === 0 ? "bg-green-500/[0.06] border-green-500/20" : "bg-[#D4A85C]/[0.06] border-[#D4A85C]/20"
          }`}>
            {result.failed === 0
              ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-[#D4A85C] flex-shrink-0 mt-0.5" />}
            <div className="text-sm font-sans">
              <div className="text-white/90 font-semibold">
                {result.failed === 0 ? "All emails sent" : "Sent with some failures"}
              </div>
              <div className="text-white/50 mt-0.5">
                {result.sent} of {result.total} delivered{result.failed > 0 ? ` · ${result.failed} failed` : ""}.
              </div>
            </div>
          </div>
        )}

        <p className="text-white/25 text-xs font-sans text-center">
          Emails are sent from noreply@sandd.abiodunsule.uk. A copy is delivered to your own inbox.
        </p>
      </div>
    </AdminShell>
  );
}
