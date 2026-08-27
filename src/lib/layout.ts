import type { Arch, NormalizedRect } from '../types'

// Shared coordinate system for the schematic bitewing view. Both the case
// generator (ground-truth zones) and the renderer (tooth shapes) derive
// positions from these same pure functions so scoring zones always line up
// with what's drawn on screen.

export const VIEW_W = 800
export const VIEW_H = 420

const ARCH_MARGIN_X = 0.07
const TOOTH_GAP_RATIO = 0.14
const MIDLINE = 0.5

export interface ToothRect extends NormalizedRect {
  arch: Arch
  slot: number
}

/** Crown rectangle (normalized) for every tooth in an arch, evenly spaced. */
export function getArchToothRects(arch: Arch, count: number): ToothRect[] {
  const usableWidth = 1 - ARCH_MARGIN_X * 2
  const toothW = usableWidth / (count + (count - 1) * TOOTH_GAP_RATIO)
  const gapW = toothW * TOOTH_GAP_RATIO

  const crownH = 0.34
  const y = arch === 'upper' ? MIDLINE - crownH - 0.03 : MIDLINE + 0.03

  const rects: ToothRect[] = []
  for (let i = 0; i < count; i++) {
    const x = ARCH_MARGIN_X + i * (toothW + gapW)
    rects.push({ arch, slot: i, x, y, w: toothW, h: crownH })
  }
  return rects
}

/** Root rectangle (normalized), extending away from the occlusal midline. */
export function getRootRect(tooth: ToothRect): NormalizedRect {
  const rootH = 0.14
  const y = tooth.arch === 'upper' ? tooth.y - rootH : tooth.y + tooth.h
  return { x: tooth.x + tooth.w * 0.18, y, w: tooth.w * 0.64, h: rootH }
}

/**
 * Interproximal contact zone between tooth[gapIndex] and tooth[gapIndex+1]
 * in the given arch. This is the region a student should colour in when
 * they suspect a lesion at that contact.
 */
export function getSurfaceZone(arch: Arch, count: number, gapIndex: number): NormalizedRect {
  const teeth = getArchToothRects(arch, count)
  const left = teeth[gapIndex]
  const right = teeth[gapIndex + 1]
  const boundaryX = left.x + left.w
  const zoneW = (right.x - boundaryX) + left.w * 0.22 + right.w * 0.22
  const x = boundaryX - left.w * 0.22

  // Contact point sits in the occlusal-to-middle third of the crown.
  const zoneH = left.h * 0.55
  const y = arch === 'upper' ? left.y + left.h * 0.3 : left.y + left.h * 0.15

  return { x, y, w: zoneW, h: zoneH }
}
