'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'

export function AddWordForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const wordRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ word: '', sentence: '', context: '' })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.word.trim()) return

    setLoading(true)
    try {
      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: form.word.trim().toLowerCase(),
          sentence: form.sentence.trim() || null,
          context: form.context.trim() || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to add word')
      }

      toast({
        title: 'Word added!',
        description: `"${form.word}" was saved and exercises were generated.`,
        variant: 'success',
      })

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Add a new word</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Add context to get better AI exercises.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="word">
                Word <span className="text-red-500">*</span>
              </Label>
              <Input
                ref={wordRef}
                id="word"
                name="word"
                placeholder="e.g. ephemeral"
                value={form.word}
                onChange={handleChange}
                required
                autoFocus
                autoCapitalize="none"
                autoCorrect="off"
                className="text-base"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sentence">
                Sentence{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="sentence"
                name="sentence"
                placeholder="e.g. The morning dew is ephemeral, gone before noon."
                value={form.sentence}
                onChange={handleChange}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Include the word in context — AI uses this to craft better exercises.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="context">
                Where did you encounter it?{' '}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="context"
                name="context"
                placeholder="e.g. Philosophy book, podcast, conversation"
                value={form.context}
                onChange={handleChange}
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={!form.word.trim() || loading} className="w-full gap-2">
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating exercises…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Save &amp; Generate Exercises
                  </>
                )}
              </Button>
              {loading && (
                <p className="text-xs text-center text-muted-foreground mt-2">
                  This usually takes 5–10 seconds
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
