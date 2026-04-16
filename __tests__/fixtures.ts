import type { Word, Exercise, PracticeWord } from '@/lib/types'

export const mockExercises: Exercise[] = [
  {
    id: 'ex-1',
    word_id: 'word-1',
    type: 'fill_blank',
    question: 'The morning dew is _____, gone before noon.',
    answer: 'ephemeral',
    explanation: 'Ephemeral describes something short-lived or transitory.',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex-2',
    word_id: 'word-1',
    type: 'usage_scenario',
    question: 'Use "ephemeral" to describe a social media trend.',
    answer: 'Social media trends are ephemeral, fading within days.',
    explanation: 'Ephemeral fits well for short-lived phenomena.',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ex-3',
    word_id: 'word-1',
    type: 'sentence_rewrite',
    question: 'Rewrite using "ephemeral": The fame lasted only a moment.',
    answer: 'The fame was ephemeral.',
    explanation: 'Ephemeral replaces the longer phrase concisely.',
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const mockWord: Word = {
  id: 'word-1',
  user_id: 'user-1',
  word: 'ephemeral',
  sentence: 'The morning dew is ephemeral, gone before noon.',
  context: 'Philosophy book',
  created_at: '2024-01-01T00:00:00Z',
  exercises: mockExercises,
}

export const mockWordNoExercises: Word = {
  id: 'word-2',
  user_id: 'user-1',
  word: 'serendipity',
  sentence: null,
  context: null,
  created_at: '2024-01-01T00:00:00Z',
  exercises: [],
}

export const mockWordMinimal: Word = {
  id: 'word-3',
  user_id: 'user-1',
  word: 'sonder',
  sentence: null,
  context: null,
  created_at: '2024-01-01T00:00:00Z',
  exercises: mockExercises.map((ex) => ({ ...ex, word_id: 'word-3' })),
}

export const mockPracticeWord: PracticeWord = {
  word: mockWord,
  exercises: mockExercises,
}

/** A second word with a single exercise, for multi-word session tests */
export const mockWord2: Word = {
  id: 'word-2',
  user_id: 'user-1',
  word: 'serendipity',
  sentence: 'Finding the book was pure serendipity.',
  context: 'Novel',
  created_at: '2024-01-02T00:00:00Z',
  exercises: [
    {
      id: 'ex-4',
      word_id: 'word-2',
      type: 'fill_blank',
      question: 'Finding the perfect gift felt like _____.',
      answer: 'serendipity',
      explanation: 'Serendipity means a fortunate accident.',
      created_at: '2024-01-02T00:00:00Z',
    },
  ],
}

export const mockPracticeWord2: PracticeWord = {
  word: mockWord2,
  exercises: mockWord2.exercises as Exercise[],
}
