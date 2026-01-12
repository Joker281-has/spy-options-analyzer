/**
 * Background Service Worker
 * Handles message passing and auto-sync
 */

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'DATA_CAPTURED') {
    // Log capture event
    console.log('Contract captured:', request.contract);
    
    // Could integrate with web app here via webhook
    // For now, data is stored in chrome.storage.local
  }
});

// Periodic sync with web app (every 10 seconds)
setInterval(async () => {
  const result = await chrome.storage.local.get(['contracts']);
  const contracts = result.contracts || [];
  
  if (contracts.length > 0) {
    // Try to notify connected web app
    // This requires the web app to be registered as a connection listener
    notifyWebApp(contracts);
  }
}, 10000);

// Function to notify web app via postMessage
function notifyWebApp(contracts) {
  // The web app will be listening for messages
  // This is handled via a background page or tab communication
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SYNC_CONTRACTS',
        contracts: contracts
      }).catch(() => {
        // Tab might not have content script, ignore error
      });
    });
  });
}

// Clear old data after 7 days
chrome.storage.local.get(['contracts'], (result) => {
  const contracts = result.contracts || [];
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  const filtered = contracts.filter(c => {
    const capturedTime = new Date(c.capturedAt).getTime();
    return capturedTime > sevenDaysAgo;
  });
  
  if (filtered.length !== contracts.length) {
    chrome.storage.local.set({ contracts: filtered });
  }
});
