import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { Lock } from "lucide-react";

const year1 = [
  { icon: "📖", slug: "intro-nt-prophecy", title: "Introduction to NT Prophecy", desc: "Covers differences between Old and New Testament prophecy and the role of prophecy in the church.", credits: 3, scripture: "1 Cor. 14:3" },
  { icon: "🕊️", slug: "person-holy-spirit", title: "The Person & Work of the Holy Spirit", desc: "Explores the Holy Spirit's role in prophecy and discernment.", credits: 3, scripture: "John 14–16" },
  { icon: "📜", slug: "biblical-hermeneutics", title: "Biblical Hermeneutics", desc: "Teaches sound Bible interpretation to avoid reading meaning into the text.", credits: 3, scripture: "2 Tim. 2:15" },
  { icon: "⚠️", slug: "spirituality-vs-spiritism", title: "Spirituality vs. Spiritism", desc: "Addresses biblical warnings against spiritism and how to guard against it.", credits: 2, scripture: "1 John 4:1–6" },
  { icon: "🙏", slug: "prayer-intimacy", title: "Prayer & Intimacy with God", desc: "Cultivates a lifestyle of prayer, fasting, and worship as the foundation for prophetic ministry.", credits: 2, scripture: "Ps. 27:4" },
  { icon: "⚖️", slug: "character-ethics", title: "Character & Ethics in Prophetic Ministry", desc: "Emphasizes integrity, accountability, and holiness as requirements for prophetic service.", credits: 2, scripture: "1 Tim. 3:1–7" },
];

const year2 = [
  { icon: "🔥", slug: "advanced-prophetic", title: "Advanced Prophetic Ministry", desc: "Covers prophetic intercession, visions, and corporate prophecy in depth.", credits: 3, scripture: null },
  { icon: "🛡️", slug: "discernment-deliverance", title: "Discernment & Deliverance", desc: "Teaches spiritual warfare and the ministry of deliverance.", credits: 3, scripture: "Mark 16:17" },
  { icon: "✝️", slug: "new-covenant-theology", title: "Theology of the New Covenant", desc: "Explores grace, freedom in Christ, and the superiority of the New Covenant.", credits: 3, scripture: "Heb. 8:6–13" },
  { icon: "👑", slug: "leadership-prophetic", title: "Leadership in Prophetic Ministry", desc: "Prepares students to mentor others and serve alongside church leadership.", credits: 2, scripture: null },
  { icon: "🌍", slug: "prophetic-evangelism", title: "Prophetic Evangelism", desc: "Equips students to use prophetic gifts in outreach and evangelism.", credits: 2, scripture: "Acts 8:26–40" },
];

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-brand-900 text-4xl font-medium mb-3">Curriculum</h1>
          <p className="text-slate-500 text-base max-w-xl">
            A structured two-year program. Year 1 builds your biblical and spiritual
            foundation. Year 2 takes you into advanced prophetic ministry and leadership.
          </p>
        </div>

        {/* Year 1 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-brand-700 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              Year 1
            </div>
            <div className="text-slate-400 text-sm">Certificate in Prophetic Ministry · 15 credits</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {year1.map((c) => (
              <div key={c.slug} className="bg-white rounded-xl border border-blue-100 shadow-card hover:shadow-card-hover hover:border-brand-200 transition-all p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-xl">
                    {c.icon}
                  </div>
                  <span className="bg-brand-50 text-brand-600 text-[11px] font-medium px-2.5 py-1 rounded-full">
                    {c.credits} credits
                  </span>
                </div>
                <h3 className="text-brand-900 font-medium text-sm mb-1.5">{c.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">{c.desc}</p>
                {c.scripture && (
                  <div className="text-brand-400 text-[11px] font-medium border-t border-blue-50 pt-2.5">
                    {c.scripture}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Year 2 */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-slate-200 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <Lock className="w-3 h-3" /> Year 2
            </div>
            <div className="text-slate-400 text-sm">Diploma in NT Prophecy · 13 credits · Unlocks after Year 1</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {year2.map((c) => (
              <div key={c.slug} className="bg-white rounded-xl border border-slate-100 shadow-card p-5 opacity-70">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xl grayscale">
                    {c.icon}
                  </div>
                  <span className="bg-slate-50 text-slate-400 text-[11px] font-medium px-2.5 py-1 rounded-full">
                    {c.credits} credits
                  </span>
                </div>
                <h3 className="text-slate-500 font-medium text-sm mb-1.5">{c.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">{c.desc}</p>
                {c.scripture && (
                  <div className="text-slate-300 text-[11px] font-medium border-t border-slate-50 pt-2.5">
                    {c.scripture}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Practical components */}
        <div className="mt-10 bg-brand-950 rounded-2xl p-6">
          <h2 className="font-display text-brand-200 text-xl font-medium mb-4">Practical Components</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "Weekly", desc: "Prayer & worship sessions alongside video lessons" },
              { label: "Monthly", desc: "Prophetic activation exercises under supervision" },
              { label: "Annual", desc: "Prophetic retreat and conference" },
            ].map((p) => (
              <div key={p.label} className="bg-brand-900/50 border border-brand-800/50 rounded-xl p-4">
                <div className="text-brand-300 font-medium text-sm mb-1">{p.label}</div>
                <div className="text-brand-400 text-xs leading-relaxed">{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Apply CTA */}
        <div className="mt-6 flex items-center justify-center">
          <Link
            href="/apply"
            className="bg-brand-700 hover:bg-brand-800 text-white font-medium text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Apply Now — Tuition is Free
          </Link>
        </div>
      </div>
    </div>
  );
}
