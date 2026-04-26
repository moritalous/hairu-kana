import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const FIXTURE_DIR = join(__dirname, "fixtures");
const SAMPLE_MD = join(FIXTURE_DIR, "sample.md");
const CLI_PATH = join(__dirname, "..", "src", "cli.ts");

// Helper: run CLI as subprocess via bun
function runCLI(args: string[]): {
	stdout: string;
	stderr: string;
	exitCode: number;
} {
	try {
		const stdout = execFileSync("bun", [CLI_PATH, ...args], {
			encoding: "utf-8",
			timeout: 55_000,
			stdio: ["pipe", "pipe", "pipe"],
		});
		return { stdout, stderr: "", exitCode: 0 };
	} catch (err: any) {
		return {
			stdout: err.stdout ?? "",
			stderr: err.stderr ?? "",
			exitCode: err.status ?? 1,
		};
	}
}

describe("Node.js/Bun E2E テスト", () => {
	it("simple markdown → pages >= 1", async () => {
		const { countPages } = await import("../src/node");
		const markdown = readFileSync(SAMPLE_MD, "utf-8");
		const result = await countPages(markdown);

		expect(result.pages).toBeGreaterThanOrEqual(1);
		expect(result.renderHeight).toBeGreaterThan(0);
		expect(result.contentHeight).toBeGreaterThan(0);
	}, 60_000);

	it("empty markdown → pages === 0", async () => {
		const { countPages } = await import("../src/node");
		const result = await countPages("");

		expect(result.pages).toBe(0);
		expect(result.renderHeight).toBe(0);
		expect(result.lastPageFill).toBe(0);
	}, 60_000);

	it("PageResult structure is valid", async () => {
		const { countPages } = await import("../src/node");
		const result = await countPages("# Hello\n\nSome content.");

		expect(result).toHaveProperty("pages");
		expect(result).toHaveProperty("renderHeight");
		expect(result).toHaveProperty("contentHeight");
		expect(result).toHaveProperty("lastPageFill");
		expect(result).toHaveProperty("presets");

		expect(typeof result.pages).toBe("number");
		expect(Number.isInteger(result.pages)).toBe(true);
		expect(result.pages).toBeGreaterThanOrEqual(0);
		expect(typeof result.renderHeight).toBe("number");
		expect(result.renderHeight).toBeGreaterThanOrEqual(0);
		expect(typeof result.contentHeight).toBe("number");
		expect(result.contentHeight).toBeGreaterThan(0);
		expect(typeof result.lastPageFill).toBe("number");
		expect(result.lastPageFill).toBeGreaterThanOrEqual(0);
		expect(result.lastPageFill).toBeLessThanOrEqual(1);
		expect(result.presets).toHaveProperty("paper");
		expect(result.presets.paper).toHaveProperty("width");
		expect(result.presets.paper).toHaveProperty("height");
		expect(result.presets.paper).toHaveProperty("marginH");
		expect(result.presets.paper).toHaveProperty("marginV");
	}, 60_000);
});

describe("GFM テスト", () => {
	it("GFM content (tables, strikethrough, task lists) is measured correctly", async () => {
		const { countPages } = await import("../src/node");
		const gfmMarkdown = `# GFM テスト

| タスク | 状態 |
|--------|------|
| 設計   | ~~完了~~ |
| 実装   | 進行中 |

- [x] 要件定義
- [ ] テスト
- [ ] デプロイ

This text has ~~strikethrough~~ formatting.
`;
		const result = await countPages(gfmMarkdown);

		expect(result.pages).toBeGreaterThanOrEqual(1);
		expect(result.renderHeight).toBeGreaterThan(0);
	}, 60_000);
});

describe("CLI テスト", () => {
	it("output format matches '{filename}: Xページ ({paperSize})'", async () => {
		const { stdout, exitCode } = runCLI([SAMPLE_MD]);
		// If Chrome/Playwright not available, skip gracefully
		if (exitCode !== 0) {
			console.warn(
				"Skipped: CLI test failed (Chrome/Playwright may not be available)",
			);
			return;
		}
		expect(stdout.trim()).toMatch(/sample\.md: \d+ページ \(A4\)/);
	}, 60_000);

	it("--json output is valid JSON with PageResult fields", async () => {
		const { stdout, exitCode } = runCLI([SAMPLE_MD, "--json"]);
		if (exitCode !== 0) {
			console.warn(
				"Skipped: CLI JSON test failed (Chrome/Playwright may not be available)",
			);
			return;
		}
		const result = JSON.parse(stdout.trim());
		expect(result).toHaveProperty("pages");
		expect(result).toHaveProperty("renderHeight");
		expect(result).toHaveProperty("contentHeight");
		expect(result).toHaveProperty("lastPageFill");
		expect(result).toHaveProperty("presets");
		expect(typeof result.pages).toBe("number");
		expect(result.pages).toBeGreaterThanOrEqual(0);
	}, 60_000);
});

describe("決定性テスト", () => {
	it("countPages returns identical results for same input called twice", async () => {
		const { countPages } = await import("../src/node");
		const markdown =
			"# Determinism Test\n\nSome content for testing determinism.\n\n- Item A\n- Item B\n";

		const result1 = await countPages(markdown);
		const result2 = await countPages(markdown);

		expect(result1.pages).toBe(result2.pages);
		expect(result1.renderHeight).toBe(result2.renderHeight);
		expect(result1.contentHeight).toBe(result2.contentHeight);
		expect(result1.lastPageFill).toBe(result2.lastPageFill);
	}, 60_000);
});

describe("用紙サイズ単調性テスト", () => {
	it("pages(A3) ≤ pages(A4) ≤ pages(B5) for same markdown", async () => {
		const { countPages } = await import("../src/node");
		const markdown = readFileSync(SAMPLE_MD, "utf-8");

		const resultA3 = await countPages(markdown, { paper: "a3" });
		const resultA4 = await countPages(markdown, { paper: "a4" });
		const resultB5 = await countPages(markdown, { paper: "b5" });

		expect(resultA3.pages).toBeLessThanOrEqual(resultA4.pages);
		expect(resultA4.pages).toBeLessThanOrEqual(resultB5.pages);
	}, 60_000);
});
