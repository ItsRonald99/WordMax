import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRouter } from 'next/navigation'
import { WordCard } from '@/components/WordCard'
import { mockWord, mockWordNoExercises, mockExercises } from '../fixtures'

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

jest.mock('@/components/ui/use-toast', () => ({
  toast: jest.fn(),
}))

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: jest.fn(), push: jest.fn() })
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200 })
})

describe('WordCard', () => {
  describe('rendering', () => {
    it('renders the word name', () => {
      render(<WordCard word={mockWord} />)
      expect(screen.getByText('ephemeral')).toBeInTheDocument()
    })

    it('renders the example sentence in italics', () => {
      render(<WordCard word={mockWord} />)
      expect(screen.getByText(/The morning dew is ephemeral/)).toBeInTheDocument()
    })

    it('renders the context tag', () => {
      render(<WordCard word={mockWord} />)
      expect(screen.getByText('Philosophy book')).toBeInTheDocument()
    })

    it('does not render sentence section when sentence is null', () => {
      render(<WordCard word={mockWordNoExercises} />)
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument()
    })

    it('does not render context when context is null', () => {
      render(<WordCard word={mockWordNoExercises} />)
      // Only the date should appear in the metadata row
      expect(screen.queryByText('Philosophy book')).not.toBeInTheDocument()
    })

    it('renders a date', () => {
      render(<WordCard word={mockWord} />)
      // formatRelativeDate output is relative — just check something date-like is present
      // The calendar icon is rendered alongside a date string
      expect(screen.getByText(/ago/)).toBeInTheDocument()
    })
  })

  describe('exercise badge', () => {
    it('shows exercise count badge when exercises exist', () => {
      render(<WordCard word={mockWord} />)
      expect(screen.getByText(/3 exercises/i)).toBeInTheDocument()
    })

    it('shows "No exercises" badge when exercises array is empty', () => {
      render(<WordCard word={mockWordNoExercises} />)
      expect(screen.getByText(/no exercises/i)).toBeInTheDocument()
    })

    it('shows "No exercises" badge when exercises is undefined', () => {
      const wordWithoutExerciseProp = { ...mockWord, exercises: undefined }
      render(<WordCard word={wordWithoutExerciseProp} />)
      expect(screen.getByText(/no exercises/i)).toBeInTheDocument()
    })
  })

  describe('expand / collapse', () => {
    it('shows expand button when word has exercises', () => {
      render(<WordCard word={mockWord} />)
      expect(screen.getByRole('button', { name: /show exercises/i })).toBeInTheDocument()
    })

    it('does not show expand button when word has no exercises', () => {
      render(<WordCard word={mockWordNoExercises} />)
      expect(screen.queryByRole('button', { name: /show exercises/i })).not.toBeInTheDocument()
    })

    it('exercises are hidden by default', () => {
      render(<WordCard word={mockWord} />)
      expect(screen.queryByText(mockExercises[0].question)).not.toBeInTheDocument()
    })

    it('reveals exercises when expand button is clicked', async () => {
      const user = userEvent.setup()
      render(<WordCard word={mockWord} />)
      await user.click(screen.getByRole('button', { name: /show exercises/i }))
      expect(screen.getByText(mockExercises[0].question)).toBeInTheDocument()
      expect(screen.getByText(mockExercises[1].question)).toBeInTheDocument()
      expect(screen.getByText(mockExercises[2].question)).toBeInTheDocument()
    })

    it('shows exercise type labels when expanded', async () => {
      const user = userEvent.setup()
      render(<WordCard word={mockWord} />)
      await user.click(screen.getByRole('button', { name: /show exercises/i }))
      expect(screen.getByText('Fill in the Blank')).toBeInTheDocument()
      expect(screen.getByText('Real-world Usage')).toBeInTheDocument()
      expect(screen.getByText('Sentence Rewrite')).toBeInTheDocument()
    })

    it('collapses exercises when button is clicked again', async () => {
      const user = userEvent.setup()
      render(<WordCard word={mockWord} />)
      await user.click(screen.getByRole('button', { name: /show exercises/i }))
      expect(screen.getByText(mockExercises[0].question)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /hide exercises/i }))
      expect(screen.queryByText(mockExercises[0].question)).not.toBeInTheDocument()
    })

    it('toggles aria-label between show and hide', async () => {
      const user = userEvent.setup()
      render(<WordCard word={mockWord} />)
      const btn = screen.getByRole('button', { name: /show exercises/i })
      await user.click(btn)
      expect(screen.getByRole('button', { name: /hide exercises/i })).toBeInTheDocument()
    })
  })
})
