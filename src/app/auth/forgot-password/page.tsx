"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { BookOpen, ArrowLeft, CheckCircle } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center px-4">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-display text-brand-900 text-base font-semibold">S&D Prophetic School</div>
          <div className="text-[10px] text-brand-400 tracking-wide uppercase">Student Portal</div>
        </div>
      </Link>

      <div className="bg-white rounded-2xl border border-blue-100 shadow-card w-full max-w-sm p-7">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <h1 className="font-display text-brand-900 text-xl font-medium mb-2">Check your email</h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              We sent a password reset link to <strong className="text-brand-900">{email}</strong>.
              Check your inbox and follow the link to reset your password.
            </p>
            <Link href="/auth/login"
              className="text-brand-600 text-sm font-medium hover:text-brand-800 flex items-center justify-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
          </div>
        ) : (
          <>
            <Link href="/auth/login"
              className="flex items-center gap-1 text-slate-400 hover:text-brand-600 text-sm mb-5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </Link>
            <h1 className="font-display text-brand-900 text-2xl font-medium mb-1">Reset your password</h1>
            <p className="text-slate-400 text-sm mb-6">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors"
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
