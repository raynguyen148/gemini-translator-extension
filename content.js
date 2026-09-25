// ── Constants ──────────────────────────────────────────────
const POPOVER_ID = "gemini-translator-popover-btn";
const MODAL_ID   = "gemini-translator-modal-container";
const PAGE_CONTROL_ID = "gemini-translator-page-controls";
const THEME_STORAGE_KEY = "translationPopupTheme";

// Inline SVG icons
const POPOVER_SVG = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <line x1="3.5" y1="4.5" x2="11.5" y2="20.5" stroke="#1557b0" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="12" y1="20.5" x2="16.8" y2="9.5" stroke="#1a73e8" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M19 0.8C19.3 3.1 20.4 4.2 22.8 4.6C20.4 5.0 19.3 6.1 19 8.4C18.7 6.1 17.6 5.0 15.2 4.6C17.6 4.2 18.7 3.1 19 0.8Z" fill="#1a73e8"/>
</svg>`;

const HEADER_SVG = `<svg width="15" height="15" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <line x1="2" y1="2.2" x2="6.6" y2="12" stroke="rgba(255,255,255,0.75)" stroke-width="2.1" stroke-linecap="round"/>
  <line x1="6.8" y1="12" x2="10" y2="5.5" stroke="white" stroke-width="2.1" stroke-linecap="round"/>
  <path d="M11.5 0.5C11.7 1.8 12.3 2.4 13.6 2.6C12.3 2.8 11.7 3.4 11.5 4.7C11.3 3.4 10.7 2.8 9.4 2.6C10.7 2.4 11.3 1.8 11.5 0.5Z" fill="white"/>
</svg>`;

const PIN_SVG = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
  <line x1="8" y1="9" x2="8" y2="15"/>
  <path d="M5 9h6V5.5L13 3H3l2 2.5V9z"/>
  <line x1="3" y1="3" x2="13" y2="3"/>
</svg>`;

const EXPAND_SVG = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="1 6 1 1 6 1"/>
  <polyline points="10 1 15 1 15 6"/>
  <polyline points="15 10 15 15 10 15"/>
  <polyline points="6 15 1 15 1 10"/>
</svg>`;

const COLLAPSE_SVG = `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="6 1 6 6 1 6"/>
  <polyline points="10 1 10 6 15 6"/>
  <polyline points="15 10 10 10 10 15"/>
  <polyline points="1 10 6 10 6 15"/>
</svg>`;

const MOON_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M13.2 10.2A5.8 5.8 0 0 1 5.8 2.8a5.8 5.8 0 1 0 7.4 7.4z"/>
</svg>`;

const SUN_SVG = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="8" cy="8" r="2.7"/>
  <path d="M8 1v1.4M8 13.6V15M1 8h1.4M13.6 8H15M3.05 3.05l1 1M11.95 11.95l1 1M12.95 3.05l-1 1M4.05 11.95l-1 1"/>
</svg>`;

const SPEAKER_SVG = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="2 5 6 5 10 2 10 14 6 11 2 11 2 5"></polygon>
  <path d="M13 5.5a5 5 0 0 1 0 5"></path>
</svg>`;

const SPEAKER_STOP_SVG = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="10" height="10" rx="1.5"></rect>
</svg>`;

let selectedText = "";
let isPinned = false;
let isSpeaking = false;
let translationDirection = "auto";
let currentSourceText = "";
let activeTranslationRequest = 0;
let currentTheme = "light";

loadThemePreference();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[THEME_STORAGE_KEY]) return;
  setPopupTheme(changes[THEME_STORAGE_KEY].newValue);
});

// ── 1. Bôi đen chữ → hiện Popover ─────────────────────────
document.addEventListener("mouseup", (e) => {
  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (e.target.closest(`#${MODAL_ID}, #${POPOVER_ID}, #${PAGE_CONTROL_ID}`)) return;

    if (text.length > 0) {
      selectedText = text;
      showPopover(e.pageX, e.pageY);
    } else {
      hidePopover();
    }
  }, 10);
});

// Ẩn popover khi click ra ngoài
document.addEventListener("mousedown", (e) => {
  if (!e.target.closest(`#${POPOVER_ID}, #${MODAL_ID}, #${PAGE_CONTROL_ID}`)) {
    hidePopover();
  }
});

// ── 2. Popover Button ──────────────────────────────────────
function showPopover(x, y) {
  let btn = document.getElementById(POPOVER_ID);
  if (!btn) {
    btn = document.createElement("button");
    btn.id = POPOVER_ID;
    btn.innerHTML = POPOVER_SVG;
    btn.title = getDirectionLabel("auto");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      hidePopover();
      processTranslation(selectedText, "auto");
    });
    document.body.appendChild(btn);
  }
  btn.style.left = `${x + 6}px`;
  btn.style.top  = `${y + 6}px`;
  btn.style.display = "flex";
}

function hidePopover() {
  const btn = document.getElementById(POPOVER_ID);
  if (btn) btn.style.display = "none";
}

// ── 3. Nhận lệnh từ Context Menu (chuột phải) ─────────────
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "TRIGGER_TRANSLATE") {
    hidePopover();
    processTranslation(request.text, "auto");
  }
});

// ── 4. Luồng dịch chính ────────────────────────────────────
async function processTranslation(text, direction = "auto") {
  currentSourceText = text;
  translationDirection = direction;
  const requestId = ++activeTranslationRequest;
  showModal({ state: "loading", direction });

  try {
    const response = await chrome.runtime.sendMessage({ action: "TRANSLATE", text, direction });

    // Người dùng có thể đổi chiều dịch khi request cũ vẫn đang chạy.
    if (requestId !== activeTranslationRequest) return;

    if (chrome.runtime.lastError) throw new Error("Mất kết nối với Extension.");

    if (response.error) {
      showModal({ state: "error", content: response.error, direction });
    } else {
      showModal({ state: "result", content: response.result, direction });
    }
  } catch (error) {
    if (requestId !== activeTranslationRequest) return;
    showModal({ state: "error", content: `Đã xảy ra lỗi: ${error.message}`, direction });
  }
}

// ── 5. Modal & Tương tác cao cấp ───────────────────────────
function showModal({ state, content, direction = translationDirection }) {
  let modal = document.getElementById(MODAL_ID);

  if (!modal) {
    modal = document.createElement("div");
    modal.id = MODAL_ID;

    // Overlay
    const overlay = document.createElement("div");
    overlay.className = "gt-overlay";
    overlay.addEventListener("click", () => {
      if (!isPinned) closeModal(modal);
    });

    // Box
    const box = document.createElement("div");
    box.className = "gt-box";

    // Header
    const header = document.createElement("div");
    header.className = "gt-header";
    header.title = "Kéo để di chuyển vị trí";

    const headerLeft = document.createElement("div");
    headerLeft.className = "gt-header-left";

    const headerIcon = document.createElement("span");
    headerIcon.className = "gt-header-icon";
    headerIcon.innerHTML = HEADER_SVG;

    const title = document.createElement("strong");
    title.textContent = "Gemini Translator";

    headerLeft.appendChild(headerIcon);
    headerLeft.appendChild(title);

    // Header Actions (Theme, Pin, Expand, Close)
    const headerActions = document.createElement("div");
    headerActions.className = "gt-header-actions";

    // Theme Button
    const themeBtn = document.createElement("button");
    themeBtn.type = "button";
    themeBtn.className = "gt-tool-btn gt-theme-toggle";
    themeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      setPopupTheme(nextTheme);
      saveThemePreference(nextTheme);
    });

    // Pin Button
    const pinBtn = document.createElement("button");
    pinBtn.className = "gt-tool-btn";
    pinBtn.innerHTML = PIN_SVG;
    pinBtn.title = "Ghim (không tắt khi bấm ra ngoài)";
    pinBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      isPinned = !isPinned;
      box.classList.toggle("is-pinned", isPinned);
      overlay.classList.toggle("is-pinned-overlay", isPinned);
      pinBtn.classList.toggle("active", isPinned);
      pinBtn.title = isPinned ? "Bỏ ghim" : "Ghim (không tắt khi bấm ra ngoài)";
    });

    // Expand Button
    const expandBtn = document.createElement("button");
    expandBtn.className = "gt-tool-btn";
    expandBtn.innerHTML = EXPAND_SVG;
    expandBtn.title = "Mở rộng chiều rộng";
    expandBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isExpanded = box.classList.toggle("is-expanded");
      expandBtn.innerHTML = isExpanded ? COLLAPSE_SVG : EXPAND_SVG;
      expandBtn.title = isExpanded ? "Thu gọn chiều rộng" : "Mở rộng chiều rộng";
    });

    // Close Button
    const closeBtn = document.createElement("button");
    closeBtn.className = "gt-tool-btn";
    closeBtn.innerHTML = "✕";
    closeBtn.title = "Đóng (Esc)";
    closeBtn.addEventListener("click", () => closeModal(modal));

    headerActions.appendChild(themeBtn);
    headerActions.appendChild(pinBtn);
    headerActions.appendChild(expandBtn);
    headerActions.appendChild(closeBtn);

    header.appendChild(headerLeft);
    header.appendChild(headerActions);

    // Body
    const body = document.createElement("div");
    body.className = "gt-body";
    body.id = "gt-body-content";

    // Footer
    const footer = document.createElement("div");
    footer.className = "gt-footer";
    footer.id = "gt-footer";
    footer.style.display = "none";

    box.appendChild(header);
    box.appendChild(body);
    box.appendChild(footer);
    modal.appendChild(overlay);
    modal.appendChild(box);
    document.body.appendChild(modal);

    applyThemeToModal(modal);

    // Kéo thả di chuyển Modal (Drag & Drop)
    makeDraggable(box, header);

    // Phím tắt Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.style.display !== "none") {
        closeModal(modal);
      }
    });
  }

  const body   = document.getElementById("gt-body-content");
  const footer = document.getElementById("gt-footer");

  // Reset
  body.className = "gt-body";
  footer.innerHTML = "";
  stopSpeech();

  const footerLeft = document.createElement("div");
  footerLeft.className = "gt-footer-left";
  footerLeft.appendChild(createDirectionControl(direction));

  const footerRight = document.createElement("div");
  footerRight.className = "gt-footer-right";

  if (state === "loading") {
    body.innerHTML = `<div class="gt-loading"><div class="gt-spinner"></div>Đang dịch với Gemini...</div>`;
  } else if (state === "error") {
    body.classList.add("is-error");
    body.innerHTML = `${escapeHtml(content)}<div class="gt-error-hint">Mở Cài đặt extension để kiểm tra API Key và Model.</div>`;
  } else if (state === "result") {
    body.innerHTML = renderMarkdown(content);

    const wordCount = document.createElement("span");
    wordCount.className = "gt-word-count";
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    wordCount.textContent = `~${words} từ`;

    footerLeft.appendChild(wordCount);

    // Footer Right: Speak + Copy
    // Speak Button
    const speakBtn = document.createElement("button");
    speakBtn.className = "gt-action-btn";
    speakBtn.innerHTML = `${SPEAKER_SVG} Nghe`;
    speakBtn.title = "Đọc bản dịch";
    speakBtn.addEventListener("click", () => {
      toggleSpeech(content, speakBtn);
    });

    // Copy Button
    const copyBtn = document.createElement("button");
    copyBtn.className = "gt-action-btn gt-copy-btn";
    copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.3"/><path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Sao chép`;
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(content).then(() => {
        copyBtn.classList.add("copied");
        copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Đã chép`;
        setTimeout(() => {
          copyBtn.classList.remove("copied");
          copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.3"/><path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Sao chép`;
        }, 2000);
      });
    });

    footerRight.appendChild(speakBtn);
    footerRight.appendChild(copyBtn);

  }

  footer.appendChild(footerLeft);
  footer.appendChild(footerRight);
  footer.style.display = "flex";

  modal.style.display = "flex";
}

function loadThemePreference() {
  chrome.storage.local.get([THEME_STORAGE_KEY], (result) => {
    if (chrome.runtime.lastError) return;
    setPopupTheme(result[THEME_STORAGE_KEY]);
  });
}

function saveThemePreference(theme) {
  chrome.storage.local.set({ [THEME_STORAGE_KEY]: theme }, () => {
    // Reading lastError prevents an unchecked runtime error if the extension
    // is reloaded while this content script is still attached to the page.
    void chrome.runtime.lastError;
  });
}

function setPopupTheme(theme) {
  currentTheme = theme === "dark" ? "dark" : "light";

  const modal = document.getElementById(MODAL_ID);
  if (modal) applyThemeToModal(modal);
}

function applyThemeToModal(modal) {
  const isDark = currentTheme === "dark";
  modal.dataset.theme = currentTheme;

  const themeBtn = modal.querySelector(".gt-theme-toggle");
  if (!themeBtn) return;

  const label = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";
  themeBtn.innerHTML = isDark ? SUN_SVG : MOON_SVG;
  themeBtn.title = label;
  themeBtn.setAttribute("aria-label", "Giao diện tối");
  themeBtn.setAttribute("aria-pressed", String(isDark));
}

function createDirectionControl(activeDirection) {
  const control = document.createElement("div");
  control.className = "gt-direction-control";
  control.setAttribute("role", "group");
  control.setAttribute("aria-label", "Chọn hướng dịch");

  [
    { value: "auto", label: "Tự động", title: "Tự nhận biết ngôn ngữ và chọn chiều dịch" },
    { value: "en-to-vi", label: "EN → VI", title: "Dịch từ tiếng Anh sang tiếng Việt" },
    { value: "vi-to-en", label: "VI → EN", title: "Dịch từ tiếng Việt sang tiếng Anh" }
  ].forEach(({ value, label, title }) => {
    const button = document.createElement("button");
    const isActive = value === activeDirection;
    button.type = "button";
    button.className = `gt-direction-btn${isActive ? " active" : ""}`;
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-pressed", String(isActive));
    button.addEventListener("click", () => setTranslationDirection(value));
    control.appendChild(button);
  });

  return control;
}

function setTranslationDirection(direction) {
  if (direction === translationDirection) return;

  translationDirection = direction;

  if (currentSourceText) {
    processTranslation(currentSourceText, direction);
  }
}

function getDirectionLabel(direction) {
  if (direction === "vi-to-en") return "Dịch từ tiếng Việt sang tiếng Anh";
  if (direction === "en-to-vi") return "Dịch từ tiếng Anh sang tiếng Việt";
  return "Tự nhận biết ngôn ngữ và chọn chiều dịch";
}

// ── Kéo thả (Draggable) ───────────────────────────────────
function makeDraggable(box, handle) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  handle.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;

    const rect = box.getBoundingClientRect();
    initialLeft = rect.left;
    initialTop  = rect.top;

    box.style.position = "fixed";
    box.style.left = `${initialLeft}px`;
    box.style.top  = `${initialTop}px`;
    box.style.right = "auto";
    box.style.bottom = "auto";
    box.style.margin = "0";

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    e.preventDefault();
  });

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const maxLeft = window.innerWidth - box.offsetWidth - 12;
    const maxTop  = window.innerHeight - box.offsetHeight - 12;

    const nextLeft = Math.max(12, Math.min(maxLeft, initialLeft + dx));
    const nextTop  = Math.max(12, Math.min(maxTop, initialTop + dy));

    box.style.left = `${nextLeft}px`;
    box.style.top  = `${nextTop}px`;
  }

  function onMouseUp() {
    isDragging = false;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  }
}

// ── Text-to-Speech (Phát âm) ──────────────────────────────
function toggleSpeech(text, btn) {
  if (!("speechSynthesis" in window)) return;

  if (isSpeaking) {
    stopSpeech();
    btn.innerHTML = `${SPEAKER_SVG} Nghe`;
    btn.classList.remove("active");
  } else {
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text);
    utterance.lang = isVietnamese ? "vi-VN" : "en-US";
    utterance.rate = 1.0;

    utterance.onend = () => {
      isSpeaking = false;
      btn.innerHTML = `${SPEAKER_SVG} Nghe`;
      btn.classList.remove("active");
    };

    utterance.onerror = () => {
      isSpeaking = false;
      btn.innerHTML = `${SPEAKER_SVG} Nghe`;
      btn.classList.remove("active");
    };

    window.speechSynthesis.speak(utterance);
    isSpeaking = true;
    btn.innerHTML = `${SPEAKER_STOP_SVG} Dừng`;
    btn.classList.add("active");
  }
}

function stopSpeech() {
  if ("speechSynthesis" in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  isSpeaking = false;
}

function closeModal(modal) {
  stopSpeech();
  modal.style.display = "none";
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ── Markdown Renderer (thuần JS, không cần thư viện) ──────
function renderMarkdown(raw) {
  const lines  = raw.split("\n");
  const out    = [];
  let inCode   = false;
  let codeBuf  = [];
  let inUl     = false;
  let inOl     = false;

  const closeList = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  };

  for (const line of lines) {
    // ── Fenced code block ──────────────────────────────
    if (line.startsWith("```")) {
      if (inCode) {
        out.push(`<pre><code>${codeBuf.map(escapeHtml).join("\n")}</code></pre>`);
        codeBuf = [];
        inCode  = false;
      } else {
        closeList();
        inCode = true;
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    // ── Headings ───────────────────────────────────────
    if (line.startsWith("### ")) { closeList(); out.push(`<h3>${inline(line.slice(4))}</h3>`); continue; }
    if (line.startsWith("## "))  { closeList(); out.push(`<h2>${inline(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("# "))   { closeList(); out.push(`<h1>${inline(line.slice(2))}</h1>`); continue; }

    // ── Horizontal rule ────────────────────────────────
    if (/^---+$/.test(line.trim())) { closeList(); out.push("<hr>"); continue; }

    // ── Blockquote ─────────────────────────────────────
    if (line.startsWith("> ")) { closeList(); out.push(`<blockquote>${inline(line.slice(2))}</blockquote>`); continue; }

    // ── Unordered list ─────────────────────────────────
    if (/^[-*] /.test(line)) {
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${inline(line.slice(2))}</li>`);
      continue;
    }

    // ── Ordered list ───────────────────────────────────
    if (/^\d+\. /.test(line)) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${inline(line.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }

    // ── Empty line → paragraph break ───────────────────
    if (line.trim() === "") {
      closeList();
      out.push("<div class='gt-spacer'></div>");
      continue;
    }

    // ── Default: paragraph ─────────────────────────────
    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }

  closeList();
  return out.join("");
}

// Inline formatting: escape first, then apply patterns
function inline(raw) {
  let s = escapeHtml(raw);
  // Bold + italic
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic (asterisk or underscore)
  s = s.replace(/\*(.+?)\*/g,   "<em>$1</em>");
  s = s.replace(/_([^_]+)_/g,   "<em>$1</em>");
  // Inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Strikethrough
  s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
  return s;
}
