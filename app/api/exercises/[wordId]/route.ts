import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExercises } from '@/lib/openai'

// POST /api/exercises/[wordId] — regenerate exercises for a word
export async function POST(
  _request: Request,
  { params }: { params: { wordId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wordId } = params

    // Fetch the word (verify ownership)
    const { data: word, error: wordError } = await supabase
      .from('words')
      .select('*')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single()

    if (wordError || !word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }

    // Check if exercises already exist
    const { data: existing } = await supabase
      .from('exercises')
      .select('id')
      .eq('word_id', wordId)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Exercises already exist for this word' }, { status: 409 })
    }

    // Generate and store exercises
    const exercises = await generateExercises(word.word, word.sentence, word.context)

    const { data: insertedExercises, error: insertError } = await supabase
      .from('exercises')
      .insert(
        exercises.map((ex) => ({
          word_id: wordId,
          type: ex.type,
          question: ex.question,
          answer: ex.answer,
          explanation: ex.explanation,
        }))
      )
      .select()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to save exercises' }, { status: 500 })
    }

    return NextResponse.json({ exercises: insertedExercises }, { status: 201 })
  } catch (err) {
    console.error('POST /api/exercises/[wordId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
