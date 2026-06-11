interface Props {
  completed: number
  accuracy: number
  cpm: number
  seconds: number
  errors: number
}

export function DoneCard({ completed, accuracy, cpm, seconds, errors }: Props) {
  return (
    <div className="done-card">
      <h2>おつかれさま</h2>
      <div className="grid">
        <div className="g"><div className="k">完了</div><div className="v">{completed} 問</div></div>
        <div className="g"><div className="k">正確率</div><div className="v">{accuracy}%</div></div>
        <div className="g"><div className="k">速度</div><div className="v">{cpm} /分</div></div>
        <div className="g"><div className="k">時間</div><div className="v">{seconds.toFixed(1)} 秒</div></div>
        <div className="g"><div className="k">ミス</div><div className="v">{errors}</div></div>
      </div>
    </div>
  )
}
