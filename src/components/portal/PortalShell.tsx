"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import {
  LogOut, LayoutDashboard, BookOpen, FileText,
  Megaphone, User, Award, FolderOpen, Menu, X, Star
} from "lucide-react";

const navLinks = [
  { href: "/portal/dashboard",     icon: LayoutDashboard, label: "Dashboard"       },
  { href: "/portal/courses",       icon: BookOpen,        label: "My Courses"      },
  { href: "/portal/assignments",   icon: FileText,        label: "Assignments"     },
  { href: "/portal/announcements", icon: Megaphone,       label: "Announcements"   },
  { href: "/portal/admission",     icon: Award,           label: "Admission"       },
  { href: "/portal/assessments",   icon: Star,            label: "Assessments"     },
  { href: "/portal/documents",     icon: FolderOpen,      label: "Documents"       },
  { href: "/portal/profile",       icon: User,            label: "Profile"         },
];

// Bottom nav shows only the most important 5 on mobile
const bottomNav = [
  { href: "/portal/dashboard",     icon: LayoutDashboard, label: "Home"     },
  { href: "/portal/courses",       icon: BookOpen,        label: "Courses"  },
  { href: "/portal/assignments",   icon: FileText,        label: "Tasks"    },
  { href: "/portal/announcements", icon: Megaphone,       label: "Updates"  },
  { href: "/portal/profile",       icon: User,            label: "Profile"  },
];

interface Profile {
  name: string; initials: string; church: string; year: number; avatarUrl: string | null;
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [profile, setProfile] = useState<Profile>({ name: "Student", initials: "ST", church: "", year: 1, avatarUrl: null });
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: p } = await supabase.from("profiles")
        .select("full_name, church, current_year, avatar_url, role").eq("id", user.id).single();
      if (!p) return;
      if (p.role === "admin" || p.role === "super_admin") { router.push("/admin/dashboard"); return; }
      const name = p.full_name ?? "Student";
      setProfile({
        name, initials: name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase(),
        church: p.church ?? "", year: p.current_year ?? 1, avatarUrl: p.avatar_url ?? null,
      });
    }
    load();
  }, []);

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  const Avatar = ({ size = 8 }: { size?: number }) => (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden bg-[#1A1A2E] flex items-center justify-center flex-shrink-0`}>
      {profile.avatarUrl
        ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
        : <span className="text-white text-[10px] font-bold">{profile.initials}</span>
      }
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* ── TOP NAV ─────────────────────────────────────── */}
      <nav className="bg-white border-b border-[#E8E2D9] sticky top-0 z-50"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">

          {/* Hamburger — mobile only */}
          <button onClick={() => setDrawerOpen(v => !v)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[#1A1A2E] hover:bg-[#F5F0E8] transition-colors flex-shrink-0">
            {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand */}
          <Link href="/portal/dashboard" className="flex items-center gap-2">
            <Image src="/assets/logo.png" alt="S&D" width={30} height={30} className="rounded-lg flex-shrink-0" />
            <div className="hidden sm:block">
              <div className="text-[#1A1A2E] text-sm font-semibold leading-none" style={{ fontFamily: "'Georgia', serif" }}>
                S&D Prophetic School
              </div>
              <div className="text-[9px] text-[#8B7355] mt-0.5 tracking-wide uppercase">Student Portal</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {navLinks.map(l => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active ? "bg-[#1A1A2E] text-white" : "text-[#6B6B6B] hover:text-[#1A1A2E] hover:bg-[#F0EDE8]"
                  }`}>
                  <l.icon className="w-3.5 h-3.5" />
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Avatar */}
          <Link href="/portal/profile" className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1A1A2E] flex items-center justify-center border-2 border-transparent hover:border-[#D4A85C] transition-all">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                : <span className="text-white text-[10px] font-bold">{profile.initials}</span>
              }
            </div>
          </Link>
        </div>
      </nav>

      {/* ── MOBILE DRAWER ────────────────────────────────── */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="absolute top-14 left-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Profile section */}
            <div className="bg-[#1A1A2E] px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#2A2A4E] flex items-center justify-center flex-shrink-0">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    : <span className="text-white text-sm font-bold">{profile.initials}</span>
                  }
                </div>
                <div>
                  <div className="text-white text-sm font-semibold" style={{ fontFamily: "'Georgia', serif" }}>{profile.name}</div>
                  <div className="text-[#D4A85C] text-xs mt-0.5">{profile.church || "Student"}</div>
                  <div className="text-white/40 text-[10px] mt-0.5">Year {profile.year}</div>
                </div>
              </div>
            </div>

            {/* Nav links */}
            <div className="px-3 py-3">
              {navLinks.map(l => {
                const active = pathname === l.href;
                return (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl mb-1 transition-all ${
                      active
                        ? "bg-[#1A1A2E] text-white"
                        : "text-[#444] hover:bg-[#F5F0E8]"
                    }`}>
                    <l.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#D4A85C]" : "text-[#8B7355]"}`} />
                    <span className="text-sm font-medium">{l.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Registrar + sign out */}
            <div className="px-3 pb-6 border-t border-[#E8E2D9] mt-2 pt-4">
              <div className="bg-[#F5F0E8] rounded-xl p-3 mb-3">
                <div className="text-[#9B9B9B] text-[10px] uppercase tracking-widest mb-2">School Administration</div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-[#E8E2D9]">
                    <Image src="/assets/registrar.jpg" alt="Registrar" width={32} height={32} className="w-full h-full object-cover object-top" />
                  </div>
                  <div>
                    <div className="text-[#1A1A2E] text-xs font-semibold">John Ayomide Akinola</div>
                    <div className="text-[#9B9B9B] text-[10px]">Registrar</div>
                  </div>
                </div>
                <a href="mailto:sandd@abiodunsule.uk"
                  className="block text-center text-[#8B7355] text-xs bg-white rounded-lg py-2 border border-[#E8E2D9]">
                  Contact Registrar
                </a>
              </div>
              <button onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition-all">
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LAYOUT ───────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 lg:py-8 flex gap-8 pb-24 lg:pb-8">

        {/* Desktop Sidebar */}
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <div className="sticky top-20 space-y-2">
            {/* Student card */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    : <span className="text-white text-xs font-bold">{profile.initials}</span>
                  }
                </div>
                <div className="min-w-0">
                  <div className="text-[#1A1A2E] text-sm font-semibold truncate" style={{ fontFamily: "'Georgia', serif" }}>
                    {profile.name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] text-[#8B7355] mt-0.5">{profile.church || "Student"}</div>
                </div>
              </div>
              <div className="bg-[#F5F0E8] rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[#8B7355] text-[10px] uppercase tracking-wide">Year</span>
                <span className="text-[#1A1A2E] text-xs font-bold">Year {profile.year}</span>
              </div>
            </div>

            {/* Nav */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-2"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {navLinks.map(l => {
                const active = pathname === l.href;
                return (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active ? "bg-[#1A1A2E] text-white font-medium" : "text-[#6B6B6B] hover:bg-[#F5F0E8] hover:text-[#1A1A2E]"
                    }`}>
                    <l.icon className={`w-4 h-4 ${active ? "text-[#D4A85C]" : ""}`} />
                    {l.label}
                  </Link>
                );
              })}
              <div className="border-t border-[#E8E2D9] mt-2 pt-2">
                <button onClick={signOut}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-[#9B9B9B] hover:text-red-500 hover:bg-red-50 w-full transition-all">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>

            {/* Registrar */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-3"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="text-[#C4BDB2] text-[9px] uppercase tracking-widest mb-2.5">School Administration</div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-[#E8E2D9]">
                  <Image src="/assets/registrar.jpg" alt="Registrar" width={32} height={32} className="w-full h-full object-cover object-top" />
                </div>
                <div className="min-w-0">
                  <div className="text-[#1A1A2E] text-xs font-semibold truncate">John Ayomide Akinola</div>
                  <div className="text-[#9B9B9B] text-[10px]">Registrar</div>
                </div>
              </div>
              <a href="mailto:sandd@abiodunsule.uk"
                className="block text-center text-[#8B7355] hover:text-[#D4A85C] text-[10px] transition-colors bg-[#F5F0E8] hover:bg-[#EDE8DF] rounded-lg py-1.5 px-2">
                Contact Registrar
              </a>
            </div>
          </div>
        </aside>

        {/* Page content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#E8E2D9]"
        style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.08)" }}>
        <div className="flex items-center justify-around px-2 py-1">
          {bottomNav.map(l => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link key={l.href} href={l.href}
                className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 flex-1">
                <l.icon className={`w-5 h-5 flex-shrink-0 ${active ? "text-[#1A1A2E]" : "text-[#9B9B9B]"}`} />
                <span className={`text-[10px] font-medium truncate ${active ? "text-[#1A1A2E]" : "text-[#9B9B9B]"}`}>
                  {l.label}
                </span>
                {active && <div className="w-1 h-1 rounded-full bg-[#D4A85C]" />}
              </Link>
            );
          })}
          {/* More button */}
          <button onClick={() => setDrawerOpen(v => !v)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 flex-1">
            <Menu className="w-5 h-5 text-[#9B9B9B]" />
            <span className="text-[10px] font-medium text-[#9B9B9B]">More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
