"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import PortalShell from "@/components/portal/PortalShell";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Camera, Save, Upload } from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: "easeOut" as const } }
});

export default function ProfilePage() {
  const router    = useRouter();
  const fileRef   = useRef<HTMLInputElement>(null);
  const [userId, setUserId]       = useState("");
  const [fullName, setFullName]   = useState("");
  const [phone, setPhone]         = useState("");
  const [church, setChurch]       = useState("");
  const [city, setCity]           = useState("");
  const [email, setEmail]         = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pwNew, setPwNew]         = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  const initials = fullName.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() || "ST";

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

  const inp = "w-full bg-[#FAF9F6] border border-[#E8E2D9] rounded-xl px-4 py-3 text-sm text-[#1A1A2E] font-sans focus:outline-none focus:border-[#D4A85C]/50 transition-colors";

  return (
    <PortalShell>
      <div className="space-y-5 max-w-lg">
        <motion.div variants={rise()} initial="hidden" animate="visible">
          <h1 className="text-2xl font-semibold text-[#1A1A2E] mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            My Profile
          </h1>
          <p className="text-[#9B9B9B] text-sm font-sans">Update your photo, details and password</p>
        </motion.div>

        {/* Avatar card */}
        <motion.div variants={rise(0.1)} initial="hidden" animate="visible">
          <div className="bg-[#1A1A2E] rounded-2xl p-6 flex items-center gap-5"
            style={{ boxShadow: "0 8px 32px rgba(26,26,46,0.15)" }}>
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#2A2A4E] border-2 border-white/10 flex items-center justify-center">
                {avatarUrl
                  ? <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  : <span className="text-white text-lg font-bold" style={{ fontFamily: "'Georgia', serif" }}>{initials}</span>
                }
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#D4A85C] hover:bg-[#C49848] border-2 border-[#1A1A2E] flex items-center justify-center transition-colors">
                <Camera className="w-3 h-3 text-[#1A1A2E]" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <h2 className="text-white text-lg font-medium" style={{ fontFamily: "'Georgia', serif" }}>
                {fullName || "Your Name"}
              </h2>
              <p className="text-white/40 text-xs font-sans mt-0.5">{email}</p>
              {uploading && (
                <p className="text-[#D4A85C] text-xs font-sans mt-1 flex items-center gap-1">
                  <Upload className="w-3 h-3" /> Uploading...
                </p>
              )}
            </div>
          </div>
        </motion.div>

        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 bg-white border border-[#E8E2D9] hover:border-[#D4A85C]/40 text-[#6B6B6B] hover:text-[#1A1A2E] font-sans text-sm py-3 rounded-xl transition-all"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
          <Camera className="w-4 h-4" /> {uploading ? "Uploading..." : "Change Profile Photo"}
        </button>

        {/* Personal info */}
        <motion.div variants={rise(0.2)} initial="hidden" animate="visible">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 space-y-4"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <h2 className="text-[#1A1A2E] text-base font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
              Personal Information
            </h2>
            <div>
              <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block mb-2">Full Name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} className={inp} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block mb-2">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className={inp} />
              </div>
              <div>
                <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block mb-2">City</label>
                <input value={city} onChange={e => setCity(e.target.value)} className={inp} />
              </div>
            </div>
            <div>
              <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block mb-2">Church / Ministry</label>
              <input value={church} onChange={e => setChurch(e.target.value)} className={inp} />
            </div>
            <div>
              <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block mb-2">Email Address</label>
              <input value={email} disabled className={`${inp} opacity-50 cursor-not-allowed`} />
              <p className="text-[#C4BDB2] text-xs font-sans mt-1">Email cannot be changed. Contact admin if needed.</p>
            </div>
            <button onClick={saveProfile} disabled={saving}
              className="w-full bg-[#1A1A2E] hover:bg-[#2A2A4E] disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-all font-sans flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </motion.div>

        {/* Change password */}
        <motion.div variants={rise(0.3)} initial="hidden" animate="visible">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 space-y-4"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <h2 className="text-[#1A1A2E] text-base font-semibold" style={{ fontFamily: "'Georgia', serif" }}>
              Change Password
            </h2>
            <div>
              <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block mb-2">New Password</label>
              <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)}
                placeholder="Min 8 characters" className={inp} />
            </div>
            <div>
              <label className="text-[#9B9B9B] text-xs uppercase tracking-widest font-sans block mb-2">Confirm Password</label>
              <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)}
                placeholder="Repeat password" className={inp} />
              {pwConfirm && pwNew !== pwConfirm && (
                <p className="text-red-400 text-xs font-sans mt-1">Passwords do not match</p>
              )}
            </div>
            <button onClick={changePassword} disabled={changingPw || !pwNew || !pwConfirm}
              className="w-full border border-[#E8E2D9] hover:border-[#D4A85C]/40 text-[#6B6B6B] hover:text-[#1A1A2E] disabled:opacity-40 font-semibold text-sm py-3 rounded-xl transition-all font-sans">
              {changingPw ? "Updating..." : "Update Password"}
            </button>
          </div>
        </motion.div>
      </div>
    </PortalShell>
  );
}
