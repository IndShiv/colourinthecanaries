import clsx from 'clsx'
import type { BrushTool } from './PaintCanvas'

export const PALETTE = ['#f97316', '#facc15', '#ef4444', '#22c55e', '#38bdf8', '#c084fc']

interface Props {
  color: string
  onColorChange: (c: string) => void
  brushSize: number
  onBrushSizeChange: (n: number) => void
  tool: BrushTool
  onToolChange: (t: BrushTool) => void
  onClear: () => void
  disabled?: boolean
}

export function ColorToolbar({
  color,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  tool,
  onToolChange,
  onClear,
  disabled,
}: Props) {
  return (
    <div
      className={clsx(
        'flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm',
        disabled && 'pointer-events-none opacity-50',
      )}
    >
      <div className="flex items-center gap-1.5">
        {PALETTE.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Choose colour ${c}`}
            onClick={() => {
              onColorChange(c)
              onToolChange('brush')
            }}
            className={clsx(
              'h-6 w-6 rounded-full border-2 transition',
              color === c && tool === 'brush' ? 'border-slate-800 scale-110' : 'border-transparent',
            )}
            style={{ backgroundColor: c }}
          />
        ))}
        <label className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-slate-300">
          <input
            type="color"
            value={color}
            onChange={(e) => {
              onColorChange(e.target.value)
              onToolChange('brush')
            }}
            className="absolute -left-1 -top-1 h-8 w-8 cursor-pointer"
          />
        </label>
      </div>

      <div className="h-6 w-px bg-slate-200" />

      <label className="flex items-center gap-2 text-xs text-slate-600">
        Brush
        <input
          type="range"
          min={6}
          max={36}
          value={brushSize}
          onChange={(e) => onBrushSizeChange(Number(e.target.value))}
          className="w-20 accent-amber-500"
        />
      </label>

      <button
        type="button"
        onClick={() => onToolChange('eraser')}
        className={clsx(
          'rounded-lg px-2.5 py-1 text-xs font-medium transition',
          tool === 'eraser' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        )}
      >
        Eraser
      </button>

      <button
        type="button"
        onClick={onClear}
        className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
      >
        Clear
      </button>
    </div>
  )
}
