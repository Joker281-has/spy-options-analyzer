/**
 * Popup Script
 * Handle UI interactions and data export
 */

// Load contracts on popup open
document.addEventListener('DOMContentLoaded', loadContracts);

// Event listeners
document.getElementById('exportBtn').addEventListener('click', exportToCSV);
document.getElementById('syncBtn').addEventListener('click', syncToWebApp);
document.getElementById('clearBtn').addEventListener('click', clearAllContracts);

// Load and display contracts
function loadContracts() {
  chrome.storage.local.get(['contracts'], (result) => {
    const contracts = result.contracts || [];
    const countEl = document.getElementById('contractCount');
    const listEl = document.getElementById('contractList');
    
    countEl.textContent = contracts.length;
    
    if (contracts.length === 0) {
      listEl.innerHTML = '<div class="empty-state">No contracts captured yet<br><br>Click "📊 Capture" on SoFi pages</div>';
      return;
    }
    
    // Show last captured time
    const lastContract = contracts[contracts.length - 1];
    const lastTime = new Date(lastContract.capturedAt);
    document.getElementById('lastCaptured').textContent = lastTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Build contract list HTML
    listEl.innerHTML = contracts.map((contract, index) => `
      <div class="contract-item">
        <div class="contract-info">
          <div class="contract-symbol">${contract.symbol}</div>
          <div class="contract-price">
            ${contract.bid ? `$${contract.bid.toFixed(2)}` : 'N/A'}
            ${contract.delta ? `· Δ ${contract.delta.toFixed(2)}` : ''}
            ${contract.iv ? `· IV ${contract.iv.toFixed(1)}%` : ''}
          </div>
        </div>
        <button class="contract-delete" onclick="deleteContract(${contracts.length - 1 - index})">Delete</button>
      </div>
    `).join('');
  });
}

// Delete single contract
function deleteContract(index) {
  chrome.storage.local.get(['contracts'], (result) => {
    const contracts = result.contracts || [];
    contracts.splice(index, 1);
    chrome.storage.local.set({ contracts }, loadContracts);
  });
}

// Clear all contracts
function clearAllContracts() {
  if (!confirm('Clear all captured contracts?')) return;
  chrome.storage.local.set({ contracts: [] }, () => {
    showStatus('All contracts cleared', 'success');
    loadContracts();
  });
}

// Export to CSV
function exportToCSV() {
  chrome.storage.local.get(['contracts'], (result) => {
    const contracts = result.contracts || [];
    
    if (contracts.length === 0) {
      showStatus('No contracts to export', 'error');
      return;
    }
    
    // Prepare CSV data
    const headers = ['Symbol', 'Type', 'Strike', 'Bid', 'Ask', 'Mid', 'Delta', 'Gamma', 'Theta', 'Vega', 'IV %', 'Volume', 'Open Interest', 'Expiration', 'Captured At'];
    const rows = contracts.map(c => [
      c.symbol,
      c.type,
      c.strike,
      c.bid || '',
      c.ask || '',
      c.mid || '',
      c.delta || '',
      c.gamma || '',
      c.theta || '',
      c.vega || '',
      c.iv || '',
      c.volume || '',
      c.openInterest || '',
      c.expiration || '',
      new Date(c.capturedAt).toLocaleString()
    ]);
    
    // Create CSV string
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma
        const escaped = (cell + '').replace(/"/g, '""');
        return escaped.includes(',') || escaped.includes('"') ? `"${escaped}"` : escaped;
      }).join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sofi-options-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus(`Exported ${contracts.length} contracts`, 'success');
  });
}

// Sync to web app
function syncToWebApp() {
  chrome.storage.local.get(['contracts'], (result) => {
    const contracts = result.contracts || [];
    
    if (contracts.length === 0) {
      showStatus('No contracts to sync', 'error');
      return;
    }
    
    // Send contracts to all open tabs
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'RECEIVE_CONTRACTS',
          contracts: contracts
        }).catch(() => {
          // Tab might not have content script, ignore
        });
      });
    });
    
    showStatus(`Synced ${contracts.length} contracts to web app`, 'success');
  });
}

// Show status message
function showStatus(message, type) {
  const statusEl = document.getElementById('status');
  statusEl.textContent = message;
  statusEl.className = `status show ${type}`;
  
  setTimeout(() => {
    statusEl.classList.remove('show');
  }, 3000);
}

// Refresh contract list every 2 seconds
setInterval(loadContracts, 2000);
