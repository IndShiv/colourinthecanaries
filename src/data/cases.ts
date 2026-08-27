import type { Arch, Case, LesionSize, Surface, Tooth } from '../types'
import { getSurfaceZone } from '../lib/layout'
import { mulberry32 } from '../lib/prng'
import { useCaseStore } from '../store/useCaseStore'

const CHIEF_COMPLAINTS = [
  'Routine recall exam, no complaints.',
  'Parent reports child avoiding chewing on one side.',
  'Six-month recall bitewings.',
  'Referred for radiographic caries screening.',
  'Parent noticed dark spot between back teeth.',
  'New patient exam, no prior radiographs on file.',
]

function buildArch(rand: () => number, arch: Arch, count: number): Tooth[] {
  const teeth: Tooth[] = []
  for (let i = 0; i < count; i++) {
    teeth.push({
      id: `${arch}-${i}`,
      arch,
      slot: i,
      hasOcclusalCaries: rand() < 0.12,
      isPrimary: rand() < 0.65,
    })
  }
  return teeth
}

function buildSurfaces(
  rand: () => number,
  arch: Arch,
  count: number,
  targetLesions: number,
): Surface[] {
  const gaps = count - 1
  const cariousGaps = new Set<number>()
  while (cariousGaps.size < Math.min(targetLesions, gaps)) {
    cariousGaps.add(Math.floor(rand() * gaps))
  }

  const surfaces: Surface[] = []
  for (let g = 0; g < gaps; g++) {
    const carious = cariousGaps.has(g)
    const size: LesionSize | null = carious ? (rand() < 0.55 ? 'small' : 'large') : null
    surfaces.push({
      id: `${arch}-surf-${g}`,
      arch,
      label: `${arch === 'upper' ? 'Upper' : 'Lower'} tooth ${g + 1}–${g + 2} contact`,
      carious,
      size,
      zone: getSurfaceZone(arch, count, g),
    })
  }
  return surfaces
}

function generateCase(seed: number, id: string, lesionBudget: number): Case {
  const rand = mulberry32(seed)
  const upperCount = 3 + Math.floor(rand() * 2) // 3-4
  const lowerCount = 3 + Math.floor(rand() * 2)

  const upperTeeth = buildArch(rand, 'upper', upperCount)
  const lowerTeeth = buildArch(rand, 'lower', lowerCount)

  const upperLesions = Math.round(lesionBudget * (rand() * 0.4 + 0.3))
  const lowerLesions = Math.max(0, lesionBudget - upperLesions)

  const upperSurfaces = buildSurfaces(rand, 'upper', upperCount, upperLesions)
  const lowerSurfaces = buildSurfaces(rand, 'lower', lowerCount, lowerLesions)

  return {
    id,
    patientAge: 4 + Math.floor(rand() * 12),
    chiefComplaint: CHIEF_COMPLAINTS[Math.floor(rand() * CHIEF_COMPLAINTS.length)],
    teeth: [...upperTeeth, ...lowerTeeth],
    surfaces: [...upperSurfaces, ...lowerSurfaces],
  }
}

// A spread of lesion counts (including zero) so the deck mirrors the paper's
// mixed case set: ~45% caries-free, the rest with 1-5 interproximal lesions.
const LESION_BUDGETS = [0, 0, 1, 1, 2, 0, 2, 3, 1, 0, 4, 2, 1, 3, 0, 5, 1, 2, 0, 3]

export const CASE_BANK: Case[] = LESION_BUDGETS.map((budget, i) =>
  generateCase(1000 + i * 37, `case-${i + 1}`, budget),
)

export function getCaseById(id: string): Case | undefined {
  return CASE_BANK.find((c) => c.id === id) ?? useCaseStore.getState().customCases.find((c) => c.id === id)
}

/** All practice-able case ids: the built-in schematic bank plus any teacher-authored cases. */
export function listAllCaseIds(): string[] {
  return [...CASE_BANK.map((c) => c.id), ...useCaseStore.getState().customCases.map((c) => c.id)]
}
