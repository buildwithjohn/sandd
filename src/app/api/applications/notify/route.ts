import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// POST /api/applications/notify
// Called after a new application is inserted
// Sends email notification to admin via Resend (optional)

export async function POST(req: NextRequest) {
  try {
    const { applicationId } = await req.json();
    if (!applicationId) {
      return NextResponse.json({ error: "applicationId required" }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Fetch the application
    const { data: application, error } = await supabase
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // If Resend API key is configured, send email
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "S&D School <noreply@sandd.abiodunsule.uk>",
          to: ["admin@sandd.abiodunsule.uk"],
          subject: `New Application — ${application.full_name}`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto;">
              <div style="background: #1E3A8A; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; font-size: 20px; margin: 0;">New Application Received</h1>
                <p style="color: #BFDBFE; font-size: 14px; margin: 6px 0 0;">S&D Prophetic Training School</p>
              </div>
              <div style="background: #F8FAFF; padding: 24px; border: 1px solid #BFDBFE; border-top: none; border-radius: 0 0 12px 12px;">
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr><td style="padding: 6px 0; color: #64748B;">Name</td><td style="padding: 6px 0; font-weight: 500; color: #1E3A8A;">${application.full_name}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748B;">Email</td><td style="padding: 6px 0;">${application.email}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748B;">Church</td><td style="padding: 6px 0;">${application.church}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748B;">City</td><td style="padding: 6px 0;">${application.city ?? "—"}</td></tr>
                  <tr><td style="padding: 6px 0; color: #64748B;">Applied</td><td style="padding: 6px 0;">${new Date(application.applied_at).toLocaleDateString("en-NG", { dateStyle: "long" })}</td></tr>
                </table>
                <div style="margin-top: 20px;">
                  <a href="https://sandd.abiodunsule.uk/admin/applications"
                    style="background: #1D4ED8; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 500;">
                    Review Application →
                  </a>
                </div>
              </div>
            </div>
          `,
        }),
      });
    }

    // Also send confirmation email to the applicant
    if (RESEND_API_KEY) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "S&D Prophetic School <noreply@sandd.abiodunsule.uk>",
          to: [application.email],
          subject: "Application Received — S&D Prophetic School",
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto;">
              <div style="background: #1E3A8A; padding: 24px; border-radius: 12px 12px 0 0;">
                <h1 style="color: white; font-size: 20px; margin: 0;">Application Received</h1>
                <p style="color: #BFDBFE; font-size: 14px; margin: 6px 0 0;">Sons &amp; Daughters Prophetic Training School</p>
              </div>
              <div style="background: #F8FAFF; padding: 24px; border: 1px solid #BFDBFE; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 15px; color: #1E3A8A; font-weight: 500;">Dear ${application.full_name},</p>
                <p style="font-size: 14px; color: #475569; line-height: 1.7; margin-top: 10px;">
                  Thank you for applying to the S&amp;D Prophetic Training School. Your application has been received and is currently under review by the admissions committee.
                </p>
                <p style="font-size: 14px; color: #475569; line-height: 1.7;">
                  You will receive an email notification once a decision has been made. In the meantime, please continue to pray and seek the Lord regarding this calling.
                </p>
                <p style="font-size: 14px; color: #475569; margin-top: 16px;">In His service,<br><strong style="color: #1E3A8A;">Prophet Abiodun Sule</strong><br><span style="color: #94A3B8;">Founder & Dean, S&D Prophetic School</span></p>
              </div>
            </div>
          `,
        }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Notification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
