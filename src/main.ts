import { store } from "./store";
import { createHTML, render, updateUIText } from "./render";
import { t } from "./i18n";
import "./styles.css";

let wrapper: HTMLElement;

function init(): void {
  const config = store.getConfig();

  wrapper = document.createElement("div");
  wrapper.id = "ts-main-wrapper";
  document.body.appendChild(wrapper);

  wrapper.innerHTML = createHTML(config);

  const panel = document.getElementById("ts-panel");
  const overlay = document.getElementById("ts-modal-overlay");
  const listContainer = document.getElementById("ts-list");

  if (!panel || !overlay || !listContainer) {
    console.error("Failed to initialize: missing elements");
    return;
  }

  setupEventListeners(panel, overlay, listContainer);
  updateUIText();
  render();

  if (typeof GM_registerMenuCommand !== "undefined") {
    GM_registerMenuCommand(t("togglePanel", config.lang), () => {
      panel.classList.remove("hidden");
      updateUIText();
    });
  }
}

function setupEventListeners(
  panel: HTMLElement,
  overlay: HTMLElement,
  listContainer: HTMLElement
): void {
  const config = store.getConfig();
  let tempKey = config.key;
  let tempAlt = config.alt;
  let tempCtrl = config.ctrl;
  let tempKeyD = config.keyD || "KeyX";
  let tempAltD = config.altD !== undefined ? config.altD : true;
  let tempCtrlD = config.ctrlD || false;
  let isEditingKey = false;
  let isEditingKeyDivider = false;
  let draggedIdx: number | null = null;

  listContainer.addEventListener("click", (e: Event) => {
    const target = e.target as HTMLElement;
    const item = target.closest(".ts-item") as HTMLElement;
    if (!item) return;

    const idx = parseInt(item.dataset.idx || "0", 10);

    if (target.classList.contains("ts-time-link")) {
      const video = document.querySelector("video") as HTMLVideoElement;
      if (!video) return;
      video.currentTime = store.parseTime(target.dataset.time || "0");
    } else if (target.classList.contains("btn-comment")) {
      const logs = store.getLogs();
      if (logs[idx]) {
        logs[idx].showComment = !logs[idx].showComment;
        store.setLogs(logs);
        render();
      }
    } else if (target.classList.contains("btn-del")) {
      store.deleteLog(idx);
      render();
    }
  });

  listContainer.addEventListener("input", (e: Event) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const item = target.closest(".ts-item") as HTMLElement;
    if (!item) return;

    const idx = parseInt(item.dataset.idx || "0", 10);
    const logs = store.getLogs();

    if (logs[idx]) {
      if (target.classList.contains("ts-title-edit")) {
        logs[idx].note = target.value;
      } else if (target.classList.contains("ts-comment-area")) {
        logs[idx].comment = target.value;
      }
      store.setLogs(logs);
    }
  });

  listContainer.addEventListener(
    "blur",
    (e: Event) => {
      const target = e.target as HTMLTextAreaElement;
      if (target.classList.contains("ts-comment-area")) {
        const item = target.closest(".ts-item") as HTMLElement;
        if (!item) return;

        const idx = parseInt(item.dataset.idx || "0", 10);
        const logs = store.getLogs();
        if (logs[idx]) {
          logs[idx].comment = target.value;
          logs[idx].showComment = false;
          store.setLogs(logs);
          render();
        }
      }
    },
    true
  );

  listContainer.addEventListener("dragstart", (e: DragEvent) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("ts-drag-handle")) return;

    const item = target.closest(".ts-item") as HTMLElement;
    if (item) {
      draggedIdx = parseInt(item.dataset.idx || "0", 10);
      item.classList.add("dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
      }
    }
  });

  listContainer.addEventListener("dragend", (e: DragEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains("ts-drag-handle") || target.classList.contains("ts-item")) {
      target.classList.remove("dragging");
      document.querySelectorAll(".ts-item").forEach((el) =>
        el.classList.remove("drag-over")
      );
      draggedIdx = null;
    }
  });

  listContainer.addEventListener("dragover", (e: DragEvent) => {
    e.preventDefault();
    const item = (e.target as HTMLElement).closest(".ts-item") as HTMLElement;
    if (item && draggedIdx !== null) {
      document.querySelectorAll(".ts-item").forEach((el) =>
        el.classList.remove("drag-over")
      );
      item.classList.add("drag-over");
    }
  });

  listContainer.addEventListener("drop", (e: DragEvent) => {
    e.preventDefault();
    const item = (e.target as HTMLElement).closest(".ts-item") as HTMLElement;
    if (item && draggedIdx !== null) {
      const dropIdx = parseInt(item.dataset.idx || "0", 10);
      if (draggedIdx !== dropIdx) {
        const logs = store.getLogs();
        const [moved] = logs.splice(draggedIdx, 1);
        if (moved) {
          logs.splice(dropIdx, 0, moved);
          store.setLogs(logs);
          render();
        }
      }
    }
    document.querySelectorAll(".ts-item").forEach((el) =>
      el.classList.remove("drag-over")
    );
  });

  document.getElementById("ts-copy-btn")?.addEventListener("click", () => {
    const cfg = store.getConfig();
    const logs = store.getLogs();
    const dividerPrefix = cfg.dividerPrefix || "---";
    const dividerSuffix = cfg.dividerSuffix || "---";
    const commentPrefix = cfg.commentPrefix || "(";
    const commentSuffix = cfg.commentSuffix || ")";

    const text = logs
      .map((l) => {
        if (!l.time) return `${dividerPrefix} ${l.note} ${dividerSuffix}`;
        return `${l.time} ${l.note}${l.comment ? ` ${commentPrefix}${l.comment.replace(/\n/g, " ")}${commentSuffix}` : ""}`;
      })
      .join("\n");

    navigator.clipboard.writeText(text).then(() => {
      alert(t("copySuccess", cfg.lang));
    });
  });

  document.getElementById("ts-add")?.addEventListener("click", () => {
    const idx = store.addLog(false);
    render();
    const inputs = document.querySelectorAll(".ts-title-edit") as NodeListOf<HTMLInputElement>;
    if (inputs[idx]) inputs[idx].focus();
  });

  document.getElementById("ts-add-divider")?.addEventListener("click", () => {
    const idx = store.addLog(true);
    render();
    const inputs = document.querySelectorAll(".ts-title-edit") as NodeListOf<HTMLInputElement>;
    if (inputs[idx]) inputs[idx].focus();
  });

  document.getElementById("ts-close-btn")?.addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  document.getElementById("ts-open-settings")?.addEventListener("click", () => {
    overlay.style.display = "flex";
    document.getElementById("modal-settings")?.classList.remove("hidden");
    document.getElementById("modal-import")?.classList.add("hidden");
    updateUIText();
  });

  document.getElementById("ts-import-btn")?.addEventListener("click", () => {
    overlay.style.display = "flex";
    document.getElementById("modal-import")?.classList.remove("hidden");
    document.getElementById("modal-settings")?.classList.add("hidden");
  });

  document.getElementById("confirm-import")?.addEventListener("click", () => {
    const text = (document.getElementById("ts-import-area") as HTMLTextAreaElement)?.value || "";
    const cfg = store.getConfig();
    const dividerPrefix = cfg.dividerPrefix || "---";
    const dividerSuffix = cfg.dividerSuffix || "---";
    const commentPrefix = cfg.commentPrefix || "(";
    const commentSuffix = cfg.commentSuffix || ")";
    const logs = store.getLogs();

    text.split("\n").forEach((line) => {
      let note = "";
      let comment = "";
      let time: string | null = null;
      const trimmed = line.trim();

      if (dividerPrefix && dividerSuffix) {
        if (
          (trimmed.indexOf(dividerPrefix) >= 0 &&
            trimmed.lastIndexOf(dividerSuffix) > trimmed.indexOf(dividerPrefix)) ||
          (trimmed.indexOf(dividerPrefix) === 0 &&
            trimmed.lastIndexOf(dividerSuffix) === trimmed.length - dividerSuffix.length)
        ) {
          const dStart = trimmed.indexOf(dividerPrefix);
          const dEnd = trimmed.lastIndexOf(dividerSuffix);
          note = dStart >= 0 && dEnd > dStart
            ? trimmed.substring(dStart + dividerPrefix.length, dEnd).trim()
            : trimmed.substring(dividerPrefix.length, trimmed.length - dividerSuffix.length).trim();
          logs.push({ time: null, note, comment: "", showComment: false });
          return;
        }
      }

      if (trimmed && !/^\d{1,2}:\d{2}/.test(trimmed) && /^[-=]/.test(trimmed)) {
        note = trimmed.replace(/[-=]/g, "").trim();
        logs.push({ time: null, note, comment: "", showComment: false });
        return;
      }

      const timeMatch = line.match(/^(\d{1,2}:)?(\d{1,2}:\d{2})/);
      if (timeMatch) {
        time = timeMatch[0];
        const rest = line.replace(timeMatch[0], "").trim();

        if (commentPrefix && commentSuffix && rest.includes(commentPrefix) && rest.includes(commentSuffix)) {
          const cStart = rest.indexOf(commentPrefix);
          const cEnd = rest.lastIndexOf(commentSuffix);
          if (cEnd > cStart) {
            note = rest.substring(0, cStart).trim();
            comment = rest.substring(cStart + commentPrefix.length, cEnd).trim();
          }
        } else {
          note = rest;
        }
        logs.push({ time, note, comment, showComment: false });
      }
    });

    store.setLogs(logs);
    render();
    overlay.style.display = "none";
    alert(t("importSuccess", cfg.lang).replace("{title}", store.getVideoTitle()));
  });

  document.getElementById("ts-setting-hint")?.addEventListener("click", function () {
    isEditingKey = true;
    this.textContent = t("pressKey", store.getConfig().lang);
    (this as HTMLElement).style.borderColor = "#2ba640";
  });

  document.getElementById("ts-setting-hint-divider")?.addEventListener("click", function () {
    isEditingKeyDivider = true;
    this.textContent = t("pressKey", store.getConfig().lang);
    (this as HTMLElement).style.borderColor = "#2ba640";
  });

  document.getElementById("set-alt")?.addEventListener("change", function () {
    tempAlt = (this as HTMLInputElement).checked;
  });
  document.getElementById("set-ctrl")?.addEventListener("change", function () {
    tempCtrl = (this as HTMLInputElement).checked;
  });
  document.getElementById("set-alt-divider")?.addEventListener("change", function () {
    tempAltD = (this as HTMLInputElement).checked;
  });
  document.getElementById("set-ctrl-divider")?.addEventListener("change", function () {
    tempCtrlD = (this as HTMLInputElement).checked;
  });

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    const settingsModal = document.getElementById("modal-settings");
    const isSettingsOpen = settingsModal && !settingsModal.classList.contains("hidden");

    if (isEditingKey && isSettingsOpen) {
      if (!["Alt", "Control", "Shift", "Meta"].includes(e.key)) {
        tempKey = e.code;
        const hintEl = document.getElementById("ts-setting-hint");
        if (hintEl) {
          hintEl.textContent = (tempCtrl ? "Ctrl+" : "") + (tempAlt ? "Alt+" : "") + tempKey.replace("Key", "");
          hintEl.style.borderColor = "#3ea6ff";
        }
        isEditingKey = false;
        e.preventDefault();
      }
      return;
    }

    if (isEditingKeyDivider && isSettingsOpen) {
      if (!["Alt", "Control", "Shift", "Meta"].includes(e.key)) {
        tempKeyD = e.code;
        const hintEl = document.getElementById("ts-setting-hint-divider");
        if (hintEl) {
          hintEl.textContent = (tempCtrlD ? "Ctrl+" : "") + (tempAltD ? "Alt+" : "") + tempKeyD.replace("Key", "");
          hintEl.style.borderColor = "#ffcf5e";
        }
        isEditingKeyDivider = false;
        e.preventDefault();
      }
      return;
    }

    if (isSettingsOpen) return;

    if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
      return;
    }

    const shortcutKey = store.getConfig().key || "KeyZ";
    const shortcutAlt = store.getConfig().alt !== undefined ? store.getConfig().alt : true;
    const shortcutCtrl = store.getConfig().ctrl || false;

    const dividerKey = store.getConfig().keyD || "KeyX";
    const dividerAlt = store.getConfig().altD !== undefined ? store.getConfig().altD : true;
    const dividerCtrl = store.getConfig().ctrlD || false;

    if (e.code === shortcutKey && e.altKey === shortcutAlt && e.ctrlKey === shortcutCtrl) {
      store.addLog(false);
      render();
      e.preventDefault();
    }

    if (e.code === dividerKey && e.altKey === dividerAlt && e.ctrlKey === dividerCtrl) {
      store.addLog(true);
      render();
      e.preventDefault();
    }
  });

  document.getElementById("save-settings")?.addEventListener("click", () => {
    const dividerBgColor = (document.getElementById("set-divider-bg") as HTMLInputElement)?.value || "7d5fff";
    const newConfig = {
      key: tempKey,
      alt: tempAlt,
      ctrl: tempCtrl,
      keyD: tempKeyD,
      altD: tempAltD,
      ctrlD: tempCtrlD,
      commentColor: (document.getElementById("set-comment-color") as HTMLInputElement)?.value || "#888888",
      dividerBg: "#" + dividerBgColor + "20",
      dividerColor: (document.getElementById("set-divider-color") as HTMLInputElement)?.value || "#ffcf5e",
      dividerPrefix: (document.getElementById("set-divider-prefix") as HTMLInputElement)?.value || "---",
      dividerSuffix: (document.getElementById("set-divider-suffix") as HTMLInputElement)?.value || "---",
      commentPrefix: (document.getElementById("set-comment-prefix") as HTMLInputElement)?.value || "(",
      commentSuffix: (document.getElementById("set-comment-suffix") as HTMLInputElement)?.value || ")",
      lang: (document.getElementById("set-language") as HTMLSelectElement)?.value as "zh-TW" | "en",
    };
    store.setConfig(newConfig);
    document.getElementById("modal-settings")?.classList.add("hidden");
    overlay.style.display = "none";
    render();
    updateUIText();
  });

  document.getElementById("ts-clear-btn")?.addEventListener("click", () => {
    const cfg = store.getConfig();
    if (confirm(t("confirmClear", cfg.lang).replace("{title}", store.getVideoTitle()))) {
      store.setLogs([]);
      render();
    }
  });

  overlay.addEventListener("click", (e: Event) => {
    if (e.target === overlay) {
      document.getElementById("modal-settings")?.classList.add("hidden");
      overlay.style.display = "none";
    }
  });

  let isDrag = false;
  let relX = 0;
  let relY = 0;

  document.getElementById("ts-header")?.addEventListener("mousedown", (e: MouseEvent) => {
    isDrag = true;
    relX = e.pageX - wrapper.offsetLeft;
    relY = e.pageY - wrapper.offsetTop;
  });

  window.addEventListener("mousemove", (e: MouseEvent) => {
    if (isDrag) {
      wrapper.style.left = e.pageX - relX + "px";
      wrapper.style.top = e.pageY - relY + "px";
      wrapper.style.right = "auto";
    }
  });

  window.addEventListener("mouseup", () => {
    isDrag = false;
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
