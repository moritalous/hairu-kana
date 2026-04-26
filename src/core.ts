import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// === 用紙サイズプリセット ===

/** 96dpiでの用紙寸法 (px) */
export interface PaperDimensions {
	/** 96dpiでの総幅 (px) */
	width: number;
	/** 96dpiでの総高さ (px) */
	height: number;
	/** 水平マージン (px、左右) */
	marginH: number;
	/** 垂直マージン (px、上下) */
	marginV: number;
}

export type PaperSize = "b5" | "a4" | "a3";

export interface MeasureOptions {
	paper?: PaperSize;
}

export interface PageResult {
	/** ページ数（コンテンツが空でなければ1以上） */
	pages: number;
	/** レンダリング後の総高さ (px) */
	renderHeight: number;
	/** 1ページあたりのコンテンツ領域高さ (px) */
	contentHeight: number;
	/** 最終ページの充填率 0.0〜1.0 */
	lastPageFill: number;
	/** 計測に使用した解決済みプリセット値 */
	presets: ResolvedPresets;
}

export interface ResolvedPresets {
	paper: PaperDimensions;
}

// === プリセットルックアップテーブル ===

export const PAPER_PRESETS: Record<PaperSize, PaperDimensions> = {
	b5: { width: 669, height: 945, marginH: 91, marginV: 91 },
	a4: { width: 794, height: 1123, marginH: 120, marginV: 96 },
	a3: { width: 1123, height: 1587, marginH: 120, marginV: 96 },
};

const VALID_PAPER_SIZES = Object.keys(PAPER_PRESETS) as PaperSize[];

// === カスタムエラー ===

export class HairuKanaError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "HairuKanaError";
	}
}

// === プリセット解決 ===

export function resolvePresets(options?: MeasureOptions): ResolvedPresets {
	const paperKey = options?.paper ?? "a4";

	if (!Object.hasOwn(PAPER_PRESETS, paperKey)) {
		throw new HairuKanaError(
			`無効な用紙サイズ '${paperKey}'。有効なオプション: ${VALID_PAPER_SIZES.join(", ")}`,
		);
	}

	return {
		paper: PAPER_PRESETS[paperKey],
	};
}

// === 計測用HTMLテンプレート ===

let cachedCSS: string | undefined;

function getGithubMarkdownCSS(): string {
	if (cachedCSS !== undefined) return cachedCSS;

	const require = createRequire(import.meta.url);
	const cssPath = require.resolve(
		"github-markdown-css/github-markdown-light.css",
	);
	cachedCSS = readFileSync(cssPath, "utf-8");
	return cachedCSS;
}

export function buildMeasurementHTML(
	renderedHTML: string,
	presets: ResolvedPresets,
): string {
	const contentWidth = presets.paper.width - 2 * presets.paper.marginH;
	const css = getGithubMarkdownCSS();

	return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
${css}
</style>
</head>
<body>
<div id="hairu-kana-measure"
     class="markdown-body"
     style="width: ${contentWidth}px;">
${renderedHTML}
</div>
</body>
</html>`;
}
