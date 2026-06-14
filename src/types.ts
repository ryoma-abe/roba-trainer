export type FingerCode =
  | 'LP' | 'LR' | 'LM' | 'LI'
  | 'RI' | 'RM' | 'RR' | 'RP'
  | 'LT' | 'RT'

/** かな入力単位：複数キー・複数ローマ字候補を許容する（例: つ = tsu / tu / thu） */
export interface KanaStep {
  t: 'kana'
  /** プロンプトに出すかな（拗音・促音含む） */
  display: string
  /** 受理するローマ字候補（いずれかで打てる） */
  romaji: string[]
}

/** 単キー操作（特殊キー・クリック）。1ストロークで判定。 */
export interface ActionStep {
  t: 'key' | 'click'
  /** 正解として比較する値（key: KeyboardEvent.key / click: ボタン種別） */
  v: string
  /** プロンプト上の表示文字 */
  show: string
  /** ハイライトするキー位置（複数可） */
  pos: number[]
  /** 押しながら使う修飾キーの位置（held 表示） */
  mod?: number
  /** 補足の一言ヒント */
  hint?: string
}

export type Step = KanaStep | ActionStep

export interface Item {
  kana: string
  steps: Step[]
}

/** 入力イベントを正規化したトークン */
export interface Token {
  char?: string
  key?: string
  click?: string
}

export interface Stage {
  name: string
  sub: string
  desc: string
  items: () => Item[]
}

export interface Layer {
  name: string
  reach: string
  lab: Record<number, string>
  sub: Record<number, string>
}
