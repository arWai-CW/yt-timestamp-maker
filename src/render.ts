// UI rendering module - generates HTML for the timestamp panel and modals
import { t } from "./i18n";
import { store } from "./store";
import type { Config, TimestampLog } from "./types";

// Generates the initial HTML structure for the panel, settings modal, and import modal
export function createHTML(config: Config): string {
    const lang = config.lang || "en";

    return `
        <div id="ts-panel">
            <div id="ts-header">
                <span style="color:white; font-weight:bold;" data-i18n="appName"></span>
                <div style="display:flex; gap:12px; align-items:center;">
                    <span id="ts-open-settings" style="cursor:pointer; filter: grayscale(1);">⚙️</span>
                    <span id="ts-close-btn" style="cursor:pointer; font-size:22px; line-height:1;">×</span>
                </div>
            </div>
            <div style="padding: 10px 10px 0 10px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px;">
                <button class="ts-btn ts-btn-add" id="ts-add" data-i18n="addTimestamp"></button>
                <button class="ts-btn ts-btn-divider" id="ts-add-divider" data-i18n="addDivider"></button>
            </div>
            <div id="ts-list"></div>
            <div class="ts-main-btns">
                <button class="ts-btn ts-btn-sec" id="ts-import-btn" data-i18n="import"></button>
                <button class="ts-btn ts-btn-sec" id="ts-copy-btn" data-i18n="copyAll"></button>
                <button class="ts-btn ts-btn-sec" id="ts-clear-btn" data-i18n="clearAll" style="background:#b33939; grid-column: span 2;"></button>
            </div>
        </div>
        <div id="ts-modal-overlay">
            <div id="modal-import" class="ts-modal-box hidden">
                <h3 data-i18n="importTitle"></h3>
                <textarea id="ts-import-area" style="height:180px; background:#181818; color:#fff; border:1px solid #444; padding:10px; border-radius:4px; font-family:monospace;" data-i18n-placeholder="importPlaceholder"></textarea>
                <button class="ts-btn" id="confirm-import" data-i18n="confirmImport"></button>
            </div>
            <div id="modal-settings" class="ts-modal-box hidden">
                <h3 data-i18n="settingsTitle"></h3>
                <div style="font-size:13px; color:#ccc; margin-bottom:5px;" data-i18n="recordTime"></div>
                <div id="ts-setting-hint" style="background:#111; padding:12px; text-align:center; border-radius:6px; color:#3ea6ff; font-weight:bold; font-size:18px; border: 1px dashed #3ea6ff; cursor:pointer;" title="">${(config.ctrl ? "Ctrl+" : "") + (config.alt ? "Alt+" : "") + (config.key || "KeyZ").replace("Key", "")}</div>
                <div style="text-align:center; font-size:11px; color:#888; margin-bottom:10px;" data-i18n="clickToSet"></div>
                <div style="display:flex; justify-content:center; gap:20px; font-size:14px">
                    <label style="cursor:pointer"><input type="checkbox" id="set-alt" ${config.alt ? "checked" : ""}> Alt</label>
                    <label style="cursor:pointer"><input type="checkbox" id="set-ctrl" ${config.ctrl ? "checked" : ""}> Ctrl</label>
                </div>
                <div style="font-size:13px; color:#ccc; margin:15px 0 5px 0;" data-i18n="divider"></div>
                <div id="ts-setting-hint-divider" style="background:#111; padding:12px; text-align:center; border-radius:6px; color:#ffcf5e; font-weight:bold; font-size:18px; border: 1px dashed #ffcf5e; cursor:pointer;" title="">${(config.ctrlD ? "Ctrl+" : "") + (config.altD ? "Alt+" : "") + (config.keyD || "KeyX").replace("Key", "")}</div>
                <div style="text-align:center; font-size:11px; color:#888; margin-bottom:10px;" data-i18n="clickToSet"></div>
                <div style="display:flex; justify-content:center; gap:20px; font-size:14px">
                    <label style="cursor:pointer"><input type="checkbox" id="set-alt-divider" ${config.altD ? "checked" : ""}> Alt</label>
                    <label style="cursor:pointer"><input type="checkbox" id="set-ctrl-divider" ${config.ctrlD ? "checked" : ""}> Ctrl</label>
                </div>
                <h3 data-i18n="styleSettings"></h3>
                <div class="ts-setting-row">
                    <label data-i18n="commentColor"></label>
                    <input type="color" id="set-comment-color" value="${config.commentColor || "#888888"}">
                </div>
                <div class="ts-setting-row">
                    <label data-i18n="dividerBg"></label>
                    <input type="color" id="set-divider-bg" value="${config.dividerBg ? config.dividerBg.replace("#", "").slice(0, 6) : "7d5fff"}">
                </div>
                <div class="ts-setting-row">
                    <label data-i18n="dividerText"></label>
                    <input type="color" id="set-divider-color" value="${config.dividerColor || "#ffcf5e"}">
                </div>
                <h3 data-i18n="copyFormat"></h3>
                <div class="ts-setting-row">
                    <label data-i18n="dividerPrefix"></label>
                    <input type="text" id="set-divider-prefix" value="${config.dividerPrefix || "---"}" style="width:50px; background:#181818; color:#fff; border:1px solid #444; padding:4px; border-radius:4px; text-align:center;">
                </div>
                <div class="ts-setting-row">
                    <label data-i18n="dividerSuffix"></label>
                    <input type="text" id="set-divider-suffix" value="${config.dividerSuffix || "---"}" style="width:50px; background:#181818; color:#fff; border:1px solid #444; padding:4px; border-radius:4px; text-align:center;">
                </div>
                <div class="ts-setting-row">
                    <label data-i18n="commentPrefix"></label>
                    <input type="text" id="set-comment-prefix" value="${config.commentPrefix || "("}" style="width:50px; background:#181818; color:#fff; border:1px solid #444; padding:4px; border-radius:4px; text-align:center;">
                </div>
                <div class="ts-setting-row">
                    <label data-i18n="commentSuffix"></label>
                    <input type="text" id="set-comment-suffix" value="${config.commentSuffix || ")"}" style="width:50px; background:#181818; color:#fff; border:1px solid #444; padding:4px; border-radius:4px; text-align:center;">
                </div>
                <h3 data-i18n="language"></h3>
                <div class="ts-setting-row">
                    <label data-i18n="language"></label>
                    <select id="set-language" style="background:#181818; color:#fff; border:1px solid #444; padding:4px; border-radius:4px;">
                        <option value="zh-TW" ${config.lang === "zh-TW" ? "selected" : ""}>繁體中文</option>
                        <option value="en" ${config.lang === "en" ? "selected" : ""}>English</option>
                    </select>
                </div>
                <button class="ts-btn" id="save-settings" data-i18n="saveSettings"></button>
            </div>
        </div>
    `;
}

// Renders the timestamp list based on current store data
export function render(): void {
    const config = store.getConfig();
    const logs = store.getLogs();
    const listContainer = document.getElementById("ts-list");
    const lang = config.lang || "en";

    if (!listContainer) return;

    const dividerBg = config.dividerBg || "#7d5fff20";
    const dividerColor = config.dividerColor || "#ffcf5e";
    const commentColor = config.commentColor || "#888888";

    listContainer.innerHTML = logs
        .map(
            (l: TimestampLog, i: number) => `
            <div class="ts-item" data-idx="${i}" style="${l.time ? "" : "background:" + dividerBg + "; border-left:3px solid " + dividerColor + ";"}">
                <div class="ts-item-content">
                    <div class="ts-drag-handle" draggable="true" title="拖動">☰</div>
                    <div class="ts-row-main">
                        <div class="ts-row-top">
                            ${l.time ? `<span class="ts-time-link" data-time="${l.time}">${l.time}</span>` : `<span class="ts-divider-tag" style="color:${dividerColor}"></span>`}
                            <input type="text" class="ts-title-edit" placeholder="" value="${l.note || ""}">
                            <div class="ts-action-btns">
                                <button class="ts-mini-btn btn-comment" title="">💬</button>
                                <button class="ts-mini-btn btn-del" title="" style="color:#ff6b6b;">✕</button>
                            </div>
                        </div>
                        ${l.comment && !l.showComment ? '<div class="ts-comment-display" style="color:' + commentColor + '">' + l.comment + "</div>" : ""}
                        <textarea class="ts-comment-area ${l.showComment ? "" : "hidden"}" placeholder="">${l.comment || ""}</textarea>
                    </div>
                </div>
            </div>
        `
        )
        .join("");

    document.querySelectorAll(".ts-item").forEach((item) => {
        const el = item as HTMLElement;
        const isDivider = !el.querySelector(".ts-time-link");
        const dividerTag = el.querySelector(".ts-divider-tag") as HTMLElement;
        const titleInput = el.querySelector(".ts-title-edit") as HTMLInputElement;
        const commentBtn = el.querySelector(".btn-comment") as HTMLButtonElement;
        const delBtn = el.querySelector(".btn-del") as HTMLButtonElement;
        const commentArea = el.querySelector(".ts-comment-area") as HTMLTextAreaElement;

        if (dividerTag) dividerTag.textContent = t("sectionTag", lang);
        if (titleInput) titleInput.placeholder = t(isDivider ? "dividerPlaceholder" : "titlePlaceholder", lang);
        if (commentBtn) commentBtn.title = t("commentBtn", lang);
        if (delBtn) delBtn.title = t("deleteBtn", lang);
        if (commentArea) commentArea.placeholder = t("commentPlaceholder", lang);
    });

    store.save();
}

// Updates all UI text content based on current language setting
export function updateUIText(): void {
    const config = store.getConfig();
    const lang = config.lang || "en";

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = (el as HTMLElement).getAttribute("data-i18n");
        if (key) el.textContent = t(key, lang);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = (el as HTMLElement).getAttribute("data-i18n-placeholder");
        if (key) (el as HTMLInputElement).placeholder = t(key, lang);
    });
}
