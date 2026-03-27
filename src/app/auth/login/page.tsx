"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { BookOpen, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/portal/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-display text-brand-900 text-base font-semibold">S&D Prophetic School</div>
          <div className="text-[10px] text-brand-400 tracking-wide uppercase">Student Portal</div>
        </div>
      </Link>

      {/* Card */}
      <div className="bg-white rounded-2xl border border-blue-100 shadow-card w-full max-w-sm p-7">
        <h1 className="font-display text-brand-900 text-2xl font-medium mb-1">Welcome back</h1>
        <p className="text-slate-400 text-sm mb-6">Sign in to access your courses and progress.</p>

        <form onSubmit={handleLogin} className="space-y-4">
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

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Password</label>
              <Link href="/auth/forgot-password" className="text-xs text-brand-500 hover:text-brand-700">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors mt-2"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-blue-50 text-center">
          <p className="text-slate-400 text-sm">
            New student?{" "}
            <Link href="/apply" className="text-brand-600 font-medium hover:text-brand-800">
              Apply here
            </Link>
          </p>
          <p className="text-slate-300 text-xs mt-2">
            Your account is created when your application is accepted.
          </p>
        </div>
      </div>

      {/* Admin link */}
      <p className="mt-5 text-xs text-slate-400">
        Admin?{" "}
        <Link href="/auth/login?next=/admin/dashboard" className="text-brand-500 hover:text-brand-700">
          Sign in to admin panel
        </Link>
      </p>
    </div>
  );
}
