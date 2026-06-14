import { useEffect, useState } from 'react'
import type { Item, Step } from '../types'

interface Props {
  item: Item
  si: number
  typed: string
  errFlash: number
  hint: string
}

function reprOf(s: Step, typed: string, isCur: boolean): string {
  if (s.t !== 'kana') return s.show
  if (isCur) return s.romaji.find((r) => r.startsWith(typed)) ?? s.romaji[0]
  return s.romaji[0]
}

export function Prompt({ item, si, typed, errFlash, hint }: Props) {
  const [flashing, setFlashing] = useState(false)

  useEffect(() => {
    if (errFlash === 0) return
    setFlashing(true)
    const t = setTimeout(() => setFlashing(false), 180)
    return () => clearTimeout(t)
  }, [errFlash])

  return (
    <div className="prompt">
      <div className="kana">
        {item.kana ? item.kana : <span className="label">キー</span>}
      </div>
      <div className="romaji">
        {item.steps.map((s, i) => {
          const isCur = i === si
          const repr = reprOf(s, typed, isCur)
          const cls = ['ch']
          if (i < si) cls.push('done')
          else if (isCur) {
            cls.push('cur')
            if (flashing) cls.push('err')
          }
          if (isCur && s.t === 'kana' && typed) {
            return (
              <span key={i} className={cls.join(' ')}>
                <span className="typed">{repr.slice(0, typed.length)}</span>
                {repr.slice(typed.length)}
              </span>
            )
          }
          return <span key={i} className={cls.join(' ')}>{repr}</span>
        })}
      </div>
      <div className="step-hint">{hint}</div>
    </div>
  )
}
