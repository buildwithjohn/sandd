"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, ExternalLink, ChevronDown } from "lucide-react";

// ── Variants ──────────────────────────────────────────────────────────────
const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 32, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { duration: 0.75, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }
  }
});

const fadeIn = (delay = 0) => ({
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.9, delay } }
});

// ── Data ──────────────────────────────────────────────────────────────────
const year1 = [
  { num: "01", title: "Introduction to NT Prophecy",           credits: 3 },
  { num: "02", title: "The Person & Work of the Holy Spirit",  credits: 3 },
  { num: "03", title: "Biblical Hermeneutics",                 credits: 3 },
  { num: "04", title: "Spirituality vs. Spiritism",            credits: 2 },
  { num: "05", title: "Prayer & Intimacy with God",            credits: 2 },
  { num: "06", title: "Character & Ethics in Ministry",        credits: 2 },
];

const year2 = [
  { num: "07", title: "Advanced Prophetic Ministry",           credits: 3 },
  { num: "08", title: "Discernment and Deliverance",           credits: 3 },
  { num: "09", title: "Theology of the New Covenant",          credits: 3 },
  { num: "10", title: "Leadership in Prophetic Ministry",      credits: 2 },
  { num: "11", title: "Prophetic Evangelism",                  credits: 2 },
];

const pillars = [
  { label: "Scripture-Anchored",  body: "Every course is rooted in the Word — not tradition, emotion, or personal preference." },
  { label: "Discernment First",   body: "Students learn to test every spirit before they minister. Accuracy matters." },
  { label: "Character Over Gift", body: "Holiness and integrity are prerequisites to prophetic ministry, never afterthoughts." },
  { label: "Activation-Based",   body: "Prophetic exercises in every lesson — not just theory. You learn by doing." },
];

// ── Component ─────────────────────────────────────────────────────────────
export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale     = useTransform(scrollYProgress, [0, 1], [1, 1.08]);
  const heroOpacity   = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroTranslate = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <div className="bg-[#080C14] text-white min-h-screen" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <Navbar />

      {/* ════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">

        {/* Parallax background */}
        <motion.div style={{ scale: heroScale }} className="absolute inset-0">
          <Image
            src="/assets/hero-bg.jpg"
            alt="Prophetic calling"
            fill priority
            className="object-cover object-center"
          />
          {/* Layered overlays for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080C14]/60 via-[#080C14]/50 to-[#080C14]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080C14]/40 via-transparent to-[#080C14]/40" />
          {/* Warm gold haze at the light source center */}
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 50% 50% at 50% 45%, rgba(212,168,92,0.12) 0%, transparent 70%)" }} />
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroTranslate }}
          className="relative z-10 max-w-4xl mx-auto px-6 text-center"
        >
          {/* Eyebrow */}
          <motion.div variants={fadeIn(0.2)} initial="hidden" animate="visible"
            className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-12 bg-[#D4A85C]/50" />
            <span className="text-[#D4A85C] text-xs tracking-[0.3em] uppercase font-sans">
              Treasures in Clay Ministries
            </span>
            <div className="h-px w-12 bg-[#D4A85C]/50" />
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={rise(0.35)} initial="hidden" animate="visible"
            className="text-5xl sm:text-6xl lg:text-[80px] font-medium leading-[1.04] tracking-tight mb-6"
            style={{ fontFamily: "'Georgia', serif", letterSpacing: "-0.02em" }}>
            Raising{" "}
            <em className="not-italic"
              style={{ background: "linear-gradient(135deg, #D4A85C 0%, #F5D4A0 50%, #D4A85C 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              New Testament
            </em>
            <br />Prophets for This Age
          </motion.h1>

          {/* Sub */}
          <motion.p variants={rise(0.5)} initial="hidden" animate="visible"
            className="text-white/60 text-lg sm:text-xl font-sans max-w-2xl mx-auto leading-relaxed mb-12"
            style={{ fontFamily: "Arial, sans-serif", fontWeight: 300 }}>
            A two-year prophetic training school rooted in the Word, led by the Spirit,
            and accountable to the Body of Christ.{" "}
            <span className="text-[#D4A85C]">Tuition is completely free.</span>
          </motion.p>

          {/* CTAs */}
          <motion.div variants={rise(0.65)} initial="hidden" animate="visible"
            className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/apply"
              className="group relative overflow-hidden bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-semibold text-sm px-8 py-4 rounded-full transition-all duration-300 flex items-center gap-2 font-sans hover:shadow-[0_0_40px_rgba(212,168,92,0.4)] hover:-translate-y-0.5">
              Apply for 2026 Cohort
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#curriculum"
              className="group text-white/70 hover:text-white text-sm font-sans font-medium px-8 py-4 rounded-full border border-white/15 hover:border-white/40 transition-all duration-300 flex items-center gap-2 backdrop-blur-sm">
              View Curriculum
            </a>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-white/30 text-[10px] tracking-[0.2em] uppercase font-sans">Scroll</span>
          <ChevronDown className="w-4 h-4 text-white/30 animate-bounce" />
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════════
          STATS BAR
      ════════════════════════════════════════════════ */}
      <div className="border-y border-white/8 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-3 divide-x divide-white/8">
          {[
            { value: "2", label: "Year Programme" },
            { value: "11", label: "Courses" },
            { value: "Free", label: "Tuition" },
          ].map(s => (
            <div key={s.label} className="text-center px-4">
              <div className="text-3xl font-medium text-[#D4A85C] mb-1"
                style={{ fontFamily: "'Georgia', serif" }}>{s.value}</div>
              <div className="text-white/40 text-xs tracking-widest uppercase font-sans">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          WELCOME VIDEO
      ════════════════════════════════════════════════ */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-10 bg-[#D4A85C]/40" />
              <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">A Message from the Dean</span>
              <div className="h-px w-10 bg-[#D4A85C]/40" />
            </div>
            <h2 className="text-4xl sm:text-5xl font-medium tracking-tight"
              style={{ fontFamily: "'Georgia', serif" }}>
              Welcome from Prophet Abiodun Sule
            </h2>
          </motion.div>

          <motion.div variants={fadeIn(0.2)} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden"
            style={{ aspectRatio: "16/9", boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}>
            <iframe
              src="https://www.youtube.com/embed/Ipph21Exp8k?rel=0&modestbranding=1&color=white"
              title="Welcome from Prophet Abiodun Sule"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>

          <motion.div variants={rise(0.3)} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mt-10">
            <p className="text-white/40 text-sm font-sans mb-5">
              Tuition is completely free. Your calling is the only requirement.
            </p>
            <Link href="/apply"
              className="inline-flex items-center gap-2 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-semibold text-sm px-7 py-3.5 rounded-full transition-all font-sans hover:shadow-[0_0_30px_rgba(212,168,92,0.35)]">
              Apply Now — 2026 Cohort <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          MEET THE DEAN
      ════════════════════════════════════════════════ */}
      <section className="py-28 px-6 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 80px rgba(0,0,0,0.5)" }}>

            {/* Photo side */}
            <div className="relative h-80 lg:h-auto min-h-[480px]">
              <Image
                src="/assets/prophet-sule.png"
                alt="Prophet Abiodun Sule"
                fill className="object-cover object-top"
              />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to right, transparent 60%, #0D1320 100%)" }} />
              <div className="absolute inset-0 lg:hidden"
                style={{ background: "linear-gradient(to top, #0D1320 30%, transparent 100%)" }} />
            </div>

            {/* Content side */}
            <div className="bg-[#0D1320] p-10 lg:p-14 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-8 bg-[#D4A85C]/50" />
                <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">Founder & Dean</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-medium mb-5 tracking-tight"
                style={{ fontFamily: "'Georgia', serif" }}>
                Prophet Abiodun Sule
              </h2>
              <p className="text-white/55 text-sm leading-[1.85] font-sans mb-4">
                Under the authority of Treasures in Clay Ministries, Prophet Abiodun Sule
                founded the Sons and Daughters of Prophets Prophetic Training School with
                one conviction: the church needs prophets who are not merely gifted, but
                biblically grounded, spiritually discerning, and deeply accountable.
              </p>
              <p className="text-white/55 text-sm leading-[1.85] font-sans mb-10">
                His ministry spans decades of prophetic teaching, pastoral leadership,
                and raising up the next generation of Spirit-filled believers who carry
                the Word with accuracy and the Spirit with sensitivity.
              </p>
              <a href="https://www.abiodunsule.uk" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 text-[#D4A85C] hover:text-[#F5D4A0] font-sans text-sm font-medium group self-start border border-[#D4A85C]/30 hover:border-[#D4A85C]/60 px-6 py-3 rounded-full transition-all">
                Visit Prophet Sule&apos;s Website
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PILLARS
      ════════════════════════════════════════════════ */}
      <section className="py-28 px-6 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-16">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-[#D4A85C]/40" />
              <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">What We Stand For</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-medium tracking-tight max-w-lg"
              style={{ fontFamily: "'Georgia', serif" }}>
              Built on These Foundations
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/8 rounded-2xl overflow-hidden">
            {pillars.map((p, i) => (
              <motion.div key={p.label}
                variants={rise(i * 0.1)} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-[#080C14] hover:bg-[#0D1320] p-8 transition-colors group">
                <div className="text-[#D4A85C]/40 text-xs font-sans tracking-widest mb-3 group-hover:text-[#D4A85C]/70 transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 className="text-lg font-medium mb-3 tracking-tight"
                  style={{ fontFamily: "'Georgia', serif" }}>{p.label}</h3>
                <p className="text-white/45 text-sm leading-relaxed font-sans">{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CURRICULUM
      ════════════════════════════════════════════════ */}
      <section id="curriculum" className="py-28 px-6 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="mb-16">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-[#D4A85C]/40" />
              <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">The Curriculum</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-medium tracking-tight"
              style={{ fontFamily: "'Georgia', serif" }}>
              Two Years. Eleven Courses.
            </h2>
            <p className="text-white/40 text-base font-sans mt-4 max-w-lg leading-relaxed">
              A comprehensive, Scripture-centred curriculum designed to ground, equip and
              activate every student in prophetic ministry.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Year 1 */}
            <motion.div variants={rise(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="mb-5 flex items-baseline justify-between">
                <div>
                  <div className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans mb-1">Year One</div>
                  <h3 className="text-xl font-medium" style={{ fontFamily: "'Georgia', serif" }}>
                    Certificate in Prophetic Ministry
                  </h3>
                </div>
                <span className="text-white/25 text-xs font-sans">15 credits</span>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                {year1.map((c, i) => (
                  <div key={c.num}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors
                      ${i < year1.length - 1 ? "border-b border-white/[0.06]" : ""}`}>
                    <span className="text-[#D4A85C]/40 text-xs font-mono w-5 flex-shrink-0">{c.num}</span>
                    <span className="text-white/75 text-sm font-sans flex-1 leading-snug">{c.title}</span>
                    <span className="text-white/25 text-xs font-sans flex-shrink-0">{c.credits} cr</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Year 2 */}
            <motion.div variants={rise(0.15)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="mb-5 flex items-baseline justify-between">
                <div>
                  <div className="text-[#D4A85C] text-xs tracking-[0.2em] uppercase font-sans mb-1">Year Two</div>
                  <h3 className="text-xl font-medium" style={{ fontFamily: "'Georgia', serif" }}>
                    Diploma in NT Prophecy
                  </h3>
                </div>
                <span className="text-white/25 text-xs font-sans">13 credits</span>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(212,168,92,0.15)" }}>
                {year2.map((c, i) => (
                  <div key={c.num}
                    className={`flex items-center gap-4 px-5 py-4 hover:bg-[#D4A85C]/[0.04] transition-colors
                      ${i < year2.length - 1 ? "border-b border-[#D4A85C]/[0.08]" : ""}`}>
                    <span className="text-[#D4A85C]/50 text-xs font-mono w-5 flex-shrink-0">{c.num}</span>
                    <span className="text-white/75 text-sm font-sans flex-1 leading-snug">{c.title}</span>
                    <span className="text-[#D4A85C]/40 text-xs font-sans flex-shrink-0">{c.credits} cr</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          SCHOOL ADMINISTRATION
      ════════════════════════════════════════════════ */}
      <section className="py-16 px-6 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex flex-col sm:flex-row items-center gap-6 bg-[#0D1320] rounded-2xl border border-white/[0.07] px-8 py-7">
            {/* Small label */}
            <div className="flex-shrink-0 hidden sm:block">
              <div className="h-px w-8 bg-[#D4A85C]/40 mb-3" />
              <span className="text-[#D4A85C] text-[10px] tracking-[0.25em] uppercase font-sans">School Administration</span>
            </div>
            <div className="w-px h-12 bg-white/8 hidden sm:block flex-shrink-0" />
            {/* Registrar */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                <Image src="/assets/registrar.jpg" alt="John Ayomide Akinola"
                  width={56} height={56} className="w-full h-full object-cover object-top" />
              </div>
              <div>
                <div className="text-white text-sm font-medium" style={{ fontFamily: "\'Georgia\', serif" }}>
                  John Ayomide Akinola
                </div>
                <div className="text-white/40 text-xs font-sans mt-0.5">Registrar, S&D Prophetic Training School</div>
              </div>
            </div>
            {/* Contact */}
            <a href="mailto:sandd@abiodunsule.uk"
              className="text-[#D4A85C]/60 hover:text-[#D4A85C] text-xs font-sans transition-colors flex-shrink-0 border border-[#D4A85C]/20 hover:border-[#D4A85C]/50 px-4 py-2 rounded-full">
              sandd@abiodunsule.uk
            </a>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════ */}
      <section className="relative py-40 px-6 overflow-hidden border-t border-white/8">
        {/* Subtle background echo */}
        <div className="absolute inset-0">
          <Image src="/assets/hero-bg.jpg" alt="" fill className="object-cover object-center opacity-10" />
          <div className="absolute inset-0 bg-[#080C14]/80" />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(212,168,92,0.08) 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-px w-10 bg-[#D4A85C]/40" />
              <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">2026 Cohort — Now Open</span>
              <div className="h-px w-10 bg-[#D4A85C]/40" />
            </div>
            <h2 className="text-5xl sm:text-6xl font-medium tracking-tight mb-6"
              style={{ fontFamily: "'Georgia', serif" }}>
              Your Calling Is Waiting
            </h2>
            <p className="text-white/50 text-base font-sans leading-relaxed mb-12 max-w-lg mx-auto">
              If God has placed a prophetic calling on your life, this school was built for you.
              Join the 2026 cohort — free of charge, rooted in Scripture, led by the Spirit.
            </p>
            <Link href="/apply"
              className="inline-flex items-center gap-3 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14] font-bold text-base px-10 py-5 rounded-full transition-all duration-300 font-sans hover:shadow-[0_0_60px_rgba(212,168,92,0.4)] hover:-translate-y-0.5">
              Apply Now — It&apos;s Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-white/25 text-xs font-sans mt-6 tracking-wide">
              No application fee · No tuition · Just your Bible and your hunger for God
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          FOOTER — Refined, not generic
      ════════════════════════════════════════════════ */}
      <footer className="border-t border-white/8 bg-[#050810]">
        {/* Top strip */}
        <div className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-12">

          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <Image src="/assets/logo.png" alt="S&D Logo" width={38} height={38} className="rounded-xl" />
              <div>
                <div className="text-white text-sm font-medium" style={{ fontFamily: "'Georgia', serif" }}>
                  S&D Prophetic School
                </div>
                <div className="text-white/30 text-xs font-sans mt-0.5">Treasures in Clay Ministries</div>
              </div>
            </div>
            <p className="text-white/30 text-xs font-sans leading-relaxed">
              Raising New Testament prophets who are rooted in the Word, led by the Spirit,
              and accountable to the Body of Christ.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-white/30 text-xs tracking-[0.2em] uppercase font-sans mb-5">School</div>
            <div className="space-y-3">
              {[
                { label: "Apply — 2026 Cohort", href: "/apply" },
                { label: "View Curriculum", href: "#curriculum" },
                { label: "Student Portal", href: "/auth/login" },
              ].map(l => (
                <div key={l.label}>
                  <Link href={l.href}
                    className="text-white/50 hover:text-white text-sm font-sans transition-colors">
                    {l.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* External */}
          <div>
            <div className="text-white/30 text-xs tracking-[0.2em] uppercase font-sans mb-5">Ministry</div>
            <div className="space-y-3">
              <div>
                <a href="https://www.abiodunsule.uk" target="_blank" rel="noopener noreferrer"
                  className="text-white/50 hover:text-[#D4A85C] text-sm font-sans transition-colors flex items-center gap-1.5">
                  Prophet Abiodun Sule <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div>
                <span className="text-white/30 text-sm font-sans">
                  sandd.abiodunsule.uk
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.05] py-6 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/20 text-xs font-sans">
              © 2026 Sons and Daughters of Prophets Prophetic Training School
            </p>
            <p className="text-white/15 text-xs font-sans">
              All rights reserved · Treasures in Clay Ministries
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
