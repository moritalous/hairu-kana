// ブラウザ向けビルド（ESM、marked バンドル、github-markdown-css 埋め込み）
await Bun.build({
	entrypoints: ["./src/browser.ts"],
	outdir: "./dist",
	target: "browser",
	format: "esm",
	naming: "browser.mjs",
});

// Node.js/Bun向けビルド（ESM）
await Bun.build({
	entrypoints: ["./src/node.ts"],
	outdir: "./dist",
	target: "node",
	format: "esm",
	naming: "node.mjs",
	external: ["playwright-core"],
});

// Node.js向けビルド（CJS）
await Bun.build({
	entrypoints: ["./src/node.ts"],
	outdir: "./dist",
	target: "node",
	format: "cjs",
	naming: "node.cjs",
	external: ["playwright-core"],
});

// CLI向けビルド
await Bun.build({
	entrypoints: ["./src/cli.ts"],
	outdir: "./dist",
	target: "bun",
	format: "esm",
	naming: "cli.mjs",
	external: ["playwright-core"],
});
