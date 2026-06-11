import type { Item, Stage, Step } from '../types'
import { charToPos } from './keyboard'

export function charSteps(rom: string): Step[] {
  return rom.split('').map((c) => {
    if (c === ' ') return { t: 'key', v: ' ', show: '␣', pos: [38], hint: 'スペース（親指）' }
    return { t: 'char', v: c, show: c, pos: [charToPos[c]] }
  })
}

function lex(list: [string, string][]): Item[] {
  return list.map((it) => ({ kana: it[0], steps: charSteps(it[1]) }))
}

const homeKeys = ['f', 'j', 'd', 'k', 's', 'l', 'a', "'"]

const vowels: [string, string][] = [['あ', 'a'], ['い', 'i'], ['う', 'u'], ['え', 'e'], ['お', 'o']]

const gojuon: [string, string][] = [
  ['か', 'ka'], ['き', 'ki'], ['く', 'ku'], ['け', 'ke'], ['こ', 'ko'],
  ['さ', 'sa'], ['し', 'shi'], ['す', 'su'], ['せ', 'se'], ['そ', 'so'],
  ['た', 'ta'], ['ち', 'chi'], ['つ', 'tsu'], ['て', 'te'], ['と', 'to'],
  ['な', 'na'], ['に', 'ni'], ['ぬ', 'nu'], ['ね', 'ne'], ['の', 'no'],
  ['は', 'ha'], ['ひ', 'hi'], ['ふ', 'fu'], ['へ', 'he'], ['ほ', 'ho'],
  ['ま', 'ma'], ['み', 'mi'], ['む', 'mu'], ['め', 'me'], ['も', 'mo'],
  ['や', 'ya'], ['ゆ', 'yu'], ['よ', 'yo'],
  ['ら', 'ra'], ['り', 'ri'], ['る', 'ru'], ['れ', 're'], ['ろ', 'ro'],
  ['わ', 'wa'], ['を', 'wo'], ['ん', 'nn'],
  ['が', 'ga'], ['ぎ', 'gi'], ['ぐ', 'gu'], ['げ', 'ge'], ['ご', 'go'],
  ['ざ', 'za'], ['じ', 'ji'], ['ず', 'zu'], ['ぜ', 'ze'], ['ぞ', 'zo'],
  ['だ', 'da'], ['で', 'de'], ['ど', 'do'],
  ['ば', 'ba'], ['び', 'bi'], ['ぶ', 'bu'], ['べ', 'be'], ['ぼ', 'bo'],
  ['ぱ', 'pa'], ['ぴ', 'pi'], ['ぷ', 'pu'], ['ぺ', 'pe'], ['ぽ', 'po'],
]

const words: [string, string][] = [
  ['ねこ', 'neko'], ['いぬ', 'inu'], ['あめ', 'ame'], ['そら', 'sora'], ['やま', 'yama'],
  ['みず', 'mizu'], ['はな', 'hana'], ['うみ', 'umi'], ['とり', 'tori'], ['ほし', 'hoshi'],
  ['くるま', 'kuruma'], ['さかな', 'sakana'], ['たまご', 'tamago'], ['かわ', 'kawa'], ['でんわ', 'denwa'],
  ['にほんご', 'nihongo'], ['よろしく', 'yoroshiku'], ['おはよう', 'ohayou'], ['ありがとう', 'arigatou'], ['こんにちは', 'konnichiha'],
]

const sentences: [string, string][] = [
  ['きょうはいいてんきですね', 'kyou wa ii tenki desu ne'],
  ['ごはんをたべました', 'gohan wo tabemashita'],
  ['しごとがおわった', 'shigoto ga owatta'],
  ['あしたもがんばろう', 'ashita mo ganbarou'],
  ['キーボードはたのしい', 'kiiboodo wa tanoshii'],
]

const editItems: Item[] = [
  { kana: '⌫ Backspace', steps: [{ t: 'key', v: 'Backspace', show: '⌫', pos: [40], hint: '右の親指キー（⌫）' }] },
  { kana: '⏎ Enter', steps: [{ t: 'key', v: 'Enter', show: '⏎', pos: [41], hint: '右の親指キー（内側）' }] },
  { kana: 'Delete', steps: [{ t: 'key', v: 'Delete', show: 'Del', pos: [42], hint: '右下のいちばん外側' }] },
]

const arrowItems: Item[] = [
  { kana: '↑ 上', steps: [{ t: 'key', v: 'ArrowUp', show: '↑', pos: [2], mod: 39, hint: '無変換を押しながら E' }] },
  { kana: '↓ 下', steps: [{ t: 'key', v: 'ArrowDown', show: '↓', pos: [12], mod: 39, hint: '無変換を押しながら D' }] },
  { kana: '← 左', steps: [{ t: 'key', v: 'ArrowLeft', show: '←', pos: [11], mod: 39, hint: '無変換を押しながら S' }] },
  { kana: '→ 右', steps: [{ t: 'key', v: 'ArrowRight', show: '→', pos: [13], mod: 39, hint: '無変換を押しながら F' }] },
  { kana: 'Home 行頭', steps: [{ t: 'key', v: 'Home', show: 'Home', pos: [10], mod: 39, hint: '無変換を押しながら A' }] },
  { kana: 'End 行末', steps: [{ t: 'key', v: 'End', show: 'End', pos: [14], mod: 39, hint: '無変換を押しながら G' }] },
  { kana: 'Esc', steps: [{ t: 'key', v: 'Escape', show: 'Esc', pos: [0], mod: 39, hint: '無変換を押しながら Q' }] },
]

const clickItems: Item[] = [
  { kana: '左クリック', steps: [{ t: 'click', v: 'left', show: '左クリック', pos: [18], hint: 'ボールを少し動かして J' }] },
  { kana: '右クリック', steps: [{ t: 'click', v: 'right', show: '右クリック', pos: [20], hint: 'ボールを少し動かして L' }] },
  { kana: '中クリック', steps: [{ t: 'click', v: 'middle', show: '中クリック', pos: [19], hint: 'ボールを少し動かして K' }] },
]

const sentenceItems: Item[] = sentences.map((s) => ({
  kana: s[0],
  steps: charSteps(s[1]).concat([{ t: 'key', v: 'Enter', show: '⏎', pos: [41], hint: '最後に Enter で確定' }]),
}))

export type StageId = 'home' | 'vowels' | 'gojuon' | 'words' | 'edit' | 'arrows' | 'clicks' | 'sentences'

export const STAGE_ORDER: StageId[] = ['home', 'vowels', 'gojuon', 'words', 'edit', 'arrows', 'clicks', 'sentences']

export const STAGES: Record<StageId, Stage> = {
  home: {
    name: 'ホーム', sub: '指の位置',
    desc: 'ホームポジション。表示キーを押して、見ずに指を置けるように。右小指のホームは「\u0027」。',
    items: () => homeKeys.map((c) => ({ kana: '', steps: [{ t: 'char', v: c, show: c, pos: [charToPos[c]] }] })),
  },
  vowels: {
    name: '母音', sub: 'a i u e o',
    desc: '母音 a i u e o。日本語の全音がこれを使う。',
    items: () => lex(vowels),
  },
  gojuon: {
    name: '五十音', sub: 'ka ki ku…',
    desc: '五十音。し=shi, ち=chi, つ=tsu, ふ=fu, ん=nn。',
    items: () => lex(gojuon),
  },
  words: {
    name: '単語', sub: '単語',
    desc: '単語。表示どおりのローマ字を打つ。',
    items: () => lex(words),
  },
  edit: {
    name: '編集', sub: '⌫ ⏎ Del',
    desc: '編集キー。⌫=Backspace、⏎=Enter、Del。すべて右の親指まわり。実機で押すと判定されます。',
    items: () => editItems.slice(),
  },
  arrows: {
    name: '矢印', sub: '↑↓←→',
    desc: '矢印・移動。無変換を押しながら E↑ S← D↓ F→（Home/End/Escも）。実機の矢印キーを検知します。',
    items: () => arrowItems.slice(),
  },
  clicks: {
    name: 'クリック', sub: '左右中',
    desc: 'クリック。トラックボールを少し動かしてから J=左 K=中 L=右。マウスで反応します。',
    items: () => clickItems.slice(),
  },
  sentences: {
    name: '文章', sub: '実戦',
    desc: '文章。ローマ字で打って最後に Enter。スペースも親指で。',
    items: () => sentenceItems.slice(),
  },
}
