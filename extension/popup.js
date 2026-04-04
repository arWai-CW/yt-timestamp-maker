const i18n = {
	"zh-TW": {
		appName: "時間軸工具",
		savedVideos: "已儲存影片",
		noSavedVideos: "暫無儲存的影片",
	},
	en: {
		appName: "Timestamp Tool",
		savedVideos: "Saved Videos",
		noSavedVideos: "No saved videos",
	},
};

function t(key) {
	const lang = navigator.language.startsWith("zh") ? "zh-TW" : "en";
	return i18n[lang]?.[key] ?? i18n.en[key] ?? key;
}

async function sendMessage(message) {
	return new Promise((resolve) => {
		chrome.runtime.sendMessage(message, (response) => {
			resolve(response);
		});
	});
}

async function init() {
	const videoIdResponse = await sendMessage({ type: "getVideoId" });

	if (!videoIdResponse?.success || !videoIdResponse.data) {
		document.getElementById("video-info").classList.add("hidden");
		document.getElementById("not-video").classList.remove("hidden");
	} else {
		document.getElementById("video-id").textContent = videoIdResponse.data;
		document.getElementById("title").textContent = t("appName");
	}

	await renderSavedVideos();
}

async function renderSavedVideos() {
	const container = document.getElementById("saved-videos-list");
	const response = await sendMessage({ type: "getAllVideos" });

	if (!response?.success || response.data.length === 0) {
		container.innerHTML = `<p class="empty">${t("noSavedVideos")}</p>`;
		return;
	}

	container.innerHTML = response.data
		.map(
			(v) =>
				`<a href="${v.url}" target="_blank" class="saved-video-item" data-video-id="${v.videoId}">
					<span class="video-id-text">${v.videoId}</span>
					<span class="video-count">${v.count}</span>
				</a>`
		)
		.join("");
}

async function showPanel() {
	await sendMessage({ type: "showPanel" });
	window.close();
}

document.getElementById("show-panel")?.addEventListener("click", showPanel);

init();