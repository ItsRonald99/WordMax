import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExercises, validateWord } from '@/lib/openai'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { word, sentence, context } = body

    if (!word || typeof word !== 'string') {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 })
    }

    // Validate that the input is a real word before persisting anything.
    // Fails open on OpenAI error so a transient outage never blocks creation.
    const isValid = await validateWord(word.trim())
    if (!isValid) {
      return NextResponse.json(
        { error: `"${word.trim()}" doesn't appear to be a valid word. Please enter a real English word.` },
        { status: 400 }
      )
    }

    // Save the word first
    const { data: wordData, error: wordError } = await supabase
      .from('words')
      .insert({ user_id: user.id, word: word.trim(), sentence: sentence || null, context: context || null })
      .select()
      .single()

    if (wordError || !wordData) {
      console.error('Word insert error:', wordError)
      return NextResponse.json({ error: 'Failed to save word' }, { status: 500 })
    }

    // Generate exercises via OpenAI (fire and await — store in DB)
    try {
      const exercises = await generateExercises(word, sentence, context)

      await supabase.from('exercises').insert(
        exercises.map((ex) => ({
          word_id: wordData.id,
          type: ex.type,
          question: ex.question,
          answer: ex.answer,
          explanation: ex.explanation,
        }))
      )
    } catch (aiError) {
      // Word is saved; exercises failed. Non-fatal.
      console.error('Exercise generation failed:', aiError)
    }

    // Create initial word_progress entry (due immediately)
    await supabase.from('word_progress').insert({
      word_id: wordData.id,
      user_id: user.id,
      next_review: new Date().toISOString(),
      interval: 1,
    })

    return NextResponse.json({ word: wordData }, { status: 201 })
  } catch (err) {
    console.error('POST /api/words error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('words')
      .select('*, exercises(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ words: data })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
