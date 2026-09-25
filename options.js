document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['apiKey', 'modelName', 'selectionTranslationEnabled'], (result) => {
    if (result.apiKey)    document.getElementById('apiKey').value = result.apiKey;
    if (result.modelName) document.getElementById('modelName').value = result.modelName;
    document.getElementById('selectionTranslationEnabled').checked = result.selectionTranslationEnabled !== false;
  });
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey    = document.getElementById('apiKey').value.trim();
  const modelName = document.getElementById('modelName').value.trim() || 'gemini-3.5-flash-lite';
  const selectionTranslationEnabled = document.getElementById('selectionTranslationEnabled').checked;

  chrome.storage.local.set({ apiKey, modelName, selectionTranslationEnabled }, () => {
    const status = document.getElementById('status');
    status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 2500);
  });
});
