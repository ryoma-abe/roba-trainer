export interface SessionRecord {
  /** 完了時刻（epoch ms） */
  ts: number
  /** ローカル日付 YYYY-MM-DD */
  date: string
  /** コース名（rotation のときは「毎朝ローテ」） */
  label: string
  mode: 'single' | 'rotation'
  completed: number
  accuracy: number
  cpm: number
  errors: number
  seconds: number
}

const KEY = 'roba-trainer:records'
const MAX = 500

function localDate(ts: number): string {
  const d = new Date(ts)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function loadRecords(): SessionRecord[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? (arr as SessionRecord[]) : []
  } catch {
    return []
  }
}

export function addRecord(r: Omit<SessionRecord, 'date'>): SessionRecord[] {
  const rec: SessionRecord = { ...r, date: localDate(r.ts) }
  const next = [...loadRecords(), rec].slice(-MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // 保存に失敗しても致命的ではないので握りつぶす
  }
  return next
}

export function clearRecords(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** 連続日数（今日または昨日を起点に途切れず練習した日数） */
export function currentStreak(records: SessionRecord[], today = localDate(Date.now())): number {
  if (!records.length) return 0
  const days = new Set(records.map((r) => r.date))
  // 起点：今日やっていれば今日、なければ昨日から
  const dayMs = 86400000
  const todayTs = new Date(today + 'T00:00:00').getTime()
  let cursor = days.has(today) ? todayTs : todayTs - dayMs
  if (!days.has(localDate(cursor))) return 0
  let streak = 0
  while (days.has(localDate(cursor))) {
    streak++
    cursor -= dayMs
  }
  return streak
}
