import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// POST /api/admin/accept-student
// 1. Updates application status to 'accepted'
// 2. Creates Supabase auth user with temporary password
// 3. Sets profile role = 'student', enrollment_status = 'active'
// 4. Enrolls student in all published Year 1 courses
// 5. Sends welcome email with login credentials

export async function POST(req: NextRequest) {
  try {
    const { applicationId } = await req.json()

    // Auth — must be admin
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: adminProfile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (adminProfile?.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Fetch the application
    const { data: application, error: appError } = await supabase
      .from('applications').select('*').eq('id', applicationId).single()
    if (appError || !application)
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    if (application.status === 'accepted')
      return NextResponse.json({ error: 'Already accepted' }, { status: 400 })

    // Admin client (service role) to create auth users
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Generate a temporary password
    const tempPassword = `SandD-${Math.random().toString(36).slice(2, 8).toUpperCase()}-2025`

    // Create the auth user
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: application.email,
      password: tempPassword,
      email_confirm: true, // skip email confirmation
      user_metadata: { full_name: application.full_name },
    })
    if (createError) {
      // If user already exists, fetch their ID
      if (!createError.message.includes('already been registered')) throw createError
    }

    const studentId = newUser?.user?.id

    // Update profile (auto-created by trigger)
    if (studentId) {
      await adminSupabase.from('profiles').update({
        full_name: application.full_name,
        phone: application.phone,
        church: application.church,
        city: application.city,
        role: 'student',
        enrollment_status: 'active',
        current_year: 1,
      }).eq('id', studentId)

      // Auto-enroll in all published Year 1 courses
      const { data: year1Courses } = await adminSupabase
        .from('courses')
        .select('id')
        .eq('year', 1)
        .eq('is_published', true)

      if (year1Courses && year1Courses.length > 0) {
        const enrollments = year1Courses.map(c => ({
          student_id: studentId,
          course_id: c.id,
        }))
        await adminSupabase.from('enrollments').upsert(enrollments, {
          onConflict: 'student_id,course_id',
        })
      }
    }

    // Mark application as accepted
    await adminSupabase.from('applications').update({
      status: 'accepted',
      reviewed_at: new Date().toISOString(),
    }).eq('id', applicationId)

    // Send welcome email with credentials
    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'S&D Prophetic School <noreply@sandd.abiodunsule.uk>',
          to: [application.email],
          subject: 'You have been accepted — S&D Prophetic School',
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto;">
              <div style="background: #1E3A8A; padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
                <h1 style="color: white; font-size: 22px; margin: 0; font-family: Georgia, serif;">
                  Welcome to S&D Prophetic School
                </h1>
                <p style="color: #BFDBFE; font-size: 13px; margin: 8px 0 0;">
                  Sons &amp; Daughters of Prophets · Celestial Church of Christ
                </p>
              </div>
              <div style="background: #F8FAFF; padding: 28px; border: 1px solid #BFDBFE; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 15px; color: #1E3A8A; font-weight: 600;">
                  Dear ${application.full_name},
                </p>
                <p style="font-size: 14px; color: #475569; line-height: 1.7;">
                  It is with great joy that we inform you that your application to the Sons and Daughters of Prophets Prophetic Training School has been <strong style="color: #16A34A;">accepted</strong>.
                </p>
                <p style="font-size: 14px; color: #475569; line-height: 1.7;">
                  You have been enrolled in all Year 1 courses. Your student account has been created with the following credentials:
                </p>
                <div style="background: white; border: 1px solid #BFDBFE; border-radius: 10px; padding: 16px; margin: 16px 0;">
                  <table style="width: 100%; font-size: 14px;">
                    <tr>
                      <td style="color: #64748B; padding: 4px 0;">Login URL</td>
                      <td style="font-weight: 500; color: #1E3A8A;">
                        <a href="https://sandd.abiodunsule.uk/auth/login">sandd.abiodunsule.uk/auth/login</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; padding: 4px 0;">Email</td>
                      <td style="font-weight: 500;">${application.email}</td>
                    </tr>
                    <tr>
                      <td style="color: #64748B; padding: 4px 0;">Temp Password</td>
                      <td style="font-weight: 500; font-family: monospace; color: #1E40AF;">${tempPassword}</td>
                    </tr>
                  </table>
                </div>
                <p style="font-size: 13px; color: #94A3B8;">
                  Please change your password after your first login from your profile page.
                </p>
                <div style="margin-top: 20px; text-align: center;">
                  <a href="https://sandd.abiodunsule.uk/auth/login"
                    style="background: #1D4ED8; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 500; display: inline-block;">
                    Access Your Portal →
                  </a>
                </div>
                <p style="font-size: 14px; color: #475569; margin-top: 24px; line-height: 1.7;">
                  Begin with the Welcome Module on your dashboard. We are believing God for great things through your life.
                </p>
                <p style="font-size: 14px; color: #475569; margin-top: 16px;">
                  In His service,<br>
                  <strong style="color: #1E3A8A;">Prophet Abiodun Sule</strong><br>
                  <span style="color: #94A3B8; font-size: 12px;">Founder &amp; Dean, S&D Prophetic School</span>
                </p>
              </div>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({
      success: true,
      studentId,
      message: `${application.full_name} accepted and enrolled in Year 1`,
    })
  } catch (err: any) {
    console.error('accept-student error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
