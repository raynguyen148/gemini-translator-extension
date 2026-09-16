const inputText   = document.getElementById("inputText");
const charCount   = document.getElementById("charCount");
const translateBtn= document.getElementById("translateBtn");
const clearBtn    = document.getElementById("clearBtn");
const resultSection = document.getElementById("resultSection");
const resultBody  = document.getElementById("resultBody");
const copyBtn     = document.getElementById("copyBtn");
const speakBtn    = document.getElementById("speakBtn");
const settingsBtn = document.getElementById("settingsBtn");

let lastResult = "";
let isSpeaking = false;

// ── Open settings page ─────────────────────────────────────
settingsBtn.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// ── Char counter ───────────────────────────────────────────
inputText.addEventListener("input", () => {
  const len = inputText.value.length;
  charCount.textContent = `${len.toLocaleString()} char${len !== 1 ? "s" : ""}`;
});

// ── Keyboard shortcut: Cmd/Ctrl + Enter to translate ──────
inputText.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    doTranslate();
  }
});

// ── Clear ──────────────────────────────────────────────────
clearBtn.addEventListener("click", () => {
  inputText.value = "";
  charCount.textContent = "0 chars";
  resultSection.style.display = "none";
  lastResult = "";
  stopSpeech();
  inputText.focus();
});

// ── Translate ──────────────────────────────────────────────
translateBtn.addEventListener("click", doTranslate);

async function doTranslate() {
  const text = inputText.value.trim();
  if (!text) { inputText.focus(); return; }

  translateBtn.disabled = true;
  translateBtn.innerHTML = `<div class="spinner"></div> Translating…`;

  resultSection.style.display = "block";
  resultBody.className = "result-body";
  resultBody.innerHTML = `<div class="loading"><div class="spinner"></div>Translating with Gemini…</div>`;
  stopSpeech();

  try {
    const response = await chrome.runtime.sendMessage({ action: "TRANSLATE", text });

    if (response.error) {
      resultBody.classList.add("is-error");
      resultBody.innerHTML = `${escHtml(response.error)}<div class="error-hint">Check your API Key and Model in Settings.</div>`;
      lastResult = "";
    } else {
      lastResult = response.result;
      resultBody.innerHTML = renderMarkdown(response.result);
    }
  } catch (err) {
    resultBody.classList.add("is-error");
    resultBody.innerHTML = `${escHtml(err.message)}<div class="error-hint">Make sure the extension is properly installed.</div>`;
    lastResult = "";
  } finally {
    translateBtn.disabled = false;
    translateBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 4.5H10M10 4.5L7.5 2M10 4.5L7.5 7" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 9.5H4M4 9.5L6.5 7M4 9.5L6.5 12" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Translate`;
  }
}

// ── Copy ───────────────────────────────────────────────────
copyBtn.addEventListener("click", () => {
  if (!lastResult) return;
  navigator.clipboard.writeText(lastResult).then(() => {
    copyBtn.classList.add("copied");
    copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Copied`;
    setTimeout(() => {
      copyBtn.classList.remove("copied");
      copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.2" stroke="currentColor" stroke-width="1.3"/><path d="M3 8H2a1 1 0 01-1-1V2a1 1 0 011-1h5a1 1 0 011 1v1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg> Copy`;
    }, 2000);
  });
});

// ── Text-to-Speech ─────────────────────────────────────────
speakBtn.addEventListener("click", () => {
  if (!lastResult) return;
  if (isSpeaking) {
    stopSpeech();
    speakBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="2 5 6 5 10 2 10 14 6 11 2 11 2 5"></polygon><path d="M13 5.5a5 5 0 0 1 0 5"></path></svg> Listen`;
    speakBtn.classList.remove("copied");
  } else {
    const utt = new SpeechSynthesisUtterance(lastResult);
    const isVietnamese = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(lastResult);
    utt.lang = isVietnamese ? "vi-VN" : "en-US";
    utt.onend = utt.onerror = () => {
      isSpeaking = false;
      speakBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><polygon points="2 5 6 5 10 2 10 14 6 11 2 11 2 5"></polygon><path d="M13 5.5a5 5 0 0 1 0 5"></path></svg> Listen`;
      speakBtn.classList.remove("copied");
    };
    window.speechSynthesis.speak(utt);
    isSpeaking = true;
    speakBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="10" height="10" rx="1.5"></rect></svg> Stop`;
    speakBtn.classList.add("copied");
  }
});

function stopSpeech() {
  if (window.speechSynthesis?.speaking) window.speechSynthesis.cancel();
  isSpeaking = false;
}

// ── Helpers ────────────────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function renderMarkdown(raw) {
  const lines = raw.split("\n");
  const out = [];
  let inCode = false, codeBuf = [], inUl = false, inOl = false;

  const closeList = () => {
    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) { out.push(`<pre><code>${codeBuf.map(escHtml).join("\n")}</code></pre>`); codeBuf = []; inCode = false; }
      else { closeList(); inCode = true; }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    if (line.startsWith("### ")) { closeList(); out.push(`<h3>${inlineFmt(line.slice(4))}</h3>`); continue; }
    if (line.startsWith("## "))  { closeList(); out.push(`<h2>${inlineFmt(line.slice(3))}</h2>`); continue; }
    if (line.startsWith("# "))   { closeList(); out.push(`<h1>${inlineFmt(line.slice(2))}</h1>`); continue; }
    if (/^---+$/.test(line.trim())) { closeList(); out.push("<hr>"); continue; }
    if (line.startsWith("> "))   { closeList(); out.push(`<blockquote>${inlineFmt(line.slice(2))}</blockquote>`); continue; }

    if (/^[-*] /.test(line)) {
      if (inOl) { out.push("</ol>"); inOl = false; }
      if (!inUl) { out.push("<ul>"); inUl = true; }
      out.push(`<li>${inlineFmt(line.slice(2))}</li>`);
      continue;
    }
    if (/^\d+\. /.test(line)) {
      if (inUl) { out.push("</ul>"); inUl = false; }
      if (!inOl) { out.push("<ol>"); inOl = true; }
      out.push(`<li>${inlineFmt(line.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }

    if (line.trim() === "") { closeList(); out.push("<div class='spacer'></div>"); continue; }
    closeList();
    out.push(`<p>${inlineFmt(line)}</p>`);
  }
  closeList();
  return out.join("");
}

function inlineFmt(s) {
  s = escHtml(s);
  s = s.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/\*(.+?)\*/g, "<em>$1</em>");
  s = s.replace(/_([^_]+)_/g, "<em>$1</em>");
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  s = s.replace(/~~(.+?)~~/g, "<del>$1</del>");
  return s;
}

// Auto-focus textarea on open
inputText.focus();
