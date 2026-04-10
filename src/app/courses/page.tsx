"use client";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";

const rise = (delay = 0) => ({
  hidden:  { opacity: 0, y: 28, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)",
    transition: { duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] as [number,number,number,number] }
  }
});

const year1 = [
  { num: "01", slug: "intro-nt-prophecy",         title: "Introduction to NT Prophecy",          desc: "Covers the differences between Old and New Testament prophecy, the role of the prophetic gift in the local church, and the 1 Corinthians 14:3 charter.", credits: 3, scripture: "1 Cor. 14:3" },
  { num: "02", slug: "person-holy-spirit",         title: "The Person & Work of the Holy Spirit", desc: "Explores the Holy Spirit's nature, His role in prophecy, the gifts of the Spirit, and how to maintain a Spirit-filled lifestyle of sensitivity and obedience.", credits: 3, scripture: "John 14–16" },
  { num: "03", slug: "biblical-hermeneutics",       title: "Biblical Hermeneutics",                desc: "Teaches sound Bible interpretation principles — how to read Scripture in context, avoid eisegesis, and handle the Word of God accurately.", credits: 3, scripture: "2 Tim. 2:15" },
  { num: "04", slug: "spirituality-vs-spiritism",  title: "Spirituality vs. Spiritism",           desc: "Addresses biblical warnings against divination and occult practices, and equips students to discern between the Spirit of God and counterfeit spirits.", credits: 2, scripture: "1 John 4:1–6" },
  { num: "05", slug: "prayer-intimacy",            title: "Prayer & Intimacy with God",           desc: "Cultivates a lifestyle of prayer, fasting, and worship as the irreplaceable foundation for accurate and accountable prophetic ministry.", credits: 2, scripture: "Ps. 27:4" },
  { num: "06", slug: "character-ethics",           title: "Character & Ethics in Prophetic Ministry", desc: "Emphasises integrity, accountability, financial ethics, and holiness as prerequisites to prophetic service — not optional extras.", credits: 2, scripture: "1 Tim. 3:1–7" },
];

const year2 = [
  { num: "07", slug: "advanced-prophetic",         title: "Advanced Prophetic Ministry",          desc: "Covers prophetic intercession, visions, dreams, corporate prophecy, and navigating the prophetic in the local church with wisdom and authority.", credits: 3, scripture: "Acts 13:1–3" },
  { num: "08", slug: "discernment-deliverance",    title: "Discernment & Deliverance",            desc: "Teaches spiritual warfare, the gift of discerning of spirits, and the ministry of deliverance — including aftercare and accountability.", credits: 3, scripture: "Mark 16:17" },
  { num: "09", slug: "new-covenant-theology",      title: "Theology of the New Covenant",         desc: "Explores grace, freedom in Christ, the superiority of the New Covenant, and how covenant theology shapes every dimension of prophetic ministry.", credits: 3, scripture: "Heb. 8:6–13" },
  { num: "10", slug: "leadership-prophetic",       title: "Leadership in Prophetic Ministry",     desc: "Prepares students to mentor others, serve alongside church leadership, build prophetic teams, and sustain ministry without burning out.", credits: 2, scripture: "Eph. 4:11–12" },
  { num: "11", slug: "prophetic-evangelism",       title: "Prophetic Evangelism",                 desc: "Equips students to use prophetic gifts in outreach — word of knowledge, healing, and Spirit-led evangelism beyond the walls of the church.", credits: 2, scripture: "Acts 8:26–40" },
];

export default function CoursesPage() {
  return (
    <div className="bg-[#080C14] text-white min-h-screen" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      <Navbar />

      {/* ── PAGE HERO ─────────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-20 px-6 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #D4A85C 0%, transparent 50%), radial-gradient(circle at 80% 20%, #D4A85C 0%, transparent 40%)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/8" />

        <div className="max-w-5xl mx-auto">
          <motion.div variants={rise(0.1)} initial="hidden" animate="visible">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-10 bg-[#D4A85C]/40" />
              <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">The Curriculum</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-medium tracking-tight mb-5 leading-[1.04]"
              style={{ letterSpacing: "-0.02em" }}>
              Two Years.<br />Eleven Courses.
            </h1>
            <p className="text-white/45 text-lg font-sans font-light max-w-xl leading-relaxed">
              A comprehensive, Scripture-centred curriculum designed to ground, equip
              and activate every student in New Testament prophetic ministry.
            </p>
          </motion.div>

          {/* Summary bar */}
          <motion.div variants={rise(0.25)} initial="hidden" animate="visible"
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden">
            {[
              { value: "2", label: "Years" },
              { value: "11", label: "Courses" },
              { value: "28", label: "Total Credits" },
              { value: "Free", label: "Tuition" },
            ].map(s => (
              <div key={s.label} className="bg-[#080C14] px-6 py-5 text-center">
                <div className="text-2xl font-medium text-[#D4A85C] mb-1"
                  style={{ fontFamily: "'Georgia', serif" }}>{s.value}</div>
                <div className="text-white/30 text-xs tracking-widest uppercase font-sans">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── YEAR 1 ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-[#D4A85C]/40" />
                <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">Year One</span>
              </div>
              <h2 className="text-3xl font-medium tracking-tight" style={{ letterSpacing: "-0.01em" }}>
                Certificate in Prophetic Ministry
              </h2>
            </div>
            <span className="text-white/25 text-sm font-sans">15 credits · 6 courses</span>
          </motion.div>

          <div className="space-y-3">
            {year1.map((course, i) => (
              <motion.div key={course.num}
                variants={rise(i * 0.07)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="group relative rounded-2xl overflow-hidden transition-all duration-300
                  hover:bg-white/[0.03] cursor-default"
                  style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-start gap-5 p-6">
                    {/* Number */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#D4A85C]/10 border border-[#D4A85C]/20
                      flex items-center justify-center">
                      <span className="text-[#D4A85C] text-xs font-mono font-medium">{course.num}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-base font-medium text-white/90 leading-snug"
                          style={{ fontFamily: "'Georgia', serif" }}>
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {course.scripture && (
                            <span className="text-[#D4A85C]/60 text-xs font-sans hidden sm:block">
                              {course.scripture}
                            </span>
                          )}
                          <span className="text-white/25 text-xs font-sans whitespace-nowrap">
                            {course.credits} cr
                          </span>
                        </div>
                      </div>
                      <p className="text-white/40 text-sm font-sans leading-relaxed">{course.desc}</p>
                    </div>
                  </div>
                  {/* Hover gold left border effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#D4A85C]/0 group-hover:bg-[#D4A85C]/50 transition-all duration-300 rounded-l-full" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── YEAR 2 ────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-white/8">
        <div className="max-w-5xl mx-auto">
          <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-px w-8 bg-[#D4A85C]/40" />
                <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">Year Two</span>
              </div>
              <h2 className="text-3xl font-medium tracking-tight" style={{ letterSpacing: "-0.01em" }}>
                Diploma in New Testament Prophecy
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-3.5 h-3.5 text-white/20" />
              <span className="text-white/25 text-sm font-sans">13 credits · 5 courses · Unlocks after Year 1</span>
            </div>
          </motion.div>

          <div className="space-y-3">
            {year2.map((course, i) => (
              <motion.div key={course.num}
                variants={rise(i * 0.07)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                <div className="group relative rounded-2xl overflow-hidden transition-all duration-300
                  hover:bg-[#D4A85C]/[0.03] cursor-default"
                  style={{ border: "1px solid rgba(212,168,92,0.12)" }}>
                  <div className="flex items-start gap-5 p-6">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#D4A85C]/8 border border-[#D4A85C]/15
                      flex items-center justify-center">
                      <span className="text-[#D4A85C]/70 text-xs font-mono font-medium">{course.num}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-base font-medium text-white/80 leading-snug"
                          style={{ fontFamily: "'Georgia', serif" }}>
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {course.scripture && (
                            <span className="text-[#D4A85C]/50 text-xs font-sans hidden sm:block">
                              {course.scripture}
                            </span>
                          )}
                          <span className="text-[#D4A85C]/30 text-xs font-sans whitespace-nowrap">
                            {course.credits} cr
                          </span>
                        </div>
                      </div>
                      <p className="text-white/35 text-sm font-sans leading-relaxed">{course.desc}</p>
                    </div>
                  </div>
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#D4A85C]/0 group-hover:bg-[#D4A85C]/40 transition-all duration-300 rounded-l-full" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="border-t border-white/8 py-24 px-6">
        <motion.div variants={rise()} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px w-10 bg-[#D4A85C]/40" />
            <span className="text-[#D4A85C] text-xs tracking-[0.25em] uppercase font-sans">2026 Cohort — Now Open</span>
            <div className="h-px w-10 bg-[#D4A85C]/40" />
          </div>
          <h2 className="text-4xl font-medium tracking-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
            Ready to Begin?
          </h2>
          <p className="text-white/40 text-base font-sans leading-relaxed mb-10">
            All 11 courses are included in your free enrolment. No selection required —
            Year 1 begins immediately, Year 2 unlocks after completion.
          </p>
          <Link href="/apply"
            className="inline-flex items-center gap-2.5 bg-[#D4A85C] hover:bg-[#C49848] text-[#080C14]
              font-bold text-sm px-9 py-4 rounded-full transition-all duration-300 font-sans
              hover:shadow-[0_0_40px_rgba(212,168,92,0.35)] hover:-translate-y-0.5">
            Apply Now — It&apos;s Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] bg-[#050810] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image src="/assets/logo.png" alt="S&D" width={28} height={28} className="rounded-lg opacity-70" />
            <span className="text-white/25 text-xs font-sans">S&D Prophetic Training School · Treasures in Clay Ministries</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-white/25 hover:text-white/60 text-xs font-sans transition-colors">Home</Link>
            <Link href="/apply" className="text-white/25 hover:text-[#D4A85C] text-xs font-sans transition-colors">Apply</Link>
            <Link href="/auth/login" className="text-white/25 hover:text-white/60 text-xs font-sans transition-colors">Student Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
