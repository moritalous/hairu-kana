// === ページ数計算ロジック ===

export interface MeasureInput {
	renderHeight: number;
	contentHeight: number;
}

export function calculatePages(input: MeasureInput): {
	pages: number;
	lastPageFill: number;
} {
	const { renderHeight, contentHeight } = input;

	if (renderHeight === 0) {
		return { pages: 0, lastPageFill: 0 };
	}

	const pages = Math.ceil(renderHeight / contentHeight);
	const remainder = renderHeight % contentHeight;
	const lastPageFill = remainder === 0 ? 1.0 : remainder / contentHeight;

	return { pages, lastPageFill };
}
