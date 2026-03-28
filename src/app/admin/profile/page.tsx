"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { Save, Camera, Upload } from "lucide-react";

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

  const initials = fullName.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() || "AD";

  const roleLabel: Record<string, { label: string; cls: string }> = {
    super_admin: { label: "Super Admin", cls: "bg-amber-900/40 text-amber-300 border border-amber-700" },
    admin:       { label: "Admin",       cls: "bg-brand-900/40 text-brand-300 border border-brand-700" },
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id); setEmail(user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) return;
      setFullName(p.full_name ?? ""); setPhone(p.phone ?? "");
      setChurch(p.church ?? ""); setCity(p.city ?? "");
      setRole(p.role ?? "admin"); setAvatarUrl(p.avatar_url ?? null);
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
      const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", userId);
      setAvatarUrl(data.publicUrl);
      toast.success("Photo updated!");
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("profiles").update({ full_name: fullName, phone, church, city }).eq("id", userId);
      toast.success("Profile saved.");
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
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
    } catch (err: any) { toast.error(err.message); }
    finally { setChangingPw(false); }
  }

  return (
    <AdminShell>
      <div className="max-w-xl space-y-5">
        <div>
          <h1 className="font-display text-2xl text-white font-medium">My Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Update your photo, name and password.</p>
        </div>

        {/* Photo card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex items-center gap-5">
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-800 border-2 border-gray-700 flex items-center justify-center">
              {avatarUrl
                ? <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                : <span className="font-display text-2xl text-white font-bold">{initials}</span>
              }
            </div>
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-600 hover:bg-brand-500 border-2 border-gray-900 flex items-center justify-center transition-colors">
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div>
            <h2 className="font-display text-white text-xl font-medium">{fullName || "Your Name"}</h2>
            <p className="text-gray-400 text-xs mt-1">{email}</p>
            {role && roleLabel[role] && (
              <span className={`inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full ${roleLabel[role].cls}`}>
                {roleLabel[role].label}
              </span>
            )}
            {uploading && <p className="text-brand-400 text-xs mt-1 flex items-center gap-1"><Upload className="w-3 h-3" /> Uploading...</p>}
          </div>
        </div>

        <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 border border-gray-700 hover:border-brand-600 text-gray-300 hover:text-white font-medium text-sm py-3 rounded-xl transition-colors">
          <Camera className="w-4 h-4" /> {uploading ? "Uploading..." : "Change Profile Photo"}
        </button>

        {/* Personal info */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-white text-lg font-medium">Personal Information</h2>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">City</label>
              <input value={city} onChange={e => setCity(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Ministry</label>
            <input value={church} onChange={e => setChurch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Email</label>
            <input value={email} disabled
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-500 cursor-not-allowed" />
          </div>
          <button onClick={saveProfile} disabled={saving}
            className="w-full bg-brand-700 hover:bg-brand-600 disabled:opacity-50 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Change password */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="font-display text-white text-lg font-medium">Change Password</h2>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">New Password</label>
            <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder="Min 8 characters"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-wide block mb-1.5">Confirm Password</label>
            <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder="Repeat"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500" />
            {pwConfirm && pwNew !== pwConfirm && <p className="text-red-400 text-xs mt-1">Passwords do not match</p>}
          </div>
          <button onClick={changePassword} disabled={changingPw || !pwNew || !pwConfirm}
            className="w-full border border-gray-700 hover:border-brand-600 text-gray-300 hover:text-white disabled:opacity-40 font-medium text-sm py-3 rounded-xl transition-colors">
            {changingPw ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
