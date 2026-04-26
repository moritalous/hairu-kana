import { describe, expect, test } from "bun:test";
import fc from "fast-check";
import {
	HairuKanaError,
	PAPER_PRESETS,
	type PaperSize,
	resolvePresets,
} from "../src/core";

const VALID_KEYS: PaperSize[] = ["b5", "a4", "a3"];

describe("resolvePresets property tests", () => {
	/**
	 * Property 2: 無効プリセットのエラー
	 * For any string that is NOT one of the valid PaperSize keys ("b5", "a4", "a3"),
	 * resolvePresets({ paper: invalidKey }) SHALL throw a HairuKanaError.
	 *
	 * **Validates: Requirements 2.4**
	 */
	test("Property 2: invalid paper key throws HairuKanaError", () => {
		fc.assert(
			fc.property(
				fc.string().filter((s) => !VALID_KEYS.includes(s as PaperSize)),
				(invalidKey) => {
					expect(() =>
						resolvePresets({ paper: invalidKey as PaperSize }),
					).toThrow(HairuKanaError);
				},
			),
		);
	});

	/**
	 * Property 12: プリセットデフォルト
	 * resolvePresets() and resolvePresets({}) SHALL return identical results
	 * (both defaulting to A4).
	 *
	 * **Validates: Requirements 2.2, 2.3**
	 */
	test("Property 12: no-arg and empty-object both default to A4", () => {
		const noArg = resolvePresets();
		const emptyObj = resolvePresets({});
		const a4 = PAPER_PRESETS.a4;

		expect(noArg).toEqual(emptyObj);
		expect(noArg.paper).toEqual(a4);
	});
});
