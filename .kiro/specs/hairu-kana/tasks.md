# Implementation Plan: hairu-kana (入るかな)

## Overview

hairu-kana は Markdown ドキュメントを用紙（A4、B5、A3）にレンダリングした場合のページ数を計測する OSS ライブラリです。ブラウザと Node.js/Bun のデュアルモード設計で、marked + github-markdown-css + Playwright を使用します。実装は TypeScript で行い、Bun をランタイム・バンドラーとして使用します。

## Tasks

- [x] 1. プロジェクト基盤のセットアップ
  - [x] 1.1 プロジェクト初期化と設定ファイルの作成
    - `package.json` を作成（name, version, description, exports, bin, scripts, dependencies, devDependencies を設計ドキュメント通りに定義）
    - `tsconfig.json` を作成（strict モード、ESM ターゲット）
    - `biome.json` を作成（設計ドキュメントの Biome 設定に準拠）
    - `mise.toml` を作成（bun = "latest", biome = "1.9.4"）
    - `bun install` で依存パッケージをインストール
    - _Requirements: 8.1, 8.2, 13.1_

  - [x] 1.2 共通型・プリセット定義の実装 (`src/core.ts`)
    - `PaperDimensions`, `PaperSize`, `MeasureOptions`, `PageResult`, `ResolvedPresets` インターフェースを定義
    - `PAPER_PRESETS` ルックアップテーブルを定義（B5, A4, A3 の 96dpi ピクセル値、Word 標準マージン）
    - `HairuKanaError` カスタムエラークラスを定義
    - `resolvePresets()` 関数を実装（デフォルト A4、無効キーで HairuKanaError をスロー）
    - `buildMeasurementHTML()` ヘルパーを実装（github-markdown-css 埋め込み、markdown-body クラス適用、コンテナ幅設定、font-size/line-height の上書きなし）
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 13.1, 13.2, 13.3_

  - [x] 1.3 `resolvePresets` のプロパティテスト
    - **Property 2: 無効プリセットのエラー** — 有効な PaperSize キー以外の文字列で HairuKanaError がスローされることを検証
    - **Property 12: プリセットデフォルト** — `countPages(md)` と `countPages(md, {})` が同一の結果を返すことを検証
    - **Validates: Requirements 2.2, 2.3, 2.4**

  - [x] 1.4 `resolvePresets` と `buildMeasurementHTML` のユニットテスト
    - 全用紙サイズ（b5, a4, a3）で正しい PaperDimensions が返ることをテスト
    - デフォルト値（A4）のテスト
    - 無効キーでのエラーメッセージテスト
    - `buildMeasurementHTML` が font-size/line-height をインラインスタイルで上書きしないことをテスト
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 13.3_

- [x] 2. Markdown 変換とページ数計算の実装
  - [x] 2.1 Markdown アダプターの実装 (`src/markdown-adapter.ts`)
    - `markdownToHTML()` 関数を実装（marked を GFM 有効で使用）
    - 空文字列・空白のみの入力で空文字列を返す処理
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 `markdownToHTML` のプロパティテスト
    - **Property 1: Markdown 変換の正しさ** — 空/空白のみの文字列は空文字列を返し、それ以外は非空の HTML 文字列を返すことを検証
    - **Validates: Requirements 1.1, 1.2**

  - [x] 2.3 ページ数計算ロジックの実装 (`src/measure.ts`)
    - `calculatePages()` 関数を実装（Math.ceil による計算、lastPageFill の算出）
    - エッジケース処理: renderHeight === 0 → pages: 0, lastPageFill: 0
    - renderHeight が contentHeight の正確な倍数の場合 → lastPageFill: 1.0
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.4 `calculatePages` のプロパティテスト
    - **Property 3: ページ数計算の正しさ** — 正の renderHeight と contentHeight に対して pages === Math.ceil(renderHeight / contentHeight) かつ pages * contentHeight >= renderHeight を検証
    - **Property 4: lastPageFill の正しさ** — lastPageFill が (0.0, 1.0] の範囲にあり、正確な倍数の場合は 1.0 であることを検証
    - **Validates: Requirements 3.1, 3.3, 3.4, 3.5**

  - [x] 2.5 `markdownToHTML` と `calculatePages` のユニットテスト
    - 各種 Markdown 構文（見出し、リスト、テーブル、コードブロック、GFM 拡張）の変換テスト
    - 既知の renderHeight/contentHeight ペアでのページ数計算テスト
    - _Requirements: 1.1, 1.3, 3.1, 3.2, 3.3_

- [x] 3. チェックポイント — コアロジックの検証
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. ブラウザエントリの実装
  - [x] 4.1 ブラウザ版 `countPages` の実装 (`src/browser.ts`)
    - 非表示オフスクリーン div の作成（position: fixed, visibility: hidden, top: -99999px）
    - `markdown-body` クラスと github-markdown-css スタイルの適用
    - コンテナ幅をプリセットから算出して設定
    - `markdownToHTML()` で HTML 変換後、innerHTML に設定
    - `requestAnimationFrame` で `scrollHeight` を取得
    - 計測後の div クリーンアップ
    - `PageResult` の組み立てと返却
    - 空 Markdown → pages: 0 の処理
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 4.2 ブラウザ版のプロパティテスト
    - **Property 5: 空入力** — 空文字列で pages === 0, lastPageFill === 0 を検証
    - **Property 6: DOM クリーンアップ** — countPages 完了後に計測用 div が DOM に残らないことを検証
    - **Property 7: PageResult 構造の妥当性** — 返却値が正しい型・範囲を持つことを検証
    - **Property 10: CSS 非上書き** — 計測用 HTML にインライン font-size/line-height が含まれないことを検証
    - **Validates: Requirements 4.3, 4.4, 4.5, 13.3**

- [x] 5. Node.js/Bun エントリの実装
  - [x] 5.1 Chrome パス探索の実装 (`src/node.ts` 内)
    - `findChromePath()` 関数を実装（CHROME_PATH 環境変数 → プラットフォーム固有デフォルトパス）
    - macOS, Windows, Linux の候補パスリスト
    - Chrome 未検出時の HairuKanaError スロー
    - _Requirements: 12.1, 12.2, 12.3, 11.1_

  - [x] 5.2 Node.js/Bun 版 `countPages` の実装 (`src/node.ts`)
    - `playwright-core` 経由でヘッドレス Chrome を起動
    - `buildMeasurementHTML()` で自己完結型 HTML を構築
    - `page.setContent()` + `page.evaluate()` で scrollHeight を計測
    - 計測後のブラウザ終了（finally ブロック）
    - タイムアウト処理（デフォルト 30 秒）
    - playwright-core 未インストール時のエラーハンドリング
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 11.2, 11.3, 11.4_

  - [x] 5.3 バッチモード `createCounter` の実装 (`src/node.ts`)
    - 単一ブラウザインスタンスの起動と再利用
    - `countPages` と `close` メソッドを持つオブジェクトの返却
    - `close()` 後の `countPages` 呼び出しでエラースロー
    - 並行呼び出し時の安全性（各呼び出しで別ページを使用）
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.4 Node.js/Bun 版のユニットテスト
    - `findChromePath` のモックテスト（環境変数、プラットフォーム別パス）
    - エラーハンドリングのテスト（Chrome 未検出、playwright-core 未インストール）
    - _Requirements: 11.1, 11.2, 12.1, 12.2_

- [x] 6. チェックポイント — デュアルモード計測の検証
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. CLI の実装
  - [x] 7.1 CLI エントリポイントの実装 (`src/cli.ts`)
    - CLI 引数パース（ファイルパス、--paper、--json、--help）
    - Markdown ファイルの読み込み
    - Node.js/Bun 版 `countPages()` の呼び出し
    - 通常出力: `{filename}: {pages}ページ ({paperSize})` 形式
    - JSON 出力: `--json` フラグで PageResult を JSON 出力
    - ヘルプ表示: `--help` フラグで使い方を表示
    - ファイル未存在時のエラーメッセージ（stderr）と非ゼロ終了コード
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 7.2 CLI のユニットテスト
    - 各種フラグ組み合わせでの引数パーステスト
    - テスト用 Markdown ファイルでの実行テスト
    - エラーケース（ファイル未存在）のテスト
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8. ビルドスクリプトとパッケージ配布設定
  - [x] 8.1 ビルドスクリプトの実装 (`build.ts`)
    - ブラウザ向けビルド（ESM、marked バンドル、github-markdown-css 埋め込み）
    - Node.js/Bun 向けビルド（ESM + CJS、playwright-core を external）
    - CLI 向けビルド（Bun ターゲット、ESM）
    - _Requirements: 8.1, 8.2, 13.1_

  - [x] 8.2 ビルド実行と package.json exports の検証
    - `bun run build` でビルドが成功することを確認
    - `dist/browser.mjs`, `dist/node.mjs`, `dist/node.cjs`, `dist/cli.mjs` が生成されることを確認
    - _Requirements: 8.1, 8.2_

- [x] 9. GitHub Pages ビューアーの実装
  - [x] 9.1 ビューアー HTML の作成 (`viewer/index.html`)
    - Markdown 入力テキストエリア
    - 用紙サイズ選択（B5, A4, A3）
    - hairu-kana ブラウザビルドを使用したページ数計測
    - レンダリング結果とページ区切り位置の可視化
    - 静的サイトとして動作（サーバーサイド処理なし）
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 10. 統合テストと環境パリティ検証
  - [x] 10.1 環境パリティのプロパティテスト
    - **Property 8: 用紙サイズの単調性** — A3 ≤ A4 ≤ B5 のページ数順序を検証
    - **Property 9: 決定性** — 同一入力で同一結果を返すことを検証
    - **Property 11: コンテンツ追加の単調性** — コンテンツ追加でページ数が減少しないことを検証
    - **Validates: Requirements 9.1, 10.1**

  - [x] 10.2 統合テスト
    - ブラウザ E2E テスト: 実ブラウザで既知の Markdown を計測しページ数を検証
    - Node.js/Bun E2E テスト: Playwright で countPages() を実行し期待結果と照合
    - クロス環境パリティテスト: 同じ Markdown をブラウザと Node.js で計測し同一の pages を確認
    - GFM テスト: テーブル・取り消し線・タスクリストを含む Markdown の計測検証
    - CLI テスト: テスト用 Markdown ファイルでバイナリを実行し標準出力をパース
    - _Requirements: 5.4, 8.1, 8.2, 8.3, 10.1_

- [x] 11. 最終チェックポイント — 全テスト通過の確認
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- TypeScript を使用し、Bun をランタイム・バンドラーとして使用
- テストは `bun test` + `fast-check`（ユニット・プロパティ）、Vitest（統合テスト）
