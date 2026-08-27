import { useRef, useState } from 'react'
import type { NormalizedRect, Surface } from '../types'

interface Props {
  imageUrl: string
  viewW: number
  viewH: number
  surfaces: Surface[]
  onAddZone: (zone: NormalizedRect) => void
  onRemoveZone: (surfaceId: string) => void
}

interface Draft {
  x0: number
  y0: number
  x1: number
  y1: number
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

const MIN_ZONE_SIZE = 0.01

/** Drag on empty space to mark a new contact-point zone; click an existing zone to remove it. */
export function AnnotationCanvas({ imageUrl, viewW, viewH, surfaces, onAddZone, onRemoveZone }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [draft, setDraft] = useState<Draft | null>(null)

  function toNormalized(e: React.PointerEvent) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: clamp01((e.clientX - rect.left) / rect.width), y: clamp01((e.clientY - rect.top) / rect.height) }
  }

  function handlePointerDown(e: React.PointerEvent) {
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    const p = toNormalized(e)
    draggingRef.current = true
    setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return
    const p = toNormalized(e)
    setDraft((d) => (d ? { ...d, x1: p.x, y1: p.y } : d))
  }

  function handlePointerUp() {
    draggingRef.current = false
    if (draft) {
      const x = Math.min(draft.x0, draft.x1)
      const y = Math.min(draft.y0, draft.y1)
      const w = Math.abs(draft.x1 - draft.x0)
      const h = Math.abs(draft.y1 - draft.y0)
      if (w > MIN_ZONE_SIZE && h > MIN_ZONE_SIZE) onAddZone({ x, y, w, h })
    }
    setDraft(null)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full touch-none select-none overflow-hidden rounded-lg bg-black"
      style={{ aspectRatio: `${viewW} / ${viewH}` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <img
        src={imageUrl}
        alt="Uploaded radiograph being annotated"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        draggable={false}
      />
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="absolute inset-0 h-full w-full">
        {surfaces.map((s) => (
          <rect
            key={s.id}
            x={s.zone.x * viewW}
            y={s.zone.y * viewH}
            width={s.zone.w * viewW}
            height={s.zone.h * viewH}
            fill={s.carious ? 'rgba(239,68,68,0.25)' : 'rgba(56,189,248,0.2)'}
            stroke={s.carious ? '#ef4444' : '#38bdf8'}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer"
            onPointerDown={(e) => {
              e.stopPropagation()
              onRemoveZone(s.id)
            }}
          />
        ))}
        {draft &&
          (() => {
            const x = Math.min(draft.x0, draft.x1) * viewW
            const y = Math.min(draft.y0, draft.y1) * viewH
            const w = Math.abs(draft.x1 - draft.x0) * viewW
            const h = Math.abs(draft.y1 - draft.y0) * viewH
            return (
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="rgba(250,204,21,0.25)"
                stroke="#facc15"
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
                strokeDasharray="4 3"
              />
            )
          })()}
      </svg>
    </div>
  )
}
