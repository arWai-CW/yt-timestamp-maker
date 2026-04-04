import { i18n, t, detectSystemLang } from "./i18n";

interface VideoInfo {
	videoId: string;
	title: string | null;
	url: string;
	count: number;
}

interface MessageResponse {
	success: boolean;
	data?: unknown;
	error?: string;
}

async function sendMessage(message: { type: string; [key: string]: unknown }): Promise<MessageResponse> {
	return new Promise((resolve) => {
		chrome.runtime.sendMessage(message, (response: MessageResponse | undefined) => {
			resolve(response ?? { success: false, error: "No response" });
		});
	});
}

async function init(): Promise<void> {
	console.log("[Popup] init started");
	const lang = detectSystemLang();

	const titleEl = document.getElementById("title");
	if (titleEl) {
		titleEl.textContent = t("appName", lang);
	}

	const videoIdResponse = await sendMessage({ type: "getVideoId" });

	if (!videoIdResponse?.success || !videoIdResponse.data) {
		document.getElementById("video-info")?.classList.add("hidden");
		document.getElementById("not-video")?.classList.remove("hidden");
		document.getElementById("not-video-msg")!.textContent = t("notVideoMessage", lang);
		document.getElementById("youtube-link")!.textContent = t("goToYoutube", lang);
	} else {
		const videoId = videoIdResponse.data as string;
		const videoIdEl = document.getElementById("video-id");
		if (videoIdEl) {
			videoIdEl.textContent = videoId;
		}

		console.log("[Popup] Video ID found:", videoId);

		let titleResponse: MessageResponse | null = null;
		for (let i = 0; i < 3; i++) {
			if (i > 0) {
				await new Promise((resolve) => setTimeout(resolve, 500));
			}
			titleResponse = await sendMessage({ type: "getVideoTitle" });
			console.log(`[Popup] getVideoTitle attempt ${i + 1}:`, titleResponse);
			if (titleResponse?.success && titleResponse.data) {
				break;
			}
		}

		if (titleResponse?.success && titleResponse.data) {
			await sendMessage({ type: "setVideoTitle", videoId, data: titleResponse.data });
			console.log("[Popup] Title saved:", titleResponse.data);
		} else {
			console.log("[Popup] Failed to get title after 3 attempts");
		}
	}

	document.getElementById("show-panel")!.textContent = t("showPanel", lang);
	document.getElementById("saved-videos-title")!.textContent = t("savedVideos", lang);

	await renderSavedVideos(lang);
}

async function renderSavedVideos(lang: string): Promise<void> {
	const container = document.getElementById("saved-videos-list");
	if (!container) return;

	const response = await sendMessage({ type: "getAllVideos" });

	if (!response?.success || (response.data as VideoInfo[]).length === 0) {
		container.innerHTML = `<p class="empty">${t("noSavedVideos", lang)}</p>`;
		return;
	}

	const videos = response.data as VideoInfo[];
	container.innerHTML = videos
		.map(
			(v, i) =>
				`<a href="${v.url}" target="_blank" class="saved-video-item" data-video-id="${v.videoId}">
					<span class="video-title-text">${v.title || t("unknownVideo", lang)}</span>
					<span class="video-count">${v.count}</span>
				</a>`
		)
		.join("");
}

async function showPanel(): Promise<void> {
	await sendMessage({ type: "showPanel" });
	window.close();
}

document.getElementById("show-panel")?.addEventListener("click", showPanel);

init();