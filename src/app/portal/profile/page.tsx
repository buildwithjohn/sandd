"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, Bell, Save, LogOut, Camera } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

function PortalSidebar({ active, onSignOut }: { active: string; onSignOut: () => void }) {
  const links = [
    { href: "/portal/dashboard",     icon: "🏠", label: "Dashboard"     },
    { href: "/portal/courses",       icon: "📚", label: "My Courses"    },
    { href: "/portal/assignments",   icon: "📝", label: "Assignments"   },
    { href: "/portal/announcements", icon: "📢", label: "Announcements" },
    { href: "/portal/profile",       icon: "👤", label: "Profile"       },
  ];
  return (
    <aside className="w-56 flex-shrink-0 hidden lg:block">
      <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-card sticky top-24">
        <div className="flex items-center gap-2.5 px-2 pb-4 mb-2 border-b border-blue-50">
          <div className="w-8 h-8 rounded-lg bg-brand-700 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-display text-brand-900 text-sm font-medium">S&D School</span>
        </div>
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-2.5 px-2 py-2.5 rounded-lg text-sm transition-colors ${
              active === l.label ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}>
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
        <div className="border-t border-blue-50 mt-3 pt-3">
          <button onClick={onSignOut}
            className="flex items-center gap-2 px-2 py-2 text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName]     = useState("");
  const [phone, setPhone]           = useState("");
  const [church, setChurch]         = useState("");
  const [city, setCity]             = useState("");
  const [email, setEmail]           = useState("");
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [initials, setInitials]     = useState("ST");
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [pwNew, setPwNew]           = useState("");
  const [pwConfirm, setPwConfirm]   = useState("");
  const [changingPw, setChangingPw] = useState(false);
  const [userId, setUserId]         = useState("");
  const [role, setRole]             = useState("student");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) return;
      setFullName(p.full_name ?? "");
      setPhone(p.phone ?? "");
      setChurch(p.church ?? "");
      setCity(p.city ?? "");
      setEmail(user.email ?? "");
      setAvatarUrl(p.avatar_url ?? null);
      setRole(p.role ?? "student");
      setInitials((p.full_name ?? "ST").split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase());
    }
    load();
  }, []);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Photo must be under 2MB"); return; }
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `avatars/${userId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = urlData.publicUrl;
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", userId);
      setAvatarUrl(url);
      toast.success("Photo updated!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from("profiles")
        .update({ full_name: fullName, phone, church, city })
        .eq("id", userId);
      if (error) throw error;
      setInitials(fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase());
      toast.success("Profile updated.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (pwNew !== pwConfirm) { toast.error("Passwords do not match."); return; }
    if (pwNew.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setChangingPw(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw error;
      toast.success("Password changed successfully.");
      setPwNew(""); setPwConfirm("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setChangingPw(false);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const roleLabel: Record<string, string> = {
    student: "Year 1 Student",
    admin: "Admin",
    super_admin: "Super Admin",
    instructor: "Instructor",
    mentor: "Mentor",
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF]">
      <nav className="bg-white border-b border-blue-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-700 flex items-center justify-center">
              <BookOpen className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display text-brand-900 text-sm font-semibold">S&D Student Portal</span>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-700 flex items-center justify-center text-white font-medium text-xs">
            {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : initials}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <PortalSidebar active="Profile" onSignOut={handleSignOut} />

        <main className="flex-1 min-w-0 max-w-xl space-y-5">
          <h1 className="font-display text-brand-900 text-2xl font-medium">My Profile</h1>

          {/* Avatar card */}
          <div className="bg-brand-950 rounded-2xl p-6 flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-700 flex items-center justify-center">
                {avatarUrl
                  ? <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  : <span className="font-display text-2xl text-white font-bold">{initials}</span>
                }
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-500 border-2 border-brand-950 flex items-center justify-center hover:bg-brand-400 transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <h2 className="font-display text-white text-xl font-medium">{fullName || "Your Name"}</h2>
              <p className="text-brand-400 text-xs mt-0.5">{roleLabel[role] ?? role} · {church}</p>
              <p className="text-brand-500 text-xs mt-0.5">{email}</p>
              {uploading && <p className="text-brand-300 text-xs mt-1">Uploading photo...</p>}
            </div>
          </div>

          {/* Personal info */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6">
            <h2 className="font-display text-brand-900 text-lg font-medium mb-5">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">City</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Church / Ministry</label>
                <input value={church} onChange={e => setChurch(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Email Address</label>
                <input value={email} disabled
                  className="w-full border border-slate-100 rounded-xl px-3.5 py-2.5 text-sm text-slate-400 bg-slate-50 cursor-not-allowed" />
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
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Confirm New Password</label>
                <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors" />
                {pwConfirm && pwNew !== pwConfirm && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
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
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-700 font-medium text-sm border border-red-200 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
