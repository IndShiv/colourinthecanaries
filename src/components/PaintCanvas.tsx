import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

export type BrushTool = 'brush' | 'eraser'

export interface PaintCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null
  clear: () => void
  hasPaint: () => boolean
}

interface Props {
  color: string
  brushSize: number
  tool: BrushTool
  disabled?: boolean
  viewW: number
  viewH: number
}

const RESOLUTION_SCALE = 2

export const PaintCanvas = forwardRef<PaintCanvasHandle, Props>(function PaintCanvas(
  { color, brushSize, tool, disabled, viewW, viewH },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [, forceRerender] = useState(0)

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    clear: () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
      forceRerender((n) => n + 1)
    },
    hasPaint: () => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return false
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      for (let i = 3; i < data.length; i += 4 * 97) {
        if (data[i] > 10) return true
      }
      return false
    },
  }))

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height
    return { x, y }
  }

  function strokeTo(from: { x: number; y: number } | null, to: { x: number; y: number }) {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = brushSize * RESOLUTION_SCALE
    ctx.globalAlpha = tool === 'eraser' ? 1 : 0.65

    const start = from ?? to
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return
    ;(e.target as HTMLCanvasElement).setPointerCapture(e.pointerId)
    drawingRef.current = true
    const p = getPoint(e)
    lastPointRef.current = p
    if (p) strokeTo(null, p)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current || disabled) return
    const p = getPoint(e)
    if (!p) return
    strokeTo(lastPointRef.current, p)
    lastPointRef.current = p
  }

  function handlePointerUp() {
    drawingRef.current = false
    lastPointRef.current = null
  }

  return (
    <canvas
      ref={canvasRef}
      width={viewW * RESOLUTION_SCALE}
      height={viewH * RESOLUTION_SCALE}
      className={`absolute inset-0 h-full w-full touch-none ${disabled ? 'cursor-default' : 'cursor-crosshair'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  )
})
