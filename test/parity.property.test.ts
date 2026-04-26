import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { PAPER_PRESETS, resolvePresets } from "../src/core";
import { markdownToHTML } from "../src/markdown-adapter";
import { calculatePages } from "../src/measure";

// Pre-compute contentHeight for each paper size
const CH_A3 = PAPER_PRESETS.a3.height - 2 * PAPER_PRESETS.a3.marginV; // 1395
const CH_A4 = PAPER_PRESETS.a4.height - 2 * PAPER_PRESETS.a4.marginV; // 931
const CH_B5 = PAPER_PRESETS.b5.height - 2 * PAPER_PRESETS.b5.marginV; // 763

describe("環境パリティ property tests", () => {
	/**
	 * Property 8: 用紙サイズの単調性
	 * For any positive renderHeight:
	 *   pages(A3) ≤ pages(A4) ≤ pages(B5)
	 * This holds because contentHeight(A3) > contentHeight(A4) > contentHeight(B5),
	 * and Math.ceil(rh / larger) ≤ Math.ceil(rh / smaller).
	 *
	 * **Validates: Requirements 9.1**
	 */
	test("Property 8: paper size monotonicity — pages(A3) ≤ pages(A4) ≤ pages(B5)", () => {
		fc.assert(
			fc.property(fc.integer({ min: 1, max: 100000 }), (renderHeight) => {
				const pagesA3 = calculatePages({
					renderHeight,
					contentHeight: CH_A3,
				}).pages;
				const pagesA4 = calculatePages({
					renderHeight,
					contentHeight: CH_A4,
				}).pages;
				const pagesB5 = calculatePages({
					renderHeight,
					contentHeight: CH_B5,
				}).pages;

				expect(pagesA3).toBeLessThanOrEqual(pagesA4);
				expect(pagesA4).toBeLessThanOrEqual(pagesB5);
			}),
		);
	});

	/**
	 * Property 9: 決定性
	 * Same input → same result.
	 * Calling the same pure function twice with identical arguments returns identical results.
	 *
	 * **Validates: Requirements 10.1**
	 */
	describe("Property 9: determinism", () => {
		test("calculatePages returns identical results for same input", () => {
			fc.assert(
				fc.property(
					fc.integer({ min: 0, max: 100000 }),
					fc.integer({ min: 1, max: 100000 }),
					(renderHeight, contentHeight) => {
						const r1 = calculatePages({ renderHeight, contentHeight });
						const r2 = calculatePages({ renderHeight, contentHeight });
						expect(r1).toEqual(r2);
					},
				),
			);
		});

		test("markdownToHTML returns identical results for same input", () => {
			fc.assert(
				fc.property(fc.string({ maxLength: 500 }), (markdown) => {
					const r1 = markdownToHTML(markdown);
					const r2 = markdownToHTML(markdown);
					expect(r1).toBe(r2);
				}),
			);
		});

		test("resolvePresets returns identical results for same input", () => {
			const papers = ["b5", "a4", "a3"] as const;
			for (const paper of papers) {
				const r1 = resolvePresets({ paper });
				const r2 = resolvePresets({ paper });
				expect(r1).toEqual(r2);
			}
			// Also test default
			const d1 = resolvePresets();
			const d2 = resolvePresets();
			expect(d1).toEqual(d2);
		});
	});

	/**
	 * Property 11: コンテンツ追加の単調性
	 * For any renderHeight1 and additional positive height,
	 * if renderHeight2 = renderHeight1 + additional, then pages(rh2) >= pages(rh1).
	 * This is a mathematical property of Math.ceil: if x ≤ y then ceil(x/c) ≤ ceil(y/c).
	 *
	 * **Validates: Requirements 9.1**
	 */
	test("Property 11: content addition monotonicity — more content never decreases page count", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 0, max: 50000 }),
				fc.integer({ min: 1, max: 50000 }),
				fc.integer({ min: 1, max: 10000 }),
				(renderHeight1, additional, contentHeight) => {
					const renderHeight2 = renderHeight1 + additional;
					const pages1 = calculatePages({
						renderHeight: renderHeight1,
						contentHeight,
					}).pages;
					const pages2 = calculatePages({
						renderHeight: renderHeight2,
						contentHeight,
					}).pages;

					expect(pages2).toBeGreaterThanOrEqual(pages1);
				},
			),
		);
	});
});
