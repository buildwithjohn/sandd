"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import LineField from "@/components/LineField";

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
    font-sans placeholder-white/20 focus:outline-none focus:border-[#E0A64E]/60 focus:bg-[#E0A64E]/[0.04] transition-all`;

  return (
    <div className="min-h-screen bg-[#0B0612] flex flex-col items-center justify-center px-5 py-16 relative overflow-hidden">
      <div className="absolute inset-0 grad-hero opacity-90" />
      <div className="absolute inset-0 line-drift opacity-70"><LineField stroke="#ffffff" /></div>
      <div className="absolute inset-0 line-drift2 opacity-40"><LineField stroke="#E0A64E" count={16} /></div>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0612]/40 via-[#0B0612]/20 to-[#0B0612]/70" />

      <Link href="/" className="flex items-center gap-2.5 mb-8 relative z-10 group">
        <Image src="/assets/logo.png" alt="S&D" width={38} height={38} className="rounded-xl group-hover:scale-105 transition-transform" />
        <div>
          <div className="text-white text-base font-semibold leading-none">S&D Prophetic School</div>
          <div className="text-[10px] text-white/70 tracking-wide uppercase font-sans mt-0.5">Student Portal</div>
        </div>
      </Link>

      <motion.div initial={{ opacity: 0, y: 18, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-[26px] w-full max-w-sm p-8 relative z-10 bg-[#0B0612]/70 border border-white/10 backdrop-blur-xl"
        style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/25 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-400" weight="fill" />
            </div>
            <h1 className="kinetic-display text-2xl mb-2 text-white">Check your email</h1>
            <p className="text-white/45 text-sm font-sans leading-relaxed mb-6">
              We sent a password reset link to <strong className="text-white/80">{email}</strong>. Follow it to set a new password.
            </p>
            <Link href="/auth/login"
              className="text-[#E0A64E]/90 hover:text-[#E0A64E] text-sm font-sans flex items-center justify-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" weight="bold" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <Link href="/auth/login"
              className="flex items-center gap-1.5 text-white/40 hover:text-[#E0A64E] text-sm font-sans mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" weight="bold" /> Back to Sign In
            </Link>
            <h1 className="kinetic-display text-3xl mb-2 text-white leading-[0.95]">Reset your password</h1>
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
                className="w-full grad-hero text-white font-bold text-sm py-3.5 rounded-full font-sans transition-all hover:shadow-[0_0_40px_rgba(124,58,237,0.45)] disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><CircleNotch className="w-4 h-4 animate-spin" weight="bold" /> Sending...</> : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
