import type { CSSProperties } from 'react'
import type { Layer } from '../types'
import { POS, W, H, BASE, LAYERS, fingerOf } from '../data/keyboard'

interface CommonProps {
  scale: number
}

interface DrillProps extends CommonProps {
  mode: 'drill'
  nextPos?: number[]
  heldPos?: number | null
  /** 練習盤面に重ねるレイヤー（base 以外なら刻印を差し替え） */
  layerKey?: string
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
          const overlay = props.layerKey && props.layerKey !== 'base' ? LAYERS[props.layerKey] : null
          const isHeld = props.heldPos === i
          let lab: string
          let dim: boolean
          if (overlay && !isHeld) {
            // 保持キー（修飾キー）はベース刻印のままにして分かりやすく見せる
            lab = overlay.lab[i] !== undefined ? overlay.lab[i] : '·'
            dim = lab === '·'
          } else {
            lab = BASE[i]
            dim = !overlay && !ALPHA.test(lab)
          }
          const classes = ['kc']
          if (dim) classes.push('dim')
          if (props.nextPos?.includes(i)) classes.push('next')
          if (isHeld) classes.push('held')
          return (
            <div key={i} className={classes.join(' ')} style={style} data-pos={i}>
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
