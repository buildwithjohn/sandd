"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { LogOut, LayoutDashboard, BookOpen, FileText, Megaphone, User } from "lucide-react";

const navLinks = [
  { href: "/portal/dashboard",     icon: LayoutDashboard, label: "Dashboard"     },
  { href: "/portal/courses",       icon: BookOpen,        label: "My Courses"    },
  { href: "/portal/assignments",   icon: FileText,        label: "Assignments"   },
  { href: "/portal/announcements", icon: Megaphone,       label: "Announcements" },
  { href: "/portal/profile",       icon: User,            label: "Profile"       },
];

interface Profile {
  name: string;
  initials: string;
  church: string;
  year: number;
  avatarUrl: string | null;
}

export default function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const [profile, setProfile] = useState<Profile>({
    name: "Student", initials: "ST", church: "", year: 1, avatarUrl: null
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      const { data: p } = await supabase
        .from("profiles").select("full_name, church, current_year, avatar_url, role").eq("id", user.id).single();
      if (!p) return;
      if (p.role === "admin" || p.role === "super_admin") { router.push("/admin/dashboard"); return; }
      const name = p.full_name ?? "Student";
      setProfile({
        name,
        initials: name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase(),
        church: p.church ?? "",
        year: p.current_year ?? 1,
        avatarUrl: p.avatar_url ?? null,
      });
    }
    load();
  }, []);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: "Arial, sans-serif" }}>

      {/* ── TOP NAV ─────────────────────────────────────────────────── */}
      <nav className="bg-white border-b border-[#E8E2D9] sticky top-0 z-50"
        style={{ boxShadow: "0 1px 0 rgba(0,0,0,0.04)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <Link href="/portal/dashboard" className="flex items-center gap-2.5">
            <Image src="/assets/logo.png" alt="S&D" width={32} height={32} className="rounded-lg" />
            <div className="hidden sm:block">
              <div className="text-[#1A1A2E] text-sm font-semibold leading-none"
                style={{ fontFamily: "'Georgia', serif" }}>
                S&D Prophetic School
              </div>
              <div className="text-[10px] text-[#8B7355] mt-0.5 tracking-wide uppercase font-sans">
                Student Portal
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(l => {
              const active = pathname === l.href;
              return (
                <Link key={l.href} href={l.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? "bg-[#1A1A2E] text-white"
                      : "text-[#6B6B6B] hover:text-[#1A1A2E] hover:bg-[#F0EDE8]"
                  }`}>
                  <l.icon className="w-3.5 h-3.5" />
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right — avatar + sign out */}
          <div className="flex items-center gap-3">
            <Link href="/portal/profile"
              className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-[#1A1A2E] flex items-center justify-center flex-shrink-0 border-2 border-transparent group-hover:border-[#D4A85C] transition-all">
                {profile.avatarUrl
                  ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  : <span className="text-white text-[10px] font-bold">{profile.initials}</span>
                }
              </div>
              <div className="hidden sm:block">
                <div className="text-[#1A1A2E] text-xs font-semibold leading-none">{profile.name.split(" ")[0]}</div>
                <div className="text-[10px] text-[#8B7355] mt-0.5">Year {profile.year}</div>
              </div>
            </Link>
            <button onClick={signOut}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9B9B9B] hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── LAYOUT ──────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex gap-8">

        {/* Sidebar */}
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <div className="sticky top-24 space-y-1">

            {/* Student card */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 mb-4"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-[#1A1A2E] flex items-center justify-center flex-shrink-0">
                  {profile.avatarUrl
                    ? <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    : <span className="text-white text-xs font-bold">{profile.initials}</span>
                  }
                </div>
                <div className="min-w-0">
                  <div className="text-[#1A1A2E] text-sm font-semibold truncate"
                    style={{ fontFamily: "'Georgia', serif" }}>{profile.name.split(" ")[0]}</div>
                  <div className="text-[10px] text-[#8B7355] mt-0.5">{profile.church || "Student"}</div>
                </div>
              </div>
              <div className="bg-[#F5F0E8] rounded-lg px-3 py-2 flex items-center justify-between">
                <span className="text-[#8B7355] text-[10px] uppercase tracking-wide">Current Year</span>
                <span className="text-[#1A1A2E] text-xs font-bold">Year {profile.year}</span>
              </div>
            </div>

            {/* Nav links */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-2"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              {navLinks.map(l => {
                const active = pathname === l.href;
                return (
                  <Link key={l.href} href={l.href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? "bg-[#1A1A2E] text-white font-medium"
                        : "text-[#6B6B6B] hover:bg-[#F5F0E8] hover:text-[#1A1A2E]"
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

            {/* Registrar card */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-3 mt-3"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div className="text-[#C4BDB2] text-[9px] uppercase tracking-widest font-sans mb-2.5">
                School Administration
              </div>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-[#E8E2D9]">
                  <Image src="/assets/registrar.jpg" alt="Registrar"
                    width={32} height={32} className="w-full h-full object-cover object-top" />
                </div>
                <div className="min-w-0">
                  <div className="text-[#1A1A2E] text-xs font-semibold truncate">John Ayomide Akinola</div>
                  <div className="text-[#9B9B9B] text-[10px] font-sans">Registrar</div>
                </div>
              </div>
              <a href="mailto:sandd@abiodunsule.uk"
                className="block text-center text-[#8B7355] hover:text-[#D4A85C] text-[10px] font-sans transition-colors bg-[#F5F0E8] hover:bg-[#EDE8DF] rounded-lg py-1.5 px-2">
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
    </div>
  );
}
