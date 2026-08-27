import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Attempt, SurfaceResult } from '../types'
import { CASE_BANK } from '../data/cases'

// Persisted via localStorage for now. The shape here is intentionally
// storage-agnostic (plain attempts + a case queue) so a later move to a
// backend just means swapping this hook's persistence for API calls —
// components only ever talk to the actions below, never localStorage.

function shuffled<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

interface ProgressState {
  attempts: Attempt[]
  caseQueue: string[]
  queueIndex: number
  submitAttempt: (input: {
    caseId: string
    timeSpentMs: number
    predictedPresent: boolean
    actualPresent: boolean
    surfaceResults: SurfaceResult[]
  }) => void
  goToNextCase: () => void
  resetProgress: () => void
}

function freshQueue(): string[] {
  return shuffled(CASE_BANK.map((c) => c.id))
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      attempts: [],
      caseQueue: freshQueue(),
      queueIndex: 0,

      submitAttempt: ({ caseId, timeSpentMs, predictedPresent, actualPresent, surfaceResults }) => {
        const attempt: Attempt = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          caseId,
          timestamp: Date.now(),
          timeSpentMs,
          predictedPresent,
          actualPresent,
          surfaceResults,
        }
        set((s) => ({ attempts: [...s.attempts, attempt] }))
      },

      goToNextCase: () => {
        const { queueIndex, caseQueue } = get()
        const nextIndex = queueIndex + 1
        if (nextIndex >= caseQueue.length) {
          set({ caseQueue: freshQueue(), queueIndex: 0 })
        } else {
          set({ queueIndex: nextIndex })
        }
      },

      resetProgress: () => {
        set({ attempts: [], caseQueue: freshQueue(), queueIndex: 0 })
      },
    }),
    {
      name: 'colouring-the-canaries-progress',
      partialize: (s) => ({ attempts: s.attempts, caseQueue: s.caseQueue, queueIndex: s.queueIndex }),
    },
  ),
)
