"use client";
export const dynamic = "force-dynamic";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle, ArrowRight, Loader2 } from "lucide-react";

interface FormState {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  church: string;
  city: string;
}

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [form, setForm] = useState<FormState>({
    full_name: "", email: "", password: "",
    phone: "", church: "", city: "",
  });

  function update(field: keyof FormState, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => ({ ...e, [field]: "" }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (form.full_name.trim().length < 3)
      e.full_name = "Full name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
      e.email = "Enter a valid email address";
    if (form.password.length < 8)
      e.password = "Password must be at least 8 characters";
    if (form.phone.trim().length < 7)
      e.phone = "Enter a valid phone number";
    if (form.church.trim().length < 2)
      e.church = "Church / ministry name is required";
    if (form.city.trim().length < 2)
      e.city = "City is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const supabase = createClient();

      // Step 1 — Create Supabase auth account
      // Email confirmation is OFF so user can log in immediately
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          data: { full_name: form.full_name.trim() },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered") ||
            authError.message.includes("User already registered")) {
          setErrors({ email: "This email is already registered. Sign in instead." });
          return;
        }
        throw new Error(authError.message);
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to create account. Please try again.");

      // Step 2 — Save profile details
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name:         form.full_name.trim(),
          phone:             form.phone.trim(),
          church:            form.church.trim(),
          city:              form.city.trim(),
          role:              "student",
          enrollment_status: "active",
          current_year:      1,
        })
        .eq("id", userId);

      if (profileError) console.error("Profile update error:", profileError);

      // Step 3 — Enroll in all Year 1 courses
      const { data: courses } = await supabase
        .from("courses")
        .select("id")
        .eq("year", 1);

      if (courses && courses.length > 0) {
        const { error: enrollError } = await supabase
          .from("enrollments")
          .insert(courses.map((c: { id: string }) => ({
            student_id: userId,
            course_id:  c.id,
            status:     "active",
          })));
        if (enrollError) console.error("Enrollment error:", enrollError);
      }

      // Step 4 — Send branded welcome email via Resend
      const emailRes = await fetch("/api/auth/send-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:  form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
        }),
      });

      if (!emailRes.ok) {
        const emailErr = await emailRes.json();
        console.error("Welcome email failed:", emailErr);
        // Don't block the user — account is created successfully
      }

      // Step 5 — Show success
      setRegisteredEmail(form.email.trim().toLowerCase());
      setStep("success");

    } catch (err: any) {
      console.error("Signup error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="min-h-screen bg-[#F0F4FF]">
        <Navbar />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-10">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-display text-brand-900 text-2xl font-semibold mb-2">
              You&apos;re In! Welcome 🎉
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              A welcome message from Prophet Abiodun Sule has been sent to{" "}
              <span className="font-semibold text-brand-700">{registeredEmail}</span>.
              Check your inbox — and your spam folder just in case.
            </p>

            <div className="space-y-2 mb-8 text-left">
              {[
                "Account created successfully",
                "Enrolled in all Year 1 courses",
                "Welcome email sent from Prophet Sule",
              ].map(item => (
                <div key={item} className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/auth/login")}
              className="w-full bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2">
              Sign In to Your Portal <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-slate-400 text-xs mt-3">
              Use your email and the password you just created.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  const inputClass = (field: keyof FormState) =>
    `w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none transition-colors ${
      errors[field]
        ? "border-red-300 bg-red-50 focus:border-red-400"
        : "border-slate-200 focus:border-brand-400"
    }`;

  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/assets/logo.png" alt="S&D Logo"
            width={72} height={72}
            className="rounded-2xl mx-auto mb-4 shadow-sm"
          />
          <h1 className="font-display text-brand-900 text-3xl font-semibold">
            Join the School
          </h1>
          <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
            Create your free account and start your prophetic training journey today.
          </p>
          <div className="inline-flex items-center gap-2 mt-3 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1.5 rounded-full">
            <CheckCircle className="w-3.5 h-3.5" />
            Tuition is completely free — no credit card required
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6 sm:p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => update("full_name", e.target.value)}
                placeholder="e.g. Oluwaseun Adeyemi"
                className={inputClass("full_name")}
                disabled={loading}
              />
              {errors.full_name && (
                <p className="text-red-400 text-xs mt-1">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => update("email", e.target.value)}
                placeholder="your@email.com"
                className={inputClass("email")}
                disabled={loading}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                  placeholder="Min 8 characters"
                  className={`${inputClass("password")} pr-10`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Phone Number *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update("phone", e.target.value)}
                placeholder="+234 801 234 5678"
                className={inputClass("phone")}
                disabled={loading}
              />
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Church + City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                  Church / Ministry *
                </label>
                <input
                  type="text"
                  value={form.church}
                  onChange={e => update("church", e.target.value)}
                  placeholder="Your church"
                  className={inputClass("church")}
                  disabled={loading}
                />
                {errors.church && (
                  <p className="text-red-400 text-xs mt-1">{errors.church}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={e => update("city", e.target.value)}
                  placeholder="Lagos"
                  className={inputClass("city")}
                  disabled={loading}
                />
                {errors.city && (
                  <p className="text-red-400 text-xs mt-1">{errors.city}</p>
                )}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating your account...</>
              ) : (
                "Create Account & Join — Free"
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-blue-50 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-brand-600 font-medium hover:text-brand-800">
                Sign in
              </Link>
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
