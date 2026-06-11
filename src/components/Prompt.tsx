import { useEffect, useState } from 'react'
import type { Item } from '../types'

interface Props {
  item: Item
  si: number
  errFlash: number
  hint: string
}

export function Prompt({ item, si, errFlash, hint }: Props) {
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
          const cls = ['ch']
          if (i < si) cls.push('done')
          else if (i === si) {
            cls.push('cur')
            if (flashing) cls.push('err')
          }
          return (
            <span key={i} className={cls.join(' ')}>{s.show}</span>
          )
        })}
      </div>
      <div className="step-hint">{hint}</div>
    </div>
  )
}
