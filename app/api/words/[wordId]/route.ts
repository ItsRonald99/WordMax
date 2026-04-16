import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
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

    // Verify the word belongs to this user before touching anything
    const { data: word } = await supabase
      .from('words')
      .select('id')
      .eq('id', wordId)
      .eq('user_id', user.id)
      .single()

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 })
    }

    // Delete the word. ON DELETE CASCADE in schema handles exercises,
    // reviews, and word_progress automatically.
    const { error } = await supabase
      .from('words')
      .delete()
      .eq('id', wordId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Word delete error:', error)
      return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error('DELETE /api/words/[wordId] error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
