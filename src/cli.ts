#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import type { PaperSize } from "./core";
import { countPages } from "./node";

const HELP_TEXT = `使い方: hairu-kana <file.md> [オプション]

オプション:
  --paper <b5|a4|a3>           用紙サイズ (デフォルト: a4)
  --json                       JSON形式で出力
  --help                       ヘルプ表示`;

const VALID_PAPER_SIZES = ["b5", "a4", "a3"];

interface ParsedArgs {
	filePath: string | null;
	paper: PaperSize;
	json: boolean;
	help: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
	const args = argv.slice(2);
	const result: ParsedArgs = {
		filePath: null,
		paper: "a4",
		json: false,
		help: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--help") {
			result.help = true;
		} else if (arg === "--json") {
			result.json = true;
		} else if (arg === "--paper") {
			const value = args[++i];
			if (!value || !VALID_PAPER_SIZES.includes(value)) {
				console.error(
					`エラー: 無効な用紙サイズ '${value ?? ""}'。有効なオプション: ${VALID_PAPER_SIZES.join(", ")}`,
				);
				process.exit(1);
			}
			result.paper = value as PaperSize;
		} else if (!arg.startsWith("--")) {
			result.filePath = arg;
		}
	}

	return result;
}

async function main(): Promise<void> {
	const parsed = parseArgs(process.argv);

	if (parsed.help) {
		console.log(HELP_TEXT);
		process.exit(0);
	}

	if (!parsed.filePath) {
		console.error("エラー: ファイルパスを指定してください。");
		console.error(HELP_TEXT);
		process.exit(1);
	}

	if (!existsSync(parsed.filePath)) {
		console.error(`エラー: ファイルが見つかりません: ${parsed.filePath}`);
		process.exit(1);
	}

	try {
		const markdown = readFileSync(parsed.filePath, "utf-8");
		const result = await countPages(markdown, { paper: parsed.paper });

		if (parsed.json) {
			console.log(JSON.stringify(result));
		} else {
			const filename = basename(parsed.filePath);
			const paperLabel = parsed.paper.toUpperCase();
			console.log(`${filename}: ${result.pages}ページ (${paperLabel})`);
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		console.error(`エラー: ${message}`);
		process.exit(1);
	}
}

// Bun: import.meta.main is true only when this file is the entry point
if (import.meta.main) {
	main();
}

export { parseArgs, main };
