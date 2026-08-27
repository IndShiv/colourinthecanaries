import { useObjectUrl } from '../hooks/useObjectUrl'
import type { CaseImageRef } from '../types'

interface Props {
  image: CaseImageRef
}

/** Renders a teacher-uploaded radiograph as the case background, in place of the schematic SVG. */
export function UploadedCaseImage({ image }: Props) {
  const url = useObjectUrl(image.assetId)

  if (!url) {
    return <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">Loading image…</div>
  }

  return (
    <img
      src={url}
      alt="Bitewing radiograph submitted by instructor"
      className="h-full w-full select-none object-contain"
      draggable={false}
    />
  )
}
