import type { Metrics } from '../types'
import { COMPETENCY_THRESHOLD, MIN_CASES_FOR_COMPETENCY, isCompetent } from '../lib/scoring'

function fmt(v: number | null) {
  return v === null ? '—' : `${v.toFixed(0)}%`
}

function tone(v: number | null) {
  if (v === null) return 'text-slate-400'
  if (v >= COMPETENCY_THRESHOLD) return 'text-emerald-600'
  if (v >= COMPETENCY_THRESHOLD - 15) return 'text-amber-600'
  return 'text-rose-600'
}

export function StatsBar({ metrics }: { metrics: Metrics }) {
  const competent = isCompetent(metrics)

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <Stat label="Cases" value={String(metrics.n)} tone="text-slate-700" />
      <Stat label="Accuracy" value={fmt(metrics.accuracy)} tone={tone(metrics.accuracy)} />
      <Stat label="Sensitivity" value={fmt(metrics.sensitivity)} tone={tone(metrics.sensitivity)} />
      <Stat label="Specificity" value={fmt(metrics.specificity)} tone={tone(metrics.specificity)} />
      <div className="ml-auto">
        {competent ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            👍 Competency reached
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
            {metrics.n < MIN_CASES_FOR_COMPETENCY
              ? `${MIN_CASES_FOR_COMPETENCY - metrics.n} cases to first competency check`
              : `Aiming for ${COMPETENCY_THRESHOLD}% on all three`}
          </span>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className={`text-lg font-semibold ${tone}`}>{value}</span>
    </div>
  )
}
