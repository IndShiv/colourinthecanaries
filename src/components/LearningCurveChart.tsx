import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CurvePoint } from '../lib/scoring'
import { COMPETENCY_THRESHOLD } from '../lib/scoring'

export function LearningCurveChart({ data }: { data: CurvePoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400">
        Complete a few more cases to see your learning curve.
      </div>
    )
  }

  return (
    <div className="h-72 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" />
          <XAxis dataKey="caseNumber" tick={{ fontSize: 11 }} label={{ value: 'Case #', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v) => (typeof v === 'number' ? `${v.toFixed(0)}%` : v)}
            labelFormatter={(l) => `Case ${l}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine y={COMPETENCY_THRESHOLD} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Competency', fontSize: 10, fill: '#94a3b8' }} />
          <Line type="monotone" dataKey="accuracy" name="Accuracy" stroke="#f59e0b" dot={false} strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="sensitivity" name="Sensitivity" stroke="#38bdf8" dot={false} strokeWidth={2} connectNulls />
          <Line type="monotone" dataKey="specificity" name="Specificity" stroke="#22c55e" dot={false} strokeWidth={2} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
