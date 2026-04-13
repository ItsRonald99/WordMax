export interface Word {
  id: string
  user_id: string
  word: string
  sentence?: string | null
  context?: string | null
  created_at: string
  exercises?: Exercise[]
  word_progress?: WordProgress | null
}

export interface Exercise {
  id: string
  word_id: string
  type: 'fill_blank' | 'usage_scenario' | 'sentence_rewrite'
  question: string
  answer: string
  explanation: string
  created_at: string
}

export interface Review {
  id: string
  word_id: string
  user_id: string
  correct: boolean
  reviewed_at: string
}

export interface WordProgress {
  id: string
  word_id: string
  user_id: string
  last_reviewed?: string | null
  next_review: string
  interval: number
  created_at: string
}

export interface GeneratedExercise {
  type: 'fill_blank' | 'usage_scenario' | 'sentence_rewrite'
  question: string
  answer: string
  explanation: string
}

export interface PracticeWord {
  word: Word
  exercises: Exercise[]
}
