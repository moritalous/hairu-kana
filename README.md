# hairu-kana (入るかな)

Markdown ドキュメントを用紙（A4・B5・A3）にレンダリングした場合のページ数を計測するライブラリ。

文字数カウントではなく、見出し・テーブル・コードブロックなどを含む**実際のレンダリング高さ**に基づいてページ数を算出します。GitHub Flavored Markdown（GFM）対応。

## 特徴

- 用紙サイズ指定だけでページ数を計測（B5 / A4 / A3）
- ブラウザと Node.js の両環境で動作（デュアルモード）
- [github-markdown-css](https://github.com/sindresorhus/github-markdown-css) による GitHub スタイルのレンダリング
- GFM 対応（テーブル・取り消し線・タスクリスト）
- CLI ツール付き

## インストール

```bash
npm install hairu-kana
```

Node.js 環境で使う場合は Chrome/Chromium/Edge のいずれかがシステムにインストールされている必要があります。

## 使い方

### Node.js

```typescript
import { countPages } from "hairu-kana";

const markdown = `# 月次レポート

## 概要

Lorem ipsum dolor sit amet...`;

const result = await countPages(markdown, { paper: "a4" });

console.log(`${result.pages}ページ（最終ページ ${Math.round(result.lastPageFill * 100)}% 使用）`);
// → "2ページ（最終ページ 72% 使用）"
```

### 用紙サイズの指定

```typescript
// デフォルトは A4
const a4 = await countPages(markdown);
const b5 = await countPages(markdown, { paper: "b5" });
const a3 = await countPages(markdown, { paper: "a3" });
```

### バッチモード

複数ドキュメントを計測する場合、ブラウザインスタンスを再利用できます。

```typescript
import { createCounter } from "hairu-kana";

const counter = await createCounter();
try {
  for (const file of markdownFiles) {
    const md = await fs.promises.readFile(file, "utf-8");
    const result = await counter.countPages(md, { paper: "a4" });
    console.log(`${file}: ${result.pages}ページ`);
  }
} finally {
  await counter.close();
}
```

### ブラウザ

```html
<script type="module">
import { countPages } from "./dist/browser.mjs";

const result = await countPages("# Hello\n\nWorld", { paper: "a4" });
console.log(result.pages);
</script>
```

### CLI

```bash
# 基本
npx hairu-kana report.md
# → report.md: 3ページ (A4)

# 用紙サイズ指定
npx hairu-kana report.md --paper b5

# JSON 出力
npx hairu-kana report.md --json

# ヘルプ
npx hairu-kana --help
```

## API

### `countPages(markdown, options?)`

| パラメータ | 型 | 説明 |
|---|---|---|
| `markdown` | `string` | Markdown 文字列 |
| `options.paper` | `"b5" \| "a4" \| "a3"` | 用紙サイズ（デフォルト: `"a4"`） |

戻り値: `Promise<PageResult>`

### `PageResult`

| フィールド | 型 | 説明 |
|---|---|---|
| `pages` | `number` | ページ数 |
| `renderHeight` | `number` | レンダリング後の総高さ (px) |
| `contentHeight` | `number` | 1ページあたりのコンテンツ領域高さ (px) |
| `lastPageFill` | `number` | 最終ページの充填率（0.0〜1.0） |
| `presets` | `ResolvedPresets` | 使用したプリセット値 |

### `createCounter()`

バッチ計測用。単一ブラウザインスタンスを再利用します。

戻り値: `Promise<{ countPages, close }>`

- `countPages(markdown, options?)` — `countPages` と同じ API
- `close()` — ブラウザを終了

## 環境変数

| 変数 | 説明 |
|---|---|
| `CHROME_CHANNEL` | Playwright のブラウザチャンネル（デフォルト: `"chrome"`）。`"msedge"` 等に変更可能 |

## 用紙サイズプリセット

96dpi 換算、Microsoft Word 標準マージン準拠。

| サイズ | 幅 (px) | 高さ (px) | 水平マージン (px) | 垂直マージン (px) |
|---|---|---|---|---|
| B5 | 669 | 945 | 91 | 91 |
| A4 | 794 | 1123 | 120 | 96 |
| A3 | 1123 | 1587 | 120 | 96 |

## 開発

```bash
# ツールインストール（mise で Bun + Biome を管理）
mise install

# 依存パッケージ
bun install

# ビルド
bun run build

# ユニットテスト・プロパティテスト
bun test

# 統合テスト（Playwright + Chrome、Node.js で実行）
bun run test:integration
```

## 技術スタック

- **Markdown → HTML**: [marked](https://github.com/markedjs/marked)（GFM 対応）
- **レンダリングスタイル**: [github-markdown-css](https://github.com/sindresorhus/github-markdown-css)
- **ヘッドレスブラウザ**: [playwright-core](https://github.com/microsoft/playwright)（Node.js 環境）
- **バンドラー**: Bun.build()
- **テスト**: bun test + fast-check（プロパティテスト）+ Vitest（統合テスト）
- **リンター**: Biome

## ライセンス

MIT
