/**
 * Content Script - Runs on SoFi pages
 * Detects options contracts and extracts data
 */

// Floating capture button
function injectCaptureButton() {
  if (document.getElementById('sofi-extractor-button')) return;

  const button = document.createElement('button');
  button.id = 'sofi-extractor-button';
  button.innerHTML = '📊 Capture';
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 999999;
    padding: 10px 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    font-size: 14px;
    transition: all 0.3s ease;
  `;

  button.onmouseover = () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  };

  button.onmouseout = () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
  };

  button.onclick = captureCurrentContract;
  document.body.appendChild(button);
}

// Extract contract data from SoFi page
function captureCurrentContract() {
  const contract = extractContractData();
  
  if (!contract) {
    showNotification('No contract data found on this page', 'error');
    return;
  }

  // Save to Chrome storage
  chrome.storage.local.get(['contracts'], (result) => {
    const contracts = result.contracts || [];
    contracts.push({
      ...contract,
      capturedAt: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    });
    
    chrome.storage.local.set({ contracts }, () => {
      showNotification(`Captured: ${contract.symbol}`, 'success');
      
      // Notify background script to sync with web app
      chrome.runtime.sendMessage({
        type: 'DATA_CAPTURED',
        contract: contract,
        totalCount: contracts.length
      });
    });
  });
}

// Extract contract data from DOM
function extractContractData() {
  try {
    // Try multiple selector strategies for SoFi's dynamic UI
    
    // Strategy 1: Look for price display elements
    const priceElements = document.querySelectorAll('[data-testid*="price"], .price, [class*="Price"]');
    
    // Strategy 2: Look for option chain tables
    const tables = document.querySelectorAll('table');
    
    // Strategy 3: Look for contract info in page text
    const pageText = document.body.innerText;
    
    // Extract SPY call/put
    const contractMatch = pageText.match(/(SPY|QQQ|IWM)?\s*(\d+)\s*(Call|Put|C|P)/i);
    if (!contractMatch) return null;

    const symbol = contractMatch[1]?.toUpperCase() || 'SPY';
    const strike = parseFloat(contractMatch[2]);
    const type = contractMatch[3]?.toLowerCase().includes('put') ? 'put' : 'call';

    // Extract price data
    const bidAskText = pageText.match(/Bid[:\s]+(\$?[\d.]+)\s+Ask[:\s]+(\$?[\d.]+)/i);
    const bid = bidAskText ? parseFloat(bidAskText[1]) : null;
    const ask = bidAskText ? parseFloat(bidAskText[2]) : null;
    const mid = bid && ask ? ((bid + ask) / 2).toFixed(2) : null;

    // Extract Greeks
    const deltaMatch = pageText.match(/Delta[:\s]+([\d.-]+)/i);
    const gammaMatch = pageText.match(/Gamma[:\s]+([\d.-]+)/i);
    const thetaMatch = pageText.match(/Theta[:\s]+([\d.-]+)/i);
    const vegaMatch = pageText.match(/Vega[:\s]+([\d.-]+)/i);
    const ivMatch = pageText.match(/IV[:\s]+([\d.]+)%?/i);

    // Extract volume/OI
    const volMatch = pageText.match(/Volume[:\s]+([\d,]+)/i);
    const oiMatch = pageText.match(/Open Interest[:\s]+([\d,]+)/i);

    // Extract expiration
    const expMatch = pageText.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d+)/i);

    return {
      symbol: `${symbol}_${strike}_${type[0].toUpperCase()}`,
      type,
      strike,
      bid: bid ? parseFloat(bid.toFixed(4)) : null,
      ask: ask ? parseFloat(ask.toFixed(4)) : null,
      mid: mid ? parseFloat(mid) : null,
      delta: deltaMatch ? parseFloat(deltaMatch[1]) : null,
      gamma: gammaMatch ? parseFloat(gammaMatch[1]) : null,
      theta: thetaMatch ? parseFloat(thetaMatch[1]) : null,
      vega: vegaMatch ? parseFloat(vegaMatch[1]) : null,
      iv: ivMatch ? parseFloat(ivMatch[1]) : null,
      volume: volMatch ? parseInt(volMatch[1].replace(/,/g, '')) : null,
      openInterest: oiMatch ? parseInt(oiMatch[1].replace(/,/g, '')) : null,
      expiration: expMatch ? `${expMatch[1]} ${expMatch[2]}` : null,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error extracting contract data:', error);
    return null;
  }
}

// Show notification on page
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    font-weight: 500;
    z-index: 9999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 2000);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CURRENT_CONTRACT') {
    const contract = extractContractData();
    sendResponse({ contract });
  } else if (request.type === 'GET_ALL_CONTRACTS') {
    chrome.storage.local.get(['contracts'], (result) => {
      sendResponse({ contracts: result.contracts || [] });
    });
    return true; // Keep channel open for async response
  }
});

// Inject button when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectCaptureButton);
} else {
  injectCaptureButton();
}

// Re-inject button if page content changes dynamically
const observer = new MutationObserver(() => {
  if (!document.getElementById('sofi-extractor-button')) {
    injectCaptureButton();
  }
});

observer.observe(document.body, { childList: true, subtree: true });
