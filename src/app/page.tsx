"use client";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Award, Clock, ChevronRight,
  Star, Shield, Heart, Zap, ExternalLink
} from "lucide-react";

// ── Animation variants ────────────────────────────────────────────────────
function fadeUpVariant(i: number = 0) {
  return {
    hidden:  { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.12, ease: "easeOut" as const } },
  };
}

function fadeInVariant(i: number = 0) {
  return {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.7, delay: i * 0.1 } },
  };
}

// ── Data ─────────────────────────────────────────────────────────────────
const year1 = [
  { icon: "📖", title: "Introduction to NT Prophecy",          credits: 3 },
  { icon: "🕊️", title: "The Person & Work of the Holy Spirit", credits: 3 },
  { icon: "📜", title: "Biblical Hermeneutics",                 credits: 3 },
  { icon: "⚠️", title: "Spirituality vs. Spiritism",           credits: 2 },
  { icon: "🙏", title: "Prayer & Intimacy with God",            credits: 2 },
  { icon: "⚖️", title: "Character & Ethics",                   credits: 2 },
];

const year2 = [
  { icon: "🔥", title: "Advanced Prophetic Ministry",          credits: 3 },
  { icon: "🛡️", title: "Discernment and Deliverance",          credits: 3 },
  { icon: "✝️", title: "Theology of the New Covenant",         credits: 3 },
  { icon: "👑", title: "Leadership in Prophetic Ministry",     credits: 2 },
  { icon: "🌍", title: "Prophetic Evangelism",                 credits: 2 },
];

const values = [
  { icon: Star,   title: "Biblical Foundation",  desc: "Every course is anchored in Scripture, not tradition or emotion." },
  { icon: Shield, title: "Discernment First",    desc: "Students are trained to test every spirit before ministering." },
  { icon: Heart,  title: "Character Over Gift",  desc: "Holiness and integrity are treated as prerequisites, not afterthoughts." },
  { icon: Zap,    title: "Practical Training",   desc: "Prophetic activation exercises, not just academic study." },
];

// ── Component ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">

        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/assets/hero-bg.jpg"
            alt="Prophetic School Hero"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Deep navy overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-brand-950/85 via-brand-950/75 to-brand-950/95" />
          {/* Subtle gold glow at center-bottom */}
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse 60% 40% at 50% 80%, rgba(184,134,11,0.18) 0%, transparent 70%)" }} />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center pt-16">

          {/* Badge */}
          <motion.div
            variants={fadeUpVariant(0)} initial="hidden" animate="visible"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-brand-200 text-xs font-medium px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Treasures in Clay Ministries &nbsp;·&nbsp; Prophetic Training School
          </motion.div>

          {/* Logo */}
          <motion.div
            variants={fadeUpVariant(1)} initial="hidden" animate="visible"
            className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl bg-amber-400/30 scale-110" />
              <Image
                src="/assets/logo.png"
                alt="S&D Logo"
                width={96} height={96}
                className="relative rounded-2xl"
              />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUpVariant(2)} initial="hidden" animate="visible"
            className="font-display text-5xl sm:text-6xl lg:text-7xl text-white font-semibold leading-[1.08] mb-6">
            Raising{" "}
            <span className="text-amber-400">New Testament</span>
            <br />
            Prophets for This Age
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={fadeUpVariant(3)} initial="hidden" animate="visible"
            className="text-brand-200 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            A two-year prophetic training school rooted in the Word, led by the Spirit,
            and accountable to the Body of Christ.{" "}
            <span className="text-amber-300 font-medium">Tuition is completely free.</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUpVariant(4)} initial="hidden" animate="visible"
            className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link href="/apply"
              className="group bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-8 py-4 rounded-2xl transition-all duration-300 flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:shadow-amber-400/40 hover:-translate-y-0.5">
              Apply for 2026 Cohort
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#courses"
              className="group bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-medium text-sm px-8 py-4 rounded-2xl transition-all duration-300 border border-white/20 hover:border-white/40 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              View Curriculum
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={fadeInVariant(5)} initial="hidden" animate="visible"
            className="grid grid-cols-3 gap-4 max-w-lg mx-auto border-t border-white/10 pt-10">
            {[
              { value: "2", label: "Year Programme" },
              { value: "11", label: "Courses" },
              { value: "Free", label: "Tuition" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl text-amber-400 font-bold">{s.value}</div>
                <div className="text-brand-400 text-xs mt-1 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <div className="w-px h-12 bg-gradient-to-b from-transparent to-white/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" />
        </motion.div>
      </section>

      {/* ══ WELCOME VIDEO ════════════════════════════════════════════════ */}
      <section className="bg-brand-950 py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={fadeUpVariant()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-10">
            <div className="text-amber-400 text-xs font-medium uppercase tracking-widest mb-3">
              A Message from the Dean
            </div>
            <h2 className="font-display text-white text-3xl sm:text-4xl font-medium">
              Welcome from Prophet Abiodun Sule
            </h2>
            <p className="text-brand-400 text-sm mt-3 max-w-xl mx-auto">
              Watch the Founder & Dean introduce the heart and vision of the school.
            </p>
          </motion.div>

          <motion.div
            variants={fadeInVariant()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
            style={{ aspectRatio: "16/9" }}>
            <iframe
              src="https://www.youtube.com/embed/Ipph21Exp8k?rel=0&modestbranding=1"
              title="Welcome from Prophet Abiodun Sule"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </motion.div>

          <motion.div
            variants={fadeUpVariant()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mt-8">
            <p className="text-brand-400 text-sm">
              Inspired? Tuition is completely free — your calling is the only requirement.
            </p>
            <Link href="/apply"
              className="inline-flex items-center gap-2 mt-4 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all">
              Apply Now — 2026 Cohort <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ══ MEET THE DEAN ════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUpVariant()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="bg-gradient-to-br from-brand-950 to-brand-900 rounded-3xl overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-0">

              {/* Photo */}
              <div className="sm:w-72 flex-shrink-0 relative">
                <div className="h-72 sm:h-full relative">
                  <Image
                    src="/assets/prophet-sule.png"
                    alt="Prophet Abiodun Sule"
                    fill
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-brand-950/50 hidden sm:block" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 to-transparent sm:hidden" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-8 sm:p-10 flex flex-col justify-center">
                <div className="text-amber-400 text-xs font-medium uppercase tracking-widest mb-3">
                  Founder & Dean
                </div>
                <h2 className="font-display text-white text-3xl font-semibold mb-4">
                  Prophet Abiodun Sule
                </h2>
                <p className="text-brand-300 text-sm leading-relaxed mb-4">
                  Under the authority of Treasures in Clay Ministries, Prophet Abiodun Sule
                  founded the Sons and Daughters of Prophets Prophetic Training School with one
                  conviction: that the church needs prophets who are not merely gifted, but
                  biblically grounded, spiritually discerning, and deeply accountable.
                </p>
                <p className="text-brand-300 text-sm leading-relaxed mb-8">
                  His ministry spans decades of prophetic teaching, pastoral leadership and
                  raising up the next generation of Spirit-filled believers who carry the Word
                  with accuracy and the Spirit with sensitivity.
                </p>
                <a
                  href="https://www.abiodunsule.uk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all self-start">
                  Visit Prophet Sule&apos;s Website
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══ VALUES ═══════════════════════════════════════════════════════ */}
      <section className="py-20 px-4 sm:px-6 bg-[#F0F4FF]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUpVariant()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12">
            <div className="text-brand-500 text-xs font-medium uppercase tracking-widest mb-3">
              What We Stand For
            </div>
            <h2 className="font-display text-brand-900 text-3xl sm:text-4xl font-semibold">
              Built on These Foundations
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUpVariant()} initial="hidden" whileInView="visible"
                viewport={{ once: true }} custom={i}
                className="bg-white rounded-2xl border border-blue-100 p-6 flex gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <v.icon className="w-6 h-6 text-brand-600" />
                </div>
                <div>
                  <h3 className="font-display text-brand-900 font-semibold mb-1">{v.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ COURSES ══════════════════════════════════════════════════════ */}
      <section id="courses" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUpVariant()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12">
            <div className="text-brand-500 text-xs font-medium uppercase tracking-widest mb-3">
              The Curriculum
            </div>
            <h2 className="font-display text-brand-900 text-3xl sm:text-4xl font-semibold mb-3">
              Two Years. Eleven Courses.
            </h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto">
              A comprehensive, Scripture-centred curriculum designed to ground, equip and activate every student in prophetic ministry.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Year 1 */}
            <motion.div
              variants={fadeUpVariant(0)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="bg-brand-950 rounded-2xl p-1 h-full">
                <div className="p-5 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Year 1</span>
                    <span className="text-xs text-brand-500">· 15 credits</span>
                  </div>
                  <h3 className="font-display text-white text-lg font-semibold">Certificate in Prophetic Ministry</h3>
                </div>
                <div className="space-y-1 px-2 pb-4">
                  {year1.map((c, i) => (
                    <motion.div
                      key={c.title}
                      variants={fadeUpVariant()} initial="hidden" whileInView="visible"
                      viewport={{ once: true }} custom={i * 0.5}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-3">
                      <span className="text-lg flex-shrink-0">{c.icon}</span>
                      <span className="text-brand-200 text-sm flex-1">{c.title}</span>
                      <span className="text-brand-500 text-xs flex-shrink-0">{c.credits} cr</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Year 2 */}
            <motion.div
              variants={fadeUpVariant(1)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="bg-gradient-to-br from-amber-950 to-brand-950 rounded-2xl p-1 h-full border border-amber-900/40">
                <div className="p-5 pb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Year 2</span>
                    <span className="text-xs text-amber-700">· 13 credits</span>
                  </div>
                  <h3 className="font-display text-white text-lg font-semibold">Diploma in NT Prophecy</h3>
                </div>
                <div className="space-y-1 px-2 pb-4">
                  {year2.map((c, i) => (
                    <motion.div
                      key={c.title}
                      variants={fadeUpVariant()} initial="hidden" whileInView="visible"
                      viewport={{ once: true }} custom={i * 0.5}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-3">
                      <span className="text-lg flex-shrink-0">{c.icon}</span>
                      <span className="text-brand-200 text-sm flex-1">{c.title}</span>
                      <span className="text-amber-700 text-xs flex-shrink-0">{c.credits} cr</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════ */}
      <section className="relative py-24 px-4 sm:px-6 overflow-hidden">
        <div className="absolute inset-0">
          <Image src="/assets/hero-bg.jpg" alt="" fill className="object-cover object-center opacity-20" />
          <div className="absolute inset-0 bg-brand-950/90" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div
            variants={fadeUpVariant()} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="text-amber-400 text-xs font-medium uppercase tracking-widest mb-4">
              2026 Cohort — Now Open
            </div>
            <h2 className="font-display text-white text-4xl sm:text-5xl font-semibold mb-5">
              Your Calling Is Waiting
            </h2>
            <p className="text-brand-300 text-base leading-relaxed mb-10 max-w-lg mx-auto">
              If God has placed a prophetic calling on your life, this school was built for you.
              Join the 2026 cohort — free of charge, rooted in Scripture, led by the Spirit.
            </p>
            <Link href="/apply"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-bold text-base px-10 py-4 rounded-2xl transition-all duration-300 shadow-xl shadow-amber-500/30 hover:-translate-y-0.5">
              Apply Now — It&apos;s Free <ChevronRight className="w-5 h-5" />
            </Link>
            <p className="text-brand-500 text-xs mt-5">
              No application fee. No tuition. Just your time, your Bible, and your hunger for God.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="bg-brand-950 border-t border-white/5 py-10 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D Logo" width={36} height={36} className="rounded-lg" />
            <div>
              <div className="text-white text-sm font-semibold">S&D Prophetic School</div>
              <div className="text-brand-500 text-xs">Treasures in Clay Ministries</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-brand-500 text-xs">
            <Link href="/apply" className="hover:text-white transition-colors">Apply</Link>
            <a href="https://www.abiodunsule.uk" target="_blank" rel="noopener noreferrer"
              className="hover:text-white transition-colors">Prophet Sule</a>
            <Link href="/auth/login" className="hover:text-white transition-colors">Student Login</Link>
          </div>
          <p className="text-brand-600 text-xs">© 2026 S&D Prophetic Training School</p>
        </div>
      </footer>
    </div>
  );
}
