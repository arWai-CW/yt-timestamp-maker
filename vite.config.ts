import { defineConfig } from "vite";
import cssInjectedByJs from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [cssInjectedByJs()],
  build: {
    outDir: "dist",
    lib: {
      entry: "./src/main.ts",
      name: "YTTimestampMaker",
      fileName: "yt-timestamp-maker.user",
      formats: ["iife"],
    },
  },
});
