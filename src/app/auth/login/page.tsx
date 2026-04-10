"use client";
export const dynamic = 'force-dynamic';
import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }
  }
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/portal/dashboard";

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles").select("role").eq("id", user.id).single();
        if (profile?.role === "admin" || profile?.role === "super_admin") {
          router.push("/admin/dashboard");
        } else {
          router.push(next);
        }
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  const inp = `w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3
    text-sm text-white/90 font-sans placeholder-white/20
    focus:outline-none focus:border-[#D4A85C]/50 focus:bg-[#D4A85C]/[0.03]
    transition-all duration-200`;

  return (
    <motion.div variants={rise(0.15)} initial="hidden" animate="visible"
      className="w-full max-w-sm">

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-[#D4A85C]/40" />
          <span className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans">Student Portal</span>
        </div>
        <h1 className="text-3xl font-medium tracking-tight mb-2"
          style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>
          Welcome Back
        </h1>
        <p className="text-white/35 text-sm font-sans">
          Sign in to access your courses and continue your journey.
        </p>
      </div>

      <form onSubmit={handleLogin} noValidate className="space-y-4">
        <div>
          <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">
            Email Address
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com" required className={inp} disabled={loading} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans">
              Password
            </label>
            <Link href="/auth/forgot-password"
              className="text-[#D4A85C]/60 hover:text-[#D4A85C] text-xs font-sans transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input type={showPw ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required
              className={`${inp} pr-11`} disabled={loading} />
            <button type="button" onClick={() => setShowPw(v => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-bold text-sm
            py-4 rounded-full transition-all duration-300 font-sans flex items-center justify-center gap-2
            disabled:opacity-50 hover:shadow-[0_0_40px_rgba(212,168,92,0.3)] mt-2">
          {loading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
            : <>Sign In <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/[0.07] space-y-3 text-center">
        <p className="text-white/25 text-xs font-sans">
          New student?{" "}
          <Link href="/apply" className="text-[#D4A85C]/80 hover:text-[#D4A85C] transition-colors">
            Create your free account
          </Link>
        </p>
        <p className="text-white/15 text-xs font-sans">
          Admin access?{" "}
          <Link href="/auth/login?next=/admin/dashboard"
            className="text-white/30 hover:text-white/60 transition-colors">
            Sign in to admin panel
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-[#080C14] min-h-screen flex"
      style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* ── LEFT — Hero panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/hero-bg.jpg" alt="" fill className="object-cover object-center opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#080C14]/75 via-[#080C14]/55 to-[#080C14]/85" />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 50% at 40% 60%, rgba(212,168,92,0.12) 0%, transparent 70%)" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/assets/logo.png" alt="S&D Logo" width={40} height={40} className="rounded-xl" />
            <div>
              <div className="text-white text-sm font-medium group-hover:text-white/80 transition-colors">
                S&D Prophetic School
              </div>
              <div className="text-white/35 text-xs font-sans">Treasures in Clay Ministries</div>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 py-12">
          <div className="h-px w-12 bg-[#D4A85C]/40 mb-6" />
          <blockquote className="text-2xl font-medium leading-[1.35] text-white mb-5"
            style={{ letterSpacing: "-0.01em" }}>
            &ldquo;Eagerly desire gifts of the Spirit, especially prophecy.&rdquo;
          </blockquote>
          <cite className="text-[#D4A85C] text-xs font-sans tracking-[0.15em] uppercase not-italic">
            — 1 Corinthians 14:1
          </cite>

          <div className="mt-12 space-y-4">
            {[
              { label: "Year 1", desc: "Certificate in Prophetic Ministry" },
              { label: "Year 2", desc: "Diploma in NT Prophecy" },
            ].map(y => (
              <div key={y.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#D4A85C]/10 border border-[#D4A85C]/20
                  flex items-center justify-center flex-shrink-0">
                  <span className="text-[#D4A85C] text-xs font-sans font-medium">{y.label.split(" ")[1]}</span>
                </div>
                <span className="text-white/45 text-sm font-sans">{y.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prophet at bottom */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
            <Image src="/assets/prophet-sule.png" alt="Prophet Sule" width={40} height={48}
              className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="text-white/40 text-xs font-sans">Dean</div>
            <div className="text-white text-sm font-medium" style={{ fontFamily: "'Georgia', serif" }}>
              Prophet Abiodun Sule
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form ──────────────────────────────────────────────── */}
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

        <div className="max-w-sm w-full mx-auto">
          <Suspense fallback={
            <div className="text-white/30 text-sm font-sans text-center">Loading...</div>
          }>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
