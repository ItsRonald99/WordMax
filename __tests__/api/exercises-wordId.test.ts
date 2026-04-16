/**
 * @jest-environment node
 */
import { POST } from '@/app/api/exercises/[wordId]/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))

const mockGenerateExercises = jest.fn()
jest.mock('@/lib/openai', () => ({
  generateExercises: (...args: unknown[]) => mockGenerateExercises(...args),
}))

const mockParams = { params: { wordId: 'word-1' } }

const generatedExercises = [
  { type: 'fill_blank', question: 'New Q1', answer: 'ephemeral', explanation: 'Exp1' },
  { type: 'usage_scenario', question: 'New Q2', answer: 'Use it well.', explanation: 'Exp2' },
  { type: 'sentence_rewrite', question: 'New Q3', answer: 'Rewritten.', explanation: 'Exp3' },
]

const insertedExercises = generatedExercises.map((ex, i) => ({ ...ex, id: `new-ex-${i}`, word_id: 'word-1', created_at: '2024-01-01' }))

/**
 * Builds a Supabase mock that tracks the sequence of `from('exercises')` calls
 * so the first call gets the delete chain and the second gets the insert chain.
 */
function buildSupabaseMock({
  user = { id: 'user-1' } as { id: string } | null,
  word = { id: 'word-1', word: 'ephemeral', sentence: null, context: null } as object | null,
  deleteError = null as { message: string } | null,
  insertError = null as { message: string } | null,
  progressError = null as { message: string } | null,
} = {}) {
  let exercisesCallCount = 0

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'words') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: word, error: word ? null : { message: 'not found' } }),
        }
      }

      if (table === 'exercises') {
        exercisesCallCount++
        if (exercisesCallCount === 1) {
          // First call: delete chain  — .delete().eq('word_id', wordId)
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({ error: deleteError }),
            }),
          }
        } else {
          // Second call: insert chain — .insert([...]).select()
          return {
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockResolvedValue({
                data: insertedExercises,
                error: insertError,
              }),
            }),
          }
        }
      }

      if (table === 'word_progress') {
        return {
          upsert: jest.fn().mockResolvedValue({ error: progressError }),
        }
      }

      return {}
    }),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGenerateExercises.mockResolvedValue(generatedExercises)
})

describe('POST /api/exercises/[wordId] — regeneration', () => {
  describe('authentication & authorization', () => {
    it('returns 401 when not authenticated', async () => {
      ;(createClient as jest.Mock).mockReturnValue(buildSupabaseMock({ user: null }))
      const res = await POST(new Request('http://localhost'), mockParams)
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('returns 404 when word does not belong to the user', async () => {
      ;(createClient as jest.Mock).mockReturnValue(buildSupabaseMock({ word: null }))
      const res = await POST(new Request('http://localhost'), mockParams)
      expect(res.status).toBe(404)
      expect(await res.json()).toEqual({ error: 'Word not found' })
    })
  })

  describe('successful regeneration', () => {
    it('returns 200 with the new exercises', async () => {
      ;(createClient as jest.Mock).mockReturnValue(buildSupabaseMock())
      const res = await POST(new Request('http://localhost'), mockParams)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.exercises).toEqual(insertedExercises)
    })

    it('deletes existing exercises before inserting new ones', async () => {
      const mock = buildSupabaseMock()
      ;(createClient as jest.Mock).mockReturnValue(mock)
      await POST(new Request('http://localhost'), mockParams)

      // from('exercises') should have been called twice: delete then insert
      const exercisesCalls = mock.from.mock.calls.filter((c: string[]) => c[0] === 'exercises')
      expect(exercisesCalls).toHaveLength(2)
    })

    it('resets word_progress via upsert with interval=1 and next_review=now', async () => {
      const mock = buildSupabaseMock()
      ;(createClient as jest.Mock).mockReturnValue(mock)
      await POST(new Request('http://localhost'), mockParams)

      const progressFrom = mock.from.mock.results.find(
        (_: unknown, i: number) => mock.from.mock.calls[i][0] === 'word_progress'
      )
      expect(progressFrom).toBeDefined()

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const upsertCall = progressFrom!.value.upsert.mock.calls[0]
      expect(upsertCall[0]).toMatchObject({
        word_id: 'word-1',
        user_id: 'user-1',
        interval: 1,
        last_reviewed: null,
      })
      // next_review should be a recent ISO timestamp
      expect(new Date(upsertCall[0].next_review).getTime()).toBeGreaterThan(Date.now() - 5000)
      // Conflict target ensures no duplicate rows are created
      expect(upsertCall[1]).toEqual({ onConflict: 'word_id,user_id' })
    })

    it('creates word_progress when the row is missing (upsert handles both cases)', async () => {
      // Same mock — upsert is the single operation for create AND update
      const mock = buildSupabaseMock()
      ;(createClient as jest.Mock).mockReturnValue(mock)
      const res = await POST(new Request('http://localhost'), mockParams)
      expect(res.status).toBe(200)
      // Upsert was called exactly once
      const progressCalls = mock.from.mock.calls.filter((c: string[]) => c[0] === 'word_progress')
      expect(progressCalls).toHaveLength(1)
    })
  })

  describe('OpenAI failure — old exercises preserved', () => {
    it('returns 502 and does NOT delete existing exercises when generation fails', async () => {
      mockGenerateExercises.mockRejectedValue(new Error('OpenAI down'))
      const mock = buildSupabaseMock()
      ;(createClient as jest.Mock).mockReturnValue(mock)

      const res = await POST(new Request('http://localhost'), mockParams)
      expect(res.status).toBe(502)

      // delete must NOT have been called — old exercises are still intact
      const exercisesCalls = mock.from.mock.calls.filter((c: string[]) => c[0] === 'exercises')
      expect(exercisesCalls).toHaveLength(0)
    })
  })

  describe('database errors', () => {
    it('returns 500 when exercise deletion fails', async () => {
      ;(createClient as jest.Mock).mockReturnValue(
        buildSupabaseMock({ deleteError: { message: 'delete failed' } })
      )
      const res = await POST(new Request('http://localhost'), mockParams)
      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: 'Failed to replace exercises' })
    })

    it('returns 500 when exercise insertion fails', async () => {
      ;(createClient as jest.Mock).mockReturnValue(
        buildSupabaseMock({ insertError: { message: 'insert failed' } })
      )
      const res = await POST(new Request('http://localhost'), mockParams)
      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: 'Failed to save exercises' })
    })

    it('returns 500 when progress reset fails', async () => {
      ;(createClient as jest.Mock).mockReturnValue(
        buildSupabaseMock({ progressError: { message: 'upsert failed' } })
      )
      const res = await POST(new Request('http://localhost'), mockParams)
      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: 'Failed to reset progress' })
    })
  })
})
