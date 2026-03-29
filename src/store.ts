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
	commentColor: "#888888",
	dividerBg: "#7d5fff20",
	dividerColor: "#ffcf5e",
	dividerPrefix: "---",
	dividerSuffix: "---",
	commentPrefix: "(",
	commentSuffix: ")",
	lang: "en",
};

/**
 * Data store for timestamp logs and user configuration.
 * Persists data to localStorage, keyed by YouTube video ID.
 * Each video gets its own isolated storage namespace.
 */
class Store {
	private logs: TimestampLog[] = [];
	private config: Config = { ...DEFAULT_CONFIG };
	private videoId: string = "default";
	private saveTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.videoId = this.getVideoIdFromUrl();
		this.load();
	}

	// Extract video ID from current YouTube URL
	private getVideoIdFromUrl(): string {
		const match = window.location.href.match(/[?&]v=([^&#]+)/);
		return match?.[1] ?? "default";
	}

	// Generate storage key with video-specific namespace
	private getStorageKey(prefix: string): string {
		return `${prefix}_${this.videoId}`;
	}

	// Load persisted data from localStorage
	private load(): void {
		try {
			const storedLogs = localStorage.getItem(this.getStorageKey("yt_ts_logs"));
			this.logs = storedLogs ? JSON.parse(storedLogs) : [];

			const storedConfig = localStorage.getItem(this.getStorageKey("yt_ts_config"));
			if (storedConfig) {
				this.config = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
			}

			// Detect system language on first load
			if (!this.config.lang) {
				this.config.lang = detectSystemLang() as "zh-TW" | "en";
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
		this.save();
		return this.logs.length - 1;
	}

	deleteLog(index: number): void {
		this.logs.splice(index, 1);
		this.save();
	}

	// Persist current state to localStorage
	save(): void {
		try {
			localStorage.setItem(this.getStorageKey("yt_ts_logs"), JSON.stringify(this.logs));
			localStorage.setItem(this.getStorageKey("yt_ts_config"), JSON.stringify(this.config));
		} catch (e) {
			console.error("Failed to save:", e);
		}
	}

	// Debounced save to reduce localStorage writes during rapid changes
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
		this.load();
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
}

export const store = new Store();
