"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Shield, Plus, Mail, Phone, Crown, Trash2, Loader2,
  Copy, CheckCircle, AlertCircle, ArrowUp, ArrowDown
} from "lucide-react";

interface Admin {
  id: string; full_name: string; email: string; phone?: string;
  church?: string; role: "admin" | "super_admin"; created_at: string;
}

const inp = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all";

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string>("");
  const [myId, setMyId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [church, setChurch] = useState("");
  const [role, setRole] = useState<"admin" | "super_admin">("admin");
  const [saving, setSaving] = useState(false);

  // After creating, show credentials inline so super_admin can copy them
  const [createdCreds, setCreatedCreds] = useState<{ email: string; password: string } | null>(null);

  async function loadMe() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setMyId(user.id);
    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    setMyRole(data?.role ?? "");
  }

  async function loadAdmins() {
    setLoading(true);
    const res = await fetch("/api/admin/list-admins");
    const data = await res.json();
    setAdmins(data.admins ?? []);
    setLoading(false);
  }

  useEffect(() => { loadMe(); loadAdmins(); }, []);

  const isSuperAdmin = myRole === "super_admin";

  async function handleCreate() {
    if (!fullName.trim()) { toast.error("Enter the admin's full name."); return; }
    if (!email.trim() || !email.includes("@")) { toast.error("Enter a valid email."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          church: church.trim() || null,
          role,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      toast.success(`${fullName} added as ${role === "super_admin" ? "Super Admin" : "Admin"}.`);
      setCreatedCreds({ email: data.email, password: data.password });
      setFullName(""); setEmail(""); setPhone(""); setChurch(""); setRole("admin");
      loadAdmins();
    } catch (err: any) {
      toast.error(err.message || "Failed to create admin.");
    } finally { setSaving(false); }
  }

  async function handleAction(adminId: string, action: "demote" | "promote" | "remove", name: string) {
    const messages: Record<string, string> = {
      demote: `Demote ${name} from Super Admin to Admin?`,
      promote: `Promote ${name} to Super Admin? They will be able to create and remove admins.`,
      remove: `Remove admin role from ${name}? They will become a regular student. Their account and progress are kept.`,
    };
    if (!confirm(messages[action])) return;

    const res = await fetch("/api/admin/remove-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId, action }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || "Failed"); return; }
    toast.success(`${name} ${data.action}.`);
    loadAdmins();
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied.`);
  }

  if (loading) return (
    <AdminShell>
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-[#D4A85C]/30 border-t-[#D4A85C] rounded-full animate-spin" />
      </div>
    </AdminShell>
  );

  return (
    <AdminShell>
      <div className="max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-medium text-white" style={{ fontFamily: "'Georgia', serif" }}>
              Admins
            </h1>
            <p className="text-white/35 text-sm font-sans mt-1">
              Manage admin and super admin accounts. {!isSuperAdmin && "(Only Super Admin can add or modify admins.)"}
            </p>
          </div>
          {isSuperAdmin && (
            <button onClick={() => { setShowForm(s => !s); setCreatedCreds(null); }}
              className="flex items-center gap-1.5 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] text-xs font-bold font-sans px-4 py-2.5 rounded-full transition-all flex-shrink-0">
              <Plus className="w-3.5 h-3.5" /> {showForm ? "Cancel" : "Add Admin"}
            </button>
          )}
        </div>

        {/* Created credentials banner (after success) */}
        {createdCreds && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/[0.08] border border-green-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-400 text-sm font-semibold font-sans">Admin created. Welcome email sent.</p>
                <p className="text-white/50 text-xs font-sans mt-1">
                  Save or share these credentials in case the email is missed. The password is shown only once.
                </p>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-sans w-16">Email</span>
                <code className="text-white text-xs flex-1 font-mono">{createdCreds.email}</code>
                <button onClick={() => copyToClipboard(createdCreds.email, "Email")}
                  className="text-white/40 hover:text-[#D4A85C]"><Copy className="w-3.5 h-3.5" /></button>
              </div>
              <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
                <span className="text-white/40 text-[10px] uppercase tracking-widest font-sans w-16">Password</span>
                <code className="text-[#D4A85C] text-xs flex-1 font-mono font-bold">{createdCreds.password}</code>
                <button onClick={() => copyToClipboard(createdCreds.password, "Password")}
                  className="text-white/40 hover:text-[#D4A85C]"><Copy className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <button onClick={() => setCreatedCreds(null)}
              className="text-xs text-white/40 hover:text-white font-sans underline">
              Dismiss
            </button>
          </motion.div>
        )}

        {/* New admin form */}
        {showForm && isSuperAdmin && !createdCreds && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[#0D1320] border border-[#D4A85C]/20 rounded-2xl p-5 space-y-4">
            <div className="text-white text-sm font-semibold font-sans pb-3 border-b border-white/[0.06]">Create New Admin</div>

            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Full Name *</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="John Akinola" className={inp} />
            </div>
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Email *</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className={inp} />
              <p className="text-white/20 text-[11px] font-sans mt-1">A welcome email with login credentials is sent automatically.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+234..." className={inp} />
              </div>
              <div>
                <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Church</label>
                <input value={church} onChange={e => setChurch(e.target.value)} placeholder="Their parish or assembly" className={inp} />
              </div>
            </div>
            <div>
              <label className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans block mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {(["admin", "super_admin"] as const).map(r => (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-semibold font-sans border transition-all flex items-center justify-center gap-2 ${
                      role === r
                        ? "bg-[#D4A85C] border-[#D4A85C] text-[#080C14]"
                        : "bg-white/[0.04] border-white/10 text-white/60 hover:border-white/25"
                    }`}>
                    {r === "super_admin" && <Crown className="w-3.5 h-3.5" />}
                    {r === "admin" ? "Admin" : "Super Admin"}
                  </button>
                ))}
              </div>
              <p className="text-white/20 text-[11px] font-sans mt-1.5">
                {role === "super_admin"
                  ? "Super Admin can add, promote, demote, and remove other admins."
                  : "Admin has full course/student management but cannot create other admins."}
              </p>
            </div>

            <button onClick={handleCreate} disabled={saving || !fullName.trim() || !email.trim()}
              className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-40 text-[#080C14] font-bold text-sm py-3.5 rounded-full transition-all font-sans flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Admin Account</>}
            </button>
          </motion.div>
        )}

        {/* List */}
        <div className="bg-[#0D1320] border border-white/[0.07] rounded-2xl p-5">
          <div className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans mb-4">
            {admins.length} admin{admins.length !== 1 ? "s" : ""}
          </div>

          {admins.length === 0 && (
            <div className="py-10 text-center">
              <Shield className="w-10 h-10 text-white/15 mx-auto mb-3" />
              <p className="text-white/40 text-sm font-sans">No admins yet.</p>
            </div>
          )}

          <div className="space-y-2">
            {admins.map(a => {
              const isMe = a.id === myId;
              const initials = a.full_name?.split(" ").map(n => n[0]).slice(0,2).join("") ?? "?";
              return (
                <div key={a.id} className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl border ${
                  a.role === "super_admin"
                    ? "bg-[#D4A85C]/[0.05] border-[#D4A85C]/20"
                    : "bg-white/[0.02] border-white/[0.06]"
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    a.role === "super_admin"
                      ? "bg-[#D4A85C]/15 text-[#D4A85C] border border-[#D4A85C]/30"
                      : "bg-white/[0.06] text-white/70"
                  }`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-white text-sm font-semibold font-sans truncate" style={{ fontFamily: "'Georgia', serif" }}>
                        {a.full_name}
                      </div>
                      {isMe && <span className="text-[9px] bg-white/[0.06] text-white/40 px-1.5 py-0.5 rounded font-sans">You</span>}
                      <span className={`text-[9px] uppercase tracking-widest font-sans px-1.5 py-0.5 rounded ${
                        a.role === "super_admin"
                          ? "bg-[#D4A85C]/15 text-[#D4A85C] border border-[#D4A85C]/30"
                          : "bg-white/[0.06] text-white/40 border border-white/10"
                      }`}>
                        {a.role === "super_admin" ? <><Crown className="w-2.5 h-2.5 inline mr-0.5" /> Super</> : "Admin"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-white/40 font-sans">
                      <a href={`mailto:${a.email}`} className="hover:text-[#D4A85C] truncate">
                        {a.email}
                      </a>
                      {a.phone && <span className="hidden sm:inline">·</span>}
                      {a.phone && <span>{a.phone}</span>}
                    </div>
                  </div>

                  {/* Actions — only super_admin sees these, and not on self */}
                  {isSuperAdmin && !isMe && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {a.role === "admin" ? (
                        <button onClick={() => handleAction(a.id, "promote", a.full_name)}
                          className="text-[10px] font-semibold font-sans px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:bg-[#D4A85C]/10 hover:border-[#D4A85C]/30 hover:text-[#D4A85C] transition-all"
                          title="Promote to Super Admin">
                          <ArrowUp className="w-3 h-3 inline" />
                        </button>
                      ) : (
                        <button onClick={() => handleAction(a.id, "demote", a.full_name)}
                          className="text-[10px] font-semibold font-sans px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-400 transition-all"
                          title="Demote to Admin">
                          <ArrowDown className="w-3 h-3 inline" />
                        </button>
                      )}
                      <button onClick={() => handleAction(a.id, "remove", a.full_name)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.04] border border-white/10 text-white/40 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
                        title="Remove admin role">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
