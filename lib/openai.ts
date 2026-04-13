import OpenAI from 'openai'
import type { GeneratedExercise } from './types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function generateExercises(
  word: string,
  sentence?: string | null,
  context?: string | null
): Promise<GeneratedExercise[]> {
  const contextBlock = [
    sentence ? `Example sentence: "${sentence}"` : null,
    context ? `Where encountered: "${context}"` : null,
  ]
    .filter(Boolean)
    .join('\n')

  const prompt = `Generate 3 vocabulary exercises for the word "${word}".
${contextBlock ? `\nContext provided:\n${contextBlock}\n` : ''}
Rules:
- Exercises must feel real-world and natural, not dictionary-like
- Use the provided sentence/context if available to inform tone and domain
- Difficulty: medium
- The fill_blank question must NOT contain the word itself

Respond ONLY with valid JSON in this exact format:
{
  "exercises": [
    {
      "type": "fill_blank",
      "question": "sentence with _____ in place of the word",
      "answer": "${word}",
      "explanation": "brief explanation of why this word fits"
    },
    {
      "type": "usage_scenario",
      "question": "a real-world scenario asking user to use the word naturally",
      "answer": "a natural example sentence using the word",
      "explanation": "explanation of how the word is used in this context"
    },
    {
      "type": "sentence_rewrite",
      "question": "Rewrite this sentence using '${word}': [sentence that means the same without the target word]",
      "answer": "rewritten sentence with the word",
      "explanation": "explanation of how the word changes or clarifies the meaning"
    }
  ]
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content:
          'You are a vocabulary learning assistant. You create engaging, real-world exercises. Always respond with valid JSON only — no markdown, no code blocks.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('No response from OpenAI')

  const parsed = JSON.parse(content)
  if (!Array.isArray(parsed.exercises)) throw new Error('Invalid response format')

  return parsed.exercises as GeneratedExercise[]
}
