'use client'

import { useToast } from './use-toast'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg animate-fade-in',
            t.variant === 'destructive'
              ? 'bg-red-50 border-red-200 text-red-800'
              : t.variant === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-white border-border text-foreground'
          )}
        >
          {t.variant === 'destructive' ? (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          ) : t.variant === 'success' ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <Info className="h-4 w-4 mt-0.5 shrink-0 text-violet-600" />
          )}
          <div className="flex-1 min-w-0">
            {t.title && <p className="text-sm font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm opacity-80 mt-0.5">{t.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
