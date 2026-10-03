"use client";
export const dynamic = 'force-dynamic';
import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeSlash, ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import LineField from "@/components/LineField";

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
    focus:outline-none focus:border-[#E0A64E]/60 focus:bg-[#E0A64E]/[0.04]
    transition-all duration-200`;

  return (
    <motion.div variants={rise(0.15)} initial="hidden" animate="visible"
      className="w-full max-w-sm rounded-[28px] p-8 sm:p-9 relative z-10
        bg-[#0B0612]/70 border border-white/10 backdrop-blur-xl"
      style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px w-8 bg-[#E0A64E]/50" />
          <span className="text-[#E0A64E] text-xs tracking-[0.2em] uppercase font-sans">Student Portal</span>
        </div>
        <h1 className="kinetic-display text-[2.6rem] leading-[0.95] mb-3 text-white">
          Welcome<br />back.
        </h1>
        <p className="text-white/40 text-sm font-sans">
          Sign in to continue your prophetic training.
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
              className="text-[#E0A64E]/70 hover:text-[#E0A64E] text-xs font-sans transition-colors">
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
              {showPw ? <EyeSlash className="w-4 h-4" weight="bold" /> : <Eye className="w-4 h-4" weight="bold" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full grad-hero text-white font-bold text-sm
            py-4 rounded-full transition-all duration-300 font-sans flex items-center justify-center gap-2
            disabled:opacity-50 hover:shadow-[0_0_40px_rgba(124,58,237,0.45)] mt-2">
          {loading
            ? <><CircleNotch className="w-4 h-4 animate-spin" weight="bold" /> Signing in...</>
            : <>Sign In <ArrowRight className="w-4 h-4" weight="bold" /></>
          }
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/[0.08] space-y-3 text-center">
        <p className="text-white/30 text-xs font-sans">
          New student?{" "}
          <Link href="/apply" className="text-[#E0A64E]/90 hover:text-[#E0A64E] transition-colors">
            Create your free account
          </Link>
        </p>
        <p className="text-white/20 text-xs font-sans">
          Admin access?{" "}
          <Link href="/auth/login?next=/admin/dashboard"
            className="text-white/35 hover:text-white/70 transition-colors">
            Sign in to admin panel
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="bg-[#0B0612] min-h-screen flex">

      {/* ── LEFT — Kinetic hero panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-12 overflow-hidden grad-hero">
        {/* drifting line-fields */}
        <div className="absolute inset-0 line-drift opacity-90"><LineField stroke="#ffffff" /></div>
        <div className="absolute inset-0 line-drift2 opacity-50"><LineField stroke="#E0A64E" count={18} /></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0612]/70 via-transparent to-[#0B0612]/30" />

        {/* Logo */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 group">
            <Image src="/assets/logo.png" alt="S&D Logo" width={40} height={40} className="rounded-xl" />
            <div>
              <div className="text-white text-sm font-semibold group-hover:text-white/80 transition-colors">
                S&D Prophetic School
              </div>
              <div className="text-white/50 text-xs font-sans">Treasures in Clay Ministries</div>
            </div>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 py-12">
          <div className="h-px w-12 bg-white/50 mb-6" />
          <blockquote className="kinetic-display text-4xl leading-[1.02] text-white mb-5">
            Eagerly desire<br />the gifts of<br />the Spirit.
          </blockquote>
          <cite className="text-white/70 text-xs font-sans tracking-[0.15em] uppercase not-italic">
            — 1 Corinthians 14:1
          </cite>

          <div className="mt-12 space-y-4">
            {[
              { label: "Year 1", desc: "Certificate in Prophetic Ministry" },
              { label: "Year 2", desc: "Diploma in NT Prophecy" },
            ].map(y => (
              <div key={y.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20
                  flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                  <span className="text-white text-xs font-sans font-semibold">{y.label.split(" ")[1]}</span>
                </div>
                <span className="text-white/70 text-sm font-sans">{y.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prophet at bottom */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/20">
            <Image src="/assets/prophet-sule.png" alt="Prophet Sule" width={40} height={48}
              className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <div className="text-white/60 text-xs font-sans">Dean</div>
            <div className="text-white text-sm font-semibold">Prophet Abiodun Sule</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16 relative overflow-hidden bg-[#0B0612]">
        <div className="absolute inset-0 line-drift2 opacity-[0.18] lg:hidden"><LineField stroke="#7C3AED" /></div>
        <div className="absolute top-0 right-0 w-[380px] h-[380px] rounded-full opacity-30 pointer-events-none"
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

        <div className="max-w-sm w-full mx-auto relative z-10">
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
