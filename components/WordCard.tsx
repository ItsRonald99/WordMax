'use client'

import { useState } from 'react'
import { BookOpen, Calendar, Tag, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatRelativeDate, exerciseTypeLabel } from '@/lib/utils'
import type { Word } from '@/lib/types'

interface WordCardProps {
  word: Word
}

export function WordCard({ word }: WordCardProps) {
  const [expanded, setExpanded] = useState(false)
  const hasExercises = word.exercises && word.exercises.length > 0

  return (
    <Card className="group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Word */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-foreground tracking-tight capitalize">
                {word.word}
              </h3>
              {hasExercises ? (
                <Badge variant="violet" className="text-[10px]">
                  <Sparkles className="w-2.5 h-2.5 mr-1" />
                  {word.exercises!.length} exercises
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  No exercises
                </Badge>
              )}
            </div>

            {/* Sentence */}
            {word.sentence && (
              <p className="text-sm text-muted-foreground italic mb-2 leading-relaxed">
                &ldquo;{word.sentence}&rdquo;
              </p>
            )}

            {/* Context + date */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {word.context && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {word.context}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatRelativeDate(word.created_at)}
              </span>
            </div>
          </div>

          {/* Expand button */}
          {hasExercises && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8 text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Hide exercises' : 'Show exercises'}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Exercises preview */}
        {expanded && hasExercises && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            {word.exercises!.map((ex, i) => (
              <div key={ex.id} className="bg-slate-50 rounded-lg p-3">
                <p className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide mb-1">
                  {exerciseTypeLabel(ex.type)}
                </p>
                <p className="text-sm text-foreground">{ex.question}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
