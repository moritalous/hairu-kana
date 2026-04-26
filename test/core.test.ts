import { describe, expect, test } from "bun:test";
import {
	HairuKanaError,
	PAPER_PRESETS,
	type PaperSize,
	buildMeasurementHTML,
	resolvePresets,
} from "../src/core";

// === resolvePresets tests ===

describe("resolvePresets", () => {
	test("returns correct PaperDimensions for b5", () => {
		const result = resolvePresets({ paper: "b5" });
		expect(result.paper).toEqual(PAPER_PRESETS.b5);
	});

	test("returns correct PaperDimensions for a4", () => {
		const result = resolvePresets({ paper: "a4" });
		expect(result.paper).toEqual(PAPER_PRESETS.a4);
	});

	test("returns correct PaperDimensions for a3", () => {
		const result = resolvePresets({ paper: "a3" });
		expect(result.paper).toEqual(PAPER_PRESETS.a3);
	});

	test("defaults to A4 when no options provided", () => {
		const result = resolvePresets();
		expect(result.paper).toEqual(PAPER_PRESETS.a4);
	});

	test("defaults to A4 when empty options {} provided", () => {
		const result = resolvePresets({});
		expect(result.paper).toEqual(PAPER_PRESETS.a4);
	});

	test("throws HairuKanaError with descriptive message for invalid key", () => {
		expect(() => resolvePresets({ paper: "letter" as PaperSize })).toThrow(
			HairuKanaError,
		);
		try {
			resolvePresets({ paper: "letter" as PaperSize });
		} catch (e) {
			expect(e).toBeInstanceOf(HairuKanaError);
			expect((e as HairuKanaError).message).toContain("letter");
			expect((e as HairuKanaError).message).toContain("b5");
			expect((e as HairuKanaError).message).toContain("a4");
			expect((e as HairuKanaError).message).toContain("a3");
		}
	});
});

// === buildMeasurementHTML tests ===

describe("buildMeasurementHTML", () => {
	const presets = resolvePresets({ paper: "a4" });

	test("output contains the rendered HTML content", () => {
		const html = buildMeasurementHTML("<p>Hello</p>", presets);
		expect(html).toContain("<p>Hello</p>");
	});

	test("output contains markdown-body class", () => {
		const html = buildMeasurementHTML("<p>test</p>", presets);
		expect(html).toContain('class="markdown-body"');
	});

	test('output contains id="hairu-kana-measure"', () => {
		const html = buildMeasurementHTML("<p>test</p>", presets);
		expect(html).toContain('id="hairu-kana-measure"');
	});

	test("sets correct container width for A4 (794 - 2*120 = 554px)", () => {
		const html = buildMeasurementHTML("<p>test</p>", presets);
		expect(html).toContain("width: 554px");
	});

	test("sets correct container width for B5", () => {
		const b5Presets = resolvePresets({ paper: "b5" });
		const html = buildMeasurementHTML("<p>test</p>", b5Presets);
		// B5: 669 - 2*91 = 487px
		expect(html).toContain("width: 487px");
	});

	test("does NOT contain inline font-size style on the measurement container", () => {
		const html = buildMeasurementHTML("<p>test</p>", presets);
		// Extract the style attribute of the measurement div
		const divMatch = html.match(/id="hairu-kana-measure"[^>]*style="([^"]*)"/);
		expect(divMatch).not.toBeNull();
		const inlineStyle = divMatch?.[1];
		expect(inlineStyle).not.toContain("font-size");
	});

	test("does NOT contain inline line-height style on the measurement container", () => {
		const html = buildMeasurementHTML("<p>test</p>", presets);
		const divMatch = html.match(/id="hairu-kana-measure"[^>]*style="([^"]*)"/);
		expect(divMatch).not.toBeNull();
		const inlineStyle = divMatch?.[1];
		expect(inlineStyle).not.toContain("line-height");
	});

	test("contains embedded CSS (github-markdown-css)", () => {
		const html = buildMeasurementHTML("<p>test</p>", presets);
		expect(html).toContain("<style>");
		// github-markdown-css defines .markdown-body styles
		expect(html).toContain(".markdown-body");
	});
});
