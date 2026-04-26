import { describe, expect, test } from "bun:test";
import { markdownToHTML } from "../src/markdown-adapter";

describe("markdownToHTML", () => {
	test("converts heading: # Hello → contains <h1>", () => {
		const result = markdownToHTML("# Hello");
		expect(result).toContain("<h1>");
	});

	test("converts list: - item1\\n- item2 → contains <li>", () => {
		const result = markdownToHTML("- item1\n- item2");
		expect(result).toContain("<li>");
	});

	test("converts GFM table → contains <table>", () => {
		const result = markdownToHTML("| a | b |\n|---|---|\n| 1 | 2 |");
		expect(result).toContain("<table>");
	});

	test("converts code block → contains <code>", () => {
		const result = markdownToHTML("```\nconsole.log('hi')\n```");
		expect(result).toContain("<code>");
	});

	test("converts GFM strikethrough: ~~deleted~~ → contains <del>", () => {
		const result = markdownToHTML("~~deleted~~");
		expect(result).toContain("<del>");
	});

	test("converts GFM task list → contains <input (checkbox)", () => {
		const result = markdownToHTML("- [x] done\n- [ ] todo");
		expect(result).toContain("<input");
	});

	test("empty string returns empty string", () => {
		expect(markdownToHTML("")).toBe("");
	});

	test("whitespace-only returns empty string", () => {
		expect(markdownToHTML("   \n\t  ")).toBe("");
	});
});
