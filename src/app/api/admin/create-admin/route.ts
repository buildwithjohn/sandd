import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Only super_admin can create new admins
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: caller } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (caller?.role !== "super_admin") {
      return NextResponse.json({ error: "Only super_admin can create admins" }, { status: 403 });
    }

    const { fullName, email, role, phone, church } = await req.json();
    if (!fullName || !email || !role) {
      return NextResponse.json({ error: "Name, email and role are required." }, { status: 400 });
    }
    if (!["admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Role must be admin or super_admin." }, { status: 400 });
    }

    const admin = createAdminClient();
    const cleanEmail = email.trim().toLowerCase();

    // Generate temporary password
    const tempPassword = `SandD-Admin-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Create auth user (skip confirmation email — we send our own)
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName.trim() },
    });

    if (createErr) {
      if (createErr.message.includes("already been registered") || createErr.message.includes("already exists")) {
        return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
      }
      throw createErr;
    }

    const newId = newUser?.user?.id;
    if (!newId) throw new Error("User created but no id returned.");

    // Upsert profile with admin role
    await admin.from("profiles").upsert({
      id: newId,
      email: cleanEmail,
      full_name: fullName.trim(),
      phone: phone || null,
      church: church || null,
      role,
      enrollment_status: "active",
      current_year: 1,
    }, { onConflict: "id" });

    // Auto-enroll admin in ALL existing courses (Year 1 + Year 2)
    const { data: allCourses } = await admin.from("courses").select("id");
    if (allCourses && allCourses.length > 0) {
      const rows = allCourses.map((c: any) => ({ student_id: newId, course_id: c.id }));
      await admin.from("enrollments").upsert(rows, { onConflict: "student_id,course_id" });
    }

    // Send welcome email
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "S&D Prophetic School <noreply@sandd.abiodunsule.uk>",
            to: [cleanEmail],
            subject: "Welcome — Admin access to S&D Prophetic School",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto;">
                <div style="background: #080C14; padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
                  <h1 style="color: #D4A85C; font-size: 22px; margin: 0; font-family: Georgia, serif;">
                    S&amp;D Prophetic School
                  </h1>
                  <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 8px 0 0;">
                    ${role === "super_admin" ? "Super Admin" : "Admin"} Access
                  </p>
                </div>
                <div style="background: #FBF7EE; padding: 28px; border: 1px solid #D4A85C33; border-top: none; border-radius: 0 0 12px 12px;">
                  <p style="font-size: 15px; color: #080C14; font-weight: 600;">
                    Dear ${fullName.trim()},
                  </p>
                  <p style="font-size: 14px; color: #444; line-height: 1.7;">
                    You have been granted ${role === "super_admin" ? "<strong>Super Admin</strong>" : "<strong>Admin</strong>"} access to the S&amp;D Prophetic School portal.
                  </p>
                  <p style="font-size: 14px; color: #444; line-height: 1.7;">
                    Your account credentials are below. Please change your password after your first login.
                  </p>
                  <div style="background: white; border: 1px solid #D4A85C55; border-radius: 10px; padding: 16px; margin: 16px 0;">
                    <table style="width: 100%; font-size: 14px;">
                      <tr>
                        <td style="color: #777; padding: 4px 0;">Portal</td>
                        <td><a href="https://sandd.abiodunsule.uk/auth/login" style="color: #D4A85C; font-weight: 600;">sandd.abiodunsule.uk/auth/login</a></td>
                      </tr>
                      <tr>
                        <td style="color: #777; padding: 4px 0;">Email</td>
                        <td style="font-weight: 500; color: #080C14;">${cleanEmail}</td>
                      </tr>
                      <tr>
                        <td style="color: #777; padding: 4px 0;">Password</td>
                        <td style="font-family: monospace; background: #FBF7EE; padding: 4px 8px; border-radius: 6px; color: #080C14; font-weight: 700;">${tempPassword}</td>
                      </tr>
                    </table>
                  </div>
                  <p style="font-size: 13px; color: #666; line-height: 1.6;">
                    Once logged in, you will have access to the Admin Panel. You can also click "View as Student" to experience and test the student journey.
                  </p>
                  <p style="font-size: 13px; color: #666; line-height: 1.6; margin-top: 18px;">
                    Welcome aboard.<br/>
                    <strong>Prophet Abiodun Sule</strong><br/>
                    Founder &amp; Dean
                  </p>
                </div>
              </div>
            `,
          }),
        });
      } catch (mailErr) {
        // Continue even if email fails
      }
    }

    return NextResponse.json({
      success: true,
      id: newId,
      email: cleanEmail,
      password: tempPassword,  // show in UI so super_admin can share manually if email fails
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
