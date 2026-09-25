// Translate text nodes in place so the page's elements, links, and handlers survive.
(() => {
  const CONTROL_ID = "gemini-translator-page-controls";
  const SKIP = [
    "script", "style", "noscript", "template", "svg", "math", "pre", "code",
    "kbd", "samp", "var", "textarea", "select", "option", "input",
    "[contenteditable]", "[hidden]", "[inert]", '[aria-hidden="true"]',
    '[translate="no"]', ".notranslate",
    "#gemini-translator-modal-container", "#gemini-translator-popover-btn",
    `#${CONTROL_ID}`
  ].join(",");
  const MAX_PART_LENGTH = 2600;
  const MAX_BATCH_LENGTH = 4000;
  const MAX_BATCH_PARTS = 25;
  const THEME_STORAGE_KEY = "translationPopupTheme";
  const HEADER_SVG = `<svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="2" y1="2.2" x2="6.6" y2="12" stroke="rgba(255,255,255,0.75)" stroke-width="2.1" stroke-linecap="round"/>
    <line x1="6.8" y1="12" x2="10" y2="5.5" stroke="white" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M11.5 0.5C11.7 1.8 12.3 2.4 13.6 2.6 12.3 2.8 11.7 3.4 11.5 4.7 11.3 3.4 10.7 2.8 9.4 2.6 10.7 2.4 11.3 1.8 11.5 0.5Z" fill="white"/>
  </svg>`;
  const MOON_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13.2 10.2A5.8 5.8 0 0 1 5.8 2.8a5.8 5.8 0 1 0 7.4 7.4z"/></svg>`;
  const SUN_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="8" cy="8" r="2.7"/><path d="M8 1v1.4M8 13.6V15M1 8h1.4M13.6 8H15M3.05 3.05l1 1M11.95 11.95l1 1M12.95 3.05l-1 1M4.05 11.95l-1 1"/></svg>`;
  const EXPAND_SVG = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 6 1 1 6 1"/><polyline points="10 1 15 1 15 6"/><polyline points="15 10 15 15 10 15"/><polyline points="6 15 1 15 1 10"/></svg>`;
  const COLLAPSE_SVG = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 1 6 6 1 6"/><polyline points="10 1 10 6 15 6"/><polyline points="15 10 15 15 10 10"/><polyline points="6 15 1 10 1 15 6 15"/></svg>`;
  let controller = null;

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action !== "TRIGGER_PAGE_TRANSLATE") return;
    if (!controller) controller = createController();
    controller.start();
  });

  function splitLongText(text) {
    const parts = [];
    let remaining = text;
    while (remaining.length > MAX_PART_LENGTH) {
      let end = remaining.lastIndexOf(" ", MAX_PART_LENGTH);
      if (end < MAX_PART_LENGTH / 2) end = MAX_PART_LENGTH;
      // Avoid splitting a surrogate pair when a long unbroken token is found.
      if (end < remaining.length && /[\uD800-\uDBFF]/.test(remaining[end - 1])) end--;
      parts.push(remaining.slice(0, end).trim());
      remaining = remaining.slice(end).trimStart();
    }
    if (remaining) parts.push(remaining);
    return parts;
  }

  function createController() {
    const records = new Map();
    const host = document.createElement("div");
    host.id = CONTROL_ID;
    host.dataset.theme = "light";
    host.innerHTML = `
      <section class="gt-box" role="dialog" aria-label="Dịch trang với Gemini">
        <div class="gt-header" title="Kéo để di chuyển vị trí">
          <div class="gt-header-left"><span class="gt-header-icon">${HEADER_SVG}</span><strong>Gemini Translator</strong></div>
          <div class="gt-header-actions">
            <button class="gt-tool-btn gt-theme-toggle" type="button"></button>
            <button class="gt-tool-btn gt-page-expand" type="button" title="Mở rộng chiều rộng" aria-label="Mở rộng chiều rộng">${EXPAND_SVG}</button>
            <button class="gt-tool-btn gt-page-close" type="button" title="Đóng và khôi phục bản gốc" aria-label="Đóng và khôi phục bản gốc">✕</button>
          </div>
        </div>
        <div class="gt-body gt-page-body">
          <div class="gt-page-heading">Dịch trang sang tiếng Việt</div>
          <div class="gt-page-progress" role="status" aria-live="polite">
            <span class="gt-spinner" hidden></span><span class="gt-page-status">Đang chuẩn bị dịch…</span>
          </div>
        </div>
        <div class="gt-footer">
          <div class="gt-footer-left"><span class="gt-word-count gt-page-count">0 đoạn</span></div>
          <div class="gt-footer-right">
            <button class="gt-action-btn gt-page-stop" type="button" hidden>Dừng dịch</button>
            <button class="gt-action-btn gt-page-retry" type="button" hidden>Tiếp tục dịch</button>
            <button class="gt-action-btn gt-copy-btn gt-page-toggle" type="button">Xem bản gốc</button>
          </div>
        </div>
      </section>`;
    document.body.appendChild(host);

    const box = host.querySelector(".gt-box");
    const header = host.querySelector(".gt-header");
    const body = host.querySelector(".gt-page-body");
    const status = host.querySelector(".gt-page-status");
    const count = host.querySelector(".gt-page-count");
    const spinner = host.querySelector(".gt-spinner");
    const toggle = host.querySelector(".gt-page-toggle");
    const stop = host.querySelector(".gt-page-stop");
    const retry = host.querySelector(".gt-page-retry");
    const themeButton = host.querySelector(".gt-theme-toggle");
    const expandButton = host.querySelector(".gt-page-expand");
    let visibleTranslation = true;
    let paused = false;
    let busy = false;
    let disposed = false;
    let generation = 0;
    let rescan = false;
    let scanTimer = null;
    let currentTheme = "light";
    let themeUpdated = false;

    function setTheme(theme) {
      currentTheme = theme === "dark" ? "dark" : "light";
      host.dataset.theme = currentTheme;
      const isDark = currentTheme === "dark";
      themeButton.innerHTML = isDark ? SUN_SVG : MOON_SVG;
      themeButton.title = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
      themeButton.setAttribute("aria-label", "Giao diện tối");
      themeButton.setAttribute("aria-pressed", String(isDark));
    }

    setTheme("light");
    chrome.storage.local.get([THEME_STORAGE_KEY], (result) => {
      if (!disposed && !themeUpdated && !chrome.runtime.lastError) {
        setTheme(result[THEME_STORAGE_KEY]);
      }
    });
    const onThemeChanged = (changes, areaName) => {
      if (areaName === "local" && changes[THEME_STORAGE_KEY]) {
        themeUpdated = true;
        setTheme(changes[THEME_STORAGE_KEY].newValue);
      }
    };
    chrome.storage.onChanged.addListener(onThemeChanged);

    themeButton.addEventListener("click", () => {
      themeUpdated = true;
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      setTheme(nextTheme);
      chrome.storage.local.set({ [THEME_STORAGE_KEY]: nextTheme }, () => {
        void chrome.runtime.lastError;
      });
    });

    expandButton.addEventListener("click", () => {
      const expanded = box.classList.toggle("is-expanded");
      expandButton.innerHTML = expanded ? COLLAPSE_SVG : EXPAND_SVG;
      expandButton.title = expanded ? "Thu gọn chiều rộng" : "Mở rộng chiều rộng";
      expandButton.setAttribute("aria-label", expandButton.title);
    });

    let onMove = null;
    let onUp = null;
    header.addEventListener("mousedown", (event) => {
      if (event.target.closest("button")) return;
      if (onUp) onUp();
      const rect = box.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      host.style.left = `${rect.left}px`;
      host.style.top = `${rect.top}px`;
      host.style.right = "auto";
      host.style.bottom = "auto";
      onMove = (moveEvent) => {
        const left = Math.max(12, Math.min(window.innerWidth - box.offsetWidth - 12,
          rect.left + moveEvent.clientX - startX));
        const top = Math.max(12, Math.min(window.innerHeight - box.offsetHeight - 12,
          rect.top + moveEvent.clientY - startY));
        host.style.left = `${left}px`;
        host.style.top = `${top}px`;
      };
      onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
        onMove = null;
        onUp = null;
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      event.preventDefault();
    });

    function eligible(node, visibility) {
      const parent = node.parentElement;
      return parent && !parent.closest(SKIP) && !parent.isContentEditable &&
        visible(parent, visibility) && /\p{L}/u.test(node.data) && node.data.trim().length > 0;
    }

    function visible(element, cache) {
      if (!element || element === document.documentElement) return true;
      if (cache.has(element)) return cache.get(element);
      const style = getComputedStyle(element);
      const shown = style.display !== "none" && style.visibility !== "hidden" &&
        style.visibility !== "collapse" && style.contentVisibility !== "hidden" &&
        style.opacity !== "0" && visible(element.parentElement, cache);
      cache.set(element, shown);
      return shown;
    }

    function collectEntries() {
      for (const [node, record] of records) {
        if (!node.isConnected || (node.data !== record.original && node.data !== record.translated)) {
          records.delete(node);
        }
      }

      const entries = [];
      const visibility = new WeakMap();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!eligible(node, visibility) || records.has(node)) continue;
        const original = node.data;
        const trimmed = original.trim();
        const start = original.indexOf(trimmed);
        const parts = splitLongText(trimmed);
        entries.push({
          node, original, parts, translatedParts: Array(parts.length).fill(null),
          prefix: original.slice(0, start), suffix: original.slice(start + trimmed.length)
        });
      }
      return entries;
    }

    function makeBatches(entries) {
      const batches = [];
      let batch = [];
      let length = 0;
      for (const entry of entries) {
        entry.parts.forEach((text, index) => {
          if (batch.length && (batch.length >= MAX_BATCH_PARTS || length + text.length > MAX_BATCH_LENGTH)) {
            batches.push(batch);
            batch = [];
            length = 0;
          }
          batch.push({ entry, index, text });
          length += text.length;
        });
      }
      if (batch.length) batches.push(batch);
      return batches;
    }

    function showTranslatedRecords() {
      for (const [node, record] of records) {
        if (!node.isConnected) { records.delete(node); continue; }
        if (node.data === record.original) node.data = record.translated;
        else if (node.data !== record.translated) records.delete(node);
      }
    }

    function showOriginalRecords() {
      for (const [node, record] of records) {
        if (!node.isConnected) { records.delete(node); continue; }
        if (node.data === record.translated) node.data = record.original;
        else if (node.data !== record.original) records.delete(node);
      }
    }

    function updateButtons() {
      toggle.textContent = visibleTranslation ? "Xem bản gốc" : "Xem bản dịch";
      stop.hidden = !busy || !visibleTranslation || paused;
      retry.hidden = !paused || !visibleTranslation;
      spinner.hidden = !busy || !visibleTranslation || paused;
      count.textContent = `${records.size} đoạn`;
    }

    async function translatePending() {
      if (disposed || paused || !visibleTranslation) return;
      if (busy) { rescan = true; return; }
      const entries = collectEntries();
      if (!entries.length) {
        status.textContent = records.size
          ? `Đã dịch ${records.size} đoạn trên trang.`
          : "Không tìm thấy văn bản có thể dịch trên trang.";
        return;
      }

      const batches = makeBatches(entries);
      const total = batches.reduce((sum, batch) => sum + batch.length, 0);
      const token = ++generation;
      let completed = 0;
      let failed = false;
      busy = true;
      body.classList.remove("is-error");
      updateButtons();
      status.textContent = `Đang dịch 0/${total} đoạn…`;

      try {
        for (const batch of batches) {
          if (disposed || token !== generation) break;
          const response = await chrome.runtime.sendMessage({
            action: "TRANSLATE_PAGE_BATCH", texts: batch.map(item => item.text)
          });
          if (disposed || token !== generation) break;
          if (response?.error) throw new Error(response.error);
          if (!Array.isArray(response?.translations) || response.translations.length !== batch.length) {
            throw new Error("Gemini trả về bản dịch không hợp lệ.");
          }

          batch.forEach((item, index) => {
            item.entry.translatedParts[item.index] = response.translations[index];
            const entry = item.entry;
            if (!entry.translatedParts.every(part => typeof part === "string")) return;
            if (!entry.node.isConnected || entry.node.data !== entry.original) return;
            const translated = entry.prefix + entry.translatedParts.join(" ") + entry.suffix;
            records.set(entry.node, { original: entry.original, translated });
            if (visibleTranslation) entry.node.data = translated;
          });
          completed += batch.length;
          count.textContent = `${records.size} đoạn`;
          status.textContent = `Đang dịch ${completed}/${total} đoạn…`;
        }
      } catch (error) {
        if (!disposed && token === generation) {
          failed = true;
          paused = true;
          body.classList.add("is-error");
          status.textContent = `Đã dịch ${records.size} đoạn. ${error.message}`;
        }
      } finally {
        if (disposed) return;
        busy = false;
        updateButtons();
        if (token === generation && !failed) {
          status.textContent = `Đã dịch ${records.size} đoạn trên trang.`;
        }
        if (rescan && !paused && visibleTranslation) {
          rescan = false;
          queueMicrotask(translatePending);
        } else {
          rescan = false;
        }
      }
    }

    const observer = new MutationObserver((mutations) => {
      if (disposed || paused || !visibleTranslation) return;
      const changed = mutations.some(mutation => {
        if (mutation.type !== "characterData") return true;
        const record = records.get(mutation.target);
        return !record || mutation.target.data !== record.translated;
      });
      if (!changed) return;
      clearTimeout(scanTimer);
      scanTimer = setTimeout(translatePending, 700);
    });
    observer.observe(document.body, { childList: true, characterData: true, subtree: true });

    toggle.addEventListener("click", () => {
      visibleTranslation = !visibleTranslation;
      if (visibleTranslation) {
        paused = false;
        body.classList.remove("is-error");
        showTranslatedRecords();
        status.textContent = "Đang kiểm tra nội dung trang…";
        translatePending();
      } else {
        generation++;
        clearTimeout(scanTimer);
        rescan = false;
        showOriginalRecords();
        status.textContent = "Đang xem bản gốc.";
      }
      updateButtons();
    });

    stop.addEventListener("click", () => {
      generation++;
      paused = true;
      rescan = false;
      clearTimeout(scanTimer);
      status.textContent = `Đã dừng. Đã dịch ${records.size} đoạn.`;
      updateButtons();
    });

    retry.addEventListener("click", () => {
      paused = false;
      body.classList.remove("is-error");
      updateButtons();
      translatePending();
    });

    function close() {
      if (disposed) return;
      disposed = true;
      generation++;
      clearTimeout(scanTimer);
      observer.disconnect();
      if (onUp) onUp();
      chrome.storage.onChanged.removeListener(onThemeChanged);
      document.removeEventListener("keydown", onKeyDown);
      showOriginalRecords();
      records.clear();
      host.remove();
      controller = null;
    }

    const onKeyDown = (event) => {
      const selectionModal = document.getElementById("gemini-translator-modal-container");
      if (event.key === "Escape" && (!selectionModal || selectionModal.style.display === "none")) {
        close();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    host.querySelector(".gt-page-close").addEventListener("click", close);

    return {
      start() {
        visibleTranslation = true;
        paused = false;
        body.classList.remove("is-error");
        showTranslatedRecords();
        updateButtons();
        translatePending();
      }
    };
  }
})();
