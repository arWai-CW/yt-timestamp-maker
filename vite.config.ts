import { defineConfig } from "vite";
import { resolve } from "path";
import { cpSync, existsSync, mkdirSync, readdirSync } from "fs";

function copyStaticAssets() {
	const srcDir = resolve(__dirname, "extension");
	const distDir = resolve(__dirname, "dist", "extension");

	if (!existsSync(distDir)) {
		mkdirSync(distDir, { recursive: true });
	}

	const staticFiles = ["manifest.json", "popup.html", "popup.css", "icons"];

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
		outDir: "dist",
		emptyOutDir: false,
		lib: {
			entry: resolve(__dirname, `src/${process.env.INPUT || "content"}.ts`),
			name: "YouTubeTimestampMaker",
			formats: ["iife"],
			fileName: (format, name) => {
				const inputName = process.env.INPUT || "content";
				if (inputName === "popup") return "extension/popup.js";
				if (inputName === "background") return "extension/background.js";
				return "extension/content.js";
			},
		},
		rollupOptions: {
			output: {
				assetFileNames: (assetInfo) => {
					const inputName = process.env.INPUT || "content";
					if (inputName === "popup" && assetInfo.name === "popup.css") {
						return "extension/popup.css";
					}
					if (inputName === "content" && assetInfo.name === "style.css") {
						return "extension/content.css";
					}
					return assetInfo.name ?? "assets/[name]-[hash]";
				},
			},
		},
	},
});