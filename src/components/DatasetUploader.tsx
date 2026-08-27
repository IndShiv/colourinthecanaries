import { useMemo, useState } from 'react'
import type { Case, Surface } from '../types'
import { basename, normalizeBox, parseManifest, EXAMPLE_MANIFEST, type ManifestEntry } from '../lib/datasetManifest'
import { putImage, readImageDimensions } from '../lib/imageStore'
import { useCaseStore } from '../store/useCaseStore'

function downloadExampleManifest() {
  const blob = new Blob([JSON.stringify(EXAMPLE_MANIFEST, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'example-manifest.json'
  a.click()
  URL.revokeObjectURL(url)
}

function buildSurfaces(entry: ManifestEntry, width: number, height: number): Surface[] {
  return entry.boxes.map((b, i) => {
    const carious = b.carious ?? true
    return {
      id: `zone-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 8)}`,
      arch: 'upper', // unused for image-backed cases; kept for type compatibility
      label: `Zone ${i + 1}`,
      carious,
      size: carious ? (b.size ?? 'small') : null,
      zone: normalizeBox(b, width, height),
    }
  })
}

export function DatasetUploader() {
  const addCase = useCaseStore((s) => s.addCase)

  const [manifest, setManifest] = useState<ManifestEntry[] | null>(null)
  const [manifestError, setManifestError] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [importedCount, setImportedCount] = useState<number | null>(null)

  async function handleManifestChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportedCount(null)
    try {
      const text = await file.text()
      setManifest(parseManifest(text))
      setManifestError(null)
    } catch (err) {
      setManifest(null)
      setManifestError(err instanceof Error ? err.message : 'Could not read manifest.')
    }
  }

  function handleImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    setImages(Array.from(e.target.files ?? []))
    setImportedCount(null)
  }

  const { matched, unmatchedEntries, unusedImages } = useMemo(() => {
    if (!manifest) return { matched: [], unmatchedEntries: [], unusedImages: [] }
    const byName = new Map(images.map((f) => [f.name.toLowerCase(), f]))
    const used = new Set<string>()
    const matched: { entry: ManifestEntry; file: File }[] = []
    const unmatchedEntries: ManifestEntry[] = []

    for (const entry of manifest) {
      const file = byName.get(basename(entry.image).toLowerCase())
      if (file) {
        matched.push({ entry, file })
        used.add(file.name.toLowerCase())
      } else {
        unmatchedEntries.push(entry)
      }
    }
    const unusedImages = images.filter((f) => !used.has(f.name.toLowerCase()))
    return { matched, unmatchedEntries, unusedImages }
  }, [manifest, images])

  function resetAll() {
    setManifest(null)
    setManifestError(null)
    setImages([])
    setImportedCount(null)
  }

  async function handleImport() {
    setImporting(true)
    setProgress(0)
    let done = 0
    for (const { entry, file } of matched) {
      const dims = await readImageDimensions(file)
      const assetId = await putImage(file)
      const caseData: Case = {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientAge: entry.patientAge ?? 9,
        chiefComplaint: entry.chiefComplaint ?? 'Imported from dataset.',
        teeth: [],
        surfaces: buildSurfaces(entry, dims.width, dims.height),
        image: { assetId, width: dims.width, height: dims.height },
      }
      addCase(caseData)
      done++
      setProgress(done)
    }
    setImporting(false)
    setImportedCount(done)
    setManifest(null)
    setImages([])
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500">
        Import many cases at once from a JSON manifest — one entry per image, each listing its bounding boxes
        (normalized 0-1 or pixel coordinates, auto-detected). Boxes reuse the same zone model as single-case
        authoring.{' '}
        <button type="button" onClick={downloadExampleManifest} className="font-medium text-amber-600 underline">
          Download an example manifest
        </button>
        .
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Manifest (.json)
          <input type="file" accept="application/json,.json" onChange={handleManifestChange} className="text-sm" />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-600">
          Images
          <input type="file" accept="image/*" multiple onChange={handleImagesChange} className="text-sm" />
        </label>
      </div>

      {manifestError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">⚠️ {manifestError}</p>
      )}

      {manifest && (
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-medium text-slate-700">
            {matched.length} of {manifest.length} manifest entries matched an uploaded image
            {images.length === 0 && ' — choose the image files above'}
          </p>

          {unmatchedEntries.length > 0 && (
            <div className="mt-2">
              <p className="text-rose-600">Not found among uploaded images:</p>
              <ul className="max-h-24 list-disc overflow-y-auto pl-4">
                {unmatchedEntries.map((e) => (
                  <li key={e.image}>{e.image}</li>
                ))}
              </ul>
            </div>
          )}

          {unusedImages.length > 0 && (
            <div className="mt-2">
              <p className="text-slate-400">Uploaded but not referenced by the manifest (ignored):</p>
              <ul className="max-h-24 list-disc overflow-y-auto pl-4 text-slate-400">
                {unusedImages.map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(manifest || images.length > 0) && (
        <div className="flex items-center justify-between">
          <button type="button" onClick={resetAll} className="text-xs text-slate-400 underline">
            Start over
          </button>
          <button
            type="button"
            disabled={matched.length === 0 || importing}
            onClick={handleImport}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
          >
            {importing ? `Importing ${progress}/${matched.length}…` : `Import ${matched.length} case${matched.length === 1 ? '' : 's'}`}
          </button>
        </div>
      )}

      {importedCount !== null && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          ✅ Imported {importedCount} case{importedCount === 1 ? '' : 's'} into the practice deck.
        </p>
      )}
    </div>
  )
}
