export type FingerCode =
  | 'LP' | 'LR' | 'LM' | 'LI'
  | 'RI' | 'RM' | 'RR' | 'RP'
  | 'LT' | 'RT'

export type StepKind = 'char' | 'key' | 'click'

export interface Step {
  t: StepKind
  /** 正解として比較する値（char: 文字 / key: KeyboardEvent.key / click: ボタン種別） */
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
