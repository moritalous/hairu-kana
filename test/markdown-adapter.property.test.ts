import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import { markdownToHTML } from "../src/markdown-adapter";

describe("markdownToHTML property tests", () => {
	/**
	 * Property 1: Markdown 変換の正しさ
	 * For any string that is empty or composed entirely of whitespace characters,
	 * markdownToHTML() SHALL return an empty string.
	 * For any string that contains at least one non-whitespace character,
	 * markdownToHTML() SHALL return a non-empty HTML string.
	 *
	 * **Validates: Requirements 1.1, 1.2**
	 */

	test("Property 1a: empty string returns empty string", () => {
		expect(markdownToHTML("")).toBe("");
	});

	test("Property 1b: whitespace-only strings return empty string", () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => s.length > 0 && s.trim() === ""),
				(whitespaceOnly) => {
					expect(markdownToHTML(whitespaceOnly)).toBe("");
				},
			),
		);
	});

	test("Property 1c: strings with at least one non-whitespace character return non-empty HTML", () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => s.trim().length > 0),
				(nonEmpty) => {
					const result = markdownToHTML(nonEmpty);
					expect(result.length).toBeGreaterThan(0);
				},
			),
		);
	});
});
