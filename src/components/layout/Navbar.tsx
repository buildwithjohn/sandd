"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/apply", label: "Apply" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-blue-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/assets/logo.png" alt="S&D Prophetic School" width={36} height={36} className="rounded-lg" />
          <div>
            <div className="font-display text-brand-900 text-[15px] font-semibold leading-none">
              S&D Prophetic School
            </div>
            <div className="text-[10px] text-brand-400 mt-0.5 tracking-wide uppercase">
              Sons & Daughters of Prophets
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === l.href
                  ? "text-brand-700"
                  : "text-slate-500 hover:text-brand-700"
              )}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/portal/dashboard"
            className="bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-brand-800 transition-colors"
          >
            Student Portal
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-500"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-blue-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 py-2"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/portal/dashboard"
            className="bg-brand-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg text-center mt-1"
            onClick={() => setOpen(false)}
          >
            Student Portal
          </Link>
        </div>
      )}
    </nav>
  );
}
