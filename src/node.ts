import {
	HairuKanaError,
	type MeasureOptions,
	type PageResult,
	buildMeasurementHTML,
	resolvePresets,
} from "./core";
import { markdownToHTML } from "./markdown-adapter";
import { calculatePages } from "./measure";

export type { MeasureOptions, PageResult } from "./core";

/**
 * Playwright の chromium を動的にインポートする。
 * 未インストール時は HairuKanaError をスローする。
 */
async function getChromium() {
	try {
		const pw = await import("playwright-core");
		return pw.chromium;
	} catch {
		throw new HairuKanaError(
			"Node.jsでの使用にはplaywright-coreが必要です。実行: npm add playwright-core",
		);
	}
}

/**
 * Chrome/Edge のチャンネルを決定する。
 * CHROME_CHANNEL 環境変数で上書き可能（例: "msedge"）。
 * デフォルトは "chrome"。
 */
function resolveChannel(): string {
	return process.env.CHROME_CHANNEL ?? "chrome";
}

/**
 * ブラウザを起動する共通ヘルパー。
 * channel ベースで Playwright にブラウザ検出を委譲する。
 */
async function launchBrowser(chromium: any) {
	const channel = resolveChannel();
	try {
		return await chromium.launch({ channel, headless: true });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : String(err);
		throw new HairuKanaError(
			`ブラウザの起動に失敗しました (channel: ${channel}): ${message}`,
		);
	}
}

/**
 * ページ上で scrollHeight を計測する共通ヘルパー。
 */
async function measureRenderHeight(
	browser: any,
	fullHTML: string,
): Promise<number> {
	const page = await browser.newPage();
	try {
		await page.setContent(fullHTML, { waitUntil: "load", timeout: 30000 });
		return await page.evaluate(() => {
			const el = document.getElementById("hairu-kana-measure");
			return el ? el.scrollHeight : 0;
		});
	} finally {
		await page.close();
	}
}

export async function countPages(
	markdown: string,
	options?: MeasureOptions,
): Promise<PageResult> {
	const presets = resolvePresets(options);
	const contentHeight = presets.paper.height - 2 * presets.paper.marginV;

	const html = markdownToHTML(markdown);
	if (!html) {
		return {
			pages: 0,
			renderHeight: 0,
			contentHeight,
			lastPageFill: 0,
			presets,
		};
	}

	const fullHTML = buildMeasurementHTML(html, presets);
	const chromium = await getChromium();
	const browser = await launchBrowser(chromium);

	try {
		const renderHeight = await measureRenderHeight(browser, fullHTML);
		const { pages, lastPageFill } = calculatePages({
			renderHeight,
			contentHeight,
		});
		return { pages, renderHeight, contentHeight, lastPageFill, presets };
	} finally {
		await browser.close();
	}
}

export async function createCounter(): Promise<{
	countPages: (
		markdown: string,
		options?: MeasureOptions,
	) => Promise<PageResult>;
	close: () => Promise<void>;
}> {
	const chromium = await getChromium();
	const browser = await launchBrowser(chromium);
	let closed = false;

	return {
		async countPages(
			markdown: string,
			options?: MeasureOptions,
		): Promise<PageResult> {
			if (closed) {
				throw new HairuKanaError("カウンターは既に閉じられています。");
			}

			const presets = resolvePresets(options);
			const contentHeight = presets.paper.height - 2 * presets.paper.marginV;
			const html = markdownToHTML(markdown);

			if (!html) {
				return {
					pages: 0,
					renderHeight: 0,
					contentHeight,
					lastPageFill: 0,
					presets,
				};
			}

			const fullHTML = buildMeasurementHTML(html, presets);
			const renderHeight = await measureRenderHeight(browser, fullHTML);
			const { pages, lastPageFill } = calculatePages({
				renderHeight,
				contentHeight,
			});
			return { pages, renderHeight, contentHeight, lastPageFill, presets };
		},

		async close(): Promise<void> {
			if (!closed) {
				closed = true;
				await browser.close();
			}
		},
	};
}
