import { useEffect, useState } from 'react'
import { getImage } from '../lib/imageStore'

/** Resolves a stored image asset to a displayable object URL, revoking it on change/unmount. */
export function useObjectUrl(assetId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!assetId) {
      setUrl(null)
      return
    }
    let objectUrl: string | null = null
    let cancelled = false

    getImage(assetId).then((blob) => {
      if (cancelled || !blob) return
      objectUrl = URL.createObjectURL(blob)
      setUrl(objectUrl)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [assetId])

  return url
}
