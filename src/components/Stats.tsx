interface Props {
  completed: number
  accuracy: number
  cpm: number
  errors: number
}

export function Stats({ completed, accuracy, cpm, errors }: Props) {
  return (
    <div className="stats">
      <div className="stat">
        <div className="k">完了</div>
        <div className="v">{completed}<small> 問</small></div>
      </div>
      <div className="stat">
        <div className="k">正確率</div>
        <div className="v">{accuracy}<small>%</small></div>
      </div>
      <div className="stat">
        <div className="k">速度</div>
        <div className="v">{cpm}<small> /分</small></div>
      </div>
      <div className="stat">
        <div className="k">ミス</div>
        <div className="v">{errors}</div>
      </div>
    </div>
  )
}
