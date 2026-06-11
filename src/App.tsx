import { useEffect, useMemo, useState } from 'react'
import { useDrill } from './hooks/useDrill'
import { STAGES, STAGE_ORDER, type StageId } from './data/stages'
import { FCOL, FJP, charToPos, fingerOf } from './data/keyboard'
import type { FingerCode } from './types'
import { Board } from './components/Board'
import { FingerGuide } from './components/FingerGuide'
import { Stats } from './components/Stats'
import { Prompt } from './components/Prompt'
import { DoneCard } from './components/DoneCard'
import { Keymap } from './components/Keymap'

const LEGEND_FINGERS: FingerCode[] = ['LP', 'LR', 'LM', 'LI', 'RI', 'RM', 'RR', 'RP', 'LT']

export default function App() {
  const { state, currentStep, newSession, setShuffle, stop } = useDrill('home')
  const [layerKey, setLayerKey] = useState('base')

  // 速度表示用の時計（計測中だけ動かす）
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!state.started || state.finished) return
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [state.started, state.finished])

  const accuracy = useMemo(() => {
    const tot = state.correct + state.errors
    return tot ? Math.round((state.correct / tot) * 100) : 100
  }, [state.correct, state.errors])

  const cpm = useMemo(() => {
    if (!state.started) return 0
    const m = (now - state.started) / 60000
    return m > 0 ? Math.round(state.correct / m) : 0
  }, [state.started, now, state.correct])

  // 現在ステップに対応する指
  const activeFinger: FingerCode | null = useMemo(() => {
    const s = currentStep
    if (!s) return null
    if (s.t === 'char') return fingerOf(charToPos[s.v]) ?? null
    if (s.pos.length) return fingerOf(s.pos[s.pos.length - 1]) ?? null
    return null
  }, [currentStep])

  const doneSeconds = state.started && state.stoppedAt ? (state.stoppedAt - state.started) / 1000 : 0
  const doneCpm = doneSeconds > 0 ? Math.round(state.correct / (doneSeconds / 60)) : 0

  return (
    <div className="wrap">
      <header>
        <h1><span className="mono">roBa</span> 練習ドリル</h1>
        <span className="sub">実機配列・無限モード</span>
      </header>
      <p className="note">
        打つのは<b>表示された操作</b>。次に押すキーが<b>実機どおりの配列図</b>で光り、使う<b>指</b>が手の図に出ます。矢印・クリック・文章なども、実機でその操作をすれば判定されます。<b>やめる</b>を押すまで続きます。
      </p>

      <div className="stages">
        {STAGE_ORDER.map((id: StageId) => (
          <button
            key={id}
            className={'stage' + (id === state.stageId ? ' active' : '')}
            onClick={() => newSession(id)}
          >
            {STAGES[id].name}
            <small>{STAGES[id].sub}</small>
          </button>
        ))}
      </div>
      <p className="desc">{STAGES[state.stageId].desc}</p>

      <Stats completed={state.completed} accuracy={accuracy} cpm={cpm} errors={state.errors} />

      {state.finished ? (
        <DoneCard
          completed={state.completed}
          accuracy={accuracy}
          cpm={doneCpm}
          seconds={doneSeconds}
          errors={state.errors}
        />
      ) : state.cur ? (
        <Prompt
          item={state.cur}
          si={state.si}
          errFlash={state.errFlash}
          hint={currentStep?.hint ?? ''}
        />
      ) : null}

      <FingerGuide active={state.finished ? null : activeFinger} />

      <div className="board-wrap">
        <Board
          mode="drill"
          scale={0.86}
          nextPos={state.finished ? [] : currentStep?.pos}
          heldPos={state.finished ? null : currentStep?.mod ?? null}
        />
      </div>
      <div className="handlabel-row" style={{ maxWidth: 660, margin: '4px auto 0', width: '100%' }}>
        <span>左 / エンコーダ側</span>
        <span>右 / トラックボール側</span>
      </div>

      <div className="legend">
        {LEGEND_FINGERS.map((f) => (
          <span key={f}>
            <i className="dot" style={{ background: FCOL[f] }} />
            {f === 'LT' ? '親指' : FJP[f]}
          </span>
        ))}
      </div>

      <div className="bar">
        <button className="btn stop" onClick={stop}>やめる</button>
        <button className="btn" onClick={() => newSession()}>最初から</button>
        <label className="chk">
          <input type="checkbox" checked={state.shuffleOn} onChange={(e) => setShuffle(e.target.checked)} />
          ランダム順
        </label>
        <span className="sub" style={{ marginLeft: 'auto' }}>
          {state.finished ? '「最初から」で再開' : state.started ? 'やめるまで続きます' : '操作すると開始'}
        </span>
      </div>

      <Keymap layerKey={layerKey} onSelect={setLayerKey} />
    </div>
  )
}
