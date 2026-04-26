import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { parseArgs } from "../src/cli";

const FIXTURE_DIR = join(import.meta.dir, "fixtures");
const SAMPLE_MD = join(FIXTURE_DIR, "sample.md");
const CLI_PATH = join(import.meta.dir, "..", "src", "cli.ts");

async function runCLI(
	args: string[],
	timeoutMs = 10_000,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(["bun", CLI_PATH, ...args], {
		stdout: "pipe",
		stderr: "pipe",
	});

	const timer = setTimeout(() => proc.kill(), timeoutMs);
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	clearTimeout(timer);

	return { stdout, stderr, exitCode };
}

describe("CLI parseArgs", () => {
	test("default values with no args", () => {
		const result = parseArgs(["node", "cli"]);
		expect(result.filePath).toBeNull();
		expect(result.paper).toBe("a4");
		expect(result.json).toBe(false);
		expect(result.help).toBe(false);
	});

	test("file path is parsed from positional argument", () => {
		const result = parseArgs(["node", "cli", "report.md"]);
		expect(result.filePath).toBe("report.md");
	});

	test("--paper flag sets paper size", () => {
		const result = parseArgs(["node", "cli", "report.md", "--paper", "b5"]);
		expect(result.paper).toBe("b5");
		expect(result.filePath).toBe("report.md");
	});

	test("--json flag sets json to true", () => {
		const result = parseArgs(["node", "cli", "report.md", "--json"]);
		expect(result.json).toBe(true);
		expect(result.filePath).toBe("report.md");
	});

	test("--help flag sets help to true", () => {
		const result = parseArgs(["node", "cli", "--help"]);
		expect(result.help).toBe(true);
	});

	test("combined flags are all set correctly", () => {
		const result = parseArgs([
			"node",
			"cli",
			"report.md",
			"--paper",
			"a3",
			"--json",
		]);
		expect(result.filePath).toBe("report.md");
		expect(result.paper).toBe("a3");
		expect(result.json).toBe(true);
		expect(result.help).toBe(false);
	});
});

describe("CLI", () => {
	test("--help flag shows usage text and exits 0", async () => {
		const { stdout, exitCode } = await runCLI(["--help"]);
		expect(exitCode).toBe(0);
		expect(stdout).toContain("使い方:");
		expect(stdout).toContain("--paper");
		expect(stdout).toContain("--json");
		expect(stdout).toContain("--help");
	});

	test("non-existent file outputs error to stderr and exits non-zero", async () => {
		const { stderr, exitCode } = await runCLI(["/tmp/nonexistent-file.md"]);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("エラー");
		expect(stderr).toContain("見つかりません");
	});

	test("no file argument shows error and usage", async () => {
		const { stderr, exitCode } = await runCLI([]);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("エラー");
		expect(stderr).toContain("使い方:");
	});

	test("invalid --paper value shows error and exits non-zero", async () => {
		const { stderr, exitCode } = await runCLI([SAMPLE_MD, "--paper", "letter"]);
		expect(exitCode).not.toBe(0);
		expect(stderr).toContain("エラー");
		expect(stderr).toContain("letter");
	});

	// Playwright 依存テストは統合テスト (vitest run) で実行する。
	// Bun の Windows では Playwright の spawn が動かないため、bun test からは除外。
});
