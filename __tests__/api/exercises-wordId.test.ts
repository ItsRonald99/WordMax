/**
 * @jest-environment node
 */
import { POST } from '@/app/api/exercises/[wordId]/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))
jest.mock('@/lib/openai', () => ({
  generateExercises: jest.fn().mockResolvedValue([
    {
      type: 'fill_blank',
      question: 'The dew is ___.',
      answer: 'ephemeral',
      explanation: 'Short-lived.',
    },
  ]),
}))

const mockParams = { params: { wordId: 'word-1' } }

function buildSupabaseMock({
  user = { id: 'user-1' },
  word = { id: 'word-1', word: 'ephemeral', sentence: null, context: null },
  existingExercises = [] as { id: string }[],
  insertError = null,
}: {
  user?: { id: string } | null
  word?: object | null
  existingExercises?: { id: string }[]
  insertError?: { message: string } | null
} = {}) {
  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'words') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: word }),
        }
      }
      if (table === 'exercises') {
        // First call: check for existing exercises
        // Second call: insert new exercises
        const selectChain = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({ data: existingExercises }),
        }
        const insertChain = {
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: existingExercises,
              error: insertError,
            }),
          }),
        }
        // Return selectChain on first call, insertChain on subsequent
        let callCount = 0
        return new Proxy(
          {},
          {
            get(_, prop) {
              callCount++
              if (prop === 'select') return selectChain.select.bind(selectChain)
              if (prop === 'insert') return insertChain.insert.bind(insertChain)
              return undefined
            },
          }
        )
      }
      return {}
    }),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/exercises/[wordId]', () => {
  it('returns 401 when not authenticated', async () => {
    ;(createClient as jest.Mock).mockReturnValue(buildSupabaseMock({ user: null }))
    const req = new Request('http://localhost/api/exercises/word-1', { method: 'POST' })
    const res = await POST(req, mockParams)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 404 when word does not belong to the user', async () => {
    ;(createClient as jest.Mock).mockReturnValue(buildSupabaseMock({ word: null }))
    const req = new Request('http://localhost/api/exercises/word-1', { method: 'POST' })
    const res = await POST(req, mockParams)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Word not found' })
  })

  it('returns 409 when exercises already exist for the word', async () => {
    ;(createClient as jest.Mock).mockReturnValue(
      buildSupabaseMock({ existingExercises: [{ id: 'ex-1' }] })
    )
    const req = new Request('http://localhost/api/exercises/word-1', { method: 'POST' })
    const res = await POST(req, mockParams)
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: 'Exercises already exist for this word' })
  })
})
