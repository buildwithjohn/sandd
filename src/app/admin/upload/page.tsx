"use client";
export const dynamic = 'force-dynamic';
import { useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle, Youtube, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const courses = [
  { slug: "intro-nt-prophecy",        label: "Introduction to NT Prophecy",        year: 1 },
  { slug: "person-holy-spirit",        label: "Person & Work of the Holy Spirit",   year: 1 },
  { slug: "biblical-hermeneutics",     label: "Biblical Hermeneutics",              year: 1 },
  { slug: "spirituality-vs-spiritism", label: "Spirituality vs. Spiritism",         year: 1 },
  { slug: "prayer-intimacy",           label: "Prayer & Intimacy with God",         year: 1 },
  { slug: "character-ethics",          label: "Character & Ethics",                 year: 1 },
  { slug: "advanced-prophetic",        label: "Advanced Prophetic Ministry",        year: 2 },
  { slug: "discernment-deliverance",   label: "Discernment & Deliverance",          year: 2 },
  { slug: "new-covenant-theology",     label: "Theology of the New Covenant",       year: 2 },
  { slug: "leadership-prophetic",      label: "Leadership in Prophetic Ministry",   year: 2 },
  { slug: "prophetic-evangelism",      label: "Prophetic Evangelism",               year: 2 },
];

function extractYouTubeId(input: string): string | null {
  // Handle full URLs and bare IDs
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

function AdminSidebar() {
  const links = [
    { href: "/admin/dashboard",         icon: "🏠", label: "Dashboard"    },
    { href: "/admin/applications",      icon: "📋", label: "Applications" },
    { href: "/admin/students",          icon: "👥", label: "Students"     },
    { href: "/admin/upload",            icon: "🎬", label: "Upload Video" },
    { href: "/admin/assignments",       icon: "📝", label: "Assignments"  },
    { href: "/admin/certificates",      icon: "🏅", label: "Certificates" },
    { href: "/admin/announcements/new", icon: "📢", label: "Announce"     },
  ];
  return (
    <aside className="w-52 flex-shrink-0 hidden lg:block">
      <nav className="bg-gray-900 border border-gray-800 rounded-2xl p-3 sticky top-24">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors">
            <span>{l.icon}</span>{l.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default function UploadVideoPage() {
  const router = useRouter();
  const [courseSlug, setCourseSlug] = useState("");
  const [title, setTitle]           = useState("");
  const [youtubeInput, setYoutube]  = useState("");
  const [orderIndex, setOrder]      = useState("1");
  const [saving, setSaving]         = useState(false);
  const [done, setDone]             = useState(false);

  const videoId = extractYouTubeId(youtubeInput);

  async function handlePublish() {
    if (!title || !courseSlug || !videoId) {
      toast.error("Please fill in all fields with a valid YouTube URL.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      // Get course id from slug
      const { data: course } = await supabase
        .from("courses").select("id").eq("slug", courseSlug).single();
      if (!course) throw new Error("Course not found");

      const { error } = await supabase.from("lessons").insert({
        course_id:        course.id,
        title,
        youtube_video_id: videoId,
        video_url:        `https://www.youtube.com/watch?v=${videoId}`,
        order_index:      parseInt(orderIndex),
        is_published:     true,
      });
      if (error) throw error;
      setDone(true);
      toast.success("Lesson published successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to publish lesson.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-brand-400" />
            <span className="font-display text-white text-sm font-semibold">S&D Admin — Upload Lesson</span>
          </div>
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-white text-sm">← Dashboard</Link>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex gap-6">
        <AdminSidebar />

        <main className="flex-1 min-w-0 max-w-xl">
          <div className="mb-6">
            <h1 className="font-display text-2xl text-white font-medium">Upload Video Lesson</h1>
            <p className="text-gray-500 text-sm mt-1">
              Upload your video to YouTube as <strong className="text-gray-300">Unlisted</strong>, then paste the link here.
            </p>
          </div>

          {/* How to upload guide */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Youtube className="w-4 h-4 text-red-400" />
              <span className="text-gray-300 text-sm font-medium">How to upload a lesson video</span>
            </div>
            <ol className="space-y-1.5 text-gray-400 text-xs">
              <li>1. Go to <a href="https://studio.youtube.com" target="_blank" className="text-brand-400 hover:text-brand-300">studio.youtube.com</a></li>
              <li>2. Click <strong className="text-gray-300">Upload Video</strong> → select your MP4 file</li>
              <li>3. Set visibility to <strong className="text-yellow-400">Unlisted</strong> (not Public, not Private)</li>
              <li>4. Copy the video URL and paste it below</li>
            </ol>
          </div>

          {done ? (
            <div className="bg-gray-900 border border-green-800 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-900/50 border border-green-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="font-display text-white text-xl font-medium mb-2">Lesson Published!</h2>
              <p className="text-gray-400 text-sm mb-5">Students can now watch this lesson.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => { setDone(false); setTitle(""); setYoutube(""); setOrder("1"); }}
                  className="bg-brand-700 hover:bg-brand-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-colors">
                  Upload Another
                </button>
                <Link href="/admin/dashboard"
                  className="border border-gray-700 text-gray-300 font-medium text-sm px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors">
                  Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              {/* Course */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Course *</label>
                <select value={courseSlug} onChange={e => setCourseSlug(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500">
                  <option value="">Select a course</option>
                  <optgroup label="Year 1">
                    {courses.filter(c => c.year === 1).map(c => (
                      <option key={c.slug} value={c.slug}>{c.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Year 2">
                    {courses.filter(c => c.year === 2).map(c => (
                      <option key={c.slug} value={c.slug}>{c.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Lesson Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. What is New Testament Prophecy?"
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                />
              </div>

              {/* YouTube URL */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">YouTube Video URL *</label>
                <input type="text" value={youtubeInput} onChange={e => setYoutube(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500"
                />
                {youtubeInput && (
                  <p className={`text-xs mt-1.5 flex items-center gap-1 ${videoId ? "text-green-400" : "text-red-400"}`}>
                    {videoId
                      ? <><CheckCircle className="w-3 h-3" /> Valid YouTube URL — ID: {videoId}</>
                      : <><AlertCircle className="w-3 h-3" /> Invalid YouTube URL</>
                    }
                  </p>
                )}
              </div>

              {/* Preview */}
              {videoId && (
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Preview</label>
                  <div className="rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* Lesson number */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide font-medium block mb-1.5">Lesson Number</label>
                <input type="number" min="0" value={orderIndex} onChange={e => setOrder(e.target.value)}
                  className="w-24 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500"
                />
                <p className="text-xs text-gray-600 mt-1">Use 0 for the Welcome Module</p>
              </div>

              <button onClick={handlePublish} disabled={saving || !videoId || !title || !courseSlug}
                className="w-full bg-brand-700 hover:bg-brand-600 disabled:opacity-40 text-white font-medium text-sm py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                <Youtube className="w-4 h-4" />
                {saving ? "Publishing..." : "Publish Lesson"}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
