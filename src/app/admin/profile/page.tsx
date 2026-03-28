"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { BookOpen, Save, LogOut, Camera, Upload } from "lucide-react";

function AdminSidebar({ active }: { active: string }) {
  const router = useRouter();
  const links = [
    { href: "/admin/dashboard",         icon: "🏠", label: "Dashboard"    },
    { href: "/admin/applications",      icon: "📋", label: "Applications" },
    { href: "/admin/students",          icon: "👥", label: "Students"     },
    { href: "/admin/upload",            icon: "🎬", label: "Upload Video" },
    { href: "/admin/assignments",       icon: "📝", label: "Assignments"  },
    { href: "/admin/certificates",      icon: "🏅", label: "Certificates" },
    { href: "/admin/announcements/new", icon: "📢", label: "Announce"     },
    { href: "/admin/profile",           icon: "👤", label: "My Profile"   },
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="w-52 flex-shrink-0 hidden lg:block">
      <nav className="bg-gray-900 border border-gray-800 rounded-2xl p-3 sticky top-24">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
              active === l.label
                ? "bg-gray-800 text-white font-medium"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}>
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
        <div className="border-t border-gray-800 mt-2 pt-2">
          <button onClick={handleSignOut}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-red-400 hover:bg-red-950 w-full transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>
    </aside>
  );
}

export default function AdminProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId]         = useState("");
  const [fullName, setFullName]     = useState("");
  const [phone, setPhone]           = useState("");
  const [church, setChurch]         = useState("");
  const [city, setCity]             = useState("");
  const [email, setEmail]           = useState("");
  const [role, setRole]             = useState("");
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [pwNew, setPwNew]           = useState("");
  const [pwConfirm, setPwConfirm]   = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const initials = fullName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() || "AD";

  const roleLabel: Record<string, { label: string; cls: string }> = {
    super_admin: { label: "Super Admin", cls: "bg-amber-900/40 text-amber-300 border border-amber-700" },
    admin:       { label: "Admin",       cls: "bg-brand-900/40 text-brand-300 border border-brand-700" },
    instructor:  { label: "Instructor",  cls: "bg-green-900/40 text-green-300 border border-green-700" },
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) return;
      if (!["admin", "super_admin"].includes(p.role)) { router.push("/portal/dashboard"); return; }
      setFullName(p.full_name ?? "");
      setPhone(p.phone ?? "");
      setChurch(p.church ?? "");
      setCity(p.city ?? "");
      setRole(p.role ?? "admin");
      setAvatarUrl(p.avatar_url ?? null);
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
      await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", userId);
      setAvatarUrl(urlData.publicUrl);
      toast.success("Profile photo updated!");
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
      toast.success("Profile saved.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    if (pwNew !== pwConfirm) { toast.error("Passwords do not match."); return; }
    if (pwNew.length < 8) { toast.error("Minimum 8 characters."); return; }
    setChangingPw(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pwNew });
      if (error) throw error;
      toast.success("Password updated.");
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* NAV */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-white text-sm font-semibold">S&D Prophetic School</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest">Admin Control Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-brand-700 flex items-center justify-center flex-shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                : <span className="text-white text-xs font-bold">{initials}</span>
              }
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-950 border border-gray-700 hover:border-red-800 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <AdminSidebar active="My Profile" />

        <main className="flex-1 min-w-0 max-w-xl space-y-5">
          <div>
            <h1 className="font-display text-2xl text-white font-medium">My Profile</h1>
            <p className="text-gray-500 text-sm mt-1">Update your photo, name and password.</p>
          </div>

          {/* Photo + identity card */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-800 flex items-center justify-center border-2 border-gray-700">
                {avatarUrl
                  ? <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  : <span className="font-display text-2xl text-white font-bold">{initials}</span>
                }
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-500 border-2 border-gray-900 flex items-center justify-center transition-colors">
                <Camera className="w-3.5 h-3.5 text-white" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <h2 className="font-display text-white text-xl font-medium">{fullName || "Your Name"}</h2>
              <p className="text-gray-400 text-xs mt-1">{email}</p>
              <div className="mt-2">
                {role && roleLabel[role] && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${roleLabel[role].cls}`}>
                    {roleLabel[role].label}
                  </span>
                )}
              </div>
              {uploading && <p className="text-brand-400 text-xs mt-2 flex items-center gap-1"><Upload className="w-3 h-3" /> Uploading...</p>}
            </div>
          </div>

          {/* Upload photo button (mobile-friendly alternative) */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 border border-gray-700 hover:border-brand-600 text-gray-300 hover:text-white font-medium text-sm py-3 rounded-xl transition-colors">
            <Camera className="w-4 h-4" />
            {uploading ? "Uploading..." : "Change Profile Photo"}
          </button>

          {/* Personal info */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-display text-white text-lg font-medium mb-5">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Full Name</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Phone</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">City</label>
                  <input value={city} onChange={e => setCity(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Ministry / Church</label>
                <input value={church} onChange={e => setChurch(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Email Address</label>
                <input value={email} disabled
                  className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
                <p className="text-xs text-gray-600 mt-1">Email cannot be changed here.</p>
              </div>
              <button onClick={saveProfile} disabled={saving}
                className="w-full bg-brand-700 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="font-display text-white text-lg font-medium mb-5">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">New Password</label>
                <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors" />
              </div>
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Confirm New Password</label>
                <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors" />
                {pwConfirm && pwNew !== pwConfirm && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
              <button onClick={changePassword} disabled={changingPw || !pwNew || !pwConfirm}
                className="w-full border border-gray-700 hover:border-brand-600 text-gray-300 hover:text-white disabled:opacity-40 font-medium text-sm py-3 rounded-xl transition-colors">
                {changingPw ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>

          {/* Sign out */}
          <div className="bg-gray-900 border border-red-900/50 rounded-2xl p-5 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-300">Sign Out</div>
              <div className="text-xs text-gray-600 mt-0.5">End your admin session</div>
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-red-400 hover:text-red-300 font-medium text-sm border border-red-900 px-3 py-2 rounded-xl hover:bg-red-950 transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
