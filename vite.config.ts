import { defineConfig } from "vite";
import { resolve } from "path";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "fs";

const BROWSER = process.env.BROWSER || "chrome";

function copyStaticAssets() {
	const srcDir = resolve(__dirname, "extension");
	const distDir = resolve(__dirname, "dist", BROWSER);

	if (!existsSync(distDir)) {
		mkdirSync(distDir, { recursive: true });
	}

	const staticFiles = ["popup.html", "popup.css", "icons"];

	for (const file of staticFiles) {
		const srcPath = resolve(srcDir, file);
		const destPath = resolve(distDir, file);

		if (existsSync(srcPath)) {
			if (file === "icons") {
				mkdirSync(destPath, { recursive: true });
				const iconFiles = readdirSync(srcPath);
				for (const iconFile of iconFiles) {
					cpSync(resolve(srcPath, iconFile), resolve(destPath, iconFile));
				}
			} else {
				cpSync(srcPath, destPath);
			}
		}
	}

	const manifestPath = resolve(srcDir, "manifest.json");
	const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

	if (BROWSER === "firefox") {
		manifest.background = {
			scripts: ["background.js"],
			type: "module",
		};
	}

	const manifestPathOut = resolve(distDir, "manifest.json");
	writeFileSync(manifestPathOut, JSON.stringify(manifest, null, 2));
}

function isLastEntry(): boolean {
	const entry = process.env.INPUT;
	return entry === "popup";
}

export default defineConfig({
	plugins: [
		{
			name: "extension-build",
			closeBundle() {
				if (isLastEntry()) {
					copyStaticAssets();
				}
			},
		},
	],
	build: {
		outDir: "dist/" + BROWSER,
		emptyOutDir: false,
		lib: {
			entry: resolve(__dirname, `src/${process.env.INPUT || "content"}.ts`),
			name: "YouTubeTimestampMaker",
			formats: ["iife"],
			fileName: (format, name) => {
				const inputName = process.env.INPUT || "content";
				if (inputName === "popup") return "popup.js";
				if (inputName === "background") return "background.js";
				return "content.js";
			},
		},
		rollupOptions: {
			output: {
				assetFileNames: (assetInfo) => {
					const inputName = process.env.INPUT || "content";
					if (inputName === "popup" && assetInfo.name === "popup.css") {
						return "popup.css";
					}
					if (inputName === "content" && assetInfo.name === "style.css") {
						return "content.css";
					}
					return assetInfo.name ?? "assets/[name]-[hash]";
				},
			},
		},
	},
});