import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { resolve } from "path";

interface PackageJson {
  version: string;
  description: string;
}

const packageJson: PackageJson = JSON.parse(
  readFileSync(resolve(process.cwd(), "package.json"), "utf-8")
);

const header = `// ==UserScript==
// @name         YouTube Timestamp Maker
// @namespace    http://tampermonkey.net/
// @version      ${packageJson.version}
// @description  ${packageJson.description}
// @license      MIT License
// @author       arWai-CW
// @match        https://www.youtube.com/
// @match        https://www.youtube.com/watch?v=*
// @match        https://www.youtube.com/live/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
// @updateURL    https://raw.githubusercontent.com/arWai-CW/yt-timestamp-maker/releases/latest/download/yt-timestamp-maker.user.js
// @downloadURL  https://raw.githubusercontent.com/arWai-CW/yt-timestamp-maker/releases/latest/download/yt-timestamp-maker.user.js
// ==/UserScript==

`;

const inputFile = "dist/yt-timestamp-maker.user.iife.js";
const outputFile = "dist/yt-timestamp-maker.user.js";

if (existsSync(inputFile)) {
  const content = readFileSync(inputFile, "utf-8");
  const wrapped = `(function(){\n${content}\n})();\n`;
  writeFileSync(outputFile, header + wrapped);
  unlinkSync(inputFile);
  console.log(`Built: ${outputFile}`);
} else {
  console.error("Input file not found:", inputFile);
}
