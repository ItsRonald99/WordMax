import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { AddWordForm } from '@/components/AddWordForm'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockToast = jest.fn()
jest.mock('@/components/ui/use-toast', () => ({
  toast: (...args: unknown[]) => mockToast(...args),
}))

const mockPush = jest.fn()
const mockRefresh = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh })
  global.fetch = jest.fn()
})

function mockFetchSuccess() {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ word: { id: 'word-1', word: 'ephemeral' } }),
  })
}

function mockFetchError(message = 'Failed to add word') {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: false,
    json: () => Promise.resolve({ error: message }),
  })
}

describe('AddWordForm', () => {
  describe('rendering', () => {
    it('renders the word input', () => {
      render(<AddWordForm />)
      expect(screen.getByLabelText(/word/i)).toBeInTheDocument()
    })

    it('renders the sentence textarea', () => {
      render(<AddWordForm />)
      expect(screen.getByLabelText(/sentence/i)).toBeInTheDocument()
    })

    it('renders the context input', () => {
      render(<AddWordForm />)
      expect(screen.getByLabelText(/where did you encounter it/i)).toBeInTheDocument()
    })

    it('renders the submit button', () => {
      render(<AddWordForm />)
      expect(screen.getByRole('button', { name: /save & generate exercises/i })).toBeInTheDocument()
    })

    it('renders a back link to /dashboard', () => {
      render(<AddWordForm />)
      expect(screen.getByRole('link', { name: /back to dashboard/i })).toHaveAttribute('href', '/dashboard')
    })
  })

  describe('submit button state', () => {
    it('is disabled when the word field is empty', () => {
      render(<AddWordForm />)
      expect(screen.getByRole('button', { name: /save & generate exercises/i })).toBeDisabled()
    })

    it('is enabled after typing a word', async () => {
      const user = userEvent.setup()
      render(<AddWordForm />)
      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      expect(screen.getByRole('button', { name: /save & generate exercises/i })).toBeEnabled()
    })

    it('is disabled again if the word field is cleared', async () => {
      const user = userEvent.setup()
      render(<AddWordForm />)
      const wordInput = screen.getByLabelText(/^word/i)
      await user.type(wordInput, 'ephemeral')
      await user.clear(wordInput)
      expect(screen.getByRole('button', { name: /save & generate exercises/i })).toBeDisabled()
    })
  })

  describe('loading state', () => {
    it('shows loading text while submitting', async () => {
      // Keep fetch pending so we can inspect mid-submission state
      let resolveRequest!: () => void
      ;(global.fetch as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = () =>
            resolve({ ok: true, json: () => Promise.resolve({ word: { id: 'w1', word: 'test' } }) })
        })
      )

      const user = userEvent.setup()
      render(<AddWordForm />)
      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      expect(screen.getByText(/generating exercises/i)).toBeInTheDocument()
      resolveRequest()
    })

    it('button is disabled while loading', async () => {
      let resolveRequest!: () => void
      ;(global.fetch as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveRequest = () =>
            resolve({ ok: true, json: () => Promise.resolve({ word: { id: 'w1', word: 'test' } }) })
        })
      )

      const user = userEvent.setup()
      render(<AddWordForm />)
      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      expect(screen.getByRole('button', { name: /generating exercises/i })).toBeDisabled()
      resolveRequest()
    })
  })

  describe('successful submission', () => {
    it('sends POST to /api/words with correct payload', async () => {
      mockFetchSuccess()
      const user = userEvent.setup()
      render(<AddWordForm />)

      await user.type(screen.getByLabelText(/^word/i), 'Ephemeral')
      await user.type(screen.getByLabelText(/sentence/i), 'The dew is ephemeral.')
      await user.type(screen.getByLabelText(/where did you encounter it/i), 'Philosophy book')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))

      expect(global.fetch).toHaveBeenCalledWith('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: 'ephemeral', // trimmed and lowercased
          sentence: 'The dew is ephemeral.',
          context: 'Philosophy book',
        }),
      })
    })

    it('lowercases and trims the word before sending', async () => {
      mockFetchSuccess()
      const user = userEvent.setup()
      render(<AddWordForm />)

      await user.type(screen.getByLabelText(/^word/i), '  EPHEMERAL  ')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.word).toBe('ephemeral')
    })

    it('sends null for empty optional fields', async () => {
      mockFetchSuccess()
      const user = userEvent.setup()
      render(<AddWordForm />)

      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body.sentence).toBeNull()
      expect(body.context).toBeNull()
    })

    it('shows a success toast', async () => {
      mockFetchSuccess()
      const user = userEvent.setup()
      render(<AddWordForm />)

      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Word added!', variant: 'success' })
        )
      })
    })

    it('redirects to /dashboard on success', async () => {
      mockFetchSuccess()
      const user = userEvent.setup()
      render(<AddWordForm />)

      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/dashboard'))
    })
  })

  describe('failed submission', () => {
    it('shows a destructive toast with the server error message', async () => {
      mockFetchError('Word already exists')
      const user = userEvent.setup()
      render(<AddWordForm />)

      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            description: 'Word already exists',
            variant: 'destructive',
          })
        )
      })
    })

    it('does not redirect on error', async () => {
      mockFetchError()
      const user = userEvent.setup()
      render(<AddWordForm />)

      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      await waitFor(() => expect(mockToast).toHaveBeenCalled())
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('re-enables the submit button after a failed request', async () => {
      mockFetchError()
      const user = userEvent.setup()
      render(<AddWordForm />)

      await user.type(screen.getByLabelText(/^word/i), 'ephemeral')
      await user.click(screen.getByRole('button', { name: /save & generate exercises/i }))

      await waitFor(() =>
        expect(screen.getByRole('button', { name: /save & generate exercises/i })).toBeEnabled()
      )
    })
  })
})
