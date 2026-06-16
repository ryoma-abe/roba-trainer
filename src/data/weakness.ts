// 苦手文字の集計。どのキー（ローマ字1文字／特殊キー）でミスしたかを蓄積する。

export interface WeakEntry {
  miss: number
  total: number
}
export type WeakStat = Record<string, WeakEntry>

const KEY = 'roba-trainer:weak'

export function loadWeak(): WeakStat {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const obj = JSON.parse(raw)
    return obj && typeof obj === 'object' ? (obj as WeakStat) : {}
  } catch {
    return {}
  }
}

/** セッション分の集計を保存済みデータへ加算してマージ */
export function mergeWeak(delta: WeakStat): WeakStat {
  const base = loadWeak()
  for (const k of Object.keys(delta)) {
    const b = base[k] ?? { miss: 0, total: 0 }
    base[k] = { miss: b.miss + delta[k].miss, total: b.total + delta[k].total }
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(base))
  } catch {
    // ignore
  }
  return base
}

export function clearWeak(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export interface WeakRank {
  key: string
  miss: number
  total: number
  rate: number
}

/** ミス率の高い順に上位を返す。minTotal 未満の試行は対象外。onlyChars で a-z' の単打のみに絞れる。 */
export function topWeak(stat: WeakStat, n: number, opts?: { minTotal?: number; onlyChars?: boolean }): WeakRank[] {
  const minTotal = opts?.minTotal ?? 3
  const onlyChars = opts?.onlyChars ?? false
  return Object.keys(stat)
    .filter((k) => (onlyChars ? /^[a-z']$/.test(k) : true))
    .map((k) => ({ key: k, miss: stat[k].miss, total: stat[k].total, rate: stat[k].miss / stat[k].total }))
    .filter((r) => r.total >= minTotal && r.miss > 0)
    .sort((a, b) => b.rate - a.rate || b.miss - a.miss)
    .slice(0, n)
}
