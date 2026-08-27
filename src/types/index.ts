// Core domain types for Colour the Caries.
// Cases are data-driven so the illustrative SVG case bank in src/data/cases.ts
// can later be swapped for a fetch() against a real backend / real BWR images
// without touching the practice UI, scoring, or progress-tracking code.

export type Arch = 'upper' | 'lower'

export interface Tooth {
  id: string
  arch: Arch
  /** Position within the arch, left to right, 0-indexed. */
  slot: number
  /** Occlusal (chewing-surface) caries — noninterproximal, drawn for realism/difficulty but not a scored zone. */
  hasOcclusalCaries: boolean
  isPrimary: boolean
}

export type LesionSize = 'small' | 'large'

/** A rectangle in normalized [0,1] coordinates relative to the case viewport. */
export interface NormalizedRect {
  x: number
  y: number
  w: number
  h: number
}

export interface Surface {
  id: string
  arch: Arch
  /** Human label, e.g. "Tooth 2-3 contact" */
  label: string
  carious: boolean
  size: LesionSize | null
  zone: NormalizedRect
}

export interface CaseImageRef {
  assetId: string
  width: number
  height: number
}

export interface Case {
  id: string
  patientAge: number
  chiefComplaint: string
  /** Empty for image-backed cases — the schematic renderer isn't used for those. */
  teeth: Tooth[]
  surfaces: Surface[]
  /** Present for teacher-uploaded cases; renders the real photo instead of the schematic SVG. */
  image?: CaseImageRef
}

export interface SurfaceResult {
  surfaceId: string
  carious: boolean
  flagged: boolean
  coverage: number
}

export interface Attempt {
  id: string
  caseId: string
  timestamp: number
  timeSpentMs: number
  predictedPresent: boolean
  actualPresent: boolean
  surfaceResults: SurfaceResult[]
}

export interface Metrics {
  accuracy: number | null
  sensitivity: number | null
  specificity: number | null
  n: number
  nPositiveCases: number
  nNegativeCases: number
}
