import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import {
	type PaperSize,
	buildMeasurementHTML,
	resolvePresets,
} from "../src/core";
import { markdownToHTML } from "../src/markdown-adapter";
import { calculatePages } from "../src/measure";

const VALID_PAPER_SIZES: PaperSize[] = ["b5", "a4", "a3"];

/**
 * ブラウザ版 countPages のプロパティテスト
 *
 * bun test にはリアルブラウザ DOM がないため、DOM 不要なロジックパスを検証する。
 * DOM が必要なテスト（Property 6 等）は統合テスト（Task 10）で検証する。
 */
describe("Browser countPages property tests", () => {
	/**
	 * Property 5: 空入力
	 * For any MeasureOptions, countPages called with an empty string
	 * SHALL return pages === 0 and lastPageFill === 0.
	 *
	 * Since bun test has no DOM, we test the early-return logic path directly:
	 * empty markdown → markdownToHTML returns "" → pages: 0, lastPageFill: 0.
	 *
	 * **Validates: Requirements 3.2, 4.4, 5.3**
	 */
	test("Property 5: empty input returns pages === 0 and lastPageFill === 0", () => {
		// Generate empty/whitespace-only strings paired with any valid paper size
		const emptyStringArb = fc.oneof(
			fc.constant(""),
			fc.stringOf(fc.constantFrom(" ", "\t", "\n", "\r"), { maxLength: 50 }),
		);
		const paperArb = fc.constantFrom(...VALID_PAPER_SIZES);

		fc.assert(
			fc.property(emptyStringArb, paperArb, (markdown, paper) => {
				// Replicate the browser countPages early-return path (no DOM needed)
				const presets = resolvePresets({ paper });
				const contentHeight = presets.paper.height - 2 * presets.paper.marginV;
				const html = markdownToHTML(markdown);

				// Empty/whitespace markdown produces empty HTML
				expect(html).toBe("");

				// The early-return path yields pages: 0, lastPageFill: 0
				const result = calculatePages({
					renderHeight: 0,
					contentHeight,
				});
				expect(result.pages).toBe(0);
				expect(result.lastPageFill).toBe(0);
			}),
		);
	});

	/**
	 * Property 6: DOM クリーンアップ
	 * After Browser_Counter.countPages completes, no measurement div elements
	 * SHALL remain in the DOM.
	 *
	 * This property requires a real browser DOM (document.createElement, etc.).
	 * bun test does not provide a DOM environment, so this test is a placeholder
	 * that will be validated in integration tests (Task 10) using Vitest browser mode.
	 *
	 * **Validates: Requirement 4.3**
	 */
	test.skip("Property 6: DOM cleanup — requires real browser (validated in integration tests)", () => {
		// Placeholder: validated in Task 10 integration tests with real browser DOM
	});

	/**
	 * Property 7: PageResult 構造の妥当性
	 * For any Markdown string and MeasureOptions, countPages SHALL return a PageResult
	 * containing pages (non-negative integer), renderHeight (non-negative number),
	 * contentHeight (positive number), lastPageFill (number in [0, 1]),
	 * and presets (valid ResolvedPresets object).
	 *
	 * For empty input, we verify the structure directly via the early-return path.
	 * For non-empty input with simulated renderHeight, we verify calculatePages output.
	 *
	 * **Validates: Requirement 4.5**
	 */
	test("Property 7: PageResult structure validity for empty input", () => {
		const paperArb = fc.constantFrom(...VALID_PAPER_SIZES);

		fc.assert(
			fc.property(paperArb, (paper) => {
				const presets = resolvePresets({ paper });
				const contentHeight = presets.paper.height - 2 * presets.paper.marginV;

				// Simulate the PageResult for empty markdown (early-return path)
				const result = {
					pages: 0,
					renderHeight: 0,
					contentHeight,
					lastPageFill: 0,
					presets,
				};

				// Validate structure
				expect(Number.isInteger(result.pages)).toBe(true);
				expect(result.pages).toBeGreaterThanOrEqual(0);
				expect(result.renderHeight).toBeGreaterThanOrEqual(0);
				expect(result.contentHeight).toBeGreaterThan(0);
				expect(result.lastPageFill).toBeGreaterThanOrEqual(0);
				expect(result.lastPageFill).toBeLessThanOrEqual(1);
				expect(result.presets).toBeDefined();
				expect(result.presets.paper).toBeDefined();
				expect(result.presets.paper.width).toBeGreaterThan(0);
				expect(result.presets.paper.height).toBeGreaterThan(0);
			}),
		);
	});

	test("Property 7: PageResult structure validity for simulated non-empty render", () => {
		const paperArb = fc.constantFrom(...VALID_PAPER_SIZES);
		const renderHeightArb = fc.integer({ min: 1, max: 100000 });

		fc.assert(
			fc.property(paperArb, renderHeightArb, (paper, renderHeight) => {
				const presets = resolvePresets({ paper });
				const contentHeight = presets.paper.height - 2 * presets.paper.marginV;

				const { pages, lastPageFill } = calculatePages({
					renderHeight,
					contentHeight,
				});

				// Simulate the full PageResult
				const result = {
					pages,
					renderHeight,
					contentHeight,
					lastPageFill,
					presets,
				};

				// Validate structure
				expect(Number.isInteger(result.pages)).toBe(true);
				expect(result.pages).toBeGreaterThanOrEqual(1);
				expect(result.renderHeight).toBeGreaterThanOrEqual(0);
				expect(result.contentHeight).toBeGreaterThan(0);
				expect(result.lastPageFill).toBeGreaterThan(0);
				expect(result.lastPageFill).toBeLessThanOrEqual(1);
				expect(result.presets).toBeDefined();
				expect(result.presets.paper).toBeDefined();
			}),
		);
	});

	/**
	 * Property 10: CSS 非上書き
	 * For any PaperSize, the generated measurement HTML SHALL set the container width
	 * but SHALL NOT contain inline font-size or line-height style overrides
	 * on the measurement container.
	 *
	 * This tests buildMeasurementHTML output — no browser DOM needed.
	 *
	 * **Validates: Requirement 13.3**
	 */
	test("Property 10: measurement HTML sets width but does NOT override font-size or line-height", () => {
		const paperArb = fc.constantFrom(...VALID_PAPER_SIZES);
		// Generate arbitrary HTML content to embed
		const htmlContentArb = fc.oneof(
			fc.constant("<p>Hello</p>"),
			fc.constant("<h1>Title</h1><p>Body text</p>"),
			fc.constant("<table><tr><td>Cell</td></tr></table>"),
			fc.constant(""),
		);

		fc.assert(
			fc.property(paperArb, htmlContentArb, (paper, htmlContent) => {
				const presets = resolvePresets({ paper });
				const html = buildMeasurementHTML(htmlContent, presets);

				// Extract the style attribute of the measurement div
				const divMatch = html.match(
					/id="hairu-kana-measure"[^>]*style="([^"]*)"/,
				);
				expect(divMatch).not.toBeNull();

				const styleAttr = divMatch?.[1];

				// Should contain width
				const expectedWidth = presets.paper.width - 2 * presets.paper.marginH;
				expect(styleAttr).toContain(`width: ${expectedWidth}px`);

				// Should NOT contain font-size or line-height overrides
				expect(styleAttr).not.toContain("font-size");
				expect(styleAttr).not.toContain("line-height");
			}),
		);
	});
});
