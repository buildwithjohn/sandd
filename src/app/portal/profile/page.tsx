"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import { BookOpen, Bell, Save, LogOut, Camera } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

function PortalSidebar({ active }: { active: string }) {
  const links = [
    { href: "/portal/dashboard",     icon: "🏠", label: "Dashboard" },
    { href: "/portal/courses",       icon: "📚", label: "My Courses" },
    { href: "/portal/assignments",   icon: "📝", label: "Assignments" },
    { href: "/portal/announcements", icon: "📢", label: "Announcements" },
    { href: "/portal/profile",       icon: "👤", label: "Profile" },
  ];
  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-4 sticky top-24">
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-2 border-b border-blue-50">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-brand-900 text-sm font-medium">S&D School</span>
        </div>
        {links.map((l) => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
              active === l.label ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}>
            <span className="text-base">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </aside>
  );
}

export default function ProfilePage() {
  const { profile, signOut } = useAuth();

  // Fallback mock for dev (when auth context not hydrated)
  const [fullName, setFullName]   = useState(profile?.full_name ?? "Adeyemi Ogunlade");
  const [phone, setPhone]         = useState(profile?.phone ?? "+234 801 234 5678");
  const [church, setChurch]       = useState(profile?.church ?? "CCC Lagos");
  const [city, setCity]           = useState(profile?.city ?? "Lagos");
  const [saving, setSaving]       = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew]         = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const initials = fullName.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase();

  async function saveProfile() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("profiles")
        .update({ full_name: fullName, phone, church, city })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (pwNew !== pwConfirm) { toast.error("New passwords do not match."); return; }
    if (pwNew.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setChangingPw(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw error;
      toast.success("Password changed successfully.");
      setPwCurrent(""); setPwNew(""); setPwConfirm("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPw(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-700 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-brand-900 text-sm font-semibold">S&D Student Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg border border-blue-100 flex items-center justify-center text-slate-400">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center text-white font-medium text-xs">
              {initials}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <PortalSidebar active="Profile" />

        <main className="flex-1 min-w-0 max-w-xl space-y-5">
          <h1 className="font-display text-brand-900 text-2xl font-medium">My Profile</h1>

          {/* Avatar + name card */}
          <div className="bg-brand-950 rounded-2xl p-6 flex items-center gap-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-brand-700 flex items-center justify-center font-display text-2xl text-white font-bold">
                {initials}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-brand-500 border-2 border-brand-950 flex items-center justify-center">
                <Camera className="w-3 h-3 text-white" />
              </button>
            </div>
            <div>
              <h2 className="font-display text-white text-xl font-medium">{fullName}</h2>
              <p className="text-brand-400 text-xs mt-0.5">Year 1 Student · {church}</p>
              <p className="text-brand-500 text-xs mt-0.5">{profile?.email ?? "student@email.com"}</p>
            </div>
          </div>

          {/* Personal info form */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6">
            <h2 className="font-display text-brand-900 text-lg font-medium mb-5">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">City</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Church / Parish</label>
                <input value={church} onChange={e => setChurch(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Email Address</label>
                <input value={profile?.email ?? "student@email.com"} disabled
                  className="w-full border border-slate-100 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed. Contact admin if needed.</p>
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6">
            <h2 className="font-display text-brand-900 text-lg font-medium mb-5">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">New Password</label>
                <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Confirm New Password</label>
                <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
              </div>
              <button onClick={changePassword} disabled={changingPw || !pwNew || !pwConfirm}
                className="w-full border border-brand-200 text-brand-700 hover:bg-brand-50 disabled:opacity-50 font-medium text-sm py-3 rounded-xl transition-colors">
                {changingPw ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* Sign out */}
          <div className="bg-white rounded-2xl border border-red-100 shadow-card p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-700">Sign Out</div>
              <div className="text-xs text-slate-400 mt-0.5">You will be returned to the home page</div>
            </div>
            <button onClick={signOut}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-medium text-sm border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
