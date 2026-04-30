// Signal to the frontend that the extension is installed
const extensionFlag = document.createElement('div');
extensionFlag.id = 'localviz-extension-installed';
extensionFlag.style.display = 'none';
document.body.appendChild(extensionFlag);

// Listen to messages from the web page
window.addEventListener('message', (event) => {
  // We only accept messages from ourselves
  if (event.source !== window) return;

  if (event.data.type && (event.data.type === 'LOCALVIZ_START_SCAN')) {
    console.log("Extension received scan request:", event.data.payload);
    chrome.runtime.sendMessage({
      type: 'START_SCAN',
      payload: event.data.payload
    });
  }
});

// Listen to messages from the background script (e.g. progress, results)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCAN_PROGRESS' || message.type === 'SCAN_COMPLETE' || message.type === 'SCAN_ERROR') {
    window.postMessage({
      type: `LOCALVIZ_${message.type}`,
      payload: message.payload
    }, '*');
  }
});
