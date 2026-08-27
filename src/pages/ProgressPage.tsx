import { useMemo, useState } from 'react'
import { useProgressStore } from '../store/useProgressStore'
import { computeLearningCurve, computeMetrics } from '../lib/scoring'
import { StatsBar } from '../components/StatsBar'
import { LearningCurveChart } from '../components/LearningCurveChart'
import { getCaseById } from '../data/cases'

export function ProgressPage() {
  const attempts = useProgressStore((s) => s.attempts)
  const resetProgress = useProgressStore((s) => s.resetProgress)
  const metrics = useMemo(() => computeMetrics(attempts), [attempts])
  const curve = useMemo(() => computeLearningCurve(attempts), [attempts])
  const [confirmingReset, setConfirmingReset] = useState(false)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
      <StatsBar metrics={metrics} />

      <LearningCurveChart data={curve} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Case history</h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-slate-400">No cases completed yet — head to Practice to get started.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="py-1.5 pr-2">#</th>
                  <th className="py-1.5 pr-2">Case</th>
                  <th className="py-1.5 pr-2">Truth</th>
                  <th className="py-1.5 pr-2">Diagnosis</th>
                  <th className="py-1.5 pr-2">Result</th>
                  <th className="py-1.5 pr-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {[...attempts].reverse().map((a, idx) => {
                  const caseData = getCaseById(a.caseId)
                  const correct = a.predictedPresent === a.actualPresent
                  return (
                    <tr key={a.id} className="border-t border-slate-100">
                      <td className="py-1.5 pr-2 text-slate-400">{attempts.length - idx}</td>
                      <td className="py-1.5 pr-2 text-slate-600">{caseData?.id ?? a.caseId}</td>
                      <td className="py-1.5 pr-2 text-slate-600">{a.actualPresent ? 'Caries' : 'Clear'}</td>
                      <td className="py-1.5 pr-2 text-slate-600">{a.predictedPresent ? 'Caries' : 'Clear'}</td>
                      <td className="py-1.5 pr-2">
                        {correct ? (
                          <span className="text-emerald-600">✅</span>
                        ) : (
                          <span className="text-rose-600">❌</span>
                        )}
                      </td>
                      <td className="py-1.5 pr-2 text-slate-400">{(a.timeSpentMs / 1000).toFixed(0)}s</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        {confirmingReset ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Erase all progress?</span>
            <button
              type="button"
              onClick={() => {
                resetProgress()
                setConfirmingReset(false)
              }}
              className="rounded-lg bg-rose-600 px-3 py-1.5 font-medium text-white hover:bg-rose-700"
            >
              Yes, reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmingReset(false)}
              className="rounded-lg bg-slate-100 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-200"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingReset(true)}
            className="text-xs text-slate-400 underline hover:text-slate-600"
          >
            Reset progress
          </button>
        )}
      </div>
    </div>
  )
}
