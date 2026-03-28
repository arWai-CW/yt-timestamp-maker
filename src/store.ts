import type { TimestampLog, Config } from "./types";
import { detectSystemLang } from "./i18n";

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

class Store {
	private logs: TimestampLog[] = [];
	private config: Config = { ...DEFAULT_CONFIG };
	private videoId: string = "default";
	private saveTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor() {
		this.videoId = this.getVideoIdFromUrl();
		this.load();
	}

	private getVideoIdFromUrl(): string {
		const match = window.location.href.match(/[?&]v=([^&#]+)/);
		return match?.[1] ?? "default";
	}

	private getStorageKey(prefix: string): string {
		return `${prefix}_${this.videoId}`;
	}

	private load(): void {
		try {
			const storedLogs = localStorage.getItem(this.getStorageKey("yt_ts_logs"));
			this.logs = storedLogs ? JSON.parse(storedLogs) : [];

			const storedConfig = localStorage.getItem(this.getStorageKey("yt_ts_config"));
			if (storedConfig) {
				this.config = { ...DEFAULT_CONFIG, ...JSON.parse(storedConfig) };
			}

			if (!this.config.lang) {
				this.config.lang = detectSystemLang() as "zh-TW" | "en";
			}
		} catch {
			this.logs = [];
			this.config = { ...DEFAULT_CONFIG };
		}
	}

	getLogs(): TimestampLog[] {
		return [...this.logs];
	}

	setLogs(logs: TimestampLog[]): void {
		this.logs = [...logs];
		this.scheduleSave();
	}

	getConfig(): Config {
		return { ...this.config };
	}

	setConfig(config: Config): void {
		this.config = { ...config };
		this.save();
	}

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

	save(): void {
		try {
			localStorage.setItem(this.getStorageKey("yt_ts_logs"), JSON.stringify(this.logs));
			localStorage.setItem(this.getStorageKey("yt_ts_config"), JSON.stringify(this.config));
		} catch (e) {
			console.error("Failed to save:", e);
		}
	}

	private scheduleSave(): void {
		if (this.saveTimeout) {
			clearTimeout(this.saveTimeout);
		}
		this.saveTimeout = setTimeout(() => this.save(), 500);
	}

	getVideoId(): string {
		return this.videoId;
	}

	getVideoTitle(): string {
		const titleEl = document.querySelector(
			"h1.ytd-video-primary-info-renderer, h1.ytd-watch-metadata, ytd-video-primary-info-renderer h1, h1 yt-formatted-string"
		);
		if (titleEl) {
			return titleEl.textContent?.trim().substring(0, 30) || "Unknown Video";
		}
		return "Unknown Video";
	}

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
