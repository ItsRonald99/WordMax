import { validateWord } from '@/lib/openai'

// mockCreate must be declared with let and accessed via a lambda in the factory,
// because jest.mock() is hoisted before variable initializers run. A direct
// reference (create: mockCreate) would be in the TDZ when new OpenAI() is called
// at module-load time; a lambda defers access until the function is actually called.
let mockCreate: jest.Mock

jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    },
  }))
)

beforeEach(() => {
  mockCreate = jest.fn()
})

describe('validateWord', () => {
  it('returns true when OpenAI says the word is valid', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"isValid": true}' } }],
    })
    expect(await validateWord('ephemeral')).toBe(true)
  })

  it('returns false when OpenAI says the word is invalid', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"isValid": false}' } }],
    })
    expect(await validateWord('asdfghjkl')).toBe(false)
  })

  it('fails open (returns true) when OpenAI throws', async () => {
    mockCreate.mockRejectedValue(new Error('Network error'))
    expect(await validateWord('ephemeral')).toBe(true)
  })

  it('fails open when the response has no content', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: null } }] })
    expect(await validateWord('ephemeral')).toBe(true)
  })

  it('fails open when the response has empty choices', async () => {
    mockCreate.mockResolvedValue({ choices: [] })
    expect(await validateWord('ephemeral')).toBe(true)
  })

  it('calls OpenAI with temperature 0 and max_tokens 20', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"isValid": true}' } }],
    })
    await validateWord('test')
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0, max_tokens: 20 })
    )
  })

  it('includes the word in the prompt', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '{"isValid": true}' } }],
    })
    await validateWord('serendipity')
    const call = mockCreate.mock.calls[0][0]
    const userMessage = call.messages.find((m: { role: string }) => m.role === 'user')
    expect(userMessage.content).toContain('serendipity')
  })
})
