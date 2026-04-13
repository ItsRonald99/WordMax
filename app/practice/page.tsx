import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PracticeSession } from '@/components/PracticeSession'
import type { PracticeWord } from '@/lib/types'

export default async function PracticePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get words due for review (next_review <= now)
  const { data: dueProgress } = await supabase
    .from('word_progress')
    .select('word_id')
    .eq('user_id', user.id)
    .lte('next_review', new Date().toISOString())

  const dueWordIds = (dueProgress ?? []).map((p) => p.word_id)

  // Also include words that have never been reviewed (no progress record)
  // by fetching all words with exercises and filtering out ones with progress
  const { data: allWordIds } = await supabase
    .from('words')
    .select('id')
    .eq('user_id', user.id)

  const { data: progressWordIds } = await supabase
    .from('word_progress')
    .select('word_id')
    .eq('user_id', user.id)

  const progressSet = new Set((progressWordIds ?? []).map((p) => p.word_id))
  const neverReviewed = (allWordIds ?? [])
    .map((w) => w.id)
    .filter((id) => !progressSet.has(id))

  const practiceIds = [...new Set([...dueWordIds, ...neverReviewed])]

  if (practiceIds.length === 0) {
    return (
      <PracticeSession words={[]} />
    )
  }

  // Fetch words with exercises
  const { data: wordsData } = await supabase
    .from('words')
    .select('*, exercises(*)')
    .in('id', practiceIds)
    .eq('user_id', user.id)

  const practiceWords: PracticeWord[] = (wordsData ?? [])
    .filter((w) => w.exercises && w.exercises.length > 0)
    .map((w) => ({
      word: w,
      exercises: w.exercises,
    }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Practice</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {practiceWords.length > 0
            ? `${practiceWords.length} word${practiceWords.length !== 1 ? 's' : ''} to review`
            : 'No exercises ready yet'}
        </p>
      </div>
      <PracticeSession words={practiceWords} />
    </div>
  )
}
