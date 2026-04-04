import type { TimestampLog, Config } from "./types";
import { detectSystemLang } from "./i18n";

// Default configuration - applied when no saved config exists
const DEFAULT_CONFIG: Config = {
	key: "KeyZ",
	alt: true,
	ctrl: false,
	keyD: "KeyX",
	altD: true,
	ctrlD: false,
	commentColor: "#a7a7a7",
	dividerBg: "#1a1a1a",
	dividerColor: "#767d88",
	dividerPrefix: "---",
	dividerSuffix: "---",
	commentPrefix: "(",
	commentSuffix: ")",
	lang: "en",
};

// Message type for background script communication
type MessageType =
	| "getLogs"
	| "setLogs"
	| "getConfig"
	| "setConfig"
	| "getVideoId"
	| "getCurrentTime"
	| "setVideoTitle";

/**
 * Data store for timestamp logs and user configuration.
 * Communicates with background script via chrome.runtime.sendMessage.
 * Falls back to localStorage if chrome API is not available.
 * Each video gets its own isolated storage namespace.
 */
class Store {
	private logs: TimestampLog[] = [];
	private config: Config = { ...DEFAULT_CONFIG };
	private videoId: string = "default";
	private saveTimeout: ReturnType<typeof setTimeout> | null = null;
	private useChromeStorage: boolean = true;
	private initPromise: Promise<void>;
	private resolveInit!: () => void;

	constructor() {
		this.videoId = this.getVideoIdFromUrl();
		this.checkChromeAPI();
		this.initPromise = new Promise((resolve) => {
			this.resolveInit = resolve;
		});
		this.load();
	}

	// Check if chrome API is available
	private checkChromeAPI(): void {
		this.useChromeStorage = typeof chrome !== "undefined" && !!chrome.runtime?.sendMessage;
	}

	// Send message to background script with fallback
	private async sendMessage<T>(type: MessageType, data?: unknown): Promise<T | null> {
		if (!this.useChromeStorage || !chrome.runtime) {
			return null;
		}

		try {
			const response = await chrome.runtime.sendMessage({ type, videoId: this.videoId, data });
			return response as T | null;
		} catch {
			return null;
		}
	}

	// Extract video ID from current YouTube URL
	private getVideoIdFromUrl(): string {
		const match = window.location.href.match(/[?&]v=([^&#]+)/);
		return match?.[1] ?? "default";
	}

	// Generate storage key with video-specific namespace (for localStorage fallback)
	private getStorageKey(prefix: string): string {
		return `${prefix}_${this.videoId}`;
	}

	// Load persisted data from chrome.storage or localStorage fallback
	private async load(): Promise<void> {
		try {
			if (this.useChromeStorage) {
				// Try chrome.storage.local first
				const logsResponse = await this.sendMessage<{ success: boolean; data?: TimestampLog[] }>("getLogs");
				if (logsResponse?.success && logsResponse.data) {
					this.logs = logsResponse.data;
				}

				const configResponse = await this.sendMessage<{ success: boolean; data?: Config }>("getConfig");
				if (configResponse?.success && configResponse.data) {
					this.config = { ...DEFAULT_CONFIG, ...configResponse.data };
				}
			} else {
				// Fallback to localStorage
				this.loadFromLocalStorage();
			}
		} catch {
			// Fallback to localStorage on any error
			this.loadFromLocalStorage();
		}

		// Detect system language on first load
		if (!this.config.lang) {
			this.config.lang = detectSystemLang() as "zh-TW" | "en";
		}

		this.resolveInit();
	}

	// Fallback: load from localStorage
	private loadFromLocalStorage(): void {
		try {
			const storedLogs = localStorage.getItem(this.getStorageKey("yt_ts_logs"));
			this.logs = storedLogs ? JSON.parse(storedLogs) : [];

			const storedConfig = localStorage.getItem(this.getStorageKey("yt_ts_config"));
			if (storedConfig) {
				this.config = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
			}
		} catch {
			this.logs = [];
			this.config = { ...DEFAULT_CONFIG };
		}
	}

	// Get all timestamp logs (returns copy to prevent mutation)
	getLogs(): TimestampLog[] {
		return [...this.logs];
	}

	setLogs(logs: TimestampLog[]): void {
		this.logs = [...logs];
		this.scheduleSave();
	}

	// Get current config (returns copy)
	getConfig(): Config {
		return { ...this.config };
	}

	setConfig(config: Config): void {
		this.config = { ...config };
		this.save();
	}

	// Add new timestamp or divider at current video position
	addLog(isDivider: boolean): number {
		const time = isDivider ? null : this.getCurrentTime();
		this.logs.push({
			time,
			note: "",
			comment: "",
			showComment: false,
		});
		if (!this.hasVideoTitle()) {
			this.saveVideoTitle();
		}
		this.save();
		return this.logs.length - 1;
	}

	deleteLog(index: number): void {
		this.logs.splice(index, 1);
		this.save();
	}

	// Persist current state to chrome.storage or localStorage fallback
	save(): void {
		if (this.useChromeStorage) {
			// Save to chrome.storage.local via background script
			this.sendMessage("setLogs", this.logs);
			this.sendMessage("setConfig", this.config);
		} else {
			// Fallback to localStorage
			this.saveToLocalStorage();
		}
	}

	// Fallback: save to localStorage
	private saveToLocalStorage(): void {
		try {
			localStorage.setItem(this.getStorageKey("yt_ts_logs"), JSON.stringify(this.logs));
			localStorage.setItem(this.getStorageKey("yt_ts_config"), JSON.stringify(this.config));
		} catch (e) {
			console.error("Failed to save:", e);
		}
	}

	// Debounced save to reduce writes during rapid changes
	private scheduleSave(): void {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}
		this.saveTimeout = setTimeout(() => this.save(), 500);
	}

	getVideoId(): string {
		return this.videoId;
	}

	// Detect if user navigated to a different video
	updateVideoId(): boolean {
		const newVideoId = this.getVideoIdFromUrl();
		if (newVideoId === this.videoId) {
			return false;
		}
		this.videoId = newVideoId;
		
		// Create new init promise for new video
		this.initPromise = new Promise((resolve) => {
			this.resolveInit = resolve;
		});
		
		this.load().catch(() => {
			// Fallback to localStorage on error
			this.loadFromLocalStorage();
		});
		return true;
	}

	// Extract video title from YouTube page (supports both old and new layouts)
	getVideoTitle(): string {
		const titleEl = document.querySelector(
			"h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata, ytd-video-primary-info-renderer h1, h1 yt-formatted-string"
		);
		if (titleEl) {
			return titleEl.textContent?.trim().substring(0, 30) || "Unknown Video";
		}
		return "Unknown Video";
	}

	// Get current video timestamp in MM:SS or HH:MM:SS format
	getCurrentTime(): string {
		const v = document.querySelector("video");
		if (!v) return "00:00";
		const s = Math.floor(v.currentTime);
		const h = Math.floor(s / 3600);
		const m = Math.floor((s % 3600) / 60);
		const sec = s % 60;
		const fmt = (n: number) => (n < 10 ? "0" + n : n);
		return h > 0 ? [fmt(h), fmt(m), fmt(sec)].join(":") : [fmt(m), fmt(sec)].join(":");
	}

	// Parse timestamp string back to seconds (for video.seek)
	parseTime(timeStr: string): number {
		const parts = timeStr.split(":").reverse();
		let seconds = 0;
		if (parts[0]) seconds += parseInt(parts[0], 10);
		if (parts[1]) seconds += parseInt(parts[1], 10) * 60;
		if (parts[2]) seconds += parseInt(parts[2], 10) * 3600;
		return seconds;
	}

	saveVideoTitle(): void {
		if (!this.useChromeStorage) {
			localStorage.setItem(`yt_ts_title_${this.videoId}`, this.getVideoTitle());
			return;
		}
		this.sendMessage("setVideoTitle", this.getVideoTitle());
	}

	hasVideoTitle(): boolean {
		if (!this.useChromeStorage) {
			return localStorage.getItem(`yt_ts_title_${this.videoId}`) !== null;
		}
		return this.logs.length > 0;
	}

	updateVideoTitle(): void {
		const currentTitle = this.getVideoTitle();
		if (currentTitle && currentTitle !== "Unknown Video") {
			this.saveVideoTitle();
		}
	}

	waitForInit(): Promise<void> {
		return this.initPromise;
	}
}

export const store = new Store();