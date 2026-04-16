import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Repeat2, BookOpen, Sparkles, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { WordCard } from '@/components/WordCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Word } from '@/lib/types'

async function getStats(supabase: ReturnType<typeof createClient>, userId: string) {
  const [{ count: totalWords }, { count: dueCount }] = await Promise.all([
    supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabase
      .from('word_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .lte('next_review', new Date().toISOString()),
  ])
  return { totalWords: totalWords ?? 0, dueCount: dueCount ?? 0 }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ totalWords, dueCount }, wordsResult] = await Promise.all([
    getStats(supabase, user.id),
    supabase
      .from('words')
      .select('*, exercises(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  const words = (wordsResult.data ?? []) as Word[]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Dictionary</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {totalWords === 0
              ? 'Add your first word to get started.'
              : `${totalWords} word${totalWords !== 1 ? 's' : ''} saved`}
          </p>
        </div>
        <Button asChild>
          <Link href="/add" className="gap-2 shrink-0">
            <Plus className="w-4 h-4" />
            Add word
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalWords}</p>
              <p className="text-xs text-muted-foreground">Total words</p>
            </div>
          </CardContent>
        </Card>

        <Link href="/practice" className="block group/card">
          <Card className="transition-shadow hover:shadow-md cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <Repeat2 className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{dueCount}</p>
                <p className="text-xs text-muted-foreground">Due for review</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="col-span-2 md:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {words.filter((w) => w.exercises && w.exercises.length > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">With exercises</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Due for review CTA */}
      {dueCount > 0 && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-violet-900">
                  {dueCount} word{dueCount !== 1 ? 's' : ''} ready to practice
                </p>
                <p className="text-xs text-violet-600">Keep your streak going</p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-violet-600 hover:bg-violet-700 shrink-0">
              <Link href="/practice">Practice now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Word list */}
      {words.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">No words yet</h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-xs">
            Start building your personal dictionary. Add a word you&apos;ve encountered recently.
          </p>
          <Button asChild>
            <Link href="/add" className="gap-2">
              <Plus className="w-4 h-4" />
              Add your first word
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-1">
          {words.map((word) => (
            <WordCard key={word.id} word={word} />
          ))}
        </div>
      )}
    </div>
  )
}
