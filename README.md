# Gemini Translator — Chrome Extension

> Dịch thuật Anh → Việt tức thì ngay trên trình duyệt, powered by Google Gemini API.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=flat)
![No Dependencies](https://img.shields.io/badge/Dependencies-Zero-brightgreen?style=flat)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat)

---

## Tính năng

| Tính năng | Mô tả |
|---|---|
| **Bôi đen → dịch ngay** | Bôi đen bất kỳ đoạn văn bản nào → bấm icon mũi tên nhỏ xuất hiện → xem bản dịch ngay lập tức |
| **Menu chuột phải** | Hỗ trợ dịch qua Context Menu (chuột phải → "Dịch với Gemini") |
| **Render Markdown** | Tự động nhận diện và render cấu trúc Markdown trong bản dịch (heading, list, code block, blockquote…) |
| **Kéo thả popup** | Nhấn giữ tiêu đề popup để kéo đến bất kỳ vị trí nào trên màn hình |
| **Ghim popup** | Ghim popup luôn hiển thị khi thao tác trên trang web bên dưới |
| **Mở rộng chiều rộng** | Toggle mở rộng popup từ 480px lên 680px để đọc nội dung dài thoải mái |
| **Sao chép một chạm** | Nút sao chép kèm feedback animation trực tiếp |
| **Phát âm (TTS)** | Nghe đọc bản dịch tiếng Việt qua Web Speech API |
| **Đếm từ** | Hiển thị ước lượng số từ của bản dịch |
| **Fallback model** | Tự động thử model dự phòng khi model chính bị quá tải (HTTP 503/429) |
| **Zero dependency** | Không dùng bất kỳ thư viện nào — Markdown renderer được viết thuần JS |

---

## Giao diện

- **Modern Minimal** — nền trắng, viền 1px, shadow nhẹ
- **Anchor color:** `#1a73e8` (Google Blue)
- **Popup:** Góc dưới phải màn hình, có thể kéo thả và ghim
- **Scrollbar** mỏng (6px), tự ẩn khi không dùng
- **Responsive:** Tự giới hạn `max-height: 100vh - 60px`, hỗ trợ scroll nội dung dài

---

## Cài đặt thủ công (Developer Mode)

> Extension chưa được publish lên Chrome Web Store. Cài theo hướng dẫn dưới đây.

### Bước 1 — Clone repo

```bash
git clone https://github.com/YOUR_USERNAME/gemini-translator-extension.git
```

### Bước 2 — Load vào Chrome

1. Mở Chrome, truy cập `chrome://extensions/`
2. Bật **Developer mode** (góc trên phải)
3. Bấm **Load unpacked**
4. Chọn thư mục vừa clone

### Bước 3 — Lấy Gemini API Key

1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Tạo API Key mới (miễn phí)

### Bước 4 — Cấu hình extension

1. Bấm icon extension trên Chrome toolbar → **Options**
2. Nhập API Key vào ô **Gemini API Key**
3. Chọn model (mặc định: `gemini-3.8-flash`)
4. Bấm **Lưu cài đặt**

---

## Sử dụng

### Cách 1: Bôi đen + click icon

1. Bôi đen bất kỳ đoạn chữ tiếng Anh nào trên trang
2. Bấm vào icon mũi tên xanh xuất hiện gần con trỏ
3. Bản dịch hiện ra trong popup

### Cách 2: Menu chuột phải

1. Bôi đen đoạn chữ
2. Chuột phải → **Dịch với Gemini**

### Phím tắt

| Phím | Hành động |
|---|---|
| `Esc` | Đóng popup |

---

## Cấu trúc file

```
gemini-translator-extension/
├── manifest.json      # Cấu hình extension (MV3)
├── background.js      # Service worker — gọi Gemini API, xử lý fallback
├── content.js         # UI logic — popup, modal, drag, TTS, Markdown renderer
├── styles.css         # Toàn bộ CSS của extension
├── options.html       # Trang cài đặt
├── options.js         # Logic lưu/đọc settings từ chrome.storage
├── icon16.png         # Icon 16×16
├── icon48.png         # Icon 48×48
└── icon128.png        # Icon 128×128
```

---

## Models được hỗ trợ (2026)

Extension tự động thử fallback theo thứ tự nếu model chính bị quá tải:

| Model | Ghi chú |
|---|---|
| `gemini-3.8-flash` | **Mặc định** — nhanh, ổn định |
| `gemini-3.5-flash` | Cân bằng tốc độ/chất lượng |
| `gemini-3.5-flash-lite` | Nhẹ nhất, ít bị quá tải nhất |

---

## Công nghệ

- **Chrome Extension Manifest V3**
- **Gemini API** (`v1beta/models/{model}:generateContent`)
- **Web Speech API** (Text-to-Speech)
- **Vanilla JS** — không framework, không build step
- **Markdown renderer** tự viết thuần JS

---

## Quyền truy cập (Permissions)

| Permission | Lý do |
|---|---|
| `contextMenus` | Thêm mục "Dịch với Gemini" vào menu chuột phải |
| `storage` | Lưu API Key và tên model |
| `activeTab` | Inject UI vào tab hiện tại |
| `scripting` | Chạy content script |

> Extension **không thu thập dữ liệu**, không gửi dữ liệu về bất kỳ server nào ngoài Google Gemini API.

---

## License

MIT © 2026
