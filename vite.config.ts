import { defineConfig } from "vite";
import { resolve } from "path";
import { cpSync, existsSync, mkdirSync } from "fs";

const isExtension = process.env.BUILD === "extension";

function copyExtensionAssets() {
	const extDir = resolve(__dirname, "extension");
	const distDir = resolve(__dirname, "dist");

	if (!existsSync(extDir)) {
		mkdirSync(extDir, { recursive: true });
	}

	const contentJs = resolve(distDir, "content.js");
	if (existsSync(contentJs)) {
		cpSync(contentJs, resolve(extDir, "content.js"));
	}

	const contentCss = resolve(distDir, "style.css");
	if (existsSync(contentCss)) {
		cpSync(contentCss, resolve(extDir, "content.css"));
	}
}

export default defineConfig({
	plugins: isExtension
		? [
			{
				name: "copy-extension-assets",
				closeBundle() {
					copyExtensionAssets();
				},
			},
		]
		: [],
	build: {
		outDir: "dist",
		lib: {
			entry: resolve(__dirname, isExtension ? "src/content.ts" : "src/main.ts"),
			name: isExtension ? "ContentScript" : "YouTubeTimestampMaker",
			formats: ["iife"],
			fileName: () => (isExtension ? "content.js" : "yt-timestamp-maker.user.iife.js"),
		},
	},
});
