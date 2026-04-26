import { type MeasureOptions, type PageResult, resolvePresets } from "./core";
import { markdownToHTML } from "./markdown-adapter";
import { calculatePages } from "./measure";

export type { MeasureOptions, PageResult } from "./core";

export async function countPages(
	markdown: string,
	options?: MeasureOptions,
): Promise<PageResult> {
	// Step 1: Resolve presets
	const presets = resolvePresets(options);
	const contentWidth = presets.paper.width - 2 * presets.paper.marginH;
	const contentHeight = presets.paper.height - 2 * presets.paper.marginV;

	// Step 2: Convert Markdown to HTML
	const html = markdownToHTML(markdown);

	// Handle empty markdown
	if (!html) {
		return {
			pages: 0,
			renderHeight: 0,
			contentHeight,
			lastPageFill: 0,
			presets,
		};
	}

	// Step 3: Create hidden off-screen measurement div
	const measureDiv = document.createElement("div");
	measureDiv.className = "markdown-body";
	measureDiv.style.position = "fixed";
	measureDiv.style.visibility = "hidden";
	measureDiv.style.top = "-99999px";
	measureDiv.style.width = `${contentWidth}px`;
	// Do NOT set font-size or line-height - let github-markdown-css handle it
	measureDiv.innerHTML = html;
	document.body.appendChild(measureDiv);

	// Step 4: Measure render height using requestAnimationFrame
	const renderHeight = await new Promise<number>((resolve) => {
		requestAnimationFrame(() => resolve(measureDiv.scrollHeight));
	});

	// Step 5: Cleanup
	document.body.removeChild(measureDiv);

	// Step 6: Calculate pages
	const { pages, lastPageFill } = calculatePages({
		renderHeight,
		contentHeight,
	});

	return { pages, renderHeight, contentHeight, lastPageFill, presets };
}
