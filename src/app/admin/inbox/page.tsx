"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { toast } from "sonner";
import { Mail, Send, Loader2, ArrowLeft, MessageSquare } from "lucide-react";

interface Convo {
  id: string; student_id: string; subject: string; last_snippet: string | null;
  last_message_at: string; admin_unread: boolean;
  student?: { full_name: string; email: string };
}
interface Msg { id: string; sender_role: string; body: string; created_at: string; }

const timeAgo = (s: string) => {
  const d = (Date.now() - new Date(s).getTime()) / 1000;
  if (d < 60) return "now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return new Date(s).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
};

export default function AdminInboxPage() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Convo | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function loadList() {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setConvos(data.conversations || []);
    } catch (err: any) {
      toast.error(err.message || "Could not load inbox. Run messaging-schema.sql?");
    } finally { setLoading(false); }
  }
  useEffect(() => { loadList(); }, []);

  async function openConvo(c: Convo) {
    setActive(c); setThreadLoading(true); setMessages([]);
    try {
      const res = await fetch(`/api/messages?conversationId=${c.id}`);
      const data = await res.json();
      setMessages(data.messages || []);
      if (c.admin_unread) {
        fetch("/api/messages/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: c.id }) })
          .then(() => setConvos(prev => prev.map(x => x.id === c.id ? { ...x, admin_unread: false } : x)));
      }
    } catch { toast.error("Could not open conversation."); }
    finally { setThreadLoading(false); setTimeout(() => endRef.current?.scrollIntoView(), 50); }
  }

  async function send() {
    if (!reply.trim() || !active) return;
    setSending(true);
    const body = reply.trim();
    try {
      const res = await fetch("/api/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: active.id, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReply("");
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender_role: "admin", body, created_at: new Date().toISOString() }]);
      setConvos(prev => prev.map(x => x.id === active.id ? { ...x, last_snippet: body.slice(0, 140), last_message_at: new Date().toISOString() } : x));
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
  }

  const unreadCount = convos.filter(c => c.admin_unread).length;

  return (
    <AdminShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-[#D4A85C]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white" style={{ fontFamily: "var(--font-display), Georgia, serif" }}>Inbox</h1>
            <p className="text-white/40 text-sm font-sans">{unreadCount > 0 ? `${unreadCount} unread · ` : ""}Messages from students.</p>
          </div>
        </div>

        <div className="ksurface-d overflow-hidden grid md:grid-cols-[320px_1fr] min-h-[560px]">
          {/* List */}
          <div className={`border-r border-white/[0.07] ${active ? "hidden md:block" : ""}`}>
            {loading ? (
              <div className="flex items-center gap-2 text-white/40 text-sm p-6 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
            ) : convos.length === 0 ? (
              <div className="text-white/30 text-sm font-sans p-8 text-center">No messages yet.</div>
            ) : (
              <div className="divide-y divide-white/[0.05] max-h-[560px] overflow-y-auto">
                {convos.map(c => (
                  <button key={c.id} onClick={() => openConvo(c)}
                    className={`w-full text-left px-4 py-3.5 hover:bg-white/[0.03] transition-colors ${active?.id === c.id ? "bg-white/[0.04]" : ""}`}>
                    <div className="flex items-center gap-2">
                      {c.admin_unread && <span className="w-2 h-2 rounded-full bg-[#D4A85C] flex-shrink-0" />}
                      <span className={`text-sm font-sans truncate flex-1 ${c.admin_unread ? "text-white font-semibold" : "text-white/70"}`}>
                        {c.student?.full_name || c.student?.email || "Student"}
                      </span>
                      <span className="text-white/30 text-[10px] font-sans flex-shrink-0">{timeAgo(c.last_message_at)}</span>
                    </div>
                    <div className="text-white/40 text-xs font-sans truncate mt-0.5 pl-4">{c.subject}{c.last_snippet ? ` — ${c.last_snippet}` : ""}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Thread */}
          <div className={`flex flex-col ${active ? "" : "hidden md:flex"}`}>
            {!active ? (
              <div className="flex-1 flex flex-col items-center justify-center text-white/25 text-sm font-sans gap-2">
                <MessageSquare className="w-8 h-8 opacity-40" /> Select a conversation
              </div>
            ) : (
              <>
                <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center gap-3">
                  <button onClick={() => setActive(null)} className="md:hidden text-white/50"><ArrowLeft className="w-4 h-4" /></button>
                  <div className="min-w-0">
                    <div className="text-white/90 text-sm font-semibold font-sans truncate">{active.student?.full_name || "Student"}</div>
                    <div className="text-white/35 text-xs font-sans truncate">{active.student?.email} · {active.subject}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[380px]">
                  {threadLoading ? (
                    <div className="flex items-center gap-2 text-white/40 text-sm justify-center py-8"><Loader2 className="w-4 h-4 animate-spin" /></div>
                  ) : messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm font-sans leading-relaxed ${
                        m.sender_role === "admin" ? "bg-[#D4A85C] text-[#0D1320]" : "bg-white/[0.06] text-white/85 border border-white/10"}`}>
                        <div className="whitespace-pre-wrap">{m.body}</div>
                        <div className={`text-[10px] mt-1 ${m.sender_role === "admin" ? "text-[#0D1320]/60" : "text-white/35"}`}>{timeAgo(m.created_at)}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <div className="p-3 border-t border-white/[0.07] flex items-end gap-2">
                  <textarea value={reply} onChange={e => setReply(e.target.value)} rows={1}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                    placeholder="Write a reply… (emails the student)"
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/90 font-sans placeholder-white/25 focus:outline-none focus:border-[#D4A85C]/50 resize-none" />
                  <button onClick={send} disabled={sending || !reply.trim()}
                    className="bg-[#D4A85C] hover:bg-[#c39a4f] disabled:opacity-40 text-[#0D1320] rounded-xl p-2.5 transition-all">
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
