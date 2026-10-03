"use client";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { ArrowRight, ArrowUpRight, List, X, Sparkle, Student, Compass, Pause, Play } from "@phosphor-icons/react";

/* ── Flowing contour-line field (SVG, drifts horizontally) ─────────── */
function wavePath(baseline: number, amp: number, phase: number) {
  const W = 1800, step = 12, period = 300;
  let d = `M 0 ${baseline + amp * Math.sin(phase)}`;
  for (let x = step; x <= W; x += step) {
    const y = baseline + amp * Math.sin((x / period) * Math.PI * 2 + phase);
    d += ` L ${x} ${y.toFixed(1)}`;
  }
  return d;
}
function LineField({ stroke, className }: { stroke: string; className: string }) {
  const lines = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    d: wavePath(40 + i * 28, 26 + (i % 5) * 7, i * 0.5),
    o: 0.08 + (i % 6) * 0.03,
  })), []);
  return (
    <svg className={`absolute inset-0 w-[150%] h-full ${className}`} viewBox="0 0 1800 900" preserveAspectRatio="none" fill="none">
      {lines.map((l, i) => <path key={i} d={l.d} stroke={stroke} strokeWidth={1.4} opacity={l.o} />)}
    </svg>
  );
}

const pillars = [
  { icon: Sparkle, label: "Scripture-Anchored", body: "Every course is rooted in the Word — not tradition, emotion, or personal preference." },
  { icon: Compass, label: "Discernment First", body: "Students learn to test every spirit before they minister. Accuracy matters." },
  { icon: Student, label: "Character Over Gift", body: "Holiness and integrity are prerequisites to prophetic ministry, never afterthoughts." },
  { icon: ArrowUpRight, label: "Activation-Based", body: "Prophetic exercises in every lesson — not just theory. You learn by doing." },
];
const year1 = [["01", "Introduction to NT Prophecy", 3], ["02", "The Person & Work of the Holy Spirit", 3], ["03", "Biblical Hermeneutics", 3], ["04", "Spirituality vs. Spiritism", 2], ["05", "Prayer & Intimacy with God", 2], ["06", "Character & Ethics in Ministry", 2]] as const;
const year2 = [["07", "Advanced Prophetic Ministry", 3], ["08", "Discernment and Deliverance", 3], ["09", "Theology of the New Covenant", 3], ["10", "Leadership in Prophetic Ministry", 2], ["11", "Prophetic Evangelism", 2]] as const;

const rise = (d = 0) => ({ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, delay: d, ease: [0.19, 1, 0.22, 1] as [number, number, number, number] } } });
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

export default function Home() {
  const [menu, setMenu] = useState(false);
  const [paused, setPaused] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const s = () => setScrolled(window.scrollY > 24);
    s(); window.addEventListener("scroll", s, { passive: true });
    return () => window.removeEventListener("scroll", s);
  }, []);
  const anim = paused ? "[animation-play-state:paused]" : "";

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B0612] text-white">

      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#0B0612]/60 backdrop-blur-xl border-b border-white/10" : "border-b border-transparent"}`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D" width={40} height={40} className="rounded-md" />
            <div className="leading-none">
              <div className="text-[16px] font-bold tracking-tight font-display">S&amp;D Prophetic School</div>
              <div className="text-[10px] tracking-[0.22em] uppercase text-white/50 mt-1">Sons &amp; Daughters of Prophets</div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-9 text-sm font-medium">
            <Link href="/courses" className="text-white/70 hover:text-white transition-colors">Courses</Link>
            <Link href="/apply" className="text-white/70 hover:text-white transition-colors">Apply</Link>
            <Link href="/auth/login" className="text-white/70 hover:text-white transition-colors">Sign In</Link>
            <Link href="/apply" className="bg-white text-[#241253] px-5 py-2.5 rounded-full font-semibold inline-flex items-center gap-1.5 hover:bg-[#E0A64E] transition-colors">
              Enroll <ArrowRight weight="bold" className="w-4 h-4" />
            </Link>
          </div>
          <button className="md:hidden text-white p-2" onClick={() => setMenu(!menu)} aria-label="Menu">
            {menu ? <X weight="bold" className="w-6 h-6" /> : <List weight="bold" className="w-6 h-6" />}
          </button>
        </div>
        {menu && (
          <div className="md:hidden bg-[#0B0612]/95 backdrop-blur-xl border-t border-white/10 px-5 py-4 flex flex-col gap-3">
            <Link href="/courses" className="font-medium py-1" onClick={() => setMenu(false)}>Courses</Link>
            <Link href="/apply" className="font-medium py-1" onClick={() => setMenu(false)}>Apply</Link>
            <Link href="/auth/login" className="font-medium py-1" onClick={() => setMenu(false)}>Sign In</Link>
            <Link href="/apply" className="bg-white text-[#241253] px-5 py-2.5 rounded-full font-semibold text-center">Enroll</Link>
          </div>
        )}
      </nav>

      {/* ── HERO (animated gradient + flowing lines) ─────── */}
      <section className={`grad-hero ${anim} relative min-h-[100svh] flex items-center overflow-hidden`}>
        <div className={`line-drift ${anim} absolute inset-0 pointer-events-none`}><LineField stroke="#E0A64E" className="" /></div>
        <div className={`line-drift2 ${anim} absolute inset-0 pointer-events-none`}><LineField stroke="#ffffff" className="" /></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,transparent_0%,rgba(11,6,18,0.35)_100%)]" />

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 w-full pt-24">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="max-w-5xl">
            <motion.div variants={rise()} className="flex items-center gap-3 mb-8">
              <span className="w-2 h-2 rounded-full bg-[#E0A64E] animate-pulse" />
              <span className="text-xs tracking-[0.3em] uppercase font-semibold text-white/80">Treasures in Clay Ministries · Applications Open</span>
            </motion.div>
            <motion.h1 variants={rise(0.05)} className="kinetic-display text-[clamp(3.2rem,9vw,8.5rem)]">
              Raising <span className="accent-cycle">prophets</span><br />for this age.
            </motion.h1>
            <motion.p variants={rise(0.12)} className="mt-8 text-xl sm:text-2xl text-white/80 max-w-2xl leading-snug font-light">
              A two-year prophetic training school forming prophets who are biblically grounded,
              spiritually discerning, and deeply accountable.
            </motion.p>
            <motion.div variants={rise(0.18)} className="mt-10 flex flex-wrap items-center gap-4">
              <Link href="/apply" className="bg-white text-[#241253] px-9 py-4 rounded-full font-bold text-base inline-flex items-center gap-2 hover:bg-[#E0A64E] transition-colors">
                Apply Now <ArrowRight weight="bold" className="w-5 h-5" />
              </Link>
              <Link href="/courses" className="px-9 py-4 rounded-full font-semibold text-base border-2 border-white/40 hover:border-white hover:bg-white/10 transition-colors inline-flex items-center gap-2">
                Explore Courses
              </Link>
            </motion.div>
          </motion.div>
        </div>

        <button onClick={() => setPaused(!paused)} aria-label="Toggle animation"
          className="absolute bottom-6 left-6 z-10 flex items-center gap-2 text-white/70 hover:text-white text-xs font-medium bg-black/25 backdrop-blur-md border border-white/15 rounded-full px-3.5 py-2 transition-colors">
          {paused ? <Play weight="fill" className="w-3.5 h-3.5" /> : <Pause weight="fill" className="w-3.5 h-3.5" />}
          {paused ? "Play" : "Pause"} animation
        </button>
      </section>

      {/* ── STATEMENT (huge type, cycling color words) ───── */}
      <section className="bg-[#FAF9F6] text-[#0B0612]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-28 sm:py-36">
          <motion.h2 variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="kinetic-display text-[clamp(2.4rem,7vw,6rem)]">
            We raise prophets who are <span className="text-[#7C3AED]">grounded</span>, <span className="text-[#C026A3]">discerning</span>, <span className="text-[#E0A64E]">accountable</span> — and sent.
          </motion.h2>
          <motion.div variants={rise(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-10">
            <Link href="/courses" className="inline-flex items-center gap-2 text-lg font-semibold text-[#7C3AED] hover:gap-3 transition-all">
              See the curriculum <ArrowRight weight="bold" className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── STATS (gradient band) ───────────────────────── */}
      <section className={`grad-band ${anim} relative overflow-hidden`}>
        <div className={`line-drift ${anim} absolute inset-0 pointer-events-none opacity-60`}><LineField stroke="#ffffff" className="" /></div>
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-20 grid grid-cols-2 lg:grid-cols-4 gap-10">
          {[["2", "Year Programme"], ["11", "Courses"], ["28", "Total Credits"], ["100%", "Scripture-Based"]].map(([n, l]) => (
            <motion.div key={l} variants={rise()}>
              <div className="kinetic-display text-6xl sm:text-7xl text-white">{n}</div>
              <div className="mt-2 text-[11px] tracking-[0.2em] uppercase text-white/70">{l}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── PILLARS ─────────────────────────────────────── */}
      <section className="bg-[#FAF9F6] text-[#0B0612]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-28">
          <motion.h2 variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="kinetic-display text-[clamp(2.2rem,5vw,4rem)] mb-14 max-w-2xl">Built on these foundations.</motion.h2>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 gap-5">
            {pillars.map((p, i) => (
              <motion.div key={p.label} variants={rise()} className="group relative rounded-3xl p-9 bg-white border border-[#0B0612]/10 hover:border-transparent transition-all overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity grad-band" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="kinetic-display text-5xl text-[#7C3AED] group-hover:text-white transition-colors">{String(i + 1).padStart(2, "0")}</div>
                    <div className="w-12 h-12 rounded-2xl bg-[#241253] group-hover:bg-white/20 flex items-center justify-center transition-colors">
                      <p.icon weight="duotone" className="w-6 h-6 text-[#E0A64E]" />
                    </div>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-3 group-hover:text-white transition-colors">{p.label}</h3>
                  <p className="text-[#0B0612]/60 group-hover:text-white/85 leading-relaxed transition-colors">{p.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CURRICULUM ──────────────────────────────────── */}
      <section id="curriculum" className="bg-[#0B0612]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-28">
          <motion.h2 variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="kinetic-display text-[clamp(2.2rem,5vw,4rem)] mb-14">The curriculum.</motion.h2>
          <div className="grid lg:grid-cols-2 gap-x-16 gap-y-12">
            {[{ label: "Year One", sub: "Certificate in Prophetic Ministry", items: year1, c: "#E0A64E" }, { label: "Year Two", sub: "Diploma in NT Prophecy", items: year2, c: "#C026A3" }].map((yr, yi) => (
              <motion.div key={yr.label} variants={rise(yi * 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="border-b border-white/15 pb-4 mb-2">
                  <div className="text-xs tracking-[0.25em] uppercase mb-1" style={{ color: yr.c }}>{yr.label}</div>
                  <h3 className="font-display text-2xl font-bold">{yr.sub}</h3>
                </div>
                {yr.items.map(([num, title, cr]) => (
                  <div key={num} className="flex items-center gap-5 py-4 border-b border-white/10 hover:pl-2 transition-all">
                    <span className="font-display text-lg w-7" style={{ color: yr.c }}>{num}</span>
                    <span className="flex-1 text-white/85">{title}</span>
                    <span className="text-white/40 text-xs">{cr} cr</span>
                  </div>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WELCOME VIDEO ───────────────────────────────── */}
      <section className="bg-[#0B0612] border-t border-white/10">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 py-28">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-10 bg-[#E0A64E]/50" />
              <span className="text-[#E0A64E] text-xs tracking-[0.25em] uppercase font-sans">A Message from the Dean</span>
              <div className="h-px w-10 bg-[#E0A64E]/50" />
            </div>
            <h2 className="kinetic-display text-[clamp(2.2rem,5vw,3.8rem)]">
              Welcome from <span className="accent-cycle">Prophet Abiodun Sule</span>
            </h2>
          </motion.div>

          <motion.div variants={rise(0.15)} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
            style={{ aspectRatio: "16/9", boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)" }}>
            <iframe
              src="https://www.youtube.com/embed/Ipph21Exp8k?rel=0&modestbranding=1&color=white"
              title="Welcome from Prophet Abiodun Sule"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>

          <motion.div variants={rise(0.25)} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mt-10">
            <p className="text-white/50 text-sm font-sans mb-5">
              Tuition is completely free. Your calling is the only requirement.
            </p>
            <Link href="/apply"
              className="inline-flex items-center gap-2 grad-hero text-white font-semibold text-sm px-7 py-3.5 rounded-full transition-all font-sans hover:shadow-[0_0_30px_rgba(124,58,237,0.45)]">
              Apply Now — Cohort 0.2 <ArrowRight weight="bold" className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── SCHOOL ADMINISTRATION / REGISTRAR ───────────── */}
      <section className="bg-[#0B0612] border-t border-white/10">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-16">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl px-8 py-7 border border-white/10 bg-white/[0.03] backdrop-blur-sm">
            {/* Label */}
            <div className="flex-shrink-0 hidden sm:block">
              <div className="h-px w-8 bg-[#E0A64E]/50 mb-3" />
              <span className="text-[#E0A64E] text-[10px] tracking-[0.25em] uppercase font-sans">A Word from the Registrar</span>
            </div>
            <div className="w-px h-12 bg-white/10 hidden sm:block flex-shrink-0" />
            {/* Registrar */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/15 flex-shrink-0">
                <Image src="/assets/registrar.jpg" alt="John Ayomide Akinola"
                  width={56} height={56} className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <div className="font-display text-white text-base font-bold">John Ayomide Akinola</div>
                <div className="text-white/50 text-xs font-sans mt-0.5">Registrar, S&D Prophetic Training School</div>
              </div>
            </div>
            {/* Contact */}
            <a href="mailto:sandd@abiodunsule.uk"
              className="text-[#E0A64E]/80 hover:text-white hover:grad-hero text-xs font-sans transition-all flex-shrink-0 border border-[#E0A64E]/30 hover:border-transparent px-4 py-2 rounded-full">
              sandd@abiodunsule.uk
            </a>
          </motion.div>
        </div>
      </section>

      {/* ── CTA (animated gradient) ─────────────────────── */}
      <section className={`grad-hero ${anim} relative overflow-hidden`}>
        <div className={`line-drift2 ${anim} absolute inset-0 pointer-events-none`}><LineField stroke="#ffffff" className="" /></div>
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-32 text-center">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="kinetic-display text-[clamp(2.6rem,7vw,6rem)] max-w-4xl mx-auto">Your call deserves preparation.</h2>
            <p className="mt-6 text-white/80 text-xl max-w-xl mx-auto font-light">Applications are open for the next cohort.</p>
            <Link href="/apply" className="mt-10 inline-flex items-center gap-2 bg-white text-[#241253] px-10 py-5 rounded-full font-bold text-lg hover:bg-[#E0A64E] transition-colors">
              Begin Your Application <ArrowRight weight="bold" className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="bg-[#0B0612] border-t border-white/10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-14 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D" width={40} height={40} className="rounded-md" />
            <div>
              <div className="font-bold font-display">S&amp;D Prophetic School</div>
              <div className="text-white/40 text-xs">Treasures in Clay Ministries — 2026</div>
            </div>
          </div>
          <div className="flex items-center gap-7 text-sm text-white/55">
            <Link href="/courses" className="hover:text-[#E0A64E]">Courses</Link>
            <Link href="/apply" className="hover:text-[#E0A64E]">Apply</Link>
            <Link href="/auth/login" className="hover:text-[#E0A64E]">Sign In</Link>
            <a href="mailto:sandd@abiodunsule.uk" className="hover:text-[#E0A64E]">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
