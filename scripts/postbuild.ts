import { readFileSync, writeFileSync, renameSync, existsSync, unlinkSync } from "fs";

const header = `// ==UserScript==
// @name         YouTube 時間軸工具
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  支援摺疊註解、分隔線功能、優化彈窗對比度、支援每影片獨立儲存
// @match        https://www.youtube.com/watch?v=*
// @match        https://www.youtube.com/live/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @run-at       document-end
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
