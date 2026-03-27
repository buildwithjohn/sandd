"use client";
import Navbar from "@/components/layout/Navbar";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import { CheckCircle, Upload } from "lucide-react";

const schema = z.object({
  full_name: z.string().min(3, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  church: z.string().min(3, "Church name is required"),
  city: z.string().min(2, "City is required"),
  testimony: z.string().min(500, "Testimony must be at least 500 words"),
});

type FormValues = z.infer<typeof schema>;

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recFile, setRecFile] = useState<File | null>(null);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const testimonyValue = watch("testimony") || "";
  const wordCount = testimonyValue.trim().split(/\s+/).filter(Boolean).length;

  async function onSubmit(data: FormValues) {
    setLoading(true);
    try {
      const supabase = createClient();
      let recommendation_url: string | null = null;

      // Upload recommendation letter if provided
      if (recFile) {
        const fileName = `recommendations/${Date.now()}-${recFile.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("applications")
          .upload(fileName, recFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("applications").getPublicUrl(fileName);
        recommendation_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("applications").insert({
        ...data,
        recommendation_url,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F8FAFF]">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="font-display text-brand-900 text-3xl font-medium mb-3">
            Application Received
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Thank you for applying to S&D Prophetic School. Your application has been
            submitted and is under review by the admissions committee. You will receive
            an email once a decision has been made.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="bg-brand-950 rounded-2xl p-8 text-center mb-8">
          <h1 className="font-display text-white text-3xl font-medium mb-2">
            Apply to S&D Prophetic School
          </h1>
          <p className="text-brand-300 text-sm leading-relaxed">
            Applications open for the 2025 cohort (20–50 students).
            <br />Tuition is completely free. All you need is a genuine calling.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-blue-100 shadow-card p-6 sm:p-8">
          <h2 className="font-display text-brand-900 text-xl font-medium mb-6">
            Application Form
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                  First Name
                </label>
                <input
                  {...register("full_name")}
                  placeholder="Oluwaseun"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
                {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                  Last Name
                </label>
                <input
                  placeholder="Adeyemi"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Email Address</label>
              <input {...register("email")} type="email" placeholder="your@email.com"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Phone Number</label>
              <input {...register("phone")} type="tel" placeholder="+234 801 234 5678"
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">Church / Parish</label>
                <input {...register("church")} placeholder="CCC Lagos Parish"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
                {errors.church && <p className="text-red-400 text-xs mt-1">{errors.church.message}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">City</label>
                <input {...register("city")} placeholder="Lagos"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors"
                />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
              </div>
            </div>

            {/* Testimony */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Testimony of Prophetic Calling
              </label>
              <p className="text-slate-400 text-xs mb-2">
                Share how God revealed your prophetic calling. Minimum 500 words.
              </p>
              <textarea
                {...register("testimony")}
                rows={8}
                placeholder="Begin your testimony here..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-brand-400 transition-colors resize-none"
              />
              <div className={`text-xs mt-1 ${wordCount >= 500 ? "text-green-500" : "text-slate-400"}`}>
                {wordCount} / 500 words minimum {wordCount >= 500 && "✓"}
              </div>
              {errors.testimony && <p className="text-red-400 text-xs mt-1">{errors.testimony.message}</p>}
            </div>

            {/* Recommendation upload */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1.5">
                Pastor&apos;s Recommendation Letter
              </label>
              <label className="border-2 border-dashed border-blue-200 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer hover:border-brand-400 bg-brand-50/40 transition-colors">
                <Upload className="w-5 h-5 text-brand-400" />
                <span className="text-brand-600 text-sm font-medium">
                  {recFile ? recFile.name : "Upload PDF or Word Document"}
                </span>
                <span className="text-slate-400 text-xs">Drag and drop, or click to browse</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setRecFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-700 hover:bg-brand-800 disabled:opacity-60 text-white font-medium text-sm py-3 rounded-xl transition-colors"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
