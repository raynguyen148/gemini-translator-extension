showModal({ state: "idle", direction: "auto" });

const detachedModal = document.getElementById(MODAL_ID);
const detachedBox = detachedModal.querySelector(".gt-box");
const detachedHeaderActions = detachedBox.querySelector(".gt-header-actions");
const detachedBody = detachedBox.querySelector(".gt-body");

const fontControls = document.createElement("div");
fontControls.className = "gt-font-controls";
fontControls.setAttribute("role", "group");
fontControls.setAttribute("aria-label", "Cỡ chữ");
fontControls.innerHTML = `
  <button type="button" class="gt-font-btn" id="gt-font-decrease" aria-label="Giảm cỡ chữ" title="Giảm cỡ chữ">A−</button>
  <button type="button" class="gt-font-btn" id="gt-font-increase" aria-label="Tăng cỡ chữ" title="Tăng cỡ chữ">A+</button>
`;

const settingsBtn = document.createElement("button");
settingsBtn.type = "button";
settingsBtn.className = "gt-tool-btn";
settingsBtn.title = "Cài đặt";
settingsBtn.setAttribute("aria-label", "Cài đặt");
settingsBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`;
settingsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
detachedHeaderActions.prepend(fontControls);
detachedHeaderActions.insertBefore(settingsBtn, detachedHeaderActions.lastChild);

const inputPanel = document.createElement("div");
inputPanel.className = "gt-manual-panel";
inputPanel.innerHTML = `
  <div class="gt-manual-heading">
    <label for="gt-manual-input">TEXT TO TRANSLATE</label>
    <div class="gt-manual-actions">
      <button type="button" class="gt-action-btn" id="gt-copy-input" title="Sao chép văn bản nhập">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.3"/><path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        <span>Copy</span>
      </button>
      <button type="button" class="gt-action-btn" id="gt-paste-input" title="Dán từ clipboard">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M4 2H3a1 1 0 00-1 1v7a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1H8" stroke="currentColor" stroke-width="1.3"/><rect x="4" y="1" width="4" height="2" rx="0.5" stroke="currentColor" stroke-width="1.2"/></svg>
        <span>Paste</span>
      </button>
    </div>
  </div>
  <textarea id="gt-manual-input" spellcheck="false" placeholder="Paste or type text here…"></textarea>
  <div class="gt-manual-count" id="gt-manual-count">0 chars</div>
  <div class="gt-manual-submit">
    <button type="button" class="gt-translate-btn" id="gt-manual-translate">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 4.5H10M10 4.5L7.5 2M10 4.5L7.5 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 9.5H4M4 9.5L6.5 7M4 9.5L6.5 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Translate</span>
    </button>
    <button type="button" class="gt-action-btn" id="gt-manual-clear">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true"><path d="M3 3l7 7M10 3l-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
      Clear
    </button>
  </div>
`;
detachedBox.insertBefore(inputPanel, detachedBody);

const manualInput = inputPanel.querySelector("#gt-manual-input");
const charCount = inputPanel.querySelector("#gt-manual-count");
const copyInputBtn = inputPanel.querySelector("#gt-copy-input");
const pasteInputBtn = inputPanel.querySelector("#gt-paste-input");
const translateBtn = inputPanel.querySelector("#gt-manual-translate");
const clearBtn = inputPanel.querySelector("#gt-manual-clear");
const feedbackTimers = new Map();

function updateInputState() {
  const length = manualInput.value.length;
  charCount.textContent = `${length.toLocaleString()} char${length === 1 ? "" : "s"}`;
  copyInputBtn.disabled = length === 0;
  translateBtn.disabled = !manualInput.value.trim();
}

function showButtonFeedback(button, label) {
  clearTimeout(feedbackTimers.get(button));
  const text = button.querySelector("span");
  text.textContent = label;
  feedbackTimers.set(button, setTimeout(() => {
    text.textContent = button === pasteInputBtn ? "Paste" : "Copy";
  }, 2000));
}

manualInput.addEventListener("input", () => {
  updateInputState();
  if (currentSourceText && manualInput.value.trim() !== currentSourceText) {
    resetDetachedTranslation();
    translateBtn.querySelector("span").textContent = "Translate";
  }
});

manualInput.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    translateInput();
  }
});

copyInputBtn.addEventListener("click", async () => {
  if (!manualInput.value) return;
  try {
    await navigator.clipboard.writeText(manualInput.value);
    showButtonFeedback(copyInputBtn, "Copied");
  } catch {
    showButtonFeedback(copyInputBtn, "Failed");
  }
});

pasteInputBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (!text) {
      showButtonFeedback(pasteInputBtn, "Empty");
      return;
    }
    manualInput.setRangeText(text, manualInput.selectionStart, manualInput.selectionEnd, "end");
    manualInput.dispatchEvent(new Event("input", { bubbles: true }));
    manualInput.focus();
    showButtonFeedback(pasteInputBtn, "Pasted");
  } catch {
    showButtonFeedback(pasteInputBtn, "Failed");
  }
});

async function translateInput() {
  const text = manualInput.value.trim();
  if (!text) { manualInput.focus(); return; }
  processTranslation(text, translationDirection);
}

translateBtn.addEventListener("click", translateInput);
window.addEventListener("gt-translation-start", () => {
  translateBtn.disabled = true;
  translateBtn.querySelector("span").textContent = "Translating…";
});
window.addEventListener("gt-translation-settled", () => {
  translateBtn.querySelector("span").textContent = "Translate";
  updateInputState();
});
clearBtn.addEventListener("click", () => {
  manualInput.value = "";
  resetDetachedTranslation();
  translateBtn.querySelector("span").textContent = "Translate";
  updateInputState();
  manualInput.focus();
});

let detachedFontSize = 13.5;
const decreaseFontBtn = fontControls.querySelector("#gt-font-decrease");
const increaseFontBtn = fontControls.querySelector("#gt-font-increase");

function setDetachedFontSize(size) {
  detachedFontSize = Math.min(20, Math.max(12, size));
  detachedModal.style.setProperty("--gt-reading-font-size", `${detachedFontSize}px`);
  decreaseFontBtn.disabled = detachedFontSize <= 12;
  increaseFontBtn.disabled = detachedFontSize >= 20;
}

decreaseFontBtn.addEventListener("click", () => {
  setDetachedFontSize(detachedFontSize - 1);
  chrome.storage.local.set({ toolbarFontSize: detachedFontSize });
});
increaseFontBtn.addEventListener("click", () => {
  setDetachedFontSize(detachedFontSize + 1);
  chrome.storage.local.set({ toolbarFontSize: detachedFontSize });
});
chrome.storage.local.get("toolbarFontSize").then(({ toolbarFontSize }) => {
  if (typeof toolbarFontSize === "number" && Number.isFinite(toolbarFontSize)) setDetachedFontSize(toolbarFontSize);
});

window.addEventListener("blur", () => {
  if (!isPinned) chrome.windows.getCurrent().then(({ id }) => chrome.windows.remove(id));
});

updateInputState();
manualInput.focus();
