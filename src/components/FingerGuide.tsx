import type { CSSProperties } from 'react'
import type { FingerCode } from '../types'
import { FCOL, FJP } from '../data/keyboard'

const FGR_GEOM: Record<string, { x: number; y: number; w: number; h: number; r?: number; cx?: number; cy?: number }> = {
  LP: { x: 30, y: 62, w: 18, h: 46 },
  LR: { x: 54, y: 46, w: 18, h: 62 },
  LM: { x: 78, y: 36, w: 18, h: 72 },
  LI: { x: 102, y: 50, w: 18, h: 58 },
  LT: { x: 120, y: 96, w: 40, h: 18, r: 34, cx: 122, cy: 102 },
  RI: { x: 260, y: 50, w: 18, h: 58 },
  RM: { x: 284, y: 36, w: 18, h: 72 },
  RR: { x: 308, y: 46, w: 18, h: 62 },
  RP: { x: 332, y: 62, w: 18, h: 46 },
  RT: { x: 220, y: 96, w: 40, h: 18, r: -34, cx: 258, cy: 102 },
}

interface Props {
  active: FingerCode | null
}

export function FingerGuide({ active }: Props) {
  return (
    <div className="finger-guide">
      <svg viewBox="0 0 380 172" width="290" height="131" aria-hidden="true">
        <rect className="palm" x="26" y="104" width="100" height="46" rx="14" />
        {(['LP', 'LR', 'LM', 'LI', 'LT'] as FingerCode[]).map((f) => (
          <FingerRect key={f} code={f} active={active === f} />
        ))}
        <rect className="palm" x="254" y="104" width="100" height="46" rx="14" />
        {(['RI', 'RM', 'RR', 'RP', 'RT'] as FingerCode[]).map((f) => (
          <FingerRect key={f} code={f} active={active === f} />
        ))}
      </svg>
      <div className="finger-name">
        {active ? (
          <span style={{ color: FCOL[active] }}>{FJP[active]}</span>
        ) : (
          <span style={{ color: 'var(--dim)' }}>—</span>
        )}
        <small>使う指</small>
      </div>
    </div>
  )
}

function FingerRect({ code, active }: { code: FingerCode; active: boolean }) {
  const g = FGR_GEOM[code]
  const style: CSSProperties = active ? { filter: `drop-shadow(0 0 6px ${FCOL[code]})` } : { filter: 'none' }
  return (
    <rect
      className="fgr"
      x={g.x}
      y={g.y}
      width={g.w}
      height={g.h}
      rx={9}
      transform={g.r ? `rotate(${g.r} ${g.cx} ${g.cy})` : undefined}
      fill={active ? FCOL[code] : '#222a35'}
      stroke={active ? '#fff' : '#3a4350'}
      style={style}
    />
  )
}
