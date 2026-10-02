"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [validSession, setValid]  = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => setValid(!!session));
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    if (password.length < 8)  { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/portal/dashboard"), 2500);
    } catch (err: any) {
      toast.error(err.message || "Password reset failed.");
    } finally {
      setLoading(false);
    }
  }

  const inp = `w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90
    font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 focus:bg-[#D4A85C]/[0.03] transition-all`;

  return (
    <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center px-5 py-16 relative overflow-hidden aurora"
      style={{ fontFamily: "'Georgia', serif" }}>
      <div className="aurora-blob aurora-gold" style={{ width: 460, height: 460, top: "-140px", right: "-120px" }} />
      <div className="aurora-blob aurora-royal" style={{ width: 480, height: 480, bottom: "-160px", left: "-140px" }} />

      <Link href="/" className="flex items-center gap-2.5 mb-8 relative z-10 group">
        <Image src="/assets/logo.png" alt="S&D" width={38} height={38} className="rounded-xl group-hover:scale-105 transition-transform" />
        <div>
          <div className="text-white text-base font-semibold leading-none">S&D Prophetic School</div>
          <div className="text-[10px] text-[#D4A85C]/80 tracking-wide uppercase font-sans mt-0.5">Student Portal</div>
        </div>
      </Link>

      <motion.div initial={{ opacity: 0, y: 18, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="glass-dark glass-edge rounded-[26px] w-full max-w-sm p-8 relative z-10">
        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <h1 className="text-xl font-medium mb-2 text-gilt-gradient">Password updated</h1>
            <p className="text-white/45 text-sm font-sans">Redirecting you to your dashboard…</p>
          </div>
        ) : !validSession ? (
          <div className="text-center">
            <h1 className="text-xl font-medium mb-2 text-gilt-gradient">Link expired</h1>
            <p className="text-white/45 text-sm font-sans mb-6">
              This reset link has expired or is invalid. Please request a new one.
            </p>
            <Link href="/auth/forgot-password"
              className="bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-semibold text-sm font-sans px-5 py-2.5 rounded-full transition-all inline-block">
              Request New Link
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-medium mb-2 text-gilt-gradient tracking-tight" style={{ letterSpacing: "-0.02em" }}>
              Set new password
            </h1>
            <p className="text-white/40 text-sm font-sans mb-6">Choose a strong password for your account.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">New Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters" required className={`${inp} pr-11`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Confirm Password</label>
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat new password" required className={inp} />
                {confirm && password !== confirm && (
                  <p className="text-red-400 text-xs font-sans mt-1.5">Passwords do not match</p>
                )}
              </div>
              <button type="submit" disabled={loading || password !== confirm || password.length < 8}
                className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-50 text-[#080C14] font-bold text-sm py-3.5 rounded-full font-sans transition-all hover:shadow-[0_0_40px_rgba(212,168,92,0.3)] flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : "Set New Password"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
