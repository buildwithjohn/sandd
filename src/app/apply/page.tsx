"use client";
export const dynamic = 'force-dynamic';
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ApplyPage() {
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showPw, setShowPw]       = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

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

      // 1. Create Supabase auth account
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/portal/dashboard`,
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Account creation failed. Please try again.");

      // 2. Upsert profile with full details
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        church: form.church,
        city: form.city,
        role: "student",
        enrollment_status: "active",
        current_year: 1,
      }, { onConflict: "id" });

      // 3. Auto-enroll in all Year 1 courses
      const { data: courses } = await supabase
        .from("courses").select("id").eq("year", 1).eq("is_published", true);
      if (courses && courses.length > 0) {
        await supabase.from("enrollments").upsert(
          courses.map(c => ({ student_id: data.user!.id, course_id: c.id })),
          { onConflict: "student_id,course_id" }
        );
      }

      // 4. Send branded welcome + verification email via Resend
      // Get the confirmation URL Supabase generated
      const confirmationUrl = `${window.location.origin}/auth/callback?next=/portal/dashboard`;
      await fetch("/api/auth/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          full_name: form.full_name,
          confirmation_url: confirmationUrl,
        }),
      });

      setSubmittedEmail(form.email);
      setSubmitted(true);
    } catch (err: any) {
      if (err.message?.includes("already registered")) {
        toast.error("This email is already registered. Please sign in instead.");
      } else {
        toast.error(err.message || "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFF]">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="font-display text-brand-900 text-3xl font-medium mb-3">Check Your Email</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-2">
            We sent a verification link to
          </p>
          <p className="text-brand-700 font-semibold text-base mb-4">{submittedEmail}</p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Click the link in the email to verify your account and access your student portal.
            Check your spam folder if you don&apos;t see it within a few minutes.
          </p>
        </div>
      </div>
    );
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/assets/logo.png" alt="S&D" width={72} height={72} className="rounded-xl" />
          </div>
          <h1 className="font-display text-brand-900 text-3xl font-medium mb-2">
            Join S&D Prophetic School
          </h1>
          <p className="text-slate-500 text-sm">Tuition is completely free. Create your account below.</p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Full Name *</label>
              <input value={form.full_name} onChange={e => update("full_name", e.target.value)}
                placeholder="e.g. Oluwaseun Adeyemi" type="text"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.full_name ? "border-red-300" : "border-slate-200 focus:border-brand-400"}`} />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Email Address *</label>
              <input value={form.email} onChange={e => update("email", e.target.value)}
                placeholder="your@email.com" type="email"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.email ? "border-red-300" : "border-slate-200 focus:border-brand-400"}`} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Password *</label>
              <div className="relative">
                <input value={form.password} onChange={e => update("password", e.target.value)}
                  placeholder="Min 8 characters" type={showPw ? "text" : "password"}
                  className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-700 focus:outline-none transition-colors ${errors.password ? "border-red-300" : "border-slate-200 focus:border-brand-400"}`} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Phone Number *</label>
              <input value={form.phone} onChange={e => update("phone", e.target.value)}
                placeholder="+234 801 234 5678" type="tel"
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.phone ? "border-red-300" : "border-slate-200 focus:border-brand-400"}`} />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Church / Ministry *</label>
                <input value={form.church} onChange={e => update("church", e.target.value)}
                  placeholder="Your church" type="text"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.church ? "border-red-300" : "border-slate-200 focus:border-brand-400"}`} />
                {errors.church && <p className="text-red-400 text-xs mt-1">{errors.church}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">City *</label>
                <input value={form.city} onChange={e => update("city", e.target.value)}
                  placeholder="Lagos" type="text"
                  className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${errors.city ? "border-red-300" : "border-slate-200 focus:border-brand-400"}`} />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors mt-2">
              {loading ? "Creating your account..." : "Create Account & Join"}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-blue-50 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <a href="/auth/login" className="text-brand-600 font-medium hover:text-brand-800">Sign in</a>
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
