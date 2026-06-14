// かな → ローマ字候補。実機で打てる複数の表記を許容する（例: つ = tsu / tu / thu）。

/** 基本かな（清音・濁音・半濁音・小書きを除く単独かな） */
const BASE_KANA: Record<string, string[]> = {
  あ: ['a'], い: ['i'], う: ['u'], え: ['e'], お: ['o'],
  か: ['ka'], き: ['ki'], く: ['ku'], け: ['ke'], こ: ['ko'],
  が: ['ga'], ぎ: ['gi'], ぐ: ['gu'], げ: ['ge'], ご: ['go'],
  さ: ['sa'], し: ['shi', 'si'], す: ['su'], せ: ['se'], そ: ['so'],
  ざ: ['za'], じ: ['ji', 'zi'], ず: ['zu'], ぜ: ['ze'], ぞ: ['zo'],
  た: ['ta'], ち: ['chi', 'ti'], つ: ['tsu', 'tu', 'thu'], て: ['te'], と: ['to'],
  だ: ['da'], ぢ: ['di', 'ji'], づ: ['du', 'zu'], で: ['de'], ど: ['do'],
  な: ['na'], に: ['ni'], ぬ: ['nu'], ね: ['ne'], の: ['no'],
  は: ['ha'], ひ: ['hi'], ふ: ['fu', 'hu'], へ: ['he'], ほ: ['ho'],
  ば: ['ba'], び: ['bi'], ぶ: ['bu'], べ: ['be'], ぼ: ['bo'],
  ぱ: ['pa'], ぴ: ['pi'], ぷ: ['pu'], ぺ: ['pe'], ぽ: ['po'],
  ま: ['ma'], み: ['mi'], む: ['mu'], め: ['me'], も: ['mo'],
  や: ['ya'], ゆ: ['yu'], よ: ['yo'],
  ら: ['ra'], り: ['ri'], る: ['ru'], れ: ['re'], ろ: ['ro'],
  わ: ['wa'], を: ['wo', 'o'], ゔ: ['vu'],
  // 小書き単独（拗音にできなかった場合のフォールバック）
  ぁ: ['xa', 'la'], ぃ: ['xi', 'li'], ぅ: ['xu', 'lu'], ぇ: ['xe', 'le'], ぉ: ['xo', 'lo'],
  ゃ: ['xya', 'lya'], ゅ: ['xyu', 'lyu'], ょ: ['xyo', 'lyo'], っ: ['xtu', 'ltu'],
}

/** 拗音（い段かな + 小書きゃゅょ） */
const YOUON: Record<string, string[]> = {
  きゃ: ['kya'], きゅ: ['kyu'], きょ: ['kyo'],
  ぎゃ: ['gya'], ぎゅ: ['gyu'], ぎょ: ['gyo'],
  しゃ: ['sha', 'sya'], しゅ: ['shu', 'syu'], しょ: ['sho', 'syo'],
  じゃ: ['ja', 'jya', 'zya'], じゅ: ['ju', 'jyu', 'zyu'], じょ: ['jo', 'jyo', 'zyo'],
  ちゃ: ['cha', 'tya'], ちゅ: ['chu', 'tyu'], ちょ: ['cho', 'tyo'],
  ぢゃ: ['dya'], ぢゅ: ['dyu'], ぢょ: ['dyo'],
  にゃ: ['nya'], にゅ: ['nyu'], にょ: ['nyo'],
  ひゃ: ['hya'], ひゅ: ['hyu'], ひょ: ['hyo'],
  びゃ: ['bya'], びゅ: ['byu'], びょ: ['byo'],
  ぴゃ: ['pya'], ぴゅ: ['pyu'], ぴょ: ['pyo'],
  みゃ: ['mya'], みゅ: ['myu'], みょ: ['myo'],
  りゃ: ['rya'], りゅ: ['ryu'], りょ: ['ryo'],
}

const SMALL_Y = new Set(['ゃ', 'ゅ', 'ょ'])
const VOWELS = new Set(['a', 'i', 'u', 'e', 'o'])

/** かな1単位（複数キー・複数ローマ字候補を持つ入力単位） */
export interface KanaUnit {
  display: string
  romaji: string[]
}

/** カタカナをひらがなへ正規化（長音「ー」と各種記号はそのまま） */
function toHiragana(s: string): string {
  let out = ''
  for (const ch of s) {
    const code = ch.codePointAt(0)!
    // カタカナ（ァ〜ヶ）→ ひらがな
    if (code >= 0x30a1 && code <= 0x30f6) out += String.fromCodePoint(code - 0x60)
    else out += ch
  }
  return out
}

function geminate(cands: string[]): string[] {
  // 促音：先頭の子音を重ねる（母音始まりは重ねられないのでそのまま）
  return cands.map((r) => (VOWELS.has(r[0]) ? r : r[0] + r))
}

function lastVowel(units: KanaUnit[]): string | null {
  for (let i = units.length - 1; i >= 0; i--) {
    const r = units[i].romaji[0]
    const c = r[r.length - 1]
    if (VOWELS.has(c)) return c
  }
  return null
}

/** かな文字列をローマ字候補つきの入力単位列へ分解 */
export function tokenizeKana(input: string): KanaUnit[] {
  const s = toHiragana(input)
  const units: KanaUnit[] = []
  let sokuon = false
  let i = 0

  const push = (display: string, cands: string[]) => {
    if (sokuon) {
      units.push({ display: 'っ' + display, romaji: geminate(cands) })
      sokuon = false
    } else {
      units.push({ display, romaji: cands })
    }
  }

  while (i < s.length) {
    const c = s[i]
    const next = s[i + 1]

    if (c === 'っ') { sokuon = true; i++; continue }
    if (c === 'ん') { push('ん', ['nn']); i++; continue }
    if (c === 'ー') {
      const v = lastVowel(units)
      if (v) push('ー', [v])
      i++
      continue
    }
    if (next && SMALL_Y.has(next) && YOUON[c + next]) {
      push(c + next, YOUON[c + next])
      i += 2
      continue
    }
    if (BASE_KANA[c]) { push(c, BASE_KANA[c]); i++; continue }

    // 想定外の文字はそのまま1キー扱い（英字など）
    push(c, [c])
    i++
  }

  // 末尾に促音だけ残った場合のフォールバック
  if (sokuon) units.push({ display: 'っ', romaji: ['xtu', 'ltu'] })

  return units
}
