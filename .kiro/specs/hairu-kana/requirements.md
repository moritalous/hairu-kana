# Requirements Document

## Introduction

hairu-kana（入るかな）は、Markdownドキュメントを用紙（A4、B5、A3）にレンダリングした場合に何ページになるかを計測するOSSライブラリです。単純な文字数カウントではなく、見出し・テーブル・コードブロックなどを含む実際のレンダリング高さに基づいて「情報密度」を正確に測定します。ブラウザとNode.js/Bunの両環境で動作するデュアルモード設計を採用し、npmモジュール、CLIツール、GitHub Pagesビューアーとして配布します。

## Glossary

- **Counter**: hairu-kana ライブラリのページ数計測エンジン
- **Browser_Counter**: ブラウザ環境で動作する Counter の実装（ライブDOMを使用）
- **Node_Counter**: Node.js/Bun環境で動作する Counter の実装（Playwright経由のヘッドレスChrome使用）
- **Batch_Counter**: 単一ブラウザインスタンスを再利用して複数ドキュメントを計測するNode.js/Bun向けカウンター
- **Markdown_Adapter**: Markdown文字列をHTML文字列に変換するコンポーネント（marked使用、GFM対応）
- **Preset_Resolver**: ユーザー指定のプリセットキーを具体的なピクセル値に解決するコンポーネント
- **Page_Calculator**: レンダリング高さとコンテンツ高さからページ数・充填率を算出する純粋計算コンポーネント
- **CLI**: コマンドラインインターフェース。Markdownファイルを引数に取り、ページ数を標準出力に表示する
- **Viewer**: GitHub Pagesでホスティングされるブラウザベースのインタラクティブビューアー
- **PageResult**: 計測結果を表すデータ構造（pages, renderHeight, contentHeight, lastPageFill, presets）
- **PaperSize**: 用紙サイズプリセットキー（"b5", "a4", "a3"）
- **MeasureOptions**: 計測オプション（用紙サイズ指定）
- **GFM**: GitHub Flavored Markdown。テーブル・取り消し線・タスクリストなどの拡張構文
- **contentHeight**: 1ページあたりのコンテンツ領域高さ（用紙高さからマージンを除いたもの、px）
- **renderHeight**: Markdownをレンダリングした後の総高さ（px）
- **lastPageFill**: 最終ページの充填率（0.0〜1.0）
- **github-markdown-css**: GitHubのMarkdownレンダリングスタイルを再現するCSSライブラリ

## Requirements

### Requirement 1: Markdown→HTML変換

**User Story:** As a developer, I want to convert Markdown to HTML consistently across all environments, so that page measurement results are identical regardless of execution environment.

#### Acceptance Criteria

1. WHEN a valid Markdown string is provided, THE Markdown_Adapter SHALL convert the string to a valid HTML string using marked with GFM enabled
2. WHEN an empty or whitespace-only Markdown string is provided, THE Markdown_Adapter SHALL return an empty string
3. WHEN a Markdown string contains GFM extensions (tables, strikethrough, task lists), THE Markdown_Adapter SHALL convert the extensions to corresponding HTML elements
4. THE Markdown_Adapter SHALL produce identical HTML output for the same Markdown input in both browser and Node.js/Bun environments

### Requirement 2: プリセット解決

**User Story:** As a developer, I want to specify paper size by simple preset keys, so that I can measure page counts without knowing pixel dimensions.

#### Acceptance Criteria

1. WHEN a valid PaperSize key ("b5", "a4", "a3") is provided, THE Preset_Resolver SHALL return the corresponding PaperDimensions with width, height, marginH, and marginV in pixels
2. WHEN no paper option is provided, THE Preset_Resolver SHALL default to "a4" paper size
3. WHEN an empty MeasureOptions object is provided, THE Preset_Resolver SHALL default to "a4" paper size
4. WHEN an invalid PaperSize key is provided, THE Preset_Resolver SHALL throw a HairuKanaError with a message listing the valid options (b5, a4, a3)
5. THE Preset_Resolver SHALL use pixel values derived from 96dpi conversion of physical paper dimensions with Microsoft Word standard margins

### Requirement 3: ページ数計算

**User Story:** As a developer, I want to calculate page count from render height and content height, so that I can determine how many pages a document occupies.

#### Acceptance Criteria

1. WHEN renderHeight is greater than zero, THE Page_Calculator SHALL return pages equal to Math.ceil(renderHeight / contentHeight)
2. WHEN renderHeight is zero, THE Page_Calculator SHALL return pages equal to zero and lastPageFill equal to zero
3. WHEN renderHeight is an exact multiple of contentHeight, THE Page_Calculator SHALL return lastPageFill equal to 1.0
4. THE Page_Calculator SHALL return lastPageFill in the range 0.0 to 1.0 inclusive for non-empty content
5. THE Page_Calculator SHALL return pages such that pages multiplied by contentHeight is greater than or equal to renderHeight

### Requirement 4: ブラウザ環境での計測

**User Story:** As a frontend developer, I want to measure Markdown page counts directly in the browser, so that I can integrate page measurement into web applications without server-side dependencies.

#### Acceptance Criteria

1. WHEN countPages is called with a Markdown string in a browser environment, THE Browser_Counter SHALL create a hidden off-screen div element with the markdown-body class and github-markdown-css styles
2. WHEN the measurement div is created, THE Browser_Counter SHALL set the div width to the content width derived from the selected paper preset (paper width minus twice the horizontal margin)
3. WHEN the measurement is complete, THE Browser_Counter SHALL remove the measurement div from the DOM
4. WHEN countPages is called with an empty Markdown string, THE Browser_Counter SHALL return a PageResult with pages equal to zero
5. THE Browser_Counter SHALL return a valid PageResult containing pages, renderHeight, contentHeight, lastPageFill, and the resolved presets

### Requirement 5: Node.js/Bun環境での計測

**User Story:** As a backend developer, I want to measure Markdown page counts in Node.js/Bun, so that I can use the library in server-side applications and automation scripts.

#### Acceptance Criteria

1. WHEN countPages is called in a Node.js/Bun environment, THE Node_Counter SHALL launch a headless Chrome instance via playwright-core and measure the rendered height using the same div-based approach as the Browser_Counter
2. WHEN the measurement is complete, THE Node_Counter SHALL terminate the browser process
3. WHEN countPages is called with an empty Markdown string, THE Node_Counter SHALL return a PageResult with pages equal to zero
4. THE Node_Counter SHALL return the same PageResult as the Browser_Counter for the same Markdown input and options

### Requirement 6: バッチ計測

**User Story:** As a developer processing multiple documents, I want to reuse a single browser instance across measurements, so that I can avoid repeated browser startup costs.

#### Acceptance Criteria

1. WHEN createCounter is called, THE Batch_Counter SHALL launch a single browser instance and return an object with countPages and close methods
2. WHEN countPages is called on the Batch_Counter, THE Batch_Counter SHALL reuse the existing browser instance for measurement
3. WHEN close is called on the Batch_Counter, THE Batch_Counter SHALL terminate the browser process
4. IF close has been called on the Batch_Counter, THEN THE Batch_Counter SHALL throw an error when countPages is called subsequently
5. WHEN multiple countPages calls are made concurrently on the Batch_Counter, THE Batch_Counter SHALL handle each call safely using separate pages

### Requirement 7: CLI

**User Story:** As a user, I want to measure Markdown page counts from the command line, so that I can quickly check document length without writing code.

#### Acceptance Criteria

1. WHEN a Markdown file path is provided as an argument, THE CLI SHALL read the file and output the page count to standard output
2. WHEN the --paper option is provided with a valid PaperSize key, THE CLI SHALL use the specified paper size for measurement
3. WHEN the --json flag is provided, THE CLI SHALL output the full PageResult as a JSON object
4. WHEN the --help flag is provided, THE CLI SHALL display usage information and exit
5. IF the specified file does not exist, THEN THE CLI SHALL output an error message to standard error and exit with a non-zero exit code

### Requirement 8: 環境パリティ

**User Story:** As a developer, I want identical measurement results across browser and Node.js/Bun environments, so that I can trust the results regardless of where the library runs.

#### Acceptance Criteria

1. THE Counter SHALL use marked for Markdown-to-HTML conversion in all environments to eliminate HTML output differences
2. THE Counter SHALL use github-markdown-css styles (markdown-body class) in all environments to ensure consistent rendering
3. THE Counter SHALL produce the same pages value for the same Markdown input and options in both browser and Node.js/Bun environments

### Requirement 9: 用紙サイズとページ数の関係

**User Story:** As a user, I want to understand how paper size affects page count, so that I can choose the appropriate paper size for my documents.

#### Acceptance Criteria

1. WHEN the same Markdown content is measured with different paper sizes, THE Counter SHALL return pages for A3 less than or equal to pages for A4, and pages for A4 less than or equal to pages for B5

### Requirement 10: 決定性

**User Story:** As a developer, I want consistent measurement results, so that I can rely on the library for automated checks and CI pipelines.

#### Acceptance Criteria

1. WHEN countPages is called multiple times with the same Markdown string and the same options, THE Counter SHALL return the same PageResult each time

### Requirement 11: エラーハンドリング

**User Story:** As a developer, I want clear error messages when something goes wrong, so that I can quickly diagnose and fix issues.

#### Acceptance Criteria

1. IF Chrome or Chromium is not found at CHROME_PATH or default system paths, THEN THE Node_Counter SHALL throw a HairuKanaError with a message instructing the user to install Chrome or set the CHROME_PATH environment variable
2. IF playwright-core is not available at runtime, THEN THE Node_Counter SHALL throw a HairuKanaError with a message instructing the user to install playwright-core
3. IF the browser fails to launch (permissions, corrupted binary), THEN THE Node_Counter SHALL throw a HairuKanaError wrapping the original Playwright error with context information
4. IF DOM measurement exceeds the configured timeout (default 30 seconds), THEN THE Node_Counter SHALL throw a HairuKanaError indicating a timeout

### Requirement 12: Chromeパス探索

**User Story:** As a developer, I want the library to automatically find Chrome on my system, so that I can use the Node.js/Bun mode without manual configuration.

#### Acceptance Criteria

1. WHEN CHROME_PATH environment variable is set, THE Node_Counter SHALL use the specified path as the Chrome executable
2. WHEN CHROME_PATH is not set, THE Node_Counter SHALL search platform-specific default paths (macOS, Windows, Linux) for Chrome or Chromium
3. WHEN multiple Chrome installations exist, THE Node_Counter SHALL use the first found candidate in the platform-specific search order

### Requirement 13: 計測用HTMLテンプレート

**User Story:** As a developer, I want the measurement HTML to be self-contained with embedded styles, so that measurements work without external network requests.

#### Acceptance Criteria

1. THE Counter SHALL embed github-markdown-css styles directly in the measurement HTML template without relying on CDN or external network requests
2. THE Counter SHALL apply the markdown-body class to the measurement container to use github-markdown-css default styles (font-size: 16px, line-height: 1.5)
3. THE Counter SHALL set the measurement container width to the content width derived from the paper preset without overriding font-size or line-height defined by github-markdown-css

### Requirement 14: GitHub Pagesビューアー

**User Story:** As a user, I want an interactive web-based viewer, so that I can visually preview how my Markdown content maps to physical pages.

#### Acceptance Criteria

1. THE Viewer SHALL provide a text input area for entering Markdown content
2. THE Viewer SHALL render the Markdown content and display the calculated page count using the hairu-kana browser build
3. THE Viewer SHALL allow the user to select paper size (B5, A4, A3) and update the measurement result accordingly
4. THE Viewer SHALL display page break positions visually on the rendered content
5. THE Viewer SHALL work as a static site hosted on GitHub Pages without server-side processing
