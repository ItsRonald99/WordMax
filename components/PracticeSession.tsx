'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Eye, ArrowRight, Trophy, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { exerciseTypeLabel } from '@/lib/utils'
import type { PracticeWord } from '@/lib/types'

interface PracticeSessionProps {
  words: PracticeWord[]
}

interface SessionItem {
  wordId: string
  wordText: string
  exerciseId: string
  type: string
  question: string
  answer: string
  explanation: string
}

export function PracticeSession({ words }: PracticeSessionProps) {
  const router = useRouter()

  // Flatten all exercises into a flat list
  const items: SessionItem[] = words.flatMap(({ word, exercises }) =>
    exercises.map((ex) => ({
      wordId: word.id,
      wordText: word.word,
      exerciseId: ex.id,
      type: ex.type,
      question: ex.question,
      answer: ex.answer,
      explanation: ex.explanation,
    }))
  )

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [score, setScore] = useState({ correct: 0, incorrect: 0 })
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [wordResults, setWordResults] = useState<Map<string, boolean[]>>(new Map())

  const current = items[index]
  const progress = items.length > 0 ? ((index) / items.length) * 100 : 0

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-violet-600" />
        </div>
        <h2 className="text-xl font-bold">All caught up!</h2>
        <p className="text-muted-foreground max-w-sm">
          No words are due for review right now. Come back later or add more words.
        </p>
        <Button onClick={() => router.push('/dashboard')} variant="outline">
          Go to Dashboard
        </Button>
      </div>
    )
  }

  if (done) {
    const total = score.correct + score.incorrect
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-violet-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Session complete!</h2>
          <p className="text-muted-foreground mt-1">Here&apos;s how you did</p>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-emerald-600">{score.correct}</span>
            <span className="text-sm text-muted-foreground">Correct</span>
          </div>
          <div className="w-px bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-red-500">{score.incorrect}</span>
            <span className="text-sm text-muted-foreground">Incorrect</span>
          </div>
          <div className="w-px bg-border" />
          <div className="flex flex-col items-center">
            <span className="text-3xl font-bold text-violet-600">{pct}%</span>
            <span className="text-sm text-muted-foreground">Score</span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
          <Button onClick={() => { setIndex(0); setRevealed(false); setScore({ correct: 0, incorrect: 0 }); setDone(false); setWordResults(new Map()) }}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Practice again
          </Button>
        </div>
      </div>
    )
  }

  async function submitWordResults(results: Map<string, boolean[]>) {
    // One request per word: correct only if all exercises were answered correctly
    await Promise.all(
      Array.from(results.entries()).map(([wordId, answers]) =>
        fetch(`/api/practice/${wordId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ correct: answers.every(Boolean) }),
        }).catch(() => {}) // Non-critical — don't block practice flow
      )
    )
  }

  async function markAnswer(correct: boolean) {
    if (submitting) return
    setSubmitting(true)

    // Accumulate this exercise's result under its word
    const updatedResults = new Map(wordResults)
    updatedResults.set(current.wordId, [...(updatedResults.get(current.wordId) ?? []), correct])
    setWordResults(updatedResults)

    setScore((prev) => ({
      correct: prev.correct + (correct ? 1 : 0),
      incorrect: prev.incorrect + (correct ? 0 : 1),
    }))

    if (index + 1 >= items.length) {
      await submitWordResults(updatedResults)
      setDone(true)
    } else {
      setIndex((i) => i + 1)
      setRevealed(false)
    }
    setSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {index + 1} / {items.length}
          </span>
          <span>
            {score.correct} correct · {score.incorrect} incorrect
          </span>
        </div>
        <Progress value={progress} />
      </div>

      {/* Exercise card */}
      <Card className="animate-fade-in">
        <CardContent className="p-6 space-y-5">
          {/* Meta */}
          <div className="flex items-center gap-2">
            <Badge variant="violet">{current.wordText}</Badge>
            <Badge variant="outline" className="text-xs">
              {exerciseTypeLabel(current.type)}
            </Badge>
          </div>

          {/* Question */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Question
            </p>
            <p className="text-base text-foreground leading-relaxed">{current.question}</p>
          </div>

          {/* Reveal button or answer */}
          {!revealed ? (
            <Button
              variant="outline"
              onClick={() => setRevealed(true)}
              className="w-full gap-2"
            >
              <Eye className="w-4 h-4" />
              Reveal Answer
            </Button>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">
                  Answer
                </p>
                <p className="text-sm text-emerald-900 font-medium">{current.answer}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Explanation
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{current.explanation}</p>
              </div>

              {/* Mark buttons */}
              <div className="flex gap-3 pt-1">
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-2"
                  disabled={submitting}
                  onClick={() => markAnswer(false)}
                >
                  <XCircle className="w-4 h-4" />
                  Needs work
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2"
                  disabled={submitting}
                  onClick={() => markAnswer(true)}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Got it!
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skip */}
      {!revealed && (
        <div className="flex justify-center">
          <button
            onClick={async () => {
              if (index + 1 >= items.length) {
                await submitWordResults(wordResults)
                setDone(true)
              } else {
                setIndex((i) => i + 1)
                setRevealed(false)
              }
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            Skip <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
