# roba-trainer

[roBa](https://github.com/takashicompany/roBa)（トラックボール付き分割キーボード）の配列を覚えるための練習ドリル。

次に押すキーが**実機どおりの配列図**で光り、使う**指**が手の図に表示される。母音・五十音・単語・文章のタイピング練習に加え、矢印（無変換レイヤー）・編集キー・トラックボールのクリックまで、実機で操作すればそのまま判定される無限モード。

全レイヤー（ベース / 数字・記号 / F系 / 矢印 / マウス / スクロール / Bluetooth）のキーマップ早見表も付属。

## ステージ

| ステージ | 内容 |
| --- | --- |
| ホーム | ホームポジションの指の位置 |
| 母音 | a i u e o |
| 五十音 | か行〜濁音・半濁音 |
| 単語 | よく使う単語 |
| 編集 | ⌫ / ⏎ / Del |
| 矢印 | 無変換 + E/S/D/F など |
| クリック | トラックボールの左・中・右 |
| 文章 | ローマ字入力の実戦 |

## 開発

```bash
npm install
npm run dev      # 開発サーバ
npm run build    # 本番ビルド（dist/）
npm run preview  # ビルド結果のプレビュー
```

## 技術スタック

- Vite + React + TypeScript
- 状態管理は `useReducer` ベースの軽量ステートマシン（[src/hooks/useDrill.ts](src/hooks/useDrill.ts)）
- キー配列・レイヤー定義は [src/data/keyboard.ts](src/data/keyboard.ts)、練習内容は [src/data/stages.ts](src/data/stages.ts)

## デプロイ

`main` への push で GitHub Actions が自動ビルドし、GitHub Pages に公開する（[.github/workflows/deploy.yml](.github/workflows/deploy.yml)）。
