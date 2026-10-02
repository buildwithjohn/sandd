"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email.");
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
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <h1 className="text-xl font-medium mb-2 text-gilt-gradient">Check your email</h1>
            <p className="text-white/45 text-sm font-sans leading-relaxed mb-6">
              We sent a password reset link to <strong className="text-white/80">{email}</strong>. Follow it to set a new password.
            </p>
            <Link href="/auth/login"
              className="text-[#D4A85C]/80 hover:text-[#D4A85C] text-sm font-sans flex items-center justify-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <Link href="/auth/login"
              className="flex items-center gap-1.5 text-white/40 hover:text-[#D4A85C] text-sm font-sans mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
            <h1 className="text-2xl font-medium mb-2 text-gilt-gradient tracking-tight"
              style={{ letterSpacing: "-0.02em" }}>Reset your password</h1>
            <p className="text-white/40 text-sm font-sans mb-6">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" required className={inp} disabled={loading} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-50 text-[#080C14] font-bold text-sm py-3.5 rounded-full font-sans transition-all hover:shadow-[0_0_40px_rgba(212,168,92,0.3)] flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
