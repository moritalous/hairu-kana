import { describe, expect, test } from "bun:test";
import { calculatePages } from "../src/measure";

describe("calculatePages", () => {
	test("renderHeight: 1000, contentHeight: 500 → pages: 2, lastPageFill: 1.0", () => {
		const result = calculatePages({ renderHeight: 1000, contentHeight: 500 });
		expect(result.pages).toBe(2);
		expect(result.lastPageFill).toBe(1.0);
	});

	test("renderHeight: 1001, contentHeight: 500 → pages: 3, lastPageFill close to 0.002", () => {
		const result = calculatePages({ renderHeight: 1001, contentHeight: 500 });
		expect(result.pages).toBe(3);
		expect(result.lastPageFill).toBeCloseTo(0.002, 3);
	});

	test("renderHeight: 0, contentHeight: 500 → pages: 0, lastPageFill: 0", () => {
		const result = calculatePages({ renderHeight: 0, contentHeight: 500 });
		expect(result.pages).toBe(0);
		expect(result.lastPageFill).toBe(0);
	});

	test("renderHeight: 499, contentHeight: 500 → pages: 1, lastPageFill: 0.998", () => {
		const result = calculatePages({ renderHeight: 499, contentHeight: 500 });
		expect(result.pages).toBe(1);
		expect(result.lastPageFill).toBeCloseTo(0.998, 3);
	});

	test("renderHeight: 500, contentHeight: 500 → pages: 1, lastPageFill: 1.0", () => {
		const result = calculatePages({ renderHeight: 500, contentHeight: 500 });
		expect(result.pages).toBe(1);
		expect(result.lastPageFill).toBe(1.0);
	});
});
