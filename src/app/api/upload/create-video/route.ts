import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID!
const BUNNY_API_KEY    = process.env.BUNNY_API_KEY!
const BUNNY_BASE_URL   = `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}`

// ── Step 1: Create a video slot on Bunny.net ─────────────────────────────────
// POST /api/upload/create-video
export async function POST(req: NextRequest) {
  try {
    const { title, courseId, orderIndex } = await req.json()

    // Auth check
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Create video on Bunny
    const bunnyRes = await fetch(`${BUNNY_BASE_URL}/videos`, {
      method: 'POST',
      headers: {
        'AccessKey': BUNNY_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    })

    if (!bunnyRes.ok) {
      const err = await bunnyRes.text()
      throw new Error(`Bunny API error: ${err}`)
    }

    const bunnyVideo = await bunnyRes.json()

    // Save lesson stub to Supabase (unpublished until upload completes)
    const { data: lesson, error: dbError } = await supabase
      .from('lessons')
      .insert({
        course_id:       courseId,
        title,
        bunny_video_id:  bunnyVideo.guid,
        order_index:     orderIndex ?? 99,
        is_published:    false,
      })
      .select()
      .single()

    if (dbError) throw dbError

    return NextResponse.json({
      lessonId:      lesson.id,
      bunnyVideoId:  bunnyVideo.guid,
      uploadUrl:     `${BUNNY_BASE_URL}/videos/${bunnyVideo.guid}`,
      // The client will PUT the raw video bytes to this URL with the API key header
    })
  } catch (err: any) {
    console.error('create-video error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
