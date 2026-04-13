import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeDate(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy')
}

export function exerciseTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    fill_blank: 'Fill in the Blank',
    usage_scenario: 'Real-world Usage',
    sentence_rewrite: 'Sentence Rewrite',
  }
  return labels[type] ?? type
}
