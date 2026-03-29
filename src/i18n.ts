// Internationalization (i18n) module
// Supports: zh-TW (Traditional Chinese), en (English)
import type { I18n, I18nDict } from "./types";

export const i18n: I18n = {
	"zh-TW": {
		appName: "時間軸工具",
		addTimestamp: "＋ 記錄時間",
		addDivider: "― 階段分隔線",
		import: "導入",
		copyAll: "複製全部",
		clearAll: "清空所有記錄",
		importTitle: "導入外部記錄",
		importPlaceholder: "格式：01:23 內容",
		confirmImport: "確認導入",
		settingsTitle: "設定快捷鍵",
		recordTime: "記錄時間",
		clickToSet: "點擊上方方塊設定捷徑",
		divider: "分隔線",
		styleSettings: "樣式設定",
		commentColor: "註解文字顏色",
		dividerBg: "分隔線背景",
		dividerText: "分隔線文字",
		copyFormat: "複製格式",
		dividerPrefix: "分隔線前綴",
		dividerSuffix: "分隔線後綴",
		commentPrefix: "註解前綴",
		commentSuffix: "註解後綴",
		saveSettings: "儲存設定",
		titlePlaceholder: "標題...",
		dividerPlaceholder: "輸入階段名稱 (如：正片開始)",
		commentBtn: "詳細註解",
		deleteBtn: "刪除",
		commentPlaceholder: "在此輸入更多詳細筆記...",
		copySuccess: "複製成功！",
		importSuccess: "導入成功！目前為影片「{title}」的時間軸",
		confirmClear: "確定清空目前影片「{title}」的時間軸？",
		pressKey: "按下按鍵...",
		unknownVideo: "未知影片",
		sectionTag: "【區段】",
		togglePanel: "顯示/隱藏面板",
		language: "語言",
		dragHandle: "拖動",
	},
	en: {
		appName: "Timestamp Tool",
		addTimestamp: "+ Add Timestamp",
		addDivider: "- Add Section",
		import: "Import",
		copyAll: "Copy All",
		clearAll: "Clear All",
		importTitle: "Import Data",
		importPlaceholder: "Format: 01:23 Title",
		confirmImport: "Confirm Import",
		settingsTitle: "Shortcut Settings",
		recordTime: "Record Time",
		clickToSet: "Click to set shortcut",
		divider: "Divider",
		styleSettings: "Style Settings",
		commentColor: "Comment Color",
		dividerBg: "Divider Background",
		dividerText: "Divider Text",
		copyFormat: "Copy Format",
		dividerPrefix: "Divider Prefix",
		dividerSuffix: "Divider Suffix",
		commentPrefix: "Comment Prefix",
		commentSuffix: "Comment Suffix",
		saveSettings: "Save Settings",
		titlePlaceholder: "Title...",
		dividerPlaceholder: "Enter section name (e.g., Main Content)",
		commentBtn: "Details",
		deleteBtn: "Delete",
		commentPlaceholder: "Add detailed notes here...",
		copySuccess: "Copied!",
		importSuccess: 'Imported! Timeline for "{title}"',
		confirmClear: 'Clear timeline for "{title}"?',
		pressKey: "Press a key...",
		unknownVideo: "Unknown Video",
		sectionTag: "[Section]",
		togglePanel: "Show/Hide Panel",
		language: "Language",
		dragHandle: "Drag",
	},
};

export function t(key: string, lang: string = "en"): string {
	const dict: I18nDict = i18n[lang as keyof typeof i18n] || i18n.en;
	return dict[key] || i18n.en[key] || key;
}

export function detectSystemLang(): string {
	const navLang = navigator.language;
	if (navLang && i18n[navLang as keyof typeof i18n]) {
		return navLang;
	}
	for (const lang in i18n) {
		const prefix = lang.split("-")[0];
		if (navLang && prefix && navLang.startsWith(prefix)) {
			return lang;
		}
	}
	return "en";
}
