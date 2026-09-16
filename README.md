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
| **Highlight & Translate** | Select text on any webpage → click the floating action button → view instant translation |
| **Bidirectional (Auto-detect)** | Automatically detects if the input is English or Vietnamese and translates to the opposite language |
| **Toolbar Popup** | Click the extension icon in the toolbar to paste/type text directly (ideal for Google Docs, Notion, or canvas-based apps) |
| **Right-Click Menu** | Translate selections via the browser context menu (*Right click → "Dịch với Gemini"*) |
| **Markdown Rendering** | Native, zero-dependency Markdown parser that renders headings, lists, code blocks, bold/italics, and blockquotes |
| **Draggable Modal** | Click and drag the modal header to reposition it anywhere on the screen |
| **Pin Mode** | Pin the translation popup to keep reading while interacting with the webpage underneath |
| **Expandable Width** | Toggle between default (480px) and wide view (680px) for reading lengthy technical articles and PR descriptions |
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

1. Click the extension icon in your Chrome toolbar → click the **Settings (⚙)** button in the top right (or open extension options directly).
2. Paste your API Key into the **Gemini API Key** field.
3. Select your preferred model (default: `gemini-3.8-flash`).
4. Click **Save Settings**.

---

## How to Use

### Method 1: Inline Selection
1. Highlight any English text on a webpage.
2. Click the floating translation icon that appears near your cursor.
3. The translation modal will open in the bottom-right corner.

### Method 2: Toolbar Popup (Recommended for Google Docs / Web Apps)
1. Click the Gemini Translator icon in the Chrome toolbar.
2. Paste or type text into the input box.
3. Press **`Cmd + Enter`** (Mac) or **`Ctrl + Enter`** (Windows/Linux), or click **Translate**.

### Method 3: Context Menu
1. Highlight text anywhere on the page.
2. Right-click and choose **Dịch với Gemini**.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Cmd + Enter` / `Ctrl + Enter` | Translate input in toolbar popup |
| `Esc` | Close translation modal |

---

## Project Structure

```
gemini-translator-extension/
├── manifest.json      # Extension configuration (Manifest V3)
├── background.js      # Background service worker (API dispatch & fallback logic)
├── content.js         # Content script (in-page popup, modal, drag & drop, TTS, Markdown parser)
├── popup.html         # Toolbar quick-translation popup interface
├── popup.js           # Logic and interactions for toolbar popup
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
| `storage` | Securely persists your API key and model selection locally |
| `activeTab` | Injects translation results into the currently active tab |
| `scripting` | Executes UI components within web pages |

> **Privacy Notice:** This extension operates entirely client-side. Your text and API key are transmitted directly to the official Google Gemini API and are never routed through any third-party intermediate servers.

---

## License

MIT License © 2026
