"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, CircleNotch } from "@phosphor-icons/react";
import LineField from "@/components/LineField";

export default function RegistrationClosed() {
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  async function handleWaitlist(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) { setError("Enter a valid email address."); return; }
    setLoading(true); setError("");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.from("waitlist").insert({ email: email.trim().toLowerCase(), full_name: name.trim() || null });
      if (err) {
        if (err.code === "23505") { setError("This email is already on the waitlist."); return; }
        throw err;
      }
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally { setLoading(false); }
  }

  return (
    <div className="bg-[#0B0612] min-h-screen flex" style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}>

      {/* Left kinetic panel */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden grad-hero">
        <div className="absolute inset-0 line-drift opacity-90"><LineField stroke="#ffffff" /></div>
        <div className="absolute inset-0 line-drift2 opacity-50"><LineField stroke="#E0A64E" count={18} /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0612]/70 via-transparent to-[#0B0612]/30" />
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D Logo" width={40} height={40} className="rounded-xl" />
            <div>
              <div className="text-white text-sm font-semibold">S&D Prophetic School</div>
              <div className="text-white/50 text-xs font-sans">Treasures in Clay Ministries</div>
            </div>
          </Link>
        </div>
        <div className="relative z-10 py-12">
          <div className="h-px w-12 bg-white/50 mb-6" />
          <h2 className="kinetic-display text-4xl leading-[1.02] text-white mb-5">
            Cohort 0.2 is<br />now in session.
          </h2>
          <p className="text-white/70 text-sm font-sans leading-relaxed">
            Registration for this cohort has closed. Leave your details and we will notify you when the next cohort opens.
          </p>
          <div className="mt-10 space-y-3">
            {["Free tuition — always", "Scripture-centred curriculum", "Live sessions with Prophet Sule", "Certificate & Diploma awarded"].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/70" />
                <span className="text-white/70 text-sm font-sans">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
            <Image src="/assets/prophet-sule.png" alt="Prophet Sule" width={40} height={48} className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="text-white/60 text-xs font-sans">Founded by</div>
            <div className="text-white text-sm font-semibold">Prophet Abiodun Sule</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16 relative overflow-hidden bg-[#0B0612]">
        <div className="absolute top-0 right-0 w-[380px] h-[380px] rounded-full opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)", transform: "translate(30%,-40%)" }} />

        {/* Mobile logo */}
        <div className="lg:hidden mb-10 relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D" width={36} height={36} className="rounded-lg" />
            <div>
              <div className="text-white text-sm font-semibold">S&D Prophetic School</div>
              <div className="text-white/40 text-xs font-sans">Treasures in Clay Ministries</div>
            </div>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-sm w-full mx-auto relative z-10">

          {/* Closed badge */}
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-sans px-3 py-1.5 rounded-full mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Registration Closed — Cohort 0.2
          </div>

          {!submitted ? (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-[#D4A85C]/40" />
                  <span className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans">Next Cohort</span>
                </div>
                <h1 className="kinetic-display text-5xl mb-3 text-white leading-[0.95]">
                  Join the<br /><span className="accent-cycle">waitlist.</span>
                </h1>
                <p className="text-white/40 text-sm font-sans leading-relaxed">
                  Be the first to know when registration opens for the next cohort. We will email you directly.
                </p>
              </div>

              <form onSubmit={handleWaitlist} noValidate className="space-y-4">
                <div>
                  <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#E0A64E]/60 transition-all" />
                </div>
                <div>
                  <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Email Address *</label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="your@email.com" required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#E0A64E]/60 transition-all" />
                  {error && <p className="text-red-400/80 text-xs font-sans mt-1.5">{error}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full grad-hero disabled:opacity-50 text-white font-bold text-sm py-4 rounded-full transition-all font-sans flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(124,58,237,0.45)]">
                  {loading
                    ? <><CircleNotch className="w-4 h-4 animate-spin" weight="bold" /> Joining...</>
                    : <>Join Waitlist <ArrowRight className="w-4 h-4" weight="bold" /></>
                  }
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-white/[0.07] text-center">
                <p className="text-white/25 text-xs font-sans">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-[#D4A85C]/80 hover:text-[#D4A85C] transition-colors">Sign in</Link>
                </p>
              </div>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="text-center">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute w-20 h-20 rounded-full bg-[#7C3AED]/25 blur-xl" />
                <div className="relative w-14 h-14 rounded-full border border-[#D4A85C]/30 bg-[#D4A85C]/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#D4A85C]" weight="fill" />
                </div>
              </div>
              <h2 className="kinetic-display text-3xl mb-3 text-white">You&apos;re on the list.</h2>
              <p className="text-white/40 text-sm font-sans leading-relaxed mb-2">
                We&apos;ve saved your details. When the next cohort opens, you&apos;ll be the first to know.
              </p>
              <p className="text-[#D4A85C] text-xs font-sans">{email}</p>
              <Link href="/"
                className="mt-8 inline-flex items-center gap-2 text-white/40 hover:text-white text-xs font-sans transition-colors">
                ← Back to homepage
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
