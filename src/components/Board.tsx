import type { CSSProperties } from 'react'
import type { Layer } from '../types'
import { POS, W, H, BASE, fingerOf } from '../data/keyboard'

interface CommonProps {
  scale: number
}

interface DrillProps extends CommonProps {
  mode: 'drill'
  nextPos?: number[]
  heldPos?: number | null
}

interface RefProps extends CommonProps {
  mode: 'ref'
  layer: Layer
  layerKey: string
}

type Props = DrillProps | RefProps

const ALPHA = /^[a-z']$/

export function Board(props: Props) {
  const { scale } = props
  const boardStyle: CSSProperties = { width: W * scale + 'px', height: H * scale + 'px' }

  return (
    <div className="board" style={boardStyle}>
      {Array.from({ length: 43 }, (_, i) => {
        const c = POS[i]
        const finger = fingerOf(i)
        const style: CSSProperties = {
          left: (c[0] - 26) * scale + 'px',
          top: (c[1] - 26) * scale + 'px',
          width: 52 * scale + 'px',
          height: 52 * scale + 'px',
          ['--fc' as string]: `var(--${finger})`,
        }
        if (c[2]) style.transform = `rotate(${c[2]}deg)`

        if (props.mode === 'drill') {
          const lab = BASE[i]
          const isL = ALPHA.test(lab)
          const classes = ['kc']
          if (!isL) classes.push('dim')
          if (props.nextPos?.includes(i)) classes.push('next')
          if (props.heldPos === i) classes.push('held')
          return (
            <div key={i} className={classes.join(' ')} style={style} data-pos={i} data-char={isL ? lab : undefined}>
              <span>{lab}</span>
            </div>
          )
        }

        const lab2 = props.layer.lab[i] !== undefined ? props.layer.lab[i] : '·'
        const sub = props.layer.sub[i] || ''
        const trans = lab2 === '·'
        const classes = ['kc', 'ref']
        if (trans) classes.push('dim')
        if (props.layerKey === 'base' && i === 41) classes.push('enter-hi')
        return (
          <div key={i} className={classes.join(' ')} style={style} data-pos={i}>
            <span>{lab2}</span>
            {sub ? <span className="sub">{sub}</span> : null}
          </div>
        )
      })}
    </div>
  )
}
