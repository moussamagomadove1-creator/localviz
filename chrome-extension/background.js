let dashboardTabId = null;
let mapsTabId = null;
let mapsWindowId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_SCAN') {
    dashboardTabId = sender.tab.id;
    const { category, city, limit } = message.payload;
    
    // Create the search URL
    const query = encodeURIComponent(`${category} à ${city}, France`);
    const mapsUrl = `https://www.google.fr/maps/search/${query}#localviz-limit=${limit}`;

    // Create a minimized window so it works "en transparence"
    chrome.windows.create({
      url: mapsUrl,
      state: 'minimized',
      focused: false,
      type: 'popup'
    }, (window) => {
      mapsWindowId = window.id;
      mapsTabId = window.tabs[0].id;
    });
  }

  // Forward progress and completion from Maps to Dashboard
  if (message.type === 'SCAN_PROGRESS' || message.type === 'SCAN_COMPLETE' || message.type === 'SCAN_ERROR') {
    if (dashboardTabId) {
      chrome.tabs.sendMessage(dashboardTabId, message);
    }
    
    // If complete, close the maps window
    if (message.type === 'SCAN_COMPLETE' || message.type === 'SCAN_ERROR') {
      if (mapsWindowId) {
        chrome.windows.remove(mapsWindowId).catch(() => {});
        mapsWindowId = null;
        mapsTabId = null;
      }
    }
  }
});
