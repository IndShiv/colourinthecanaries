import { useEffect, useMemo, useState } from 'react'
import type { LesionSize, NormalizedRect, Surface, Case } from '../types'
import { getCaseViewSize } from '../lib/layout'
import { putImage, readImageDimensions } from '../lib/imageStore'
import { useCaseStore } from '../store/useCaseStore'
import { useObjectUrl } from '../hooks/useObjectUrl'
import { AnnotationCanvas } from '../components/AnnotationCanvas'

interface Props {
  onPracticeCase: (caseId: string) => void
}

function newSurface(zone: NormalizedRect, index: number): Surface {
  return {
    id: `zone-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    arch: 'upper', // unused for image-backed cases; kept for type compatibility
    label: `Zone ${index + 1}`,
    carious: true,
    size: 'small',
    zone,
  }
}

export function AuthorPage({ onPracticeCase }: Props) {
  const customCases = useCaseStore((s) => s.customCases)
  const addCase = useCaseStore((s) => s.addCase)
  const removeCase = useCaseStore((s) => s.removeCase)

  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null)
  const [patientAge, setPatientAge] = useState(9)
  const [chiefComplaint, setChiefComplaint] = useState('Routine recall bitewings.')
  const [surfaces, setSurfaces] = useState<Surface[]>([])
  const [saving, setSaving] = useState(false)
  const [savedCaseId, setSavedCaseId] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const { w: viewW, h: viewH } = useMemo(() => getCaseViewSize(imageDims ?? undefined), [imageDims])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const dims = await readImageDimensions(f)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(f)
    setImageDims(dims)
    setPreviewUrl(URL.createObjectURL(f))
    setSurfaces([])
    setSavedCaseId(null)
  }

  function handleAddZone(zone: NormalizedRect) {
    setSurfaces((s) => [...s, newSurface(zone, s.length)])
  }

  function handleRemoveZone(id: string) {
    setSurfaces((s) => s.filter((z) => z.id !== id))
  }

  function updateSurface(id: string, patch: Partial<Surface>) {
    setSurfaces((s) => s.map((z) => (z.id === id ? { ...z, ...patch } : z)))
  }

  async function handleSave() {
    if (!file || !imageDims || surfaces.length === 0) return
    setSaving(true)
    try {
      const assetId = await putImage(file)
      const caseData: Case = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientAge,
        chiefComplaint,
        teeth: [],
        surfaces,
        image: { assetId, width: imageDims.width, height: imageDims.height },
      }
      addCase(caseData)
      setSavedCaseId(caseData.id)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setFile(null)
      setPreviewUrl(null)
      setImageDims(null)
      setSurfaces([])
    } finally {
      setSaving(false)
    }
  }

  const cariousCount = surfaces.filter((s) => s.carious).length

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 text-sm font-semibold text-slate-700">Add a case</h2>
        <p className="mb-3 text-xs text-slate-500">
          Upload a bitewing image, then drag on it to mark each interproximal contact you want scored — mark
          whether it shows caries (red) or is clear (blue). Click a zone to remove it. Students will colour these
          in during Practice.
        </p>

        {!previewUrl ? (
          <label className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600">
            <span>Click to choose an image, or drag one here</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        ) : (
          <>
            <AnnotationCanvas
              imageUrl={previewUrl}
              viewW={viewW}
              viewH={viewH}
              surfaces={surfaces}
              onAddZone={handleAddZone}
              onRemoveZone={handleRemoveZone}
            />

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Patient age
                <input
                  type="number"
                  min={1}
                  max={18}
                  value={patientAge}
                  onChange={(e) => setPatientAge(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-600">
                Chief complaint
                <input
                  type="text"
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                />
              </label>
            </div>

            {surfaces.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1.5">
                {surfaces.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                    <span className="w-14 text-slate-500">Zone {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => updateSurface(s.id, { carious: !s.carious, size: !s.carious ? 'small' : null })}
                      className={`rounded-full px-2.5 py-1 font-medium ${
                        s.carious ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {s.carious ? 'Caries' : 'Clear'}
                    </button>
                    {s.carious && (
                      <select
                        value={s.size ?? 'small'}
                        onChange={(e) => updateSurface(s.id, { size: e.target.value as LesionSize })}
                        className="rounded-md border border-slate-200 px-1.5 py-1"
                      >
                        <option value="small">Small (enamel)</option>
                        <option value="large">Large (dentin)</option>
                      </select>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveZone(s.id)}
                      className="ml-auto text-slate-400 hover:text-rose-600"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {surfaces.length} zone{surfaces.length === 1 ? '' : 's'} · {cariousCount} carious
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (previewUrl) URL.revokeObjectURL(previewUrl)
                    setFile(null)
                    setPreviewUrl(null)
                    setImageDims(null)
                    setSurfaces([])
                  }}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={surfaces.length === 0 || saving}
                  onClick={handleSave}
                  className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save case'}
                </button>
              </div>
            </div>
          </>
        )}

        {savedCaseId && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <span>✅ Case saved and added to the practice deck.</span>
            <button
              type="button"
              onClick={() => onPracticeCase(savedCaseId)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              Try it now →
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-700">Your cases ({customCases.length})</h2>
        {customCases.length === 0 ? (
          <p className="text-sm text-slate-400">No cases added yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {customCases.map((c) => (
              <CustomCaseRow key={c.id} caseData={c} onDelete={() => removeCase(c.id)} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function CustomCaseRow({ caseData, onDelete }: { caseData: Case; onDelete: () => void }) {
  const url = useObjectUrl(caseData.image?.assetId)
  const cariousCount = caseData.surfaces.filter((s) => s.carious).length

  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-100 p-2">
      <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded bg-black">
        {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-slate-700">{caseData.chiefComplaint}</p>
        <p className="text-xs text-slate-400">
          Age {caseData.patientAge} · {caseData.surfaces.length} zones · {cariousCount} carious
        </p>
      </div>
      <button type="button" onClick={onDelete} className="text-xs text-slate-400 hover:text-rose-600">
        Delete
      </button>
    </li>
  )
}
