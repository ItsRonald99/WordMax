import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExercises } from '@/lib/openai'

// POST /api/exercises/[wordId] — regenerate exercises for a word.
// Always replaces existing exercises and resets spaced repetition progress.
export async function POST(
  _request: Request,
  { params }: { params: { wordId: string } }
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wordId } = params

    // Step 1: Verify word ownership
    const { data: word, error: wordError } = await supabase
      .from('words')
      .select('*')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single()

    if (wordError || !word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }

    // Step 2: Generate new exercises FIRST.
    // If OpenAI fails here, old exercises are still intact — nothing has been deleted yet.
    let newExercises
    try {
      newExercises = await generateExercises(word.word, word.sentence, word.context)
    } catch (aiError) {
      console.error('Exercise generation failed:', aiError)
      return NextResponse.json({ error: 'Failed to generate exercises' }, { status: 502 })
    }

    // Step 3: Delete old exercises (only reached after successful generation)
    const { error: deleteError } = await supabase
      .from('exercises')
      .delete()
      .eq('word_id', wordId)

    if (deleteError) {
      console.error('Exercise delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to replace exercises' }, { status: 500 })
    }

    // Step 4: Insert new exercises
    const { data: insertedExercises, error: insertError } = await supabase
      .from('exercises')
      .insert(
        newExercises.map((ex) => ({
          word_id: wordId,
          type: ex.type,
          question: ex.question,
          answer: ex.answer,
          explanation: ex.explanation,
        }))
      )
      .select()

    if (insertError) {
      console.error('Exercise insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save exercises' }, { status: 500 })
    }

    // Step 5: Reset spaced repetition progress.
    // Upsert handles both "row exists" (update) and "row missing" (insert) cases
    // using the unique constraint on (word_id, user_id).
    const { error: progressError } = await supabase
      .from('word_progress')
      .upsert(
        {
          word_id: wordId,
          user_id: user.id,
          interval: 1,
          next_review: new Date().toISOString(),
          last_reviewed: null,
        },
        { onConflict: 'word_id,user_id' }
      )

    if (progressError) {
      console.error('Progress reset error:', progressError)
      return NextResponse.json({ error: 'Failed to reset progress' }, { status: 500 })
    }

    return NextResponse.json({ exercises: insertedExercises }, { status: 200 })
  } catch (err) {
    console.error('POST /api/exercises/[wordId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
