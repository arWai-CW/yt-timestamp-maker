const STORAGE_KEY_LOGS = "yt_ts_logs";
const STORAGE_KEY_CONFIG = "yt_ts_config";

const DEFAULT_CONFIG = {
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

function getVideoIdFromUrl(url) {
	const match = url.match(/[?&]v=([^&#]+)/);
	return match?.[1] ?? null;
}

function getStorageKeys(videoId) {
	return {
		logs: `${STORAGE_KEY_LOGS}_${videoId}`,
		config: `${STORAGE_KEY_CONFIG}_${videoId}`,
	};
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	const { type, videoId, data } = message;
	const targetVideoId = videoId ?? (sender.tab?.url ? getVideoIdFromUrl(sender.tab.url) : null);
	const keys = targetVideoId ? getStorageKeys(targetVideoId) : null;

	(async () => {
		switch (type) {
			case "getAllVideos": {
				const allResults = await chrome.storage.local.get(null);
				const videoIds = new Set();
				
				Object.keys(allResults).forEach((key) => {
					if (key.startsWith(STORAGE_KEY_LOGS + "_")) {
						const vid = key.replace(STORAGE_KEY_LOGS + "_", "");
						if (allResults[key] && Array.isArray(allResults[key]) && allResults[key].length > 0) {
							videoIds.add(vid);
						}
					}
				});

				const videos = Array.from(videoIds).map((vid) => ({
					videoId: vid,
					url: `https://www.youtube.com/watch?v=${vid}`,
					count: (allResults[`${STORAGE_KEY_LOGS}_${vid}`]?.length) || 0,
				}));

				sendResponse({ success: true, data: videos });
				break;
			}

			case "getVideoId": {
				const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
				if (tabs[0]?.url) {
					const vid = getVideoIdFromUrl(tabs[0].url);
					sendResponse({ success: true, data: vid });
				} else {
					sendResponse({ success: false, error: "No active tab" });
				}
				break;
			}

			case "getLogs": {
				if (!keys) {
					sendResponse({ success: false, error: "No video ID" });
					return;
				}
				const result = await chrome.storage.local.get(keys.logs);
				sendResponse({ success: true, data: result[keys.logs] ?? [] });
				break;
			}
			case "setLogs": {
				if (!keys) {
					sendResponse({ success: false, error: "No video ID" });
					return;
				}
				await chrome.storage.local.set({ [keys.logs]: data });
				sendResponse({ success: true });
				break;
			}
			case "getConfig": {
				if (!keys) {
					sendResponse({ success: false, error: "No video ID" });
					return;
				}
				const result = await chrome.storage.local.get(keys.config);
				sendResponse({
					success: true,
					data: result[keys.config] ?? DEFAULT_CONFIG,
				});
				break;
			}
			case "setConfig": {
				if (!keys) {
					sendResponse({ success: false, error: "No video ID" });
					return;
				}
				await chrome.storage.local.set({ [keys.config]: data });
				sendResponse({ success: true });
				break;
			}
			case "getVideoId": {
				sendResponse({ success: true, data: targetVideoId });
				break;
			}
			case "togglePanel": {
				if (sender.tab?.id) {
					chrome.tabs.sendMessage(sender.tab.id, { type: "togglePanel" });
				}
				sendResponse({ success: true });
				break;
			}
			case "showPanel": {
				const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
				const ytTab = tabs.find(t => t.url?.includes("youtube.com"));
				if (ytTab?.id) {
					chrome.tabs.sendMessage(ytTab.id, { type: "showPanel" });
				}
				sendResponse({ success: true });
				break;
			}
			case "getCurrentTime": {
				if (sender.tab?.id) {
					chrome.tabs.sendMessage(sender.tab.id, { type: "getCurrentTime" }, (response) => {
						sendResponse(response);
					});
				} else {
					sendResponse({ success: false, error: "No tab" });
				}
				break;
			}
			default:
				sendResponse({ success: false, error: "Unknown message type" });
		}
	})();

	return true;
});

chrome.contextMenus?.create({
	id: "yt-timestamp-maker-toggle",
	title: "Toggle Timestamp Panel",
	contexts: ["page"],
	targetUrlPatterns: ["*://*.youtube.com/watch*"],
});

chrome.contextMenus?.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "yt-timestamp-maker-toggle" && tab?.id) {
		chrome.tabs.sendMessage(tab.id, { type: "togglePanel" });
	}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (!tab?.url || !tab.url.includes("youtube.com/watch")) {
		return;
	}

	if (changeInfo.url || (changeInfo.status === "complete" && tab.url)) {
		const videoId = getVideoIdFromUrl(tab.url);
		if (videoId) {
			chrome.tabs.sendMessage(tabId, {
				type: "videoChanged",
				videoId,
			});
		}
	}
});

chrome.runtime.onInstalled.addListener(() => {
	console.log("YouTube Timestamp Maker extension installed");
});
