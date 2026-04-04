/**
 * Type definitions for YouTube Timestamp Maker
 * 
 * This file contains all TypeScript interfaces and types used throughout the application.
 * These types define the data structures for timestamp logs, user configuration, and i18n.
 */

/**
 * Represents a single timestamp entry or section divider.
 * 
 * @property time - The timestamp in HH:MM:SS or MM:SS format. Null for section dividers.
 * @property note - The user-provided title/label for this entry.
 * @property comment - Detailed notes or description (optional).
 * @property showComment - Whether the comment textarea is currently visible.
 */
export interface TimestampLog {
	time: string | null; // null for dividers
	note: string;
	comment: string;
	showComment: boolean;
}

/**
 * User configuration for the timestamp tool.
 * Controls keyboard shortcuts and export format.
 * 
 * @property key - Keyboard key code for adding timestamps (e.g., "KeyZ")
 * @property alt - Whether Alt key is required for timestamp shortcut
 * @property ctrl - Whether Ctrl key is required for timestamp shortcut
 * @property keyD - Keyboard key code for adding dividers (e.g., "KeyX")
 * @property altD - Whether Alt key is required for divider shortcut
 * @property ctrlD - Whether Ctrl key is required for divider shortcut
 * @property dividerPrefix - String prefix for dividers in export (e.g., "---")
 * @property dividerSuffix - String suffix for dividers in export (e.g., "---")
 * @property commentPrefix - String prefix wrapping comments in export (e.g., "(")
 * @property commentSuffix - String suffix wrapping comments in export (e.g., ")")
 * @property lang - UI language (zh-TW or en)
 */
export interface Config {
	key: string;
	alt: boolean;
	ctrl: boolean;
	keyD: string;
	altD: boolean;
	ctrlD: boolean;
	dividerPrefix: string;
	dividerSuffix: string;
	commentPrefix: string;
	commentSuffix: string;
	lang: "zh-TW" | "en";
}

/**
 * Dictionary type for internationalization strings.
 * Maps translation keys to their translated values.
 */
export interface I18nDict {
	[key: string]: string;
}

/**
 * Container for all supported translations.
 * Keys are language codes, values are I18nDict objects.
 */
export interface I18n {
	"zh-TW": I18nDict;
	en: I18nDict;
}

/**
 * Public API interface for the Store class.
 * Defines the contract for data persistence and retrieval.
 * Used for type-safe dependency injection and testing.
 */
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
