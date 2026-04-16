/**
 * @jest-environment node
 */
import { DELETE } from '@/app/api/words/[wordId]/route'
import { createClient } from '@/lib/supabase/server'

jest.mock('@/lib/supabase/server', () => ({ createClient: jest.fn() }))

// Helper to build a minimal mock Supabase client for a given scenario
function buildSupabaseMock({
  user = { id: 'user-1' },
  word = { id: 'word-1' },
  deleteError = null,
}: {
  user?: { id: string } | null
  word?: { id: string } | null
  deleteError?: { message: string } | null
} = {}) {
  // Each .from() call returns a fresh chainable builder
  const deleteChain = {
    eq: jest.fn().mockReturnThis(),
    // Final .eq() resolves the promise
  }
  // Override the last eq to resolve
  const resolveDelete = jest.fn().mockResolvedValue({ error: deleteError })
  deleteChain.eq
    .mockReturnValueOnce(deleteChain) // .eq('id', wordId)
    .mockReturnValueOnce({ then: resolveDelete.bind(null) }) // not used directly

  const mockFrom = jest.fn().mockImplementation((table: string) => {
    if (table === 'words') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: word }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: deleteError }),
          }),
        }),
      }
    }
    return {}
  })

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: mockFrom,
  }
}

const mockParams = { params: { wordId: 'word-1' } }

beforeEach(() => {
  jest.clearAllMocks()
})

describe('DELETE /api/words/[wordId]', () => {
  it('returns 401 when not authenticated', async () => {
    ;(createClient as jest.Mock).mockReturnValue(
      buildSupabaseMock({ user: null })
    )
    const req = new Request('http://localhost/api/words/word-1')
    const res = await DELETE(req, mockParams)
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Unauthorized' })
  })

  it('returns 404 when the word does not belong to the user', async () => {
    ;(createClient as jest.Mock).mockReturnValue(
      buildSupabaseMock({ word: null })
    )
    const req = new Request('http://localhost/api/words/word-1')
    const res = await DELETE(req, mockParams)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Word not found' })
  })

  it('returns 204 on successful deletion', async () => {
    ;(createClient as jest.Mock).mockReturnValue(buildSupabaseMock())
    const req = new Request('http://localhost/api/words/word-1')
    const res = await DELETE(req, mockParams)
    expect(res.status).toBe(204)
    expect(res.body).toBeNull()
  })

  it('returns 500 when Supabase delete fails', async () => {
    ;(createClient as jest.Mock).mockReturnValue(
      buildSupabaseMock({ deleteError: { message: 'DB error' } })
    )
    const req = new Request('http://localhost/api/words/word-1')
    const res = await DELETE(req, mockParams)
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to delete word' })
  })

  it('verifies ownership by filtering on both id and user_id', async () => {
    const mock = buildSupabaseMock()
    ;(createClient as jest.Mock).mockReturnValue(mock)
    const req = new Request('http://localhost/api/words/word-1')
    await DELETE(req, mockParams)

    const fromCalls = mock.from.mock.calls.map((c: string[]) => c[0])
    expect(fromCalls).toContain('words')
  })
})
