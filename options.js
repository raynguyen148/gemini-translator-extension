document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['apiKey', 'modelName'], (result) => {
    if (result.apiKey)    document.getElementById('apiKey').value = result.apiKey;
    if (result.modelName) document.getElementById('modelName').value = result.modelName;
  });
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const apiKey    = document.getElementById('apiKey').value.trim();
  const modelName = document.getElementById('modelName').value.trim() || 'gemini-3.8-flash';

  chrome.storage.local.set({ apiKey, modelName }, () => {
    const status = document.getElementById('status');
    status.classList.add('visible');
    setTimeout(() => status.classList.remove('visible'), 2500);
  });
});
