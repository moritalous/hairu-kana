import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { calculatePages } from "../src/measure";

describe("calculatePages property tests", () => {
	/**
	 * Property 3: ページ数計算の正しさ
	 * For any positive renderHeight and positive contentHeight,
	 * calculatePages SHALL return pages equal to Math.ceil(renderHeight / contentHeight),
	 * and pages multiplied by contentHeight SHALL be greater than or equal to renderHeight.
	 *
	 * **Validates: Requirements 3.1, 3.5**
	 */
	test("Property 3: pages === Math.ceil(renderHeight / contentHeight) and pages * contentHeight >= renderHeight", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 100000 }),
				fc.integer({ min: 1, max: 100000 }),
				(renderHeight, contentHeight) => {
					const result = calculatePages({ renderHeight, contentHeight });
					expect(result.pages).toBe(Math.ceil(renderHeight / contentHeight));
					expect(result.pages * contentHeight).toBeGreaterThanOrEqual(
						renderHeight,
					);
				},
			),
		);
	});

	/**
	 * Property 4: lastPageFill の正しさ
	 * For any positive renderHeight and positive contentHeight,
	 * calculatePages SHALL return lastPageFill in the range (0.0, 1.0].
	 * When renderHeight is an exact multiple of contentHeight, lastPageFill SHALL equal 1.0.
	 *
	 * **Validates: Requirements 3.3, 3.4**
	 */
	test("Property 4a: lastPageFill is in range (0.0, 1.0]", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 100000 }),
				fc.integer({ min: 1, max: 100000 }),
				(renderHeight, contentHeight) => {
					const result = calculatePages({ renderHeight, contentHeight });
					expect(result.lastPageFill).toBeGreaterThan(0);
					expect(result.lastPageFill).toBeLessThanOrEqual(1.0);
				},
			),
		);
	});

	test("Property 4b: exact multiple of contentHeight yields lastPageFill === 1.0", () => {
		fc.assert(
			fc.property(
				fc.integer({ min: 1, max: 1000 }),
				fc.integer({ min: 1, max: 1000 }),
				(multiplier, contentHeight) => {
					const renderHeight = multiplier * contentHeight;
					const result = calculatePages({ renderHeight, contentHeight });
					expect(result.lastPageFill).toBe(1.0);
				},
			),
		);
	});
});
