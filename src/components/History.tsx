import { useMemo, useState } from 'react'
import type { SessionRecord } from '../data/records'
import { currentStreak } from '../data/records'
import { type GitHubConfig, isConfigured } from '../data/github'

interface Props {
  records: SessionRecord[]
  onClear: () => void
  ghConfig: GitHubConfig
  onSaveGhConfig: (cfg: GitHubConfig) => void
  onSyncNow: () => void
  syncStatus: string
}

const SPARK_W = 280
const SPARK_H = 64

function Sparkline({ values, color, max }: { values: number[]; color: string; max: number }) {
  if (values.length === 0) {
    return <div className="hist-empty">まだ記録がありません</div>
  }
  const n = values.length
  const pad = 4
  const innerW = SPARK_W - pad * 2
  const innerH = SPARK_H - pad * 2
  const x = (i: number) => (n === 1 ? SPARK_W / 2 : pad + (i / (n - 1)) * innerW)
  const y = (v: number) => pad + innerH - (Math.min(v, max) / max) * innerH
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = values[n - 1]
  return (
    <svg width={SPARK_W} height={SPARK_H} className="spark">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === n - 1 ? 3 : 1.6} fill={color} />
      ))}
      <text x={SPARK_W - pad} y={12} textAnchor="end" fontSize="11" fill={color} fontFamily="var(--mono)">
        {last}
      </text>
    </svg>
  )
}

export function History({ records, onClear, ghConfig, onSaveGhConfig, onSyncNow, syncStatus }: Props) {
  const recent = useMemo(() => records.slice(-30), [records])
  const accVals = recent.map((r) => r.accuracy)
  const cpmVals = recent.map((r) => r.cpm)
  const cpmMax = Math.max(60, ...cpmVals)
  const streak = useMemo(() => currentStreak(records), [records])
  const table = useMemo(() => records.slice(-10).reverse(), [records])

  return (
    <>
      <div className="section-title"><span className="bar-i" />成績の記録</div>

      {records.length === 0 ? (
        <p className="desc">セッションを「やめる」と、ここに記録が残ります（このブラウザ内に保存）。</p>
      ) : (
        <>
          <div className="hist-summary">
            <div className="hist-badge">
              <div className="k">連続</div>
              <div className="v">{streak}<small> 日</small></div>
            </div>
            <div className="hist-badge">
              <div className="k">記録数</div>
              <div className="v">{records.length}<small> 回</small></div>
            </div>
          </div>

          <div className="hist-charts">
            <div className="hist-chart">
              <div className="hist-chart-h">正確率 <span style={{ color: 'var(--ok)' }}>%</span></div>
              <Sparkline values={accVals} color="var(--ok)" max={100} />
            </div>
            <div className="hist-chart">
              <div className="hist-chart-h">速度 <span style={{ color: 'var(--accent)' }}>/分</span></div>
              <Sparkline values={cpmVals} color="var(--accent)" max={cpmMax} />
            </div>
          </div>

          <div className="hist-table-wrap">
            <table className="hist-table">
              <thead>
                <tr><th>日付</th><th>コース</th><th>完了</th><th>正確率</th><th>速度</th><th>ミス</th></tr>
              </thead>
              <tbody>
                {table.map((r) => (
                  <tr key={r.ts}>
                    <td>{r.date.slice(5)}</td>
                    <td>{r.label}</td>
                    <td>{r.completed}</td>
                    <td>{r.accuracy}%</td>
                    <td>{r.cpm}</td>
                    <td>{r.errors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bar">
            <button className="btn" onClick={onClear}>記録を消去</button>
          </div>
        </>
      )}

      <GitHubPanel ghConfig={ghConfig} onSave={onSaveGhConfig} onSyncNow={onSyncNow} syncStatus={syncStatus} />
    </>
  )
}

function GitHubPanel({
  ghConfig, onSave, onSyncNow, syncStatus,
}: {
  ghConfig: GitHubConfig
  onSave: (cfg: GitHubConfig) => void
  onSyncNow: () => void
  syncStatus: string
}) {
  const [form, setForm] = useState<GitHubConfig>(ghConfig)
  const linked = isConfigured(ghConfig)
  const set = (k: keyof GitHubConfig) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <details className="gh-panel" open={!linked}>
      <summary>
        リポジトリに保存（GitHub連携）
        <span className={'gh-state' + (linked ? ' on' : '')}>{linked ? '連携中' : '未連携'}</span>
      </summary>
      <p className="gh-note">
        成績を自分の GitHub リポジトリへ自動コミットします。トークンは<b>このブラウザにのみ保存</b>され、コードや公開先には含まれません。
        <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noreferrer">fine-grained PAT</a>
        で対象リポジトリの <b>Contents: Read and write</b> のみ許可するのが安全です。成績を公開したくない場合は<b>プライベートリポジトリ</b>を使ってください。
      </p>
      <div className="gh-form">
        <label>Token<input type="password" value={form.token} onChange={set('token')} placeholder="github_pat_..." autoComplete="off" /></label>
        <label>Owner<input value={form.owner} onChange={set('owner')} placeholder="ryoma-abe" /></label>
        <label>Repo<input value={form.repo} onChange={set('repo')} placeholder="roba-records" /></label>
        <label>Path<input value={form.path} onChange={set('path')} placeholder="roba-records.json" /></label>
        <label>Branch<input value={form.branch} onChange={set('branch')} placeholder="main" /></label>
      </div>
      <div className="bar">
        <button className="btn" onClick={() => onSave(form)}>連携を保存</button>
        <button className="btn" onClick={onSyncNow} disabled={!isConfigured(form)}>今すぐ同期</button>
        {syncStatus ? <span className="sub" style={{ marginLeft: 'auto' }}>{syncStatus}</span> : null}
      </div>
    </details>
  )
}
