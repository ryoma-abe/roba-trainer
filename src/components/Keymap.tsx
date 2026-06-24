import { COMBOS, LAYERS } from '../data/keyboard'
import { Board } from './Board'

interface Props {
  layerKey: string
  onSelect: (key: string | null) => void
  /** 練習に自動追従中か（手動選択していない状態） */
  autoFollowing: boolean
}

const LAYER_KEYS = Object.keys(LAYERS)

export function Keymap({ layerKey, onSelect, autoFollowing }: Props) {
  const layer = LAYERS[layerKey]
  return (
    <>
      <div className="section-title">
        <span className="bar-i" />キーマップ全体（全レイヤー）
        {autoFollowing
          ? <span className="auto-badge">練習に自動追従中</span>
          : <button className="auto-badge auto-badge-btn" onClick={() => onSelect(null)}>自動追従に戻す</button>}
      </div>
      <div className="fk-tabs">
        {LAYER_KEYS.map((k) => (
          <button
            key={k}
            className={'fk-tab' + (k === layerKey ? ' active' : '')}
            onClick={() => onSelect(k)}
          >
            {LAYERS[k].name}
          </button>
        ))}
      </div>
      <p className="fk-reach" dangerouslySetInnerHTML={{ __html: layer.reach }} />
      <div className="fk-panel">
        <div className="board-wrap">
          <Board mode="ref" scale={0.86} layer={layer} layerKey={layerKey} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        {layerKey === 'base' ? (
          <span className="enter-callout">
            Enter は右親指のキー（黄色枠）。⌫(Backspace)の隣で、回転して並ぶ親指キーの一番内側。長押しでF系レイヤー。
          </span>
        ) : null}
      </div>

      <div className="section-title"><span className="bar-i" />コンボ（2キー同時押し）</div>
      <div className="combo-list">
        {COMBOS.map((c) => (
          <div className="combo-row" key={c.combo}>
            <span className="combo-keys">{c.combo}</span>
            <span className="combo-arrow">→</span>
            <span className="combo-result">{c.result}</span>
          </div>
        ))}
      </div>
    </>
  )
}
