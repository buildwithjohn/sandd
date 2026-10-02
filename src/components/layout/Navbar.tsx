"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";
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
    <nav className="sticky top-0 z-50 bg-[#080C14]/70 backdrop-blur-xl border-b border-white/[0.07]"
      style={{ fontFamily: "'Georgia', serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Image src="/assets/logo.png" alt="S&D Prophetic School" width={36} height={36}
            className="rounded-lg transition-transform group-hover:scale-105" />
          <div>
            <div className="text-white text-[15px] font-semibold leading-none">S&D Prophetic School</div>
            <div className="text-[10px] text-[#D4A85C]/80 mt-0.5 tracking-wide uppercase font-sans">
              Sons &amp; Daughters of Prophets
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn(
                "text-sm font-sans transition-colors",
                pathname === l.href ? "text-[#D4A85C]" : "text-white/55 hover:text-white"
              )}>
              {l.label}
            </Link>
          ))}
          <Link href="/portal/dashboard"
            className="flex items-center gap-1.5 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] text-sm font-semibold font-sans px-4 py-2 rounded-full transition-all hover:shadow-[0_0_28px_rgba(212,168,92,0.35)]">
            Student Portal <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg text-white/70 hover:text-white transition-colors"
          onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-white/[0.07] bg-[#080C14]/95 backdrop-blur-xl px-4 pb-4 pt-2 flex flex-col gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href}
              className={cn("text-sm font-sans py-2.5 transition-colors",
                pathname === l.href ? "text-[#D4A85C]" : "text-white/60 hover:text-white")}
              onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link href="/portal/dashboard"
            className="bg-[#D4A85C] text-[#080C14] text-sm font-semibold font-sans px-4 py-2.5 rounded-full text-center mt-2"
            onClick={() => setOpen(false)}>
            Student Portal
          </Link>
        </div>
      )}
    </nav>
  );
}
