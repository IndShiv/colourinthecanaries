import type { Case } from '../types'
import { VIEW_W, VIEW_H, getArchToothRects, getRootRect } from '../lib/layout'

const enamelId = 'enamel-gradient'
const bgId = 'bg-gradient'

function px(n: number, dim: number) {
  return n * dim
}

interface Props {
  caseData: Case
}

/**
 * Stylized, illustrative bitewing radiograph rendered from case data. Not a
 * clinical image — a schematic diagram (dark field, radiopaque tooth
 * shapes, radiolucent lesion shading) built to teach the interproximal
 * caries pattern the source study's cases present.
 */
export function BitewingImage({ caseData }: Props) {
  const upperCount = caseData.teeth.filter((t) => t.arch === 'upper').length
  const lowerCount = caseData.teeth.filter((t) => t.arch === 'lower').length
  const upperTeeth = getArchToothRects('upper', upperCount)
  const lowerTeeth = getArchToothRects('lower', lowerCount)

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className="h-full w-full select-none"
      role="img"
      aria-label={`Bitewing radiograph, patient age ${caseData.patientAge}`}
    >
      <defs>
        <radialGradient id={bgId} cx="50%" cy="50%" r="75%">
          <stop offset="0%" stopColor="#1c1d24" />
          <stop offset="100%" stopColor="#08080b" />
        </radialGradient>
        <linearGradient id={enamelId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2f1ea" />
          <stop offset="55%" stopColor="#cfccc0" />
          <stop offset="100%" stopColor="#9c988c" />
        </linearGradient>
      </defs>

      <rect x={0} y={0} width={VIEW_W} height={VIEW_H} fill={`url(#${bgId})`} />

      {[...upperTeeth, ...lowerTeeth].map((t) => {
        const root = getRootRect(t)
        const tooth = caseData.teeth.find((x) => x.arch === t.arch && x.slot === t.slot)
        return (
          <g key={`${t.arch}-${t.slot}`}>
            <path
              d={rootPath(root, t.arch, VIEW_W, VIEW_H)}
              fill={`url(#${enamelId})`}
              opacity={0.85}
            />
            <rect
              x={px(t.x, VIEW_W)}
              y={px(t.y, VIEW_H)}
              width={px(t.w, VIEW_W)}
              height={px(t.h, VIEW_H)}
              rx={px(t.w, VIEW_W) * 0.22}
              fill={`url(#${enamelId})`}
            />
            {tooth?.hasOcclusalCaries && (
              <ellipse
                cx={px(t.x + t.w / 2, VIEW_W)}
                cy={t.arch === 'upper' ? px(t.y + t.h * 0.82, VIEW_H) : px(t.y + t.h * 0.18, VIEW_H)}
                rx={px(t.w, VIEW_W) * 0.14}
                ry={px(t.h, VIEW_H) * 0.09}
                fill="#2a2a30"
                opacity={0.7}
              />
            )}
          </g>
        )
      })}

      {caseData.surfaces
        .filter((s) => s.carious)
        .map((s) => {
          const cx = px(s.zone.x + s.zone.w / 2, VIEW_W)
          const cy = px(s.zone.y + s.zone.h / 2, VIEW_H)
          const rx = px(s.zone.w, VIEW_W) * (s.size === 'large' ? 0.42 : 0.3)
          const ry = px(s.zone.h, VIEW_H) * (s.size === 'large' ? 0.55 : 0.4)
          return (
            <ellipse
              key={s.id}
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="#26262b"
              opacity={s.size === 'large' ? 0.82 : 0.5}
            />
          )
        })}
    </svg>
  )
}

function rootPath(
  root: { x: number; y: number; w: number; h: number },
  arch: 'upper' | 'lower',
  vw: number,
  vh: number,
) {
  const x0 = px(root.x, vw)
  const x1 = px(root.x + root.w, vw)
  const yTop = px(root.y, vh)
  const yBottom = px(root.y + root.h, vh)
  const tipX = px(root.x + root.w / 2, vw)

  if (arch === 'upper') {
    return `M ${x0} ${yBottom} L ${x1} ${yBottom} L ${tipX} ${yTop} Z`
  }
  return `M ${x0} ${yTop} L ${x1} ${yTop} L ${tipX} ${yBottom} Z`
}
