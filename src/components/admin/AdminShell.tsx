"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { BookOpen, LogOut } from "lucide-react";

const navLinks = [
  { href: "/admin/dashboard",         icon: "🏠", label: "Dashboard"    },
  { href: "/admin/applications",      icon: "📋", label: "Applications" },
  { href: "/admin/students",          icon: "👥", label: "Students"     },
  { href: "/admin/upload",            icon: "🎬", label: "Upload Video" },
  { href: "/admin/assignments",       icon: "📝", label: "Assignments"  },
  { href: "/admin/announcements",     icon: "📢", label: "Announcements"},
  { href: "/admin/certificates",      icon: "🏅", label: "Certificates" },
  { href: "/admin/profile",           icon: "👤", label: "My Profile"   },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
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

  const initials = adminName.slice(0, 2).toUpperCase();
  const roleLabel = adminRole === "super_admin" ? "Super Admin" : "Admin";
  const roleCls   = adminRole === "super_admin"
    ? "bg-amber-900/40 text-amber-300 border border-amber-700"
    : "bg-brand-900/40 text-brand-300 border border-brand-700";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* TOP NAV */}
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-display text-white text-sm font-semibold leading-none">S&D Prophetic School</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Admin Control Panel</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-1.5 border border-gray-700">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-brand-600 flex items-center justify-center flex-shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt={adminName} className="w-full h-full object-cover" />
                  : <span className="text-white text-[10px] font-bold">{initials}</span>
                }
              </div>
              <span className="text-gray-300 text-xs font-medium">{adminName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${roleCls}`}>{roleLabel}</span>
            </div>
            <button onClick={handleSignOut}
              className="flex items-center gap-1.5 text-gray-400 hover:text-red-400 text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-red-950 border border-gray-700 hover:border-red-800 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        {/* SIDEBAR */}
        <aside className="w-52 flex-shrink-0 hidden lg:block">
          <nav className="bg-gray-900 border border-gray-800 rounded-2xl p-3 sticky top-24">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest px-3 mb-2">Navigation</p>
            {navLinks.map(l => {
              const isActive = pathname === l.href || (l.href !== "/admin/dashboard" && pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white font-medium"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}>
                  <span>{l.icon}</span>{l.label}
                </Link>
              );
            })}
            <div className="border-t border-gray-800 mt-2 pt-2">
              <button onClick={handleSignOut}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:text-red-400 hover:bg-red-950 w-full transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* PAGE CONTENT */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
