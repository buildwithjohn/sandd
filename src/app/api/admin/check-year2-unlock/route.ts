import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// POST /api/admin/check-year2-unlock
// Called after a lesson is marked complete
// Checks if student has completed ALL Year 1 courses → unlocks Year 2

export async function POST(req: NextRequest) {
  try {
    const { studentId } = await req.json()
    if (!studentId) return NextResponse.json({ error: 'studentId required' }, { status: 400 })

    const supabase = createServerSupabaseClient()

    // Get all published Year 1 courses
    const { data: year1Courses } = await supabase
      .from('courses')
      .select('id')
      .eq('year', 1)
      .eq('is_published', true)

    if (!year1Courses || year1Courses.length === 0)
      return NextResponse.json({ unlocked: false, reason: 'No Year 1 courses found' })

    // For each Year 1 course, check that all published lessons are completed
    let allComplete = true

    for (const course of year1Courses) {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', course.id)
        .eq('is_published', true)

      if (!lessons || lessons.length === 0) continue

      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('id')
        .eq('student_id', studentId)
        .eq('status', 'completed')
        .in('lesson_id', lessons.map(l => l.id))

      if ((completedLessons?.length ?? 0) < lessons.length) {
        allComplete = false
        break
      }
    }

    if (!allComplete) {
      return NextResponse.json({ unlocked: false, reason: 'Year 1 not yet complete' })
    }

    // Year 1 complete — enroll student in Year 2 courses
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: year2Courses } = await adminSupabase
      .from('courses')
      .select('id')
      .eq('year', 2)
      .eq('is_published', true)

    if (year2Courses && year2Courses.length > 0) {
      await adminSupabase.from('enrollments').upsert(
        year2Courses.map(c => ({ student_id: studentId, course_id: c.id })),
        { onConflict: 'student_id,course_id' }
      )
    }

    // Update profile to Year 2
    await adminSupabase.from('profiles')
      .update({ current_year: 2 })
      .eq('id', studentId)

    // Mark all Year 1 enrollments as completed
    await adminSupabase.from('enrollments')
      .update({ completed_at: new Date().toISOString() })
      .eq('student_id', studentId)
      .in('course_id', year1Courses.map(c => c.id))

    // Send congratulations email
    const { data: profile } = await adminSupabase
      .from('profiles').select('full_name, email').eq('id', studentId).single()

    const RESEND_API_KEY = process.env.RESEND_API_KEY
    if (RESEND_API_KEY && profile) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'S&D Prophetic School <noreply@sandd.abiodunsule.uk>',
          to: [profile.email],
          subject: 'Congratulations — Year 2 Unlocked!',
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 520px; margin: 0 auto;">
              <div style="background: #1E3A8A; padding: 28px; border-radius: 12px 12px 0 0; text-align: center;">
                <div style="font-size: 36px; margin-bottom: 8px;">🎉</div>
                <h1 style="color: white; font-size: 22px; margin: 0; font-family: Georgia, serif;">
                  Year 1 Complete!
                </h1>
              </div>
              <div style="background: #F8FAFF; padding: 28px; border: 1px solid #BFDBFE; border-top: none; border-radius: 0 0 12px 12px;">
                <p style="font-size: 15px; color: #1E3A8A; font-weight: 600;">Dear ${profile.full_name},</p>
                <p style="font-size: 14px; color: #475569; line-height: 1.7;">
                  Congratulations! You have successfully completed all Year 1 courses of the S&D Prophetic Training School. This is a significant milestone in your prophetic journey.
                </p>
                <p style="font-size: 14px; color: #475569; line-height: 1.7;">
                  <strong style="color: #1E3A8A;">Year 2 has now been unlocked</strong> on your student portal. You may now access the advanced courses including Discernment &amp; Deliverance, Advanced Prophetic Ministry, and Prophetic Evangelism.
                </p>
                <div style="margin-top: 20px; text-align: center;">
                  <a href="https://sandd.abiodunsule.uk/portal/courses"
                    style="background: #1D4ED8; color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-size: 14px; font-weight: 500;">
                    Access Year 2 Courses →
                  </a>
                </div>
                <p style="font-size: 14px; color: #475569; margin-top: 20px; line-height: 1.7;">
                  Well done, good and faithful servant. Keep pressing forward.<br><br>
                  In His service,<br>
                  <strong style="color: #1E3A8A;">Prophet Abiodun Sule</strong>
                </p>
              </div>
            </div>
          `,
        }),
      })
    }

    return NextResponse.json({
      unlocked: true,
      enrolledInYear2: year2Courses?.length ?? 0,
      message: `Year 2 unlocked for ${profile?.full_name}`,
    })
  } catch (err: any) {
    console.error('check-year2-unlock error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
