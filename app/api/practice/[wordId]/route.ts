import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addDays } from 'date-fns'

// POST /api/practice/[wordId] — record review result + update spaced repetition
export async function POST(
  request: Request,
  { params }: { params: { wordId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wordId } = params
    const { correct } = await request.json()

    if (typeof correct !== 'boolean') {
      return NextResponse.json({ error: 'correct (boolean) is required' }, { status: 400 })
    }

    const now = new Date()

    // Insert review record
    await supabase.from('reviews').insert({
      word_id: wordId,
      user_id: user.id,
      correct,
      reviewed_at: now.toISOString(),
    })

    // Get current progress
    const { data: progress } = await supabase
      .from('word_progress')
      .select('*')
      .eq('word_id', wordId)
      .eq('user_id', user.id)
      .single()

    if (progress) {
      // Update spaced repetition interval
      const newInterval = correct
        ? Math.min(progress.interval * 2, 365) // Cap at 1 year
        : 1
      const nextReview = addDays(now, newInterval)

      await supabase
        .from('word_progress')
        .update({
          last_reviewed: now.toISOString(),
          next_review: nextReview.toISOString(),
          interval: newInterval,
        })
        .eq('id', progress.id)
    } else {
      // Create progress record if it doesn't exist yet
      const newInterval = correct ? 2 : 1
      const nextReview = addDays(now, newInterval)

      await supabase.from('word_progress').insert({
        word_id: wordId,
        user_id: user.id,
        last_reviewed: now.toISOString(),
        next_review: nextReview.toISOString(),
        interval: newInterval,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('POST /api/practice/[wordId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
