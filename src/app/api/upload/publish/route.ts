import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID!
const BUNNY_API_KEY    = process.env.BUNNY_API_KEY!

// POST /api/upload/publish
// Called after the client finishes uploading the video to Bunny.net
export async function POST(req: NextRequest) {
  try {
    const { lessonId, bunnyVideoId, notesUrl } = await req.json()

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch video metadata from Bunny to get duration
    const bunnyRes = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${bunnyVideoId}`,
      { headers: { AccessKey: BUNNY_API_KEY } }
    )
    const bunnyMeta = bunnyRes.ok ? await bunnyRes.json() : null

    // Mark lesson as published in Supabase
    const { data: lesson, error } = await supabase
      .from('lessons')
      .update({
        is_published:      true,
        duration_seconds:  bunnyMeta?.length ?? null,
        video_url:         `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${bunnyVideoId}`,
        notes_url:         notesUrl ?? null,
      })
      .eq('id', lessonId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, lesson })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
