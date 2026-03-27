"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { BookOpen, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [validSession, setValid]  = useState(false);

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValid(!!session);
    });
  }, []);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords do not match."); return; }
    if (password.length < 8)  { toast.error("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setTimeout(() => router.push("/portal/dashboard"), 2500);
    } catch (err: any) {
      toast.error(err.message || "Password reset failed.");
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
        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <h1 className="font-display text-brand-900 text-xl font-medium mb-2">Password updated</h1>
            <p className="text-slate-400 text-sm">Redirecting you to your dashboard...</p>
          </div>
        ) : !validSession ? (
          <div className="text-center">
            <h1 className="font-display text-brand-900 text-xl font-medium mb-2">Link expired</h1>
            <p className="text-slate-400 text-sm mb-5">
              This reset link has expired or is invalid. Please request a new one.
            </p>
            <Link href="/auth/forgot-password"
              className="bg-brand-700 text-white font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-brand-800 transition-colors inline-block">
              Request New Link
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display text-brand-900 text-2xl font-medium mb-1">Set new password</h1>
            <p className="text-slate-400 text-sm mb-6">Choose a strong password for your account.</p>
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
                {confirm && password !== confirm && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || password !== confirm || password.length < 8}
                className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors"
              >
                {loading ? "Updating..." : "Set New Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
