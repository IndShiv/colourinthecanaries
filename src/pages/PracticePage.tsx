import { useEffect, useMemo, useRef, useState } from 'react'
import { getCaseById } from '../data/cases'
import { useProgressStore } from '../store/useProgressStore'
import { computeMetrics, scoreCase } from '../lib/scoring'
import { getCaseViewSize } from '../lib/layout'
import { BitewingImage } from '../components/BitewingImage'
import { UploadedCaseImage } from '../components/UploadedCaseImage'
import { PaintCanvas, type PaintCanvasHandle, type BrushTool } from '../components/PaintCanvas'
import { ColorToolbar, PALETTE } from '../components/ColorToolbar'
import { FeedbackOverlay, FeedbackLegend } from '../components/FeedbackOverlay'
import { StatsBar } from '../components/StatsBar'
import type { SurfaceResult } from '../types'

export function PracticePage() {
  const caseQueue = useProgressStore((s) => s.caseQueue)
  const queueIndex = useProgressStore((s) => s.queueIndex)
  const attempts = useProgressStore((s) => s.attempts)
  const submitAttempt = useProgressStore((s) => s.submitAttempt)
  const goToNextCase = useProgressStore((s) => s.goToNextCase)

  const caseId = caseQueue[queueIndex] ?? caseQueue[0]
  const caseData = useMemo(() => getCaseById(caseId), [caseId])
  const metrics = useMemo(() => computeMetrics(attempts), [attempts])
  const { w: viewW, h: viewH } = useMemo(() => getCaseViewSize(caseData?.image), [caseData])

  const canvasRef = useRef<PaintCanvasHandle>(null)
  const startTimeRef = useRef(Date.now())

  const [color, setColor] = useState(PALETTE[0])
  const [brushSize, setBrushSize] = useState(16)
  const [tool, setTool] = useState<BrushTool>('brush')
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<SurfaceResult[] | null>(null)
  const [predictedPresent, setPredictedPresent] = useState(false)

  useEffect(() => {
    startTimeRef.current = Date.now()
    setSubmitted(false)
    setResults(null)
    canvasRef.current?.clear()
  }, [caseId])

  useEffect(() => {
    // A queued case can vanish if a teacher deletes it mid-session — skip past it.
    if (!caseData) goToNextCase()
  }, [caseData, goToNextCase])

  if (!caseData) return null

  function handleSubmit() {
    const canvas = canvasRef.current?.getCanvas()
    if (!canvas || !caseData) return
    const { surfaceResults, predictedPresent: predicted, actualPresent } = scoreCase(caseData, canvas)
    setResults(surfaceResults)
    setPredictedPresent(predicted)
    setSubmitted(true)
    submitAttempt({
      caseId: caseData.id,
      timeSpentMs: Date.now() - startTimeRef.current,
      predictedPresent: predicted,
      actualPresent,
      surfaceResults,
    })
  }

  function handleNext() {
    goToNextCase()
  }

  const overallCorrect = results ? predictedPresent === caseData.surfaces.some((s) => s.carious) : null

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
      <StatsBar metrics={metrics} />

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-sm text-slate-500">
              Patient age {caseData.patientAge} · Case {queueIndex + 1} of {caseQueue.length}
            </p>
            <p className="text-slate-800">{caseData.chiefComplaint}</p>
          </div>
        </div>

        <div className="relative w-full overflow-hidden rounded-lg bg-black" style={{ aspectRatio: `${viewW} / ${viewH}` }}>
          {caseData.image ? <UploadedCaseImage image={caseData.image} /> : <BitewingImage caseData={caseData} />}
          <PaintCanvas
            ref={canvasRef}
            color={color}
            brushSize={brushSize}
            tool={tool}
            disabled={submitted}
            viewW={viewW}
            viewH={viewH}
          />
          {submitted && results && (
            <FeedbackOverlay caseData={caseData} results={results} viewW={viewW} viewH={viewH} />
          )}
        </div>

        <p className="mt-2 text-xs text-slate-500">
          Colour in any interproximal contact where you suspect caries. Leave a case blank to diagnose it as
          caries-free.
        </p>

        <div className="mt-3">
          <ColorToolbar
            color={color}
            onColorChange={setColor}
            brushSize={brushSize}
            onBrushSizeChange={setBrushSize}
            tool={tool}
            onToolChange={setTool}
            onClear={() => canvasRef.current?.clear()}
            disabled={submitted}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          {!submitted ? (
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-amber-600"
            >
              Submit diagnosis
            </button>
          ) : (
            <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
                    overallCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {overallCorrect ? '✅ Correct diagnosis' : '❌ Incorrect diagnosis'}
                </span>
                <FeedbackLegend />
              </div>
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-slate-800 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-slate-900"
              >
                Next case →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
