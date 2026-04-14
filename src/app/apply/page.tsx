"use client";
export const dynamic = "force-dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, CheckCircle, Loader2, Mail } from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 24, filter: "blur(3px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }
  }
});

interface FormState {
  full_name: string; email: string; password: string;
  phone: string; church: string; city: string;
}

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep]     = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [doneEmail, setDoneEmail] = useState("");
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [form, setForm]       = useState<FormState>({
    full_name: "", email: "", password: "",
    phone: "", church: "", city: "",
  });

  function update(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (form.full_name.trim().length < 3)             e.full_name = "Full name required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email";
    if (form.password.length < 8)                     e.password  = "Min 8 characters";
    if (form.phone.trim().length < 7)                 e.phone     = "Enter a valid phone number";
    if (form.church.trim().length < 2)                e.church    = "Church / ministry required";
    if (form.city.trim().length < 2)                  e.city      = "City required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const supabase = createClient();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: { data: { full_name: form.full_name.trim() } },
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        const code = (authError as any).code ?? "";

        // Log exact error for debugging
        console.error("Supabase signup error:", authError.message, "code:", code);

        if (
          msg.includes("already registered") ||
          msg.includes("user already registered") ||
          code === "user_already_exists"
        ) {
          setErrors({ email: "This email is already registered. Sign in instead." });
          return;
        }

        // Email rate limit — Supabase sends this even with confirmation off
        // The fix is to disable Supabase email entirely via SMTP settings
        if (
          msg.includes("email rate limit") ||
          msg.includes("over_email_send_rate_limit") ||
          code === "over_email_send_rate_limit" ||
          code === "email_send_failed"
        ) {
          // Account IS created — just email notification failed. Proceed to success.
          const userId = (authData as any)?.user?.id as string | undefined;
          if (userId) {
            await supabase.from("profiles").upsert({
              id: userId,
              email: form.email.trim().toLowerCase(),
              full_name: form.full_name.trim(),
              phone: form.phone.trim(),
              church: form.church.trim(),
              city: form.city.trim(),
              role: "student",
              enrollment_status: "active",
              current_year: 1,
            }, { onConflict: "id" });
            setDoneEmail(form.email.trim().toLowerCase());
            setStep("success");
            return;
          }
          toast.error("Registration issue. Please try again or contact support.");
          return;
        }

        if (msg.includes("invalid") && msg.includes("email")) {
          setErrors({ email: "Please enter a valid email address." });
          return;
        }
        if (msg.includes("password") && (msg.includes("weak") || msg.includes("short"))) {
          setErrors({ password: "Password must be at least 8 characters." });
          return;
        }

        // Show the real Supabase error for anything else
        toast.error(authError.message || "Registration failed. Please try again.");
        return;
      }

      // When email confirmation is OFF, Supabase may return a user with
      // identities=[] for duplicate emails — this is a silent duplicate
      const userId = authData.user?.id;
      const isEmailDuplicate = authData.user?.identities?.length === 0;

      if (!userId) {
        toast.error("Account creation failed. Please try again.");
        return;
      }

      if (isEmailDuplicate) {
        setErrors({ email: "This email is already registered. Sign in instead." });
        return;
      }

      // Use upsert to handle cases where trigger hasn't created profile yet
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        email: form.email.trim().toLowerCase(),
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        church: form.church.trim(),
        city: form.city.trim(),
        role: "student",
        enrollment_status: "active",
        current_year: 1,
      }, { onConflict: "id" });

      if (profileError) {
        console.error("Profile upsert error:", profileError);
        // Continue anyway — account is created, we'll fix profile via trigger
      }

      const { data: courses } = await supabase.from("courses").select("id").eq("year", 1);
      if (courses && courses.length > 0) {
        await supabase.from("enrollments").insert(
          courses.map((c: { id: string }) => ({ student_id: userId, course_id: c.id, status: "active" }))
        );
      }

      fetch("/api/auth/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.full_name.trim(), email: form.email.trim().toLowerCase() }),
      }).catch(err => console.error("Welcome email error:", err));

      setDoneEmail(form.email.trim().toLowerCase());
      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (step === "success") {
    const firstName = doneEmail.split("@")[0];
    return (
      <div className="bg-[#080C14] min-h-screen flex flex-col items-center justify-center px-6 py-16"
        style={{ fontFamily: "'Georgia', serif" }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-lg">

          {/* Prophet photo + logo */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl bg-[#D4A85C]/20 scale-110" />
              <Image src="/assets/logo.png" alt="S&D Logo" width={52} height={52}
                className="relative rounded-xl" />
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="w-14 h-16 rounded-xl overflow-hidden border border-[#D4A85C]/20 flex-shrink-0">
              <Image src="/assets/prophet-sule.png" alt="Prophet Abiodun Sule"
                width={56} height={64} className="w-full h-full object-cover object-top" />
            </div>
          </div>

          {/* Welcome heading */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-[#D4A85C]/40" />
              <span className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans">Welcome to the 2026 Cohort</span>
              <div className="h-px w-10 bg-[#D4A85C]/40" />
            </div>
            <h1 className="text-4xl font-medium tracking-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
              You&apos;re In.
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <CheckCircle className="w-4 h-4 text-[#D4A85C]" />
              <CheckCircle className="w-4 h-4 text-[#D4A85C]" />
              <CheckCircle className="w-4 h-4 text-[#D4A85C]" />
              <span className="text-white/30 text-xs font-sans ml-1">Account · Courses · Active</span>
            </div>
          </div>

          {/* Prophet Sule welcome message */}
          <div className="bg-[#0D1320] border border-[#D4A85C]/20 rounded-2xl p-7 mb-6"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
            <p className="text-white/40 text-xs tracking-[0.15em] uppercase font-sans mb-4">
              A personal word from the Dean
            </p>
            <div className="space-y-4 text-white/80 text-sm leading-[1.85]">
              <p>Beloved,</p>
              <p>
                Grace and peace to you in the name of our Lord Jesus Christ.
              </p>
              <p>
                It is with great joy in my heart that I welcome you into the{" "}
                <span className="text-[#D4A85C]">Sons and Daughters of Prophets Prophetic Training School</span>.
                We believe that God has placed a prophetic calling upon your life, and this school
                exists to ensure that gift is not wasted through ignorance, pride or lack of accountability.
              </p>
              <p>
                The journey ahead will require discipline, honesty and a genuine hunger for God.
                Come with an open heart. Come willing to be corrected. Come ready to grow.
                And above all, come expecting to encounter the living God in a fresh and
                transforming way.
              </p>
              <p>
                I am believing God for great things through your life.
              </p>
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.07] mt-6 pt-5 flex items-center gap-3">
              <div className="w-9 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                <Image src="/assets/prophet-sule.png" alt="Prophet Sule"
                  width={36} height={44} className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">Prophet Abiodun Sule</div>
                <div className="text-[#D4A85C]/70 text-xs font-sans mt-0.5">
                  Founder & Dean · S&D Prophetic Training School
                </div>
              </div>
            </div>

            {/* Scripture */}
            <div className="mt-5 bg-[#D4A85C]/[0.06] border border-[#D4A85C]/15 rounded-xl px-4 py-3 text-center">
              <p className="text-white/50 text-xs italic leading-relaxed">
                &ldquo;But the one who prophesies speaks to people for their strengthening,
                encouraging and comfort.&rdquo;
              </p>
              <p className="text-[#D4A85C]/60 text-[10px] font-sans tracking-widest uppercase mt-1.5">
                1 Corinthians 14:3
              </p>
            </div>
          </div>

          {/* CTA */}
          <button onClick={() => router.push("/auth/login")}
            className="w-full bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-bold text-sm
              py-4 rounded-full transition-all duration-300 font-sans flex items-center justify-center gap-2
              hover:shadow-[0_0_40px_rgba(212,168,92,0.35)] hover:-translate-y-0.5">
            Enter Your Student Portal <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-white/20 text-xs font-sans text-center mt-3">
            Sign in with <span className="text-white/40">{doneEmail}</span> and your password
          </p>
        </motion.div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  const inp = (field: keyof FormState) =>
    `w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-white/90 font-sans
    placeholder-white/20 focus:outline-none transition-all duration-200
    ${errors[field]
      ? "border-red-500/50 focus:border-red-400/70 focus:bg-red-500/[0.04]"
      : "border-white/10 focus:border-[#D4A85C]/50 focus:bg-[#D4A85C]/[0.03]"}`;

  return (
    <div className="bg-[#080C14] min-h-screen" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      <div className="min-h-screen flex">

        {/* ── LEFT — Hero panel ─────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0">
            <Image src="/assets/hero-bg.jpg" alt="" fill className="object-cover object-center opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-br from-[#080C14]/70 via-[#080C14]/50 to-[#080C14]/80" />
            <div className="absolute inset-0"
              style={{ background: "radial-gradient(ellipse 60% 50% at 40% 60%, rgba(212,168,92,0.15) 0%, transparent 70%)" }} />
          </div>

          {/* Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <Image src="/assets/logo.png" alt="S&D Logo" width={40} height={40} className="rounded-xl" />
              <div>
                <div className="text-white text-sm font-medium">S&D Prophetic School</div>
                <div className="text-white/40 text-xs font-sans">Treasures in Clay Ministries</div>
              </div>
            </div>
          </div>

          {/* Center quote */}
          <div className="relative z-10 py-12">
            <div className="h-px w-12 bg-[#D4A85C]/40 mb-6" />
            <blockquote className="text-2xl font-medium leading-[1.35] tracking-tight text-white mb-5"
              style={{ letterSpacing: "-0.01em" }}>
              &ldquo;But the one who prophesies speaks to people for their strengthening,
              encouraging and comfort.&rdquo;
            </blockquote>
            <cite className="text-[#D4A85C] text-xs font-sans tracking-[0.15em] uppercase not-italic">
              — 1 Corinthians 14:3
            </cite>

            <div className="mt-12 space-y-3">
              {[
                "Completely free — no tuition",
                "Online · Weekly classes",
                "Two years · 11 courses",
                "Certificate & Diploma awarded",
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-1 h-1 rounded-full bg-[#D4A85C]/60" />
                  <span className="text-white/50 text-sm font-sans">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Prophet image bottom */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
              <Image src="/assets/prophet-sule.png" alt="Prophet Sule" width={40} height={48}
                className="w-full h-full object-cover object-top" />
            </div>
            <div>
              <div className="text-white/70 text-xs font-sans">Founded by</div>
              <div className="text-white text-sm font-medium" style={{ fontFamily: "'Georgia', serif" }}>
                Prophet Abiodun Sule
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT — Form ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-16 overflow-y-auto">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Image src="/assets/logo.png" alt="S&D" width={36} height={36} className="rounded-lg" />
            <div>
              <div className="text-white text-sm font-medium">S&D Prophetic School</div>
              <div className="text-white/30 text-xs font-sans">Treasures in Clay Ministries</div>
            </div>
          </div>

          <motion.div variants={rise(0.1)} initial="hidden" animate="visible" className="max-w-sm w-full mx-auto">

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px w-8 bg-[#D4A85C]/40" />
                <span className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans">2026 Cohort</span>
              </div>
              <h1 className="text-3xl font-medium tracking-tight mb-2" style={{ letterSpacing: "-0.02em" }}>
                Join the School
              </h1>
              <p className="text-white/35 text-sm font-sans leading-relaxed">
                Create your account and begin your prophetic training journey — completely free.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              {/* Full Name */}
              <div>
                <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Full Name</label>
                <input type="text" value={form.full_name} onChange={e => update("full_name", e.target.value)}
                  placeholder="Oluwaseun Adeyemi" className={inp("full_name")} disabled={loading} />
                {errors.full_name && <p className="text-red-400/80 text-xs font-sans mt-1.5">{errors.full_name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Email Address</label>
                <input type="email" value={form.email} onChange={e => update("email", e.target.value)}
                  placeholder="your@email.com" className={inp("email")} disabled={loading} />
                {errors.email && <p className="text-red-400/80 text-xs font-sans mt-1.5">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={form.password}
                    onChange={e => update("password", e.target.value)}
                    placeholder="Min 8 characters" className={`${inp("password")} pr-11`} disabled={loading} />
                  <button type="button" onClick={() => setShowPw(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400/80 text-xs font-sans mt-1.5">{errors.password}</p>}
              </div>

              {/* Phone */}
              <div>
                <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Phone Number</label>
                <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
                  placeholder="+234 801 234 5678" className={inp("phone")} disabled={loading} />
                {errors.phone && <p className="text-red-400/80 text-xs font-sans mt-1.5">{errors.phone}</p>}
              </div>

              {/* Church + City */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">Church</label>
                  <input type="text" value={form.church} onChange={e => update("church", e.target.value)}
                    placeholder="Your church" className={inp("church")} disabled={loading} />
                  {errors.church && <p className="text-red-400/80 text-xs font-sans mt-1.5">{errors.church}</p>}
                </div>
                <div>
                  <label className="text-white/40 text-xs tracking-[0.12em] uppercase font-sans block mb-2">City</label>
                  <input type="text" value={form.city} onChange={e => update("city", e.target.value)}
                    placeholder="Lagos" className={inp("city")} disabled={loading} />
                  {errors.city && <p className="text-red-400/80 text-xs font-sans mt-1.5">{errors.city}</p>}
                </div>
              </div>

              {/* Submit */}
              <button type="submit" disabled={loading}
                className="w-full bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-bold text-sm
                  py-4 rounded-full transition-all duration-300 font-sans flex items-center justify-center gap-2
                  disabled:opacity-50 hover:shadow-[0_0_40px_rgba(212,168,92,0.3)] mt-2">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating your account...</>
                  : <>"Create Account — Free" <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/[0.07] text-center">
              <p className="text-white/25 text-xs font-sans">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-[#D4A85C]/80 hover:text-[#D4A85C] transition-colors">
                  Sign in
                </Link>
              </p>
            </div>

            <p className="text-white/15 text-xs font-sans text-center mt-4 leading-relaxed">
              By joining you agree to uphold the code of conduct of S&D Prophetic School.
              Tuition is free. No credit card required.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
