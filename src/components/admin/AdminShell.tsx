"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LogOut, LayoutDashboard, Users, Upload, FileText, Award, Megaphone, UserCircle, ClipboardList } from "lucide-react";

const navLinks = [
  { href: "/admin/dashboard",     icon: LayoutDashboard, label: "Dashboard"     },
  { href: "/admin/applications",  icon: ClipboardList,   label: "Applications"  },
  { href: "/admin/students",      icon: Users,           label: "Students"      },
  { href: "/admin/upload",        icon: Upload,          label: "Upload Video"  },
  { href: "/admin/assignments",   icon: FileText,        label: "Assignments"   },
  { href: "/admin/announcements", icon: Megaphone,       label: "Announcements" },
  { href: "/admin/certificates",  icon: Award,           label: "Certificates"  },
  { href: "/admin/profile",       icon: UserCircle,      label: "My Profile"    },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [adminRole, setAdminRole] = useState("admin");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("full_name, role, avatar_url").eq("id", user.id).single();
      if (!profile || !["admin","super_admin"].includes(profile.role)) {
        router.push("/portal/dashboard"); return;
      }
      setAdminName(profile.full_name?.split(" ")[0] ?? "Admin");
      setAdminRole(profile.role);
      setAvatarUrl(profile.avatar_url ?? null);
    }
    load();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const initials  = adminName.slice(0, 2).toUpperCase();
  const isSuperAdmin = adminRole === "super_admin";

  return (
    <div className="min-h-screen bg-[#080C14] text-white" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* ── TOP NAV ─────────────────────────────────────────────────── */}
      <nav className="bg-[#0D1320] border-b border-white/[0.07] sticky top-0 z-50"
        style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D" width={32} height={32} className="rounded-lg" />
            <div className="hidden sm:block">
              <div className="text-white text-sm font-semibold leading-none" style={{ fontFamily: "'Georgia', serif" }}>
                S&D Prophetic School
              </div>
              <div className="text-[#D4A85C] text-[9px] tracking-[0.2em] uppercase mt-0.5 font-sans">
                Admin Control Panel
              </div>
            </div>
          </Link>

          {/* Right — user pill + sign out */}
          <div className="flex items-center gap-3">
            <Link href="/admin/profile"
              className="flex items-center gap-2.5 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-1.5 transition-all group">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt={adminName} className="w-full h-full object-cover" />
                  : <span className="text-white text-[9px] font-bold">{initials}</span>
                }
              </div>
              <div className="hidden sm:block">
                <span className="text-white/80 text-xs font-medium">{adminName}</span>
                <span className={`ml-2 text-[9px] px-1.5 py-0.5 rounded-full font-sans ${
                  isSuperAdmin
                    ? "bg-[#D4A85C]/15 text-[#D4A85C] border border-[#D4A85C]/25"
                    : "bg-white/8 text-white/40 border border-white/10"
                }`}>
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </span>
              </div>
            </Link>
            <button onClick={handleSignOut}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── LAYOUT ──────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">

        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-1">

            {/* Admin card */}
            <div className="bg-[#0D1320] rounded-2xl border border-white/[0.07] p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1A1A2E] flex items-center justify-center flex-shrink-0 border border-white/10">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={adminName} className="w-full h-full object-cover" />
                    : <span className="text-white text-sm font-bold">{initials}</span>
                  }
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate" style={{ fontFamily: "'Georgia', serif" }}>
                    {adminName}
                  </div>
                  <div className={`text-[10px] mt-0.5 font-sans ${isSuperAdmin ? "text-[#D4A85C]" : "text-white/35"}`}>
                    {isSuperAdmin ? "Super Admin" : "Admin"}
                  </div>
                </div>
              </div>
            </div>

            {/* Nav */}
            <div className="bg-[#0D1320] rounded-2xl border border-white/[0.07] p-2">
              {navLinks.map(l => {
                const active = pathname === l.href || (l.href !== "/admin/dashboard" && pathname.startsWith(l.href));
                return (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? "bg-[#D4A85C]/10 text-[#D4A85C] border border-[#D4A85C]/15 font-medium"
                        : "text-white/40 hover:bg-white/[0.04] hover:text-white"
                    }`}>
                    <l.icon className="w-4 h-4 flex-shrink-0" />
                    {l.label}
                  </Link>
                );
              })}
              <div className="border-t border-white/[0.06] mt-2 pt-2">
                <button onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-white/25 hover:text-red-400 hover:bg-red-400/8 w-full transition-all">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
