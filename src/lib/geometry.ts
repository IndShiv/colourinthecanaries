import type { NormalizedRect } from '../types'

const ALPHA_THRESHOLD = 24 // out of 255 — ignore near-invisible paint
const SAMPLE_STEP = 3 // sample every Nth pixel for speed

/**
 * Fraction (0-1) of a normalized zone's pixels that have been painted on
 * the given canvas, used to decide whether a student "coloured in" a
 * particular interproximal contact.
 */
export function sampleZoneCoverage(canvas: HTMLCanvasElement, zone: NormalizedRect): number {
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0

  const px = Math.round(zone.x * canvas.width)
  const py = Math.round(zone.y * canvas.height)
  const pw = Math.max(1, Math.round(zone.w * canvas.width))
  const ph = Math.max(1, Math.round(zone.h * canvas.height))

  const clampedX = Math.max(0, Math.min(canvas.width - 1, px))
  const clampedY = Math.max(0, Math.min(canvas.height - 1, py))
  const clampedW = Math.max(1, Math.min(canvas.width - clampedX, pw))
  const clampedH = Math.max(1, Math.min(canvas.height - clampedY, ph))

  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(clampedX, clampedY, clampedW, clampedH).data
  } catch {
    return 0
  }

  let painted = 0
  let sampled = 0
  for (let y = 0; y < clampedH; y += SAMPLE_STEP) {
    for (let x = 0; x < clampedW; x += SAMPLE_STEP) {
      const idx = (y * clampedW + x) * 4
      const alpha = data[idx + 3]
      sampled++
      if (alpha >= ALPHA_THRESHOLD) painted++
    }
  }

  return sampled === 0 ? 0 : painted / sampled
}
