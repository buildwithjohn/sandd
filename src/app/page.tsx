import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  BookOpen, Users, Award, Clock, ChevronRight,
  Star, Shield, Heart, Zap
} from "lucide-react";

const courses = [
  { icon: "📖", title: "Introduction to NT Prophecy", credits: 3, year: 1 },
  { icon: "🕊️", title: "The Person & Work of the Holy Spirit", credits: 3, year: 1 },
  { icon: "📜", title: "Biblical Hermeneutics", credits: 3, year: 1 },
  { icon: "⚠️", title: "Spirituality vs. Spiritism", credits: 2, year: 1 },
  { icon: "🙏", title: "Prayer & Intimacy with God", credits: 2, year: 1 },
  { icon: "⚖️", title: "Character & Ethics", credits: 2, year: 1 },
];

const values = [
  { icon: Star, title: "Biblical Foundation", desc: "Every course is anchored in Scripture, not tradition or emotion." },
  { icon: Shield, title: "Discernment First", desc: "Students are trained to test every spirit before ministering." },
  { icon: Heart, title: "Character Over Gift", desc: "Holiness and integrity are treated as prerequisites, not afterthoughts." },
  { icon: Zap, title: "Practical Formation", desc: "Monthly activations and retreats bring the classroom to real life." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />

      {/* HERO */}
      <section className="bg-brand-950 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 50%, #3B82F6 0%, transparent 60%), radial-gradient(circle at 80% 20%, #60A5FA 0%, transparent 50%)" }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-800/60 border border-brand-700/50 text-brand-200 text-xs font-medium px-4 py-2 rounded-full mb-6 tracking-wider uppercase">
            <span>Celestial Church of Christ</span>
            <span className="w-1 h-1 rounded-full bg-brand-400 inline-block" />
            <span>Prophetic Training School</span>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl text-white font-medium leading-[1.1] mb-6">
            Raising{" "}
            <span className="text-brand-300">New Testament</span>
            <br />
            Prophets for This Age
          </h1>
          <p className="text-brand-200 text-lg max-w-xl mx-auto leading-relaxed mb-10">
            A two-year prophetic training school rooted in the Word, led by the
            Spirit, and accountable to the Body of Christ. Free tuition. Real formation.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/apply"
              className="bg-brand-500 hover:bg-brand-400 text-white font-medium text-sm px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              Apply for 2025 Cohort <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              href="/courses"
              className="bg-white/10 hover:bg-white/20 text-white font-medium text-sm px-6 py-3 rounded-xl transition-colors border border-white/20"
            >
              View Curriculum
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-brand-800/60 bg-brand-900/60">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Program Duration", value: "2 Years" },
              { label: "Core Courses", value: "10+" },
              { label: "Annual Retreats", value: "2" },
              { label: "Tuition", value: "Free" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-2xl text-brand-200 font-semibold">{s.value}</div>
                <div className="text-brand-400 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WELCOME MODULE CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="bg-brand-700 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div>
            <div className="text-brand-100 text-xs font-medium uppercase tracking-wider mb-1">Before You Begin</div>
            <h3 className="font-display text-white text-xl font-medium">
              A Welcome from Prophet Abiodun Sule
            </h3>
            <p className="text-brand-200 text-sm mt-1">Watch the Dean introduce the heart and vision of S&D School.</p>
          </div>
          <Link
            href="/portal/dashboard"
            className="bg-white text-brand-700 font-medium text-sm px-5 py-2.5 rounded-xl flex-shrink-0 hover:bg-brand-50 transition-colors"
          >
            Watch Welcome Video
          </Link>
        </div>
      </section>

      {/* ABOUT PROPHET */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-16 h-16 rounded-2xl bg-brand-700 flex items-center justify-center font-display text-2xl text-white font-bold flex-shrink-0">
            AS
          </div>
          <div>
            <div className="text-brand-500 text-xs font-medium uppercase tracking-wider mb-1">Founder & Dean</div>
            <h2 className="font-display text-brand-900 text-2xl font-medium mb-2">
              Prophet Abiodun Sule
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed max-w-2xl">
              Under the authority of the Celestial Church of Christ, Prophet Abiodun Sule
              founded the Sons and Daughters of Prophets Prophetic Training School with one
              conviction: that the church needs prophets who are not merely gifted, but
              biblically grounded, spiritually discerning, and deeply accountable.
            </p>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <h2 className="font-display text-brand-900 text-2xl font-medium mb-6">
          Our Core Distinctives
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {values.map((v) => (
            <div key={v.title} className="bg-white rounded-xl border border-blue-100 shadow-card p-5 flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center flex-shrink-0">
                <v.icon className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h3 className="text-brand-900 font-medium text-sm mb-1">{v.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* COURSE PREVIEW */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-brand-900 text-2xl font-medium">Year 1 Courses</h2>
          <Link href="/courses" className="text-brand-600 text-sm font-medium hover:text-brand-700 flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <div key={c.title} className="bg-white rounded-xl border border-blue-100 shadow-card p-4 hover:shadow-card-hover hover:border-brand-200 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-lg">
                  {c.icon}
                </div>
                <span className="bg-brand-50 text-brand-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                  {c.credits} credits
                </span>
              </div>
              <p className="text-brand-900 font-medium text-sm leading-snug">{c.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FOOTER BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-10 mb-16">
        <div className="bg-brand-950 rounded-2xl p-8 text-center">
          <h2 className="font-display text-white text-2xl sm:text-3xl font-medium mb-3">
            Is God calling you to be a prophet?
          </h2>
          <p className="text-brand-300 text-sm mb-6 max-w-md mx-auto">
            Applications are open for the 2025 cohort. Tuition is free. All you need is a genuine calling and a willing heart.
          </p>
          <Link
            href="/apply"
            className="bg-brand-500 hover:bg-brand-400 text-white font-medium text-sm px-6 py-3 rounded-xl inline-flex items-center gap-2 transition-colors"
          >
            Start Your Application <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
