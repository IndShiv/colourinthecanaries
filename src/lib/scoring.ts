import type { Attempt, Case, Metrics, SurfaceResult } from '../types'
import { sampleZoneCoverage } from './geometry'

export const COVERAGE_THRESHOLD = 0.12
export const COMPETENCY_THRESHOLD = 75
export const MIN_CASES_FOR_COMPETENCY = 10

export function scoreCase(caseData: Case, canvas: HTMLCanvasElement): {
  surfaceResults: SurfaceResult[]
  predictedPresent: boolean
  actualPresent: boolean
} {
  const surfaceResults: SurfaceResult[] = caseData.surfaces.map((surface) => {
    const coverage = sampleZoneCoverage(canvas, surface.zone)
    return {
      surfaceId: surface.id,
      carious: surface.carious,
      flagged: coverage >= COVERAGE_THRESHOLD,
      coverage,
    }
  })

  return {
    surfaceResults,
    predictedPresent: surfaceResults.some((s) => s.flagged),
    actualPresent: caseData.surfaces.some((s) => s.carious),
  }
}

function pct(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return (numerator / denominator) * 100
}

/**
 * Case-level accuracy/sensitivity/specificity, mirroring how the source
 * study defines these: accuracy over all cases, sensitivity over cases
 * with caries present, specificity over cases without.
 */
export function computeMetrics(attempts: Attempt[]): Metrics {
  let correct = 0
  let tp = 0
  let tn = 0
  let positives = 0
  let negatives = 0

  for (const a of attempts) {
    if (a.actualPresent) {
      positives++
      if (a.predictedPresent) tp++
    } else {
      negatives++
      if (!a.predictedPresent) tn++
    }
    if (a.predictedPresent === a.actualPresent) correct++
  }

  return {
    accuracy: pct(correct, attempts.length),
    sensitivity: pct(tp, positives),
    specificity: pct(tn, negatives),
    n: attempts.length,
    nPositiveCases: positives,
    nNegativeCases: negatives,
  }
}

export function isCompetent(metrics: Metrics): boolean {
  if (metrics.n < MIN_CASES_FOR_COMPETENCY) return false
  return (
    (metrics.accuracy ?? 0) >= COMPETENCY_THRESHOLD &&
    (metrics.sensitivity ?? 0) >= COMPETENCY_THRESHOLD &&
    (metrics.specificity ?? 0) >= COMPETENCY_THRESHOLD
  )
}

export interface CurvePoint {
  caseNumber: number
  accuracy: number | null
  sensitivity: number | null
  specificity: number | null
}

/** Moving-average learning curve, matching Figure 3 in the source study. */
export function computeLearningCurve(attempts: Attempt[], window = 10): CurvePoint[] {
  return attempts.map((_, i) => {
    const start = Math.max(0, i + 1 - window)
    const windowAttempts = attempts.slice(start, i + 1)
    const m = computeMetrics(windowAttempts)
    return {
      caseNumber: i + 1,
      accuracy: m.accuracy,
      sensitivity: m.sensitivity,
      specificity: m.specificity,
    }
  })
}
