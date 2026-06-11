import { useCallback, useEffect, useReducer, useRef } from 'react'
import type { Item, Step, Token } from '../types'
import { STAGES, type StageId } from '../data/stages'

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
  shuffleOn: boolean
  pool: Item[]
  queue: Item[]
  cur: Item | null
  si: number
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
  | { type: 'newSession'; stageId?: StageId }
  | { type: 'setShuffle'; on: boolean }
  | { type: 'token'; tok: Token }
  | { type: 'stop' }

function refillQueue(pool: Item[], shuffleOn: boolean, stageId: StageId): Item[] {
  const a = pool.slice()
  return shuffleOn || stageId === 'home' ? shuffle(a) : a
}

function startSession(stageId: StageId, shuffleOn: boolean): DrillState {
  const pool = STAGES[stageId].items()
  const queue = refillQueue(pool, shuffleOn, stageId)
  const cur = queue.shift() ?? null
  return {
    stageId, shuffleOn, pool, queue, cur, si: 0,
    completed: 0, correct: 0, errors: 0, started: null, stoppedAt: null, finished: false, errFlash: 0,
  }
}

function nextItem(state: DrillState): { cur: Item | null; queue: Item[] } {
  let queue = state.queue
  if (!queue.length) queue = refillQueue(state.pool, state.shuffleOn, state.stageId)
  else queue = queue.slice()
  const cur = queue.shift() ?? null
  return { cur, queue }
}

function curStep(state: DrillState): Step | null {
  return state.cur ? state.cur.steps[state.si] : null
}

function reducer(state: DrillState, action: Action): DrillState {
  switch (action.type) {
    case 'newSession':
      return startSession(action.stageId ?? state.stageId, state.shuffleOn)

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
      let ok = false
      if (s.t === 'char') ok = tok.char === s.v
      else if (s.t === 'key') ok = tok.key === s.v
      else if (s.t === 'click') ok = tok.click === s.v

      if (!ok) {
        return { ...state, errors: state.errors + 1, errFlash: state.errFlash + 1 }
      }

      const started = state.started ?? Date.now()
      const correct = state.correct + 1
      const si = state.si + 1
      if (si >= state.cur.steps.length) {
        const { cur, queue } = nextItem(state)
        return { ...state, started, correct, si: 0, completed: state.completed + 1, cur, queue }
      }
      return { ...state, started, correct, si }
    }

    default:
      return state
  }
}

export function useDrill(initialStage: StageId) {
  const [state, dispatch] = useReducer(reducer, initialStage, (id) => startSession(id, true))

  // 入力ハンドラから最新 state を参照するための ref
  const stateRef = useRef(state)
  stateRef.current = state

  const newSession = useCallback((stageId?: StageId) => dispatch({ type: 'newSession', stageId }), [])
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
