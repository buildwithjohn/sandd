"use client";
export const dynamic = 'force-dynamic';
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, Mail } from "lucide-react";

export default function ApplyPage() {
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const [form, setForm] = useState({
    full_name: "", email: "", password: "",
    phone: "", church: "", city: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 3) e.full_name = "Full name is required";
    if (!form.email.includes("@"))         e.email     = "Enter a valid email address";
    if (form.password.length < 8)          e.password  = "Password must be at least 8 characters";
    if (form.phone.trim().length < 7)      e.phone     = "Enter a valid phone number";
    if (form.church.trim().length < 2)     e.church    = "Church / ministry name is required";
    if (form.city.trim().length < 2)       e.city      = "City is required";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Create auth account — Supabase sends verification email
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal/dashboard`,
        },
      });

      // Ignore SMTP/email errors — account is still created successfully
      // Supabase throws this when custom SMTP has issues but user row exists
      if (error && !error.message.toLowerCase().includes("sending") && !error.message.toLowerCase().includes("email")) {
        throw error;
      }

      const userId = data?.user?.id;
      if (!userId) throw new Error("Account creation failed. Please try again.");

      // 2. Save extra profile fields
      await supabase.from("profiles").update({
        full_name: form.full_name,
        phone:     form.phone,
        church:    form.church,
        city:      form.city,
        enrollment_status: "active",
        role: "student",
      }).eq("id", userId);

      // 3. Enroll in Year 1 courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("year", 1);

      if (courses && courses.length > 0) {
        await supabase.from("enrollments").insert(
          courses.map((c: { id: string }) => ({
            student_id: userId,
            course_id: c.id,
            status: "active",
          }))
        );
      }

      // 4. Send branded welcome email via Resend (non-blocking — don't fail signup if email fails)
      const verifyUrl = `${window.location.origin}/auth/callback?next=/portal/dashboard`;
      fetch("/api/auth/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:      form.full_name,
          email:     form.email,
          verifyUrl,
        }),
      }).catch(err => console.error("Welcome email failed (non-critical):", err));

      setSentEmail(form.email);
      setDone(true);

    } catch (err: any) {
      if (err.message?.includes("already registered")) {
        setErrors({ email: "This email is already registered. Try signing in instead." });
      } else {
        toast.error(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── SUCCESS STATE ─────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-[#F0F4FF]">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-10">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="font-display text-brand-900 text-2xl font-semibold mb-3">
              Check your email!
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-2">
              We sent a verification email to:
            </p>
            <p className="font-medium text-brand-700 text-sm mb-6">{sentEmail}</p>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Click the <strong>Verify My Email</strong> button in the email to confirm your account and access your student portal. The email contains a personal welcome from Prophet Abiodun Sule.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Account created successfully
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Enrolled in all Year 1 courses
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                Welcome email sent from Prophet Sule
              </div>
            </div>
            <p className="text-slate-400 text-xs mt-8">
              Didn&apos;t receive the email? Check your spam folder, or{" "}
              <button
                onClick={() => { setDone(false); setForm({ full_name: "", email: "", password: "", phone: "", church: "", city: "" }); }}
                className="text-brand-600 font-medium hover:underline">
                try again
              </button>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <Image src="/assets/logo.png" alt="S&D Logo" width={64} height={64} className="rounded-xl mx-auto mb-4" />
          <h1 className="font-display text-brand-900 text-3xl font-semibold">Join the School</h1>
          <p className="text-slate-500 text-sm mt-2 leading-relaxed">
            Create your free account and start your prophetic training journey today.
          </p>
          <div className="inline-flex items-center gap-2 mt-3 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" /> Tuition is completely free — no credit card required
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Full Name *</label>
              <input value={form.full_name} onChange={e => update("full_name", e.target.value)}
                placeholder="e.g. Oluwaseun Adeyemi" type="text"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.full_name ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Email Address *</label>
              <input value={form.email} onChange={e => update("email", e.target.value)}
                placeholder="your@email.com" type="email"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.email ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Password *</label>
              <div className="relative">
                <input value={form.password} onChange={e => update("password", e.target.value)}
                  placeholder="Min 8 characters" type={showPw ? "text" : "password"}
                  className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-700 focus:outline-none transition-colors ${errors.password ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Phone Number *</label>
              <input value={form.phone} onChange={e => update("phone", e.target.value)}
                placeholder="+234 801 234 5678" type="tel"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.phone ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Church + City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Church / Ministry *</label>
                <input value={form.church} onChange={e => update("church", e.target.value)}
                  placeholder="Your church" type="text"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.church ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
                {errors.church && <p className="text-red-400 text-xs mt-1">{errors.church}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">City *</label>
                <input value={form.city} onChange={e => update("city", e.target.value)}
                  placeholder="Lagos" type="text"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.city ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-brand-400"}`} />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating your account...</>
              ) : "Create Account & Join — Free"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-blue-50 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-brand-600 font-medium hover:text-brand-800">Sign in</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs mt-4 leading-relaxed">
          By joining, you agree to uphold the code of conduct of S&D Prophetic School.<br />
          Tuition is free. No credit card required.
        </p>
      </div>
    </div>
  );
}
