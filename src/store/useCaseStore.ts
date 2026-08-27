import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Case } from '../types'
import { deleteImage } from '../lib/imageStore'

// Teacher-authored cases (image + zones). Metadata is persisted to
// localStorage same as progress; the image bytes themselves live in
// IndexedDB (see lib/imageStore.ts), so only a small assetId reference is
// stored here.

interface CaseState {
  customCases: Case[]
  addCase: (c: Case) => void
  removeCase: (id: string) => void
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set, get) => ({
      customCases: [],

      addCase: (c) => {
        set((s) => ({ customCases: [...s.customCases, c] }))
      },

      removeCase: (id) => {
        const c = get().customCases.find((x) => x.id === id)
        set((s) => ({ customCases: s.customCases.filter((x) => x.id !== id) }))
        if (c?.image) void deleteImage(c.image.assetId)
      },
    }),
    { name: 'colour-the-caries-custom-cases' },
  ),
)
