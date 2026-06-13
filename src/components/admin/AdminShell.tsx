"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  LogOut, LayoutDashboard, Users, Upload, FileText,
  Award, Megaphone, UserCircle, ClipboardList, Menu, X, BookOpen, Star
, Eye
} from "lucide-react";

const navLinks = [
  { href: "/admin/dashboard",     icon: LayoutDashboard, label: "Dashboard"     },
  { href: "/admin/courses",       icon: BookOpen,        label: "Course Manager"},

  { href: "/admin/applications",  icon: ClipboardList,   label: "Applications"  },
  { href: "/admin/students",      icon: Users,           label: "Students"      },
  { href: "/admin/upload",        icon: Upload,          label: "Course Builder"},
  { href: "/admin/assignments",   icon: FileText,        label: "Assignments"   },
  { href: "/admin/assessments",     icon: Star,           label: "Assessments"   },

  { href: "/admin/announcements", icon: Megaphone,       label: "Announcements" },
  { href: "/admin/certificates",  icon: Award,           label: "Certificates"  },
  { href: "/admin/profile",       icon: UserCircle,      label: "My Profile"    },
];

const bottomNav = [
  { href: "/admin/dashboard",     icon: LayoutDashboard, label: "Home"      },
  { href: "/admin/courses",       icon: BookOpen,        label: "Courses"   },
  { href: "/admin/students",      icon: Users,           label: "Students"  },
  { href: "/admin/upload",        icon: Upload,          label: "Builder"   },
  { href: "/admin/assignments",   icon: FileText,        label: "Grades"    },
  { href: "/admin/announcements", icon: Megaphone,       label: "Announce"  },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [adminName, setAdminName]   = useState("Admin");
  const [adminRole, setAdminRole]   = useState("admin");
  const [avatarUrl, setAvatarUrl]   = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const initials = adminName.slice(0, 2).toUpperCase();
  const isSuperAdmin = adminRole === "super_admin";

  return (
    <div className="min-h-screen bg-[#080C14] text-white" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* ── TOP NAV ─────────────────────────────────────── */}
      <nav className="bg-[#0D1320] border-b border-white/[0.07] sticky top-0 z-50"
        style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* Hamburger — mobile only */}
          <button onClick={() => setDrawerOpen(v => !v)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/60 hover:bg-white/[0.06] transition-colors flex-shrink-0">
            {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand */}
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <Image src="/assets/logo.png" alt="S&D" width={30} height={30} className="rounded-lg flex-shrink-0" />
            <div className="hidden sm:block">
              <div className="text-white text-sm font-semibold leading-none" style={{ fontFamily: "'Georgia', serif" }}>
                S&D Prophetic School
              </div>
              <div className="text-[#D4A85C] text-[9px] tracking-[0.2em] uppercase mt-0.5">Admin Panel</div>
            </div>
          </Link>

          {/* View as Student */}
          <Link href="/portal/dashboard"
            className="hidden sm:flex items-center gap-1.5 bg-[#D4A85C]/10 hover:bg-[#D4A85C]/20 border border-[#D4A85C]/30 text-[#D4A85C] rounded-xl px-3 py-1.5 mr-2 transition-all">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold font-sans">View as Student</span>
          </Link>

          {/* Right — user pill */}
          <Link href="/admin/profile"
            className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl px-3 py-1.5 transition-all">
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
              }`}>{isSuperAdmin ? "Super Admin" : "Admin"}</span>
            </div>
          </Link>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute top-14 left-0 bottom-0 w-72 bg-[#0D1320] border-r border-white/[0.07] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Admin profile */}
            <div className="px-5 py-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#1A1A2E] flex items-center justify-center flex-shrink-0 border border-white/10">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={adminName} className="w-full h-full object-cover" />
                    : <span className="text-white text-sm font-bold">{initials}</span>
                  }
                </div>
                <div>
                  <div className="text-white text-sm font-semibold" style={{ fontFamily: "'Georgia', serif" }}>{adminName}</div>
                  <div className={`text-xs mt-0.5 ${isSuperAdmin ? "text-[#D4A85C]" : "text-white/40"}`}>
                    {isSuperAdmin ? "Super Admin" : "Admin"}
                  </div>
                </div>
              </div>
            </div>

            {/* View as Student button in mobile drawer */}
            <Link href="/portal/dashboard" onClick={() => setDrawerOpen(false)}
              className="mx-3 mt-3 mb-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/30 text-[#D4A85C] hover:bg-[#D4A85C]/20 transition-all">
              <Eye className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold">View as Student</div>
                <div className="text-[10px] opacity-70">Experience the student portal</div>
              </div>
            </Link>

            {/* Nav links */}
            <div className="px-3 py-3">
              {navLinks.map(l => {
                const active = pathname === l.href || (l.href !== "/admin/dashboard" && pathname.startsWith(l.href));
                return (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1 transition-all ${
                      active
                        ? "bg-[#D4A85C]/10 border border-[#D4A85C]/20 text-[#D4A85C]"
                        : "text-white/50 hover:bg-white/[0.04] hover:text-white"
                    }`}>
                    <l.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{l.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="px-3 pb-6 border-t border-white/[0.07] pt-3">
              <button onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/8 w-full transition-all">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LAYOUT ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 lg:py-8 flex gap-8 pb-24 lg:pb-8">

        {/* Desktop Sidebar */}
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-2">
            <div className="bg-[#0D1320] rounded-2xl border border-white/[0.07] p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1A1A2E] flex items-center justify-center flex-shrink-0 border border-white/10">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={adminName} className="w-full h-full object-cover" />
                    : <span className="text-white text-sm font-bold">{initials}</span>
                  }
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-medium truncate" style={{ fontFamily: "'Georgia', serif" }}>{adminName}</div>
                  <div className={`text-[10px] mt-0.5 ${isSuperAdmin ? "text-[#D4A85C]" : "text-white/35"}`}>
                    {isSuperAdmin ? "Super Admin" : "Admin"}
                  </div>
                </div>
              </div>
            </div>

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

      {/* ── MOBILE BOTTOM NAV ────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D1320] border-t border-white/[0.07]"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.4)" }}>
        <div className="flex items-center justify-around px-2 py-1">
          {bottomNav.map(l => {
            const active = pathname === l.href || (l.href !== "/admin/dashboard" && pathname.startsWith(l.href));
            return (
              <Link key={l.href} href={l.href}
                className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-0 flex-1">
                <l.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#D4A85C]" : "text-white/30"}`} />
                <span className={`text-[10px] font-medium ${active ? "text-[#D4A85C]" : "text-white/30"}`}>{l.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-[#D4A85C]" />}
              </Link>
            );
          })}
          <button onClick={() => setDrawerOpen(v => !v)}
            className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-0 flex-1">
            <Menu className="w-5 h-5 text-white/30" />
            <span className="text-[10px] font-medium text-white/30">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
