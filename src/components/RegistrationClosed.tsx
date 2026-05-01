"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle, Loader2, Mail } from "lucide-react";

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
    <div className="bg-[#080C14] min-h-screen flex" style={{ fontFamily: "'Georgia', serif" }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/hero-bg.jpg" alt="" fill className="object-cover object-center opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#080C14]/75 via-[#080C14]/55 to-[#080C14]/85" />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 50% at 40% 60%, rgba(212,168,92,0.12) 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D Logo" width={40} height={40} className="rounded-xl" />
            <div>
              <div className="text-white text-sm font-medium">S&D Prophetic School</div>
              <div className="text-white/35 text-xs font-sans">Treasures in Clay Ministries</div>
            </div>
          </Link>
        </div>
        <div className="relative z-10 py-12">
          <div className="h-px w-12 bg-[#D4A85C]/40 mb-6" />
          <h2 className="text-3xl font-medium leading-[1.3] text-white mb-5" style={{ letterSpacing: "-0.01em" }}>
            The 2026 Cohort is now in session.
          </h2>
          <p className="text-white/45 text-sm font-sans leading-relaxed">
            Registration for this cohort has closed. Leave your details and we will notify you when the next cohort opens.
          </p>
          <div className="mt-10 space-y-3">
            {["Free tuition — always", "Scripture-centred curriculum", "Live sessions with Prophet Sule", "Certificate & Diploma awarded"].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-1 h-1 rounded-full bg-[#D4A85C]/60" />
                <span className="text-white/40 text-sm font-sans">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <Image src="/assets/prophet-sule.png" alt="Prophet Sule" width={40} height={48} className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="text-white/40 text-xs font-sans">Founded by</div>
            <div className="text-white text-sm font-medium">Prophet Abiodun Sule</div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16">

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D" width={36} height={36} className="rounded-lg" />
            <div>
              <div className="text-white text-sm font-medium">S&D Prophetic School</div>
              <div className="text-white/30 text-xs font-sans">Treasures in Clay Ministries</div>
            </div>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-sm w-full mx-auto">

          {/* Closed badge */}
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-sans px-3 py-1.5 rounded-full mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Registration Closed — 2026 Cohort
          </div>

          {!submitted ? (
            <>
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px w-8 bg-[#D4A85C]/40" />
                  <span className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans">2027 Cohort</span>
                </div>
                <h1 className="text-3xl font-medium tracking-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
                  Join the Waitlist
                </h1>
                <p className="text-white/35 text-sm font-sans leading-relaxed">
                  Be the first to know when registration opens for the next cohort. We will email you directly.
                </p>
              </div>

              <form onSubmit={handleWaitlist} noValidate className="space-y-4">
                <div>
                  <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all" />
                </div>
                <div>
                  <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Email Address *</label>
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
                    placeholder="your@email.com" required
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/90 font-sans placeholder-white/20 focus:outline-none focus:border-[#D4A85C]/50 transition-all" />
                  {error && <p className="text-red-400/80 text-xs font-sans mt-1.5">{error}</p>}
                </div>
                <button type="submit" disabled={loading}
                  className="w-full bg-[#D4A85C] hover:bg-[#C49848] disabled:opacity-50 text-[#080C14] font-bold text-sm py-4 rounded-full transition-all font-sans flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,168,92,0.3)]">
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Joining...</>
                    : <>Join Waitlist <ArrowRight className="w-4 h-4" /></>
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
                <div className="absolute w-20 h-20 rounded-full bg-[#D4A85C]/15 blur-xl" />
                <div className="relative w-14 h-14 rounded-full border border-[#D4A85C]/30 bg-[#D4A85C]/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-[#D4A85C]" />
                </div>
              </div>
              <h2 className="text-2xl font-medium mb-3" style={{ letterSpacing: "-0.02em" }}>You're on the list.</h2>
              <p className="text-white/40 text-sm font-sans leading-relaxed mb-2">
                We've saved your details. When the 2027 Cohort opens, you'll be the first to know.
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
