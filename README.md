# Gemini Translator — Chrome Extension

> Instant, context-aware, bidirectional English ⇄ Vietnamese translation right in your browser, powered by the Google Gemini API.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=flat)
![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=flat)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

---

## Features

| Feature | Description |
|---|---|
| **Highlight & Translate** | Select text on any webpage → click the floating action button → view instant translation; can be disabled in extension settings |
| **Bidirectional (Auto-detect)** | Automatically detects if the input is English or Vietnamese and translates to the opposite language |
| **Detached Translator Window** | Click the extension icon to open a movable window for pasted or typed text, using the same translation UI as selected text |
| **Right-Click Menu** | Translate selections via the browser context menu (*Right click → "Dịch với Gemini"*) |
| **Translate Page in Place** | Right-click a page → **Dịch trang này sang tiếng Việt với Gemini** to replace its text while retaining the page layout; switch between the original and translated text |
| **Markdown Rendering** | Native, zero-dependency Markdown parser that renders headings, lists, code blocks, bold/italics, and blockquotes |
| **Movable Translator** | Drag the selected-text modal within the webpage, or move the detached window around the desktop using its title bar |
| **Pin Mode** | Keep the selected-text modal open when clicking the webpage, or keep the detached window open after switching focus |
| **Expandable Width** | Toggle between default (480px) and wide view (680px) for reading lengthy technical articles and PR descriptions |
| **Persistent Theme** | Switch the translation UI between Light and Dark themes; the selected theme is remembered across pages and windows |
| **Text-to-Speech (TTS)** | Listen to the Vietnamese pronunciation of the translated text via the Web Speech API |
| **One-Click Copy** | Fast copy button with tactile visual feedback |
| **Word Count** | Displays an estimated word count for translated text |
| **Automatic Fallback** | Gracefully falls back to lighter models if the primary model encounters rate limits or overload (HTTP 503/429) |
| **Zero Dependencies** | Pure vanilla JavaScript and modern CSS with zero external libraries or bundle build steps |

---

## Design System

- **Modern Minimal:** Clean surfaces, subtle 1px border lines, balanced elevation shadows.
- **Anchor Color:** Google Blue (`#1a73e8`) used strictly as the primary interactive hue.
- **Typography:** Tuned line heights and font pairings optimized for extended reading.
- **Sleek Custom Scrollbar:** 5px subtle scrollbar that blends seamlessly with the UI.

---

## Installation (Developer Mode)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/gemini-translator-extension.git
```

### 2. Load into Chrome

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `gemini-translator-extension` directory.

### 3. Obtain a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create or copy your free Gemini API key.

### 4. Configure Extension Settings

1. Click the extension icon in your Chrome toolbar → click the **Settings (⚙)** button in the detached window (or open extension options directly).
2. Paste your API Key into the **Gemini API Key** field.
3. Select your preferred model (default: `gemini-3.8-flash`).
4. Click **Save Settings**.

The **Dịch văn bản được chọn** setting is on by default. Turn it off to hide the selection icon and selected-text right-click menu while keeping page translation and the detached window available. Changes apply to open pages after saving.

---

## How to Use

### Method 1: Inline Selection
1. Highlight any English text on a webpage.
2. Click the floating translation icon that appears near your cursor.
3. The translation modal will open in the bottom-right corner.

### Method 2: Detached Window (Recommended for Google Docs / Web Apps)
1. Click the Gemini Translator icon in the Chrome toolbar.
2. Move the window by its title bar. Use **Pin** to keep it open when switching to another window; **Unpin** closes it when focus leaves.
3. Paste or type text into the input box, then press **`Cmd + Enter`** (Mac) or **`Ctrl + Enter`** (Windows/Linux), or click **Translate**.

### Method 3: Context Menu
1. Highlight text anywhere on the page.
2. Right-click and choose **Dịch với Gemini**.

### Method 4: Translate the Current Page
1. Right-click anywhere on a regular webpage and choose **Dịch trang này sang tiếng Việt với Gemini**.
2. The extension translates text in batches and replaces it directly on the page. The floating popup shares the selected-text popup's theme and layout. Use **Xem bản gốc / Xem bản dịch** to switch views, **Dừng dịch** to stop further batches, or close the popup to restore the original page.

The extension skips code blocks, form inputs, editable content, and its own UI. It also translates new DOM text added while the translated view is active. Text drawn in a canvas, closed shadow roots, and inaccessible frames cannot be replaced. Long pages may need several Gemini requests and can hit API rate limits.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd + Enter` / `Ctrl + Enter` | Translate input in detached window |
| `Esc` | Close translation modal |

The detached window has Copy and Paste controls for the input, a Copy control for the translation, and A− / A+ controls that remember the text size. Chrome does not provide an always-on-top switch for extension windows, so Pin keeps the window open but does not place it above other apps.

---

## Project Structure

```
gemini-translator-extension/
├── manifest.json      # Extension configuration (Manifest V3)
├── background.js      # Background service worker (API dispatch & fallback logic)
├── content.js         # Content script (in-page popup, modal, drag & drop, TTS, Markdown parser)
├── page-translation.js # In-place page translation and original/translated controls
├── detached.html      # Standalone translator window
├── detached.js        # Manual input and window interactions
├── options.html       # Extension configuration page
├── options.js         # Settings management with chrome.storage.local
├── styles.css         # Complete stylesheet for in-page overlays and components
├── icon.svg           # Vector source logo
├── icon16.png         # 16x16 icon
├── icon48.png         # 48x48 icon
└── icon128.png        # 128x128 icon
```

---

## Supported Models

The extension includes automated fallback handling across current Gemini generations:

| Model | Status | Characteristics |
|---|---|---|
| `gemini-3.5-flash-lite` | **Default** | Ultra-low latency, blazing fast speeds, highly resistant to traffic spikes |
| `gemini-3.8-flash` | Supported | Highest translation quality, handles deep reasoning and complex formats |
| `gemini-3.5-flash` | Supported | Well-balanced speed and output depth |

---

## Permissions

| Permission | Purpose |
|---|---|
| `contextMenus` | Adds the right-click "Dịch với Gemini" context option |
| `clipboardRead` | Reads text from the clipboard when you click Paste in the detached window |
| `storage` | Persists your API key, model selection, popup theme, and translator text size locally |
| `activeTab` | Injects translation results into the currently active tab |
| `scripting` | Executes UI components within web pages |
| Gemini API host access | Allows the background worker to call `generativelanguage.googleapis.com` |

> **Privacy Notice:** This extension operates entirely client-side. Selected text, or the page text when you choose page translation, and your API key are transmitted directly to the official Google Gemini API and are never routed through any third-party intermediate servers.

---

## License

MIT License © 2026
