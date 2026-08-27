import type { LesionSize, NormalizedRect } from '../types'

// JSON manifest format for bulk dataset import: one array entry per image,
// each with the bounding boxes an instructor has already labelled
// (e.g. exported from an external annotation tool). Box coordinates may be
// normalized [0,1] (preferred) or pixel-space — normalizeBox() below
// auto-detects and converts, once the image's real dimensions are known.

export interface ManifestBox {
  x: number
  y: number
  w: number
  h: number
  carious?: boolean
  size?: LesionSize
}

export interface ManifestEntry {
  image: string
  patientAge?: number
  chiefComplaint?: string
  boxes: ManifestBox[]
}

export const EXAMPLE_MANIFEST: ManifestEntry[] = [
  {
    image: 'case-01.jpg',
    patientAge: 8,
    chiefComplaint: 'Routine recall bitewings.',
    boxes: [
      { x: 0.34, y: 0.41, w: 0.08, h: 0.12, carious: true, size: 'small' },
      { x: 0.55, y: 0.4, w: 0.07, h: 0.11, carious: false },
    ],
  },
  {
    image: 'case-02.jpg',
    patientAge: 11,
    chiefComplaint: 'Parent reports sensitivity on the right side.',
    boxes: [{ x: 0.42, y: 0.38, w: 0.09, h: 0.14, carious: true, size: 'large' }],
  },
]

function requireNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${where} must be a number.`)
  }
  return value
}

/** Parses and validates a manifest file's text, throwing a descriptive Error on the first problem found. */
export function parseManifest(text: string): ManifestEntry[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Manifest is not valid JSON.')
  }
  if (!Array.isArray(data)) {
    throw new Error('Manifest must be a JSON array of case entries — see the example manifest.')
  }
  if (data.length === 0) {
    throw new Error('Manifest is empty.')
  }

  return data.map((raw, i) => {
    const label = `Entry ${i + 1}`
    if (typeof raw !== 'object' || raw === null) throw new Error(`${label} is not an object.`)
    const r = raw as Record<string, unknown>

    if (typeof r.image !== 'string' || !r.image.trim()) {
      throw new Error(`${label} is missing an "image" filename.`)
    }
    if (!Array.isArray(r.boxes) || r.boxes.length === 0) {
      throw new Error(`${label} ("${r.image}") needs at least one box in "boxes".`)
    }

    const boxes: ManifestBox[] = r.boxes.map((rawBox, bi) => {
      const boxLabel = `${label} ("${r.image}") box ${bi + 1}`
      if (typeof rawBox !== 'object' || rawBox === null) throw new Error(`${boxLabel} is not an object.`)
      const b = rawBox as Record<string, unknown>
      return {
        x: requireNumber(b.x, `${boxLabel} "x"`),
        y: requireNumber(b.y, `${boxLabel} "y"`),
        w: requireNumber(b.w, `${boxLabel} "w"`),
        h: requireNumber(b.h, `${boxLabel} "h"`),
        carious: b.carious === undefined ? true : Boolean(b.carious),
        size: b.size === 'large' ? 'large' : 'small',
      }
    })

    return {
      image: r.image.trim(),
      patientAge: typeof r.patientAge === 'number' ? r.patientAge : undefined,
      chiefComplaint: typeof r.chiefComplaint === 'string' ? r.chiefComplaint : undefined,
      boxes,
    }
  })
}

/** Converts a manifest box to normalized [0,1] coordinates, auto-detecting pixel-space input. */
export function normalizeBox(box: ManifestBox, imageWidth: number, imageHeight: number): NormalizedRect {
  const looksPixelSpace = box.x > 1 || box.y > 1 || box.x + box.w > 1.0001 || box.y + box.h > 1.0001
  if (!looksPixelSpace) return { x: box.x, y: box.y, w: box.w, h: box.h }
  return { x: box.x / imageWidth, y: box.y / imageHeight, w: box.w / imageWidth, h: box.h / imageHeight }
}

/** Strips any directory prefix so manifest paths like "images/case1.jpg" match a flat file selection. */
export function basename(path: string): string {
  return path.split(/[/\\]/).pop() ?? path
}
