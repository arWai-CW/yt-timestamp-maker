/**
 * Type definitions for YouTube Timestamp Maker
 */

export interface TimestampLog {
	time: string | null;  // null for dividers
	note: string;
	comment: string;
	showComment: boolean;
}

export interface Config {
	key: string;
	alt: boolean;
	ctrl: boolean;
	keyD: string;
	altD: boolean;
	ctrlD: boolean;
	commentColor: string;
	dividerBg: string;
	dividerColor: string;
	dividerPrefix: string;
	dividerSuffix: string;
	commentPrefix: string;
	commentSuffix: string;
	lang: "zh-TW" | "en";
}

export interface I18nDict {
	[key: string]: string;
}

export interface I18n {
	"zh-TW": I18nDict;
	en: I18nDict;
}

export interface Store {
	getLogs(): TimestampLog[];
	setLogs(logs: TimestampLog[]): void;
	getConfig(): Config;
	setConfig(config: Config): void;
	addLog(isDivider: boolean): number;
	deleteLog(index: number): void;
	save(): void;
	getVideoId(): string;
	getVideoTitle(): string;
	parseTime(timeStr: string): number;
}
