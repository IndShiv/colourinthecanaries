import type { Case, SurfaceResult } from '../types'

interface Props {
  caseData: Case
  results: SurfaceResult[]
  viewW: number
  viewH: number
}

const STYLES = {
  hit: { stroke: '#22c55e', fill: 'rgba(34,197,94,0.15)', label: 'Correct' },
  missed: { stroke: '#ef4444', fill: 'rgba(239,68,68,0.12)', label: 'Missed' },
  falsePositive: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.15)', label: 'Not carious here' },
} as const

function classify(r: SurfaceResult): keyof typeof STYLES | null {
  if (r.carious && r.flagged) return 'hit'
  if (r.carious && !r.flagged) return 'missed'
  if (!r.carious && r.flagged) return 'falsePositive'
  return null
}

export function FeedbackOverlay({ caseData, results, viewW, viewH }: Props) {
  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {results.map((r) => {
        const kind = classify(r)
        if (!kind) return null
        const surface = caseData.surfaces.find((s) => s.id === r.surfaceId)
        if (!surface) return null
        const style = STYLES[kind]
        const cx = (surface.zone.x + surface.zone.w / 2) * viewW
        const cy = (surface.zone.y + surface.zone.h / 2) * viewH
        const rx = (surface.zone.w / 2) * viewW * 1.15
        const ry = (surface.zone.h / 2) * viewH * 1.25

        return (
          <g key={r.surfaceId}>
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill={style.fill}
              stroke={style.stroke}
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
              strokeDasharray={kind === 'missed' ? '5 4' : undefined}
            />
          </g>
        )
      })}
    </svg>
  )
}

export function FeedbackLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
      {(Object.keys(STYLES) as (keyof typeof STYLES)[]).map((k) => (
        <span key={k} className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full border-2"
            style={{ borderColor: STYLES[k].stroke, backgroundColor: STYLES[k].fill }}
          />
          {STYLES[k].label}
        </span>
      ))}
    </div>
  )
}
