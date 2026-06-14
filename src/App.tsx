import { useEffect, useMemo, useState } from 'react'
import { useDrill } from './hooks/useDrill'
import { STAGES, STAGE_ORDER, type StageId } from './data/stages'
import { FCOL, FJP, charToPos, fingerOf } from './data/keyboard'
import type { FingerCode } from './types'
import { addRecord, clearRecords, loadRecords, type SessionRecord } from './data/records'
import { Board } from './components/Board'
import { FingerGuide } from './components/FingerGuide'
import { Stats } from './components/Stats'
import { Prompt } from './components/Prompt'
import { DoneCard } from './components/DoneCard'
import { Keymap } from './components/Keymap'
import { History } from './components/History'

const LEGEND_FINGERS: FingerCode[] = ['LP', 'LR', 'LM', 'LI', 'RI', 'RM', 'RR', 'RP', 'LT']

export default function App() {
  const { state, currentStep, newSession, setShuffle, stop } = useDrill('home')

  // 全体キーマップ：練習に自動追従（manualLayer があればそれを優先）
  const [manualLayer, setManualLayer] = useState<string | null>(null)
  // コース／モードが変わったら自動追従に戻す
  useEffect(() => { setManualLayer(null) }, [state.stageId, state.mode])

  // 成績記録
  const [records, setRecords] = useState<SessionRecord[]>(() => loadRecords())

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

  // 現在ステップ＋入力途中から、次に押すキー・指・ヒントを導出
  const view = useMemo(() => {
    const empty = { nextPos: [] as number[], heldPos: null as number | null, finger: null as FingerCode | null, hint: '' }
    const s = currentStep
    if (!s || state.finished) return empty
    if (s.t === 'kana') {
      const repr = s.romaji.find((r) => r.startsWith(state.typed)) ?? s.romaji[0]
      const ch = repr[state.typed.length]
      const p = ch !== undefined ? charToPos[ch] : undefined
      if (p === undefined) return empty
      return { nextPos: [p], heldPos: null, finger: fingerOf(p) ?? null, hint: '' }
    }
    const last = s.pos[s.pos.length - 1]
    return { nextPos: s.pos, heldPos: s.mod ?? null, finger: fingerOf(last) ?? null, hint: s.hint ?? '' }
  }, [currentStep, state.typed, state.finished])

  // 現在ステップが要求するレイヤー（自動追従の対象）
  const autoLayer = useMemo(() => {
    const s = currentStep
    if (!s || state.finished || s.t === 'kana') return 'base'
    if (s.mod === 39) return 'arrow'
    if (s.mod === 38) return 'num'
    if (s.mod === 37) return 'bt'
    if (s.t === 'click') return 'mouse'
    return 'base'
  }, [currentStep, state.finished])

  const shownLayer = manualLayer ?? autoLayer

  const doneSeconds = state.started && state.stoppedAt ? (state.stoppedAt - state.started) / 1000 : 0
  const doneCpm = doneSeconds > 0 ? Math.round(state.correct / (doneSeconds / 60)) : 0

  function persistAndStop() {
    if (state.started) {
      const sec = (Date.now() - state.started) / 1000
      const next = addRecord({
        ts: Date.now(),
        label: state.mode === 'rotation' ? '毎朝ローテ' : STAGES[state.stageId].name,
        mode: state.mode,
        completed: state.completed,
        accuracy,
        cpm: sec > 0 ? Math.round(state.correct / (sec / 60)) : 0,
        errors: state.errors,
        seconds: sec,
      })
      setRecords(next)
    }
    stop()
  }

  function handleClearRecords() {
    if (!window.confirm('成績の記録をすべて消去します。よろしいですか？')) return
    clearRecords()
    setRecords([])
  }

  const isRotation = state.mode === 'rotation'

  return (
    <div className="wrap">
      <header>
        <h1><span className="mono">roBa</span> 練習ドリル</h1>
        <span className="sub">実機配列・無限モード</span>
      </header>
      <p className="note">
        打つのは<b>表示された操作</b>。次に押すキーが<b>実機どおりの配列図</b>で光り、使う<b>指</b>が手の図に出ます。下のキーマップは<b>いま練習しているレイヤーに自動で切り替わります</b>。<b>やめる</b>を押すまで続き、やめると成績が記録されます。
      </p>

      <div className="stages">
        {STAGE_ORDER.map((id: StageId) => (
          <button
            key={id}
            className={'stage' + (!isRotation && id === state.stageId ? ' active' : '')}
            onClick={() => newSession(id, 'single')}
          >
            {STAGES[id].name}
            <small>{STAGES[id].sub}</small>
          </button>
        ))}
        <button
          className={'stage' + (isRotation ? ' active' : '')}
          onClick={() => newSession(undefined, 'rotation')}
        >
          🌅 毎朝モード
          <small>全コース巡回</small>
        </button>
      </div>
      <p className="desc">
        {isRotation
          ? `毎朝モード：全コースを自動で巡回します。今は「${STAGES[state.stageId].name}」。`
          : STAGES[state.stageId].desc}
      </p>

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
          typed={state.typed}
          errFlash={state.errFlash}
          hint={view.hint}
        />
      ) : null}

      <FingerGuide active={view.finger} />

      <div className="board-wrap">
        <Board mode="drill" scale={0.86} nextPos={view.nextPos} heldPos={view.heldPos} />
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
        <button className="btn stop" onClick={persistAndStop}>やめる</button>
        <button className="btn" onClick={() => newSession(state.stageId, state.mode)}>最初から</button>
        <label className="chk">
          <input type="checkbox" checked={state.shuffleOn} onChange={(e) => setShuffle(e.target.checked)} />
          ランダム順
        </label>
        <span className="sub" style={{ marginLeft: 'auto' }}>
          {state.finished ? '「最初から」で再開' : state.started ? 'やめるまで続きます' : '操作すると開始'}
        </span>
      </div>

      <Keymap layerKey={shownLayer} onSelect={setManualLayer} autoFollowing={manualLayer === null} />

      <History records={records} onClear={handleClearRecords} />
    </div>
  )
}
