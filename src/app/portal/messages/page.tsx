"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import PortalShell from "@/components/portal/PortalShell";
import { toast } from "sonner";
import { MessageSquare, Send, Loader2, ArrowLeft, Plus, X } from "lucide-react";

interface Convo { id: string; subject: string; last_snippet: string | null; last_message_at: string; student_unread: boolean; }
interface Msg { id: string; sender_role: string; body: string; created_at: string; }

const timeAgo = (s: string) => {
  const d = (Date.now() - new Date(s).getTime()) / 1000;
  if (d < 60) return "now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return new Date(s).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
};

export default function MessagesPage() {
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Convo | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [firstMsg, setFirstMsg] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  async function loadList() {
    try {
      const res = await fetch("/api/messages");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setConvos(data.conversations || []);
    } catch (err: any) { toast.error(err.message || "Could not load messages."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadList(); }, []);

  async function openConvo(c: Convo) {
    setActive(c); setComposing(false); setMessages([]);
    const res = await fetch(`/api/messages?conversationId=${c.id}`);
    const data = await res.json();
    setMessages(data.messages || []);
    if (c.student_unread) {
      fetch("/api/messages/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: c.id }) })
        .then(() => setConvos(prev => prev.map(x => x.id === c.id ? { ...x, student_unread: false } : x)));
    }
    setTimeout(() => endRef.current?.scrollIntoView(), 50);
  }

  async function send() {
    if (!reply.trim() || !active) return;
    setSending(true); const body = reply.trim();
    try {
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: active.id, body }) });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setReply("");
      setMessages(prev => [...prev, { id: crypto.randomUUID(), sender_role: "student", body, created_at: new Date().toISOString() }]);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
  }

  async function startConversation() {
    if (!firstMsg.trim()) { toast.error("Write your message."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject: subject.trim() || "Message", body: firstMsg.trim() }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Message sent.");
      setComposing(false); setSubject(""); setFirstMsg("");
      await loadList();
    } catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
  }

  return (
    <PortalShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold theme-text mb-1" style={{ fontFamily: "'Georgia', serif" }}>Messages</h1>
            <p className="theme-text-muted text-sm font-sans">Reach the School Office. Replies arrive here and by email.</p>
          </div>
          {!composing && !active && (
            <button onClick={() => setComposing(true)}
              className="flex items-center gap-1.5 bg-royal-700 hover:bg-royal-800 text-white text-sm font-semibold font-sans px-4 py-2.5 rounded-xl transition-all">
              <Plus className="w-4 h-4" /> New
            </button>
          )}
        </div>

        {composing ? (
          <div className="theme-bg-elevated rounded-2xl border theme-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="theme-text text-sm font-semibold font-sans">New message</div>
              <button onClick={() => setComposing(false)} className="theme-text-muted hover:theme-text"><X className="w-4 h-4" /></button>
            </div>
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject (optional)"
              className="w-full theme-bg-subtle border theme-border rounded-xl px-4 py-2.5 text-sm theme-text font-sans focus:outline-none focus:border-[#D4A85C]/50" />
            <textarea value={firstMsg} onChange={e => setFirstMsg(e.target.value)} rows={5} placeholder="Write your message to the School Office…"
              className="w-full theme-bg-subtle border theme-border rounded-xl px-4 py-3 text-sm theme-text font-sans focus:outline-none focus:border-[#D4A85C]/50 resize-none" />
            <div className="flex justify-end">
              <button onClick={startConversation} disabled={sending}
                className="flex items-center gap-2 bg-[#D4A85C] hover:bg-[#c39a4f] disabled:opacity-50 text-[#0D1320] text-sm font-semibold font-sans px-5 py-2.5 rounded-xl transition-all">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
              </button>
            </div>
          </div>
        ) : active ? (
          <div className="theme-bg-elevated rounded-2xl border theme-border overflow-hidden flex flex-col min-h-[440px]">
            <div className="px-5 py-3.5 border-b theme-border flex items-center gap-3">
              <button onClick={() => setActive(null)} className="theme-text-muted hover:theme-text"><ArrowLeft className="w-4 h-4" /></button>
              <div className="theme-text text-sm font-semibold font-sans truncate">{active.subject}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-[340px]">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.sender_role === "student" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm font-sans leading-relaxed ${
                    m.sender_role === "student" ? "bg-royal-700 text-white" : "theme-bg-subtle theme-text border theme-border"}`}>
                    <div className="whitespace-pre-wrap">{m.body}</div>
                    <div className={`text-[10px] mt-1 ${m.sender_role === "student" ? "text-white/60" : "theme-text-faint"}`}>{timeAgo(m.created_at)}</div>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-3 border-t theme-border flex items-end gap-2">
              <textarea value={reply} onChange={e => setReply(e.target.value)} rows={1}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Write a reply…"
                className="flex-1 theme-bg-subtle border theme-border rounded-xl px-4 py-2.5 text-sm theme-text font-sans focus:outline-none focus:border-[#D4A85C]/50 resize-none" />
              <button onClick={send} disabled={sending || !reply.trim()}
                className="bg-[#D4A85C] hover:bg-[#c39a4f] disabled:opacity-40 text-[#0D1320] rounded-xl p-2.5 transition-all">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center gap-2 theme-text-muted text-sm py-10 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
        ) : convos.length === 0 ? (
          <div className="theme-bg-elevated rounded-2xl border theme-border p-10 text-center">
            <MessageSquare className="w-8 h-8 theme-text-muted mx-auto mb-3 opacity-40" />
            <p className="theme-text-muted text-sm font-sans mb-4">No messages yet.</p>
            <button onClick={() => setComposing(true)} className="bg-[#D4A85C] hover:bg-[#c39a4f] text-[#0D1320] text-sm font-semibold font-sans px-5 py-2.5 rounded-xl transition-all">Start a conversation</button>
          </div>
        ) : (
          <div className="space-y-2">
            {convos.map(c => (
              <button key={c.id} onClick={() => openConvo(c)}
                className="w-full text-left theme-bg-elevated rounded-xl border theme-border p-4 hover:border-[#D4A85C]/40 transition-all flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {c.student_unread && <span className="w-2 h-2 rounded-full bg-[#D4A85C] flex-shrink-0" />}
                    <span className={`text-sm font-sans truncate ${c.student_unread ? "theme-text font-semibold" : "theme-text"}`}>{c.subject}</span>
                  </div>
                  {c.last_snippet && <div className="theme-text-muted text-xs font-sans truncate mt-0.5">{c.last_snippet}</div>}
                </div>
                <span className="theme-text-faint text-[10px] font-sans flex-shrink-0">{timeAgo(c.last_message_at)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
