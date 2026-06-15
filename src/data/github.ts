import type { SessionRecord } from './records'

// GitHub リポジトリへ成績を自動保存する（静的サイトなので PAT をブラウザに保存して Contents API を叩く）。
// トークンはこのブラウザの localStorage にのみ保存され、コードやリポジトリには含まれない。

export interface GitHubConfig {
  token: string
  owner: string
  repo: string
  path: string
  branch: string
}

const KEY = 'roba-trainer:gh'

export const DEFAULT_CONFIG: GitHubConfig = {
  token: '',
  owner: '',
  repo: '',
  path: 'roba-records.json',
  branch: 'main',
}

export function loadConfig(): GitHubConfig {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(cfg: GitHubConfig): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(cfg))
  } catch {
    // ignore
  }
}

export function isConfigured(cfg: GitHubConfig): boolean {
  return !!(cfg.token && cfg.owner && cfg.repo && cfg.path)
}

function apiUrl(cfg: GitHubConfig): string {
  return `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`
}

function headers(cfg: GitHubConfig): HeadersInit {
  return {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

// UTF-8 を安全に base64 化
function toBase64(s: string): string {
  return btoa(String.fromCharCode(...new TextEncoder().encode(s)))
}
function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ''))
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

interface RemoteFile {
  records: SessionRecord[]
  sha: string | null
}

async function getRemote(cfg: GitHubConfig): Promise<RemoteFile> {
  const res = await fetch(`${apiUrl(cfg)}?ref=${encodeURIComponent(cfg.branch)}`, { headers: headers(cfg) })
  if (res.status === 404) return { records: [], sha: null }
  if (!res.ok) throw new Error(`GitHub 取得失敗 (${res.status})`)
  const json = await res.json()
  let records: SessionRecord[] = []
  try {
    const parsed = JSON.parse(fromBase64(json.content))
    if (Array.isArray(parsed)) records = parsed
  } catch {
    records = []
  }
  return { records, sha: json.sha ?? null }
}

/** ts でユニーク化し時刻順に並べる */
export function mergeRecords(a: SessionRecord[], b: SessionRecord[]): SessionRecord[] {
  const map = new Map<number, SessionRecord>()
  for (const r of [...a, ...b]) map.set(r.ts, r)
  return [...map.values()].sort((x, y) => x.ts - y.ts)
}

/** ローカルとリモートを統合してリポジトリへコミットし、統合結果を返す */
export async function syncRecords(cfg: GitHubConfig, local: SessionRecord[]): Promise<SessionRecord[]> {
  const remote = await getRemote(cfg)
  const merged = mergeRecords(local, remote.records)
  const body = {
    message: `roBa Trainer 成績更新 (${merged.length}件)`,
    content: toBase64(JSON.stringify(merged, null, 2)),
    branch: cfg.branch,
    ...(remote.sha ? { sha: remote.sha } : {}),
  }
  const res = await fetch(apiUrl(cfg), {
    method: 'PUT',
    headers: { ...headers(cfg), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`GitHub 保存失敗 (${res.status}) ${msg.slice(0, 120)}`)
  }
  return merged
}
