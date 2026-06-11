import { LAYERS } from '../data/keyboard'
import { Board } from './Board'

interface Props {
  layerKey: string
  onSelect: (key: string) => void
}

const LAYER_KEYS = Object.keys(LAYERS)

export function Keymap({ layerKey, onSelect }: Props) {
  const layer = LAYERS[layerKey]
  return (
    <>
      <div className="section-title"><span className="bar-i" />キーマップ全体（全レイヤー）</div>
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
    </>
  )
}
