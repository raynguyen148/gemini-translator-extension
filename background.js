// Khởi tạo Context Menu (chuột phải) khi cài đặt extension
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "translate_with_gemini",
        title: "Dịch với Gemini",
        contexts: ["selection"]
    });
});

// Lắng nghe sự kiện click từ Context Menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "translate_with_gemini" && info.selectionText) {
        // Gửi lệnh dịch thẳng tới tab hiện tại để hiển thị UI
        chrome.tabs.sendMessage(tab.id, {
            action: "TRIGGER_TRANSLATE",
            text: info.selectionText
        }).catch(() => {
            console.error("Content script chưa sẵn sàng trên tab này.");
        });
    }
});

// Xử lý message nhận được từ Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "TRANSLATE") {
        // Gọi hàm async và trả kết quả qua sendResponse
        handleTranslation(request.text).then(sendResponse);
        return true; // Phải return true để giữ kết nối mở cho xử lý bất đồng bộ (async)
    }
});

/**
 * Xử lý gọi API tới Gemini.
 * Chạy ở background để không bị dính lỗi CORS từ trang web.
 */
async function handleTranslation(text) {
    try {
        const data = await chrome.storage.local.get(["apiKey", "modelName"]);
        const apiKey = data.apiKey;
        const primaryModel = data.modelName || "gemini-3.8-flash";
        
        if (!apiKey) {
            return { error: "Vui lòng cấu hình Gemini API Key trong phần Cài đặt (Options) của Extension." };
        }

        // Danh sách các model để thử (nếu primaryModel bị quá tải)
        // Cập nhật 2026: Dùng các model thế hệ 3.x mới nhất (các bản 1.5/2.0 đã ngừng hoạt động)
        const fallbackModels = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.5-flash"];
        let modelsToTry = [primaryModel];
        
        // Chỉ thêm fallback nếu primary model không nằm trong danh sách fallback
        fallbackModels.forEach(m => {
            if (m !== primaryModel) modelsToTry.push(m);
        });

        let lastError = null;

        for (const model of modelsToTry) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Bạn là một chuyên gia dịch thuật. Dịch đoạn văn bản tiếng Anh sau sang tiếng Việt một cách tự nhiên và chính xác. Trả về DUY NHẤT nội dung đã dịch, không giải thích thêm. Nếu văn bản gốc có định dạng Markdown (tiêu đề #, danh sách -, code, in đậm **), hãy GIỮ NGUYÊN cấu trúc Markdown đó trong bản dịch.

Đoạn văn bản: ${text}`
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.3 // Độ sáng tạo thấp để bám sát nghĩa gốc
                        }
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    const errorMessage = errData.error?.message || `Lỗi API HTTP ${response.status}`;
                    
                    // Nếu lỗi 503 (Overloaded) hoặc 429 (Rate limit), thử model tiếp theo
                    if (response.status === 503 || response.status === 429) {
                        lastError = errorMessage;
                        console.warn(`[Gemini Translator] Model ${model} quá tải, đang thử model dự phòng...`);
                        continue; 
                    }
                    
                    throw new Error(errorMessage);
                }

                const resultData = await response.json();
                const translatedText = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (!translatedText) {
                    throw new Error("Không nhận được kết quả hợp lệ từ Gemini.");
                }
                
                return { result: translatedText.trim() };
            } catch (err) {
                // Nếu là lỗi mạng, quăng luôn
                if (err.name === 'TypeError') throw new Error("Lỗi kết nối mạng đến Google API.");
                throw err;
            }
        }

        // Nếu thử tất cả đều lỗi
        throw new Error(lastError || "Hệ thống Gemini hiện đang quá tải. Vui lòng thử lại sau.");

    } catch (error) {
        return { error: error.message };
    }
}
