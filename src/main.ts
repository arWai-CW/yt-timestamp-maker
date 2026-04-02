// Entry point - initializes the timestamp tool on YouTube video pages
import { store } from "./store";
import { createHTML, render, updateUIText } from "./render";
import { t } from "./i18n";
import "./styles.css";

let wrapper: HTMLElement;

// Initializes the UI panel and registers event listeners
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

// Sets up all event listeners for the UI (clicks, drags, keyboard shortcuts, etc.)
function setupEventListeners(
  panel: HTMLElement,
  overlay: HTMLElement,
  listContainer: HTMLElement
): void {
  // --- State variables for settings modal ---
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

  // ============================================================
  // SECTION: Timestamp list interactions (click, input, blur)
  // ============================================================
  // Click: timestamp link seeks video, comment button toggles textarea, delete button removes entry
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

  // Input: live-update note/comment as user types
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

  // Blur: when leaving comment textarea, hide it and save
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

  // ============================================================
  // SECTION: Drag and drop reordering
  // ============================================================
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

  // Drop: reorder the list by splicing the moved item to new position
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

  // ============================================================
  // SECTION: Main action buttons
  // ============================================================
  // Copy all timestamps to clipboard in configured format
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

  // Add new timestamp at current video time
  document.getElementById("ts-add")?.addEventListener("click", () => {
    const idx = store.addLog(false);
    render();
    const inputs = document.querySelectorAll(".ts-title-edit") as NodeListOf<HTMLInputElement>;
    if (inputs[idx]) inputs[idx].focus();
  });

  // Add section divider (no timestamp)
  document.getElementById("ts-add-divider")?.addEventListener("click", () => {
    const idx = store.addLog(true);
    render();
    const inputs = document.querySelectorAll(".ts-title-edit") as NodeListOf<HTMLInputElement>;
    if (inputs[idx]) inputs[idx].focus();
  });

  // Close/hide the main panel
  document.getElementById("ts-close-btn")?.addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  // ============================================================
  // SECTION: Modal management (settings & import)
  // ============================================================
  // Open settings modal
  document.getElementById("ts-open-settings")?.addEventListener("click", () => {
    overlay.style.display = "flex";
    document.getElementById("modal-settings")?.classList.remove("hidden");
    document.getElementById("modal-import")?.classList.add("hidden");
    updateUIText();
  });

  // Open import modal
  document.getElementById("ts-import-btn")?.addEventListener("click", () => {
    overlay.style.display = "flex";
    document.getElementById("modal-import")?.classList.remove("hidden");
    document.getElementById("modal-settings")?.classList.add("hidden");
  });

  // ============================================================
  // SECTION: Import parsing
  // ============================================================
  // Parse imported text - supports:
  //   - Dividers: "--- Title ---" or "- Title"
  //   - Timestamps: "01:23 Title (comment)" or "01:23:45 Title"
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

      // Check for divider format: "--- Title ---"
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

      // Check for alternate divider format: "- Title" or "= Title"
      if (trimmed && !/^\d{1,2}:\d{2}/.test(trimmed) && /^[-=]/.test(trimmed)) {
        note = trimmed.replace(/[-=]/g, "").trim();
        logs.push({ time: null, note, comment: "", showComment: false });
        return;
      }

      // Parse timestamp format: "01:23 Title (comment)"
      const timeMatch = line.match(/^(\d{1,2}:)?(\d{1,2}:\d{2})/);
      if (timeMatch) {
        time = timeMatch[0];
        const rest = line.replace(timeMatch[0], "").trim();

        // Extract comment if wrapped in prefix/suffix
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

  // ============================================================
  // SECTION: Settings - keyboard shortcut capture
  // ============================================================
  // Click on shortcut hint to enter capture mode
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

  // Checkbox handlers for Alt/Ctrl modifiers
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

  // ============================================================
  // SECTION: Global keyboard shortcuts
  // ============================================================
  window.addEventListener("keydown", (e: KeyboardEvent) => {
    const settingsModal = document.getElementById("modal-settings");
    const isSettingsOpen = settingsModal && !settingsModal.classList.contains("hidden");

    // Capture mode: record pressed key for timestamp shortcut
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

    // Capture mode: record pressed key for divider shortcut
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

    // Don't trigger shortcuts when settings modal is open
    if (isSettingsOpen) return;

    // Don't trigger when typing in input/textarea
    if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
      return;
    }

    const shortcutKey = store.getConfig().key || "KeyZ";
    const shortcutAlt = store.getConfig().alt !== undefined ? store.getConfig().alt : true;
    const shortcutCtrl = store.getConfig().ctrl || false;

    const dividerKey = store.getConfig().keyD || "KeyX";
    const dividerAlt = store.getConfig().altD !== undefined ? store.getConfig().altD : true;
    const dividerCtrl = store.getConfig().ctrlD || false;

    // Trigger: add timestamp at current video time
    if (e.code === shortcutKey && e.altKey === shortcutAlt && e.ctrlKey === shortcutCtrl) {
      store.addLog(false);
      render();
      e.preventDefault();
    }

    // Trigger: add divider
    if (e.code === dividerKey && e.altKey === dividerAlt && e.ctrlKey === dividerCtrl) {
      store.addLog(true);
      render();
      e.preventDefault();
    }
  });

  // ============================================================
  // SECTION: Settings - save & clear
  // ============================================================
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

  // Clear all timestamps for current video
  document.getElementById("ts-clear-btn")?.addEventListener("click", () => {
    const cfg = store.getConfig();
    if (confirm(t("confirmClear", cfg.lang).replace("{title}", store.getVideoTitle()))) {
      store.setLogs([]);
      render();
    }
  });

  // Click outside modal to close
  overlay.addEventListener("click", (e: Event) => {
    if (e.target === overlay) {
      document.getElementById("modal-settings")?.classList.add("hidden");
      overlay.style.display = "none";
    }
  });

  // ============================================================
  // SECTION: Panel drag (move panel position)
  // ============================================================
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

// Called when user navigates to a different video - reloads data for the new video
function handleNavigation(): void {
  if (store.updateVideoId()) {
    render();
    updateUIText();
  }
}

// Watches for YouTube video page changes and initializes the tool when video is detected
function watchForVideoPage(): void {
  let navDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const checkVideoPage = (): void => {
    try {
      const video = document.querySelector("video");
      if (!video) return;

      const panel = document.getElementById("ts-panel");
      if (!panel) {
        init();
      } else {
        // Debounce navigation handling to avoid excessive triggers during DOM changes
        if (navDebounceTimer) {
          clearTimeout(navDebounceTimer);
        }
        navDebounceTimer = setTimeout(() => {
          handleNavigation();
        }, 100);
      }
    } catch {
      // DOM may be in unstable state during major changes (e.g., chat replay toggle)
      // Skip this check iteration
    }
  };

  const observer = new MutationObserver(() => {
    try {
      checkVideoPage();
    } catch (e) {
      console.error("MutationObserver error:", e);
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", handleNavigation);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", watchForVideoPage);
} else {
  watchForVideoPage();
}
