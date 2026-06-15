import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { Item, Step, Token } from '../types'
import { ROTATION_ORDER, STAGES, type StageId } from '../data/stages'

export type DrillMode = 'single' | 'rotation'

/** 毎朝モードはこの問題数に達したら自動で停止する */
export const DAILY_LIMIT = 90
/** 毎朝モードで1コースを連続出題する問題数（これを超えるか問題が尽きたら次コースへ） */
const ROTATION_CHUNK = 5

function shuffle<T>(a: T[]): T[] {
  a = a.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0
    const t = a[i]
    a[i] = a[j]
    a[j] = t
  }
  return a
}

export interface DrillState {
  stageId: StageId
  /** single: 単一コース無限 / rotation: 全コースを自動で巡回（毎朝モード） */
  mode: DrillMode
  /** rotation 時、ROTATION_ORDER 内の現在位置 */
  rotIndex: number
  /** rotation 時、現在コースで連続出題した問題数 */
  courseCount: number
  shuffleOn: boolean
  pool: Item[]
  queue: Item[]
  cur: Item | null
  si: number
  /** 現在のかなステップで入力済みのローマ字（複数キーかな用） */
  typed: string
  completed: number
  correct: number
  errors: number
  started: number | null
  /** stop した瞬間のタイムスタンプ（経過時間の確定用） */
  stoppedAt: number | null
  finished: boolean
  /** ミス入力ごとに増えるカウンタ（シェイク演出のトリガ） */
  errFlash: number
}

type Action =
  | { type: 'newSession'; stageId?: StageId; mode?: DrillMode }
  | { type: 'setShuffle'; on: boolean }
  | { type: 'token'; tok: Token }
  | { type: 'stop' }

function refillQueue(pool: Item[], shuffleOn: boolean, stageId: StageId): Item[] {
  const a = pool.slice()
  return shuffleOn || stageId === 'home' ? shuffle(a) : a
}

function startSession(stageId: StageId, shuffleOn: boolean, mode: DrillMode): DrillState {
  const startStage = mode === 'rotation' ? ROTATION_ORDER[0] : stageId
  const pool = STAGES[startStage].items()
  const queue = refillQueue(pool, shuffleOn, startStage)
  const cur = queue.shift() ?? null
  return {
    stageId: startStage, mode, rotIndex: 0, courseCount: 0, shuffleOn, pool, queue, cur, si: 0, typed: '',
    completed: 0, correct: 0, errors: 0, started: null, stoppedAt: null, finished: false, errFlash: 0,
  }
}

type AdvanceResult = Pick<DrillState, 'cur' | 'queue' | 'pool' | 'stageId' | 'rotIndex' | 'courseCount'>

/** 同コース内で次の問題へ（キューが空なら同コースを補充） */
function nextInCourse(state: DrillState): AdvanceResult {
  const queue = state.queue.length ? state.queue.slice() : refillQueue(state.pool, state.shuffleOn, state.stageId)
  const cur = queue.shift() ?? null
  return { cur, queue, pool: state.pool, stageId: state.stageId, rotIndex: state.rotIndex, courseCount: state.courseCount + 1 }
}

/** 次のコースへ進む（毎朝モード） */
function nextCourse(state: DrillState): AdvanceResult {
  const rotIndex = (state.rotIndex + 1) % ROTATION_ORDER.length
  const stageId = ROTATION_ORDER[rotIndex]
  const pool = STAGES[stageId].items()
  const queue = refillQueue(pool, state.shuffleOn, stageId)
  const cur = queue.shift() ?? null
  return { cur, queue, pool, stageId, rotIndex, courseCount: 0 }
}

/** 次の問題を決める。single は同コース無限、rotation は数問ごとにコースを巡回。 */
function advance(state: DrillState): AdvanceResult {
  if (state.mode !== 'rotation') return nextInCourse(state)
  // 規定数こなした or 問題が尽きたら次コースへ
  if (state.courseCount + 1 >= ROTATION_CHUNK || state.queue.length === 0) return nextCourse(state)
  return nextInCourse(state)
}

function curStep(state: DrillState): Step | null {
  return state.cur ? state.cur.steps[state.si] : null
}

/** 1問完了時の共通処理。毎朝モードで上限に達したら自動停止する。 */
function finishItem(state: DrillState, base: Partial<DrillState>): DrillState {
  const completed = state.completed + 1
  if (state.mode === 'rotation' && completed >= DAILY_LIMIT) {
    return { ...state, ...base, si: 0, typed: '', completed, finished: true, stoppedAt: Date.now() }
  }
  const next = advance(state)
  return { ...state, ...base, si: 0, typed: '', completed, ...next }
}

function reducer(state: DrillState, action: Action): DrillState {
  switch (action.type) {
    case 'newSession':
      return startSession(action.stageId ?? state.stageId, state.shuffleOn, action.mode ?? 'single')

    case 'setShuffle': {
      // 残り問題のみ再シャッフル（原実装の refill 相当）
      const queue = refillQueue(state.pool, action.on, state.stageId)
      return { ...state, shuffleOn: action.on, queue }
    }

    case 'stop':
      if (state.finished) return state
      return { ...state, finished: true, stoppedAt: Date.now() }

    case 'token': {
      if (state.finished || !state.cur) return state
      const s = curStep(state)
      if (!s) return state
      const tok = action.tok
      const miss = () => ({ ...state, errors: state.errors + 1, errFlash: state.errFlash + 1 })

      // かなステップ：複数ローマ字候補のいずれかに前方一致すれば進行
      if (s.t === 'kana') {
        if (tok.char === undefined) return miss()
        const cand = state.typed + tok.char
        const matches = s.romaji.filter((r) => r.startsWith(cand))
        if (matches.length === 0) return miss()

        const started = state.started ?? Date.now()
        const correct = state.correct + 1
        const complete = s.romaji.includes(cand) && !matches.some((r) => r.length > cand.length)
        if (!complete) {
          // まだ途中（次のキーを待つ）
          return { ...state, started, correct, typed: cand }
        }
        // このかな確定 → 次ステップ／次の問題へ
        const si = state.si + 1
        if (si >= state.cur.steps.length) {
          return finishItem(state, { started, correct })
        }
        return { ...state, started, correct, si, typed: '' }
      }

      // 単キー操作（特殊キー・クリック）
      let ok = false
      if (s.t === 'key') ok = tok.key === s.v
      else if (s.t === 'click') ok = tok.click === s.v
      if (!ok) return miss()

      const started = state.started ?? Date.now()
      const correct = state.correct + 1
      const si = state.si + 1
      if (si >= state.cur.steps.length) {
        return finishItem(state, { started, correct })
      }
      return { ...state, started, correct, si, typed: '' }
    }

    default:
      return state
  }
}

export function useDrill(initialStage: StageId) {
  const [state, dispatch] = useReducer(reducer, initialStage, (id) => startSession(id, true, 'single'))

  // 入力ハンドラから最新 state を参照するための ref
  const stateRef = useRef(state)
  stateRef.current = state

  const newSession = useCallback(
    (stageId?: StageId, mode?: DrillMode) => dispatch({ type: 'newSession', stageId, mode }),
    [],
  )
  const setShuffle = useCallback((on: boolean) => dispatch({ type: 'setShuffle', on }), [])
  const stop = useCallback(() => dispatch({ type: 'stop' }), [])
  const sendToken = useCallback((tok: Token) => dispatch({ type: 'token', tok }), [])

  // キー入力
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      if (k.length === 1) {
        const lc = k.toLowerCase()
        if (/[a-z']/.test(lc)) { e.preventDefault(); sendToken({ char: lc }); return }
        if (k === ' ') { e.preventDefault(); sendToken({ key: ' ' }); return }
        return
      }
      if (k === 'Tab') { e.preventDefault(); return }
      const sp = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'Enter', 'Delete', 'Home', 'End', 'Escape']
      if (sp.indexOf(k) >= 0) { e.preventDefault(); sendToken({ key: k }) }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [sendToken])

  // クリック入力
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const st = stateRef.current
      if (st.finished || !st.cur) return
      const s = st.cur.steps[st.si]
      if (!s || s.t !== 'click') return
      const target = e.target as HTMLElement | null
      if (target?.closest('.btn,.stage,.fk-tab,input,label')) return
      e.preventDefault()
      const btn = e.button === 0 ? 'left' : e.button === 1 ? 'middle' : e.button === 2 ? 'right' : null
      if (btn) sendToken({ click: btn })
    }
    function onContextMenu(e: MouseEvent) {
      const st = stateRef.current
      const s = st.cur ? st.cur.steps[st.si] : null
      if (!st.finished && s && s.t === 'click') e.preventDefault()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('contextmenu', onContextMenu)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [sendToken])

  return { state, currentStep: curStep(state), newSession, setShuffle, stop }
}
