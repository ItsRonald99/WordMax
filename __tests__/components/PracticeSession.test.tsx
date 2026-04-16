import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { PracticeSession } from '@/components/PracticeSession'
import {
  mockPracticeWord,
  mockPracticeWord2,
  mockExercises,
} from '../fixtures'
import type { PracticeWord } from '@/lib/types'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

const mockPush = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

// ─── helpers ────────────────────────────────────────────────────────────────

/** Reveal the current exercise's answer */
async function revealAnswer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /reveal answer/i }))
}

/** Reveal then mark the current exercise correct */
async function markCorrect(user: ReturnType<typeof userEvent.setup>) {
  await revealAnswer(user)
  await user.click(screen.getByRole('button', { name: /got it/i }))
}

/** Reveal then mark the current exercise incorrect */
async function markIncorrect(user: ReturnType<typeof userEvent.setup>) {
  await revealAnswer(user)
  await user.click(screen.getByRole('button', { name: /needs work/i }))
}

// ─── tests ───────────────────────────────────────────────────────────────────

describe('PracticeSession', () => {
  describe('empty state', () => {
    it('shows "All caught up!" when no words are passed', () => {
      render(<PracticeSession words={[]} />)
      expect(screen.getByText(/all caught up/i)).toBeInTheDocument()
    })

    it('shows a button to go to the Dashboard in empty state', () => {
      render(<PracticeSession words={[]} />)
      expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument()
    })

    it('navigates to /dashboard when the empty-state button is clicked', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[]} />)
      await user.click(screen.getByRole('button', { name: /go to dashboard/i }))
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('exercise display', () => {
    it('renders the word badge for the first exercise', () => {
      render(<PracticeSession words={[mockPracticeWord]} />)
      expect(screen.getByText('ephemeral')).toBeInTheDocument()
    })

    it('renders the exercise type label', () => {
      render(<PracticeSession words={[mockPracticeWord]} />)
      expect(screen.getByText('Fill in the Blank')).toBeInTheDocument()
    })

    it('renders the question text', () => {
      render(<PracticeSession words={[mockPracticeWord]} />)
      expect(screen.getByText(mockExercises[0].question)).toBeInTheDocument()
    })

    it('shows the progress counter', () => {
      render(<PracticeSession words={[mockPracticeWord]} />)
      expect(screen.getByText(`1 / ${mockExercises.length}`)).toBeInTheDocument()
    })

    it('shows initial score of 0 correct and 0 incorrect', () => {
      render(<PracticeSession words={[mockPracticeWord]} />)
      expect(screen.getByText(/0 correct · 0 incorrect/i)).toBeInTheDocument()
    })
  })

  describe('reveal answer', () => {
    it('shows a "Reveal Answer" button before revealing', () => {
      render(<PracticeSession words={[mockPracticeWord]} />)
      expect(screen.getByRole('button', { name: /reveal answer/i })).toBeInTheDocument()
    })

    it('hides the answer section before revealing', () => {
      render(<PracticeSession words={[mockPracticeWord]} />)
      // The "Answer" label only renders inside the revealed section
      expect(screen.queryByText('Answer')).not.toBeInTheDocument()
    })

    it('shows the answer after clicking Reveal Answer', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await revealAnswer(user)
      // The "Answer" section label is now visible
      expect(screen.getByText('Answer')).toBeInTheDocument()
      // The answer value appears (may also match the word badge — use getAllByText)
      expect(screen.getAllByText(mockExercises[0].answer).length).toBeGreaterThanOrEqual(1)
    })

    it('shows the explanation after revealing', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await revealAnswer(user)
      expect(screen.getByText(mockExercises[0].explanation)).toBeInTheDocument()
    })

    it('shows "Got it!" and "Needs work" buttons after revealing', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await revealAnswer(user)
      expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /needs work/i })).toBeInTheDocument()
    })
  })

  describe('marking answers', () => {
    it('advances to the next exercise after marking correct', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await markCorrect(user)
      expect(screen.getByText(mockExercises[1].question)).toBeInTheDocument()
    })

    it('advances to the next exercise after marking incorrect', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await markIncorrect(user)
      expect(screen.getByText(mockExercises[1].question)).toBeInTheDocument()
    })

    it('increments the correct score', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await markCorrect(user)
      expect(screen.getByText(/1 correct · 0 incorrect/i)).toBeInTheDocument()
    })

    it('increments the incorrect score', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await markIncorrect(user)
      expect(screen.getByText(/0 correct · 1 incorrect/i)).toBeInTheDocument()
    })

    it('updates the progress counter after each answer', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await markCorrect(user)
      expect(screen.getByText(`2 / ${mockExercises.length}`)).toBeInTheDocument()
    })

    it('hides the revealed answer section when advancing to the next exercise', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await markCorrect(user)
      // The "Answer" label only appears while an answer is revealed
      expect(screen.queryByText('Answer')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reveal answer/i })).toBeInTheDocument()
    })
  })

  describe('skip', () => {
    it('shows a Skip button before revealing', () => {
      render(<PracticeSession words={[mockPracticeWord]} />)
      expect(screen.getByText(/skip/i)).toBeInTheDocument()
    })

    it('hides the Skip button after revealing', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await revealAnswer(user)
      expect(screen.queryByText(/^skip$/i)).not.toBeInTheDocument()
    })

    it('advances to the next exercise without recording a result', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)
      await user.click(screen.getByText(/skip/i))
      expect(screen.getByText(mockExercises[1].question)).toBeInTheDocument()
      // Score unchanged
      expect(screen.getByText(/0 correct · 0 incorrect/i)).toBeInTheDocument()
    })

    it('ends the session and submits when skipping the last exercise', async () => {
      const user = userEvent.setup()
      // Single exercise so the first item is also the last
      const singleExerciseWord: PracticeWord = {
        word: mockPracticeWord.word,
        exercises: [mockExercises[0]],
      }
      render(<PracticeSession words={[singleExerciseWord]} />)
      await user.click(screen.getByText(/skip/i))

      await waitFor(() => {
        expect(screen.getByText(/session complete/i)).toBeInTheDocument()
      })
      // submitWordResults was called (no answers recorded, so nothing to submit)
      // fetch should NOT have been called since wordResults is empty
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('session end and SRS submission', () => {
    it('shows the done screen after answering the last exercise', async () => {
      const user = userEvent.setup()
      const singleExerciseWord: PracticeWord = {
        word: mockPracticeWord.word,
        exercises: [mockExercises[0]],
      }
      render(<PracticeSession words={[singleExerciseWord]} />)
      await markCorrect(user)

      await waitFor(() => {
        expect(screen.getByText(/session complete/i)).toBeInTheDocument()
      })
    })

    it('sends exactly ONE fetch request per word at session end', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />) // 3 exercises, 1 word

      await markCorrect(user)
      await markCorrect(user)
      await markCorrect(user)

      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())

      expect(global.fetch).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/practice/${mockPracticeWord.word.id}`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('sends correct: true when all exercises for a word are answered correctly', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)

      await markCorrect(user)
      await markCorrect(user)
      await markCorrect(user)

      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body).toEqual({ correct: true })
    })

    it('sends correct: false when any exercise for a word is answered incorrectly', async () => {
      const user = userEvent.setup()
      render(<PracticeSession words={[mockPracticeWord]} />)

      await markCorrect(user)
      await markIncorrect(user) // one wrong is enough
      await markCorrect(user)

      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())

      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body).toEqual({ correct: false })
    })

    it('sends one request per word for a multi-word session', async () => {
      const user = userEvent.setup()
      // word-1 has 3 exercises, word-2 has 1 exercise
      render(<PracticeSession words={[mockPracticeWord, mockPracticeWord2]} />)

      // Answer all 3 exercises for word-1
      await markCorrect(user)
      await markIncorrect(user)
      await markCorrect(user)
      // Answer 1 exercise for word-2
      await markCorrect(user)

      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())

      expect(global.fetch).toHaveBeenCalledTimes(2)

      const calls = (global.fetch as jest.Mock).mock.calls
      const word1Call = calls.find((c: unknown[]) => (c[0] as string).includes(mockPracticeWord.word.id))
      const word2Call = calls.find((c: unknown[]) => (c[0] as string).includes(mockPracticeWord2.word.id))

      expect(JSON.parse(word1Call[1].body)).toEqual({ correct: false }) // had one incorrect
      expect(JSON.parse(word2Call[1].body)).toEqual({ correct: true })  // all correct
    })

    it('does not call fetch for words where all exercises were skipped', async () => {
      const user = userEvent.setup()
      const singleExerciseWord: PracticeWord = {
        word: mockPracticeWord.word,
        exercises: [mockExercises[0]],
      }
      render(<PracticeSession words={[singleExerciseWord]} />)
      await user.click(screen.getByText(/skip/i))

      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe('done screen', () => {
    async function completeSession(user: ReturnType<typeof userEvent.setup>, correct: boolean[]) {
      const exercises = correct.map((_, i) => mockExercises[i % mockExercises.length])
      const practiceWord: PracticeWord = {
        word: mockPracticeWord.word,
        exercises,
      }
      render(<PracticeSession words={[practiceWord]} />)
      for (const isCorrect of correct) {
        if (isCorrect) await markCorrect(user)
        else await markIncorrect(user)
      }
      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())
    }

    it('shows the correct count', async () => {
      const user = userEvent.setup()
      await completeSession(user, [true, false, true])
      expect(screen.getByText('2')).toBeInTheDocument() // 2 correct
    })

    it('shows the incorrect count', async () => {
      const user = userEvent.setup()
      await completeSession(user, [true, false, true])
      expect(screen.getByText('1')).toBeInTheDocument() // 1 incorrect
    })

    it('shows the percentage score', async () => {
      const user = userEvent.setup()
      await completeSession(user, [true, false, true]) // 2/3 = 67%
      expect(screen.getByText('67%')).toBeInTheDocument()
    })

    it('shows a Dashboard button', async () => {
      const user = userEvent.setup()
      await completeSession(user, [true])
      expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument()
    })

    it('shows a "Practice again" button', async () => {
      const user = userEvent.setup()
      await completeSession(user, [true])
      expect(screen.getByRole('button', { name: /practice again/i })).toBeInTheDocument()
    })

    it('navigates to /dashboard when Dashboard button is clicked', async () => {
      const user = userEvent.setup()
      await completeSession(user, [true])
      await user.click(screen.getByRole('button', { name: /dashboard/i }))
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('practice again', () => {
    it('resets to the first exercise', async () => {
      const user = userEvent.setup()
      const singleExerciseWord: PracticeWord = {
        word: mockPracticeWord.word,
        exercises: [mockExercises[0]],
      }
      render(<PracticeSession words={[singleExerciseWord]} />)
      await markCorrect(user)
      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /practice again/i }))

      expect(screen.getByText(mockExercises[0].question)).toBeInTheDocument()
    })

    it('resets the score to 0/0', async () => {
      const user = userEvent.setup()
      const singleExerciseWord: PracticeWord = {
        word: mockPracticeWord.word,
        exercises: [mockExercises[0]],
      }
      render(<PracticeSession words={[singleExerciseWord]} />)
      await markCorrect(user)
      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /practice again/i }))

      expect(screen.getByText(/0 correct · 0 incorrect/i)).toBeInTheDocument()
    })

    it('resets the progress counter', async () => {
      const user = userEvent.setup()
      const singleExerciseWord: PracticeWord = {
        word: mockPracticeWord.word,
        exercises: [mockExercises[0]],
      }
      render(<PracticeSession words={[singleExerciseWord]} />)
      await markCorrect(user)
      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())

      await user.click(screen.getByRole('button', { name: /practice again/i }))

      expect(screen.getByText('1 / 1')).toBeInTheDocument()
    })

    it('does not carry over previous word results to the new session', async () => {
      const user = userEvent.setup()
      const singleExerciseWord: PracticeWord = {
        word: mockPracticeWord.word,
        exercises: [mockExercises[0]],
      }
      render(<PracticeSession words={[singleExerciseWord]} />)

      // First session: mark correct
      await markCorrect(user)
      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())
      expect(global.fetch).toHaveBeenCalledTimes(1)

      // Reset fetch mock
      ;(global.fetch as jest.Mock).mockClear()

      // Second session: mark incorrect
      await user.click(screen.getByRole('button', { name: /practice again/i }))
      await markIncorrect(user)
      await waitFor(() => expect(screen.getByText(/session complete/i)).toBeInTheDocument())

      // Should have called fetch again with fresh result (incorrect this time)
      expect(global.fetch).toHaveBeenCalledTimes(1)
      const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
      expect(body).toEqual({ correct: false })
    })
  })
})
