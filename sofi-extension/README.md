# SoFi Data Extractor - Chrome Extension Setup Guide

## Overview
The SoFi Data Extractor is a Chrome browser extension that automatically captures options contract data from SoFi.com and syncs it to your SPY Trading Assistant web app for analysis.

## What It Does
- **Auto-Extracts Data**: Floating button on SoFi pages captures: strike, delta, gamma, theta, vega, IV, volume, bid/ask
- **One-Click Capture**: Click "📊 Capture" button on any options contract page
- **CSV Export**: Download all captured contracts as CSV
- **Web Sync**: Automatically syncs to your web app's "Import Data" tab
- **Persistent Storage**: Stores captures in Chrome storage (7-day auto-cleanup)

## Installation

### Step 1: Prepare the Extension Folder
The extension files are located in `/spy-monorepo/sofi-extension/`:
```
sofi-extension/
├── manifest.json          (Extension configuration)
├── content.js             (Extracts data from SoFi pages)
├── background.js          (Background service worker)
├── popup.html             (Extension popup UI)
├── popup.js               (Popup functionality)
└── icons/                 (Extension icons)
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Step 2: Load Extension into Chrome

1. **Open Chrome Extensions Page**
   - Go to `chrome://extensions` in your browser
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" in the top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked"
   - Navigate to `/spy-monorepo/sofi-extension/`
   - Select the folder and click "Select Folder"

4. **Verify Installation**
   - You should see "SoFi Options Extractor" in your extensions list
   - A purple icon should appear in your toolbar
   - Click the icon to open the popup

## Usage

### Capturing Data from SoFi

1. **Log into SoFi**
   - Go to https://www.sofi.com
   - Navigate to Options trading section
   - Select any contract to view details

2. **Capture Contract Data**
   - Look for the purple "📊 Capture" button floating in the bottom-right corner
   - Click to extract: symbol, strike, type, bid, ask, Greeks, IV, volume, expiration
   - A green notification confirms capture
   - Repeat for multiple contracts

3. **View Captured Contracts**
   - Click the extension icon in your toolbar
   - Popup shows all captured contracts
   - Counter displays total captures
   - Last capture time shown

### Exporting Data

**Export to CSV** (from extension popup):
- Click the "📥 Export CSV" button
- Automatically downloads file: `sofi-options-YYYY-MM-DD.csv`
- Columns: Symbol, Type, Strike, Bid, Ask, Delta, Gamma, Theta, Vega, IV %, Volume, Open Interest, Expiration, Timestamp

**Clear All** (from extension popup):
- Click "🗑️ Clear All" to delete all captures
- Requires confirmation

### Syncing to Web App

**Automatic Sync**:
- Data syncs automatically when web app is open
- Extension checks every 10 seconds
- Green indicator shows when synced

**Manual Sync**:
1. Open the web app (your Netlify deployment)
2. Go to "📥 Import Data" tab
3. Click "Sync Extension" button
4. Contracts appear in the table automatically

## Advanced Features

### Accessing Captured Data Programmatically
The extension stores data in Chrome's local storage:
```javascript
chrome.storage.local.get(['contracts'], (result) => {
  const contracts = result.contracts || [];
  console.log(contracts);
});
```

### Message Passing
The extension communicates with the web app via:
```javascript
// Extension → Web App
window.postMessage({ 
  type: 'SYNC_CONTRACTS', 
  contracts: [...] 
}, '*');
```

### Auto-Cleanup
- Contracts older than 7 days automatically deleted
- Manual cleanup available via popup

## Troubleshooting

### Extension Not Appearing in Toolbar
- Ensure Developer mode is enabled
- Try reloading the extension (toggle off/on)
- Check `chrome://extensions` for errors

### Data Not Extracting from SoFi
- Ensure contract details page is fully loaded
- Some elements may not be parseable due to SoFi's dynamic rendering
- Try refreshing the page and clicking Capture again

### Sync Not Working
- Check browser console for errors: Right-click → Inspect → Console
- Ensure web app's "Import Data" tab is active
- Clear browser cache and reload

### Can't Upload CSV to Web App
- Ensure CSV has headers: Symbol, Type, Strike, etc.
- Check file is `.csv` format
- Verify all rows have minimum 3 columns

## Data Format

### CSV Import Template
```csv
Symbol,Type,Strike,Bid,Ask,Mid,Delta,Gamma,Theta,Vega,IV %,Volume,Open Interest,Expiration
SPY_450_C,call,450,2.50,2.60,2.55,0.65,0.08,-0.05,0.12,25.5,50000,100000,Jan 17
SPY_445_P,put,445,1.20,1.30,1.25,-0.35,0.09,-0.03,0.11,26.0,25000,50000,Jan 17
```

### Extracted Data Fields
| Field | Type | Description |
|-------|------|-------------|
| symbol | string | e.g., "SPY_450_C" |
| type | string | "call" or "put" |
| strike | number | Strike price |
| bid | number | Bid price |
| ask | number | Ask price |
| mid | number | Mid price (bid+ask)/2 |
| delta | number | Delta Greek |
| gamma | number | Gamma Greek |
| theta | number | Theta Greek |
| vega | number | Vega Greek |
| iv | number | Implied Volatility % |
| volume | number | Trading volume |
| openInterest | number | Open interest |
| expiration | string | Expiration date |
| capturedAt | string | ISO timestamp |

## How Data Extraction Works

1. **Content Script Injection**: When you visit SoFi, the content.js script runs on the page
2. **DOM Parsing**: Looks for contract data in page text and HTML elements
3. **Regex Extraction**: Uses patterns to find strikes, Greeks, prices, etc.
4. **Storage**: Saves to Chrome's local storage with timestamp
5. **UI Update**: Floating button appears, ready for capture

### Extraction Patterns
The script searches for:
- Contract identifier: `SPY 450 Call`, `QQQ 400 Put`, etc.
- Greeks: `Delta: 0.65`, `Theta: -0.05`, etc.
- Prices: `Bid: $2.50`, `Ask: $2.60`
- Volume/OI: `Volume: 50000`, `Open Interest: 100000`
- Expiration: `Jan 17`, `Feb 21`, etc.

## Security & Privacy

**Data Storage**:
- All data stored locally in your browser
- No data sent to external servers (except your own web app)
- Auto-cleanup after 7 days
- Manual delete anytime

**Permissions**:
- `activeTab`: Access current SoFi page
- `scripting`: Inject content script
- `storage`: Save captured data locally
- `webRequest`: Monitor network (optional)

**What This Extension DOES NOT Do**:
- ❌ Execute trades
- ❌ Access your SoFi password
- ❌ Access your account balance
- ❌ Submit orders
- ❌ Upload data to 3rd-party servers

## Updating the Extension

To update the extension code:

1. Edit files in `/sofi-extension/`
2. Go to `chrome://extensions`
3. Click refresh icon on "SoFi Options Extractor"
4. Changes take effect immediately

## Uninstalling

1. Go to `chrome://extensions`
2. Find "SoFi Options Extractor"
3. Click the trash icon
4. Confirm removal

All stored data is deleted upon uninstall.

## Support

For issues or improvements:
1. Check the troubleshooting section above
2. Review browser console (F12 → Console tab)
3. Check extension details for any error messages
4. Re-install extension if corrupted

## Future Enhancements

Possible improvements:
- Better SoFi DOM parsing for reliability
- Screenshot OCR as fallback
- Real-time price updates during capture
- Historical tracking of same contracts over time
- Integration with other brokers (ThinkorSwim, Interactive Brokers)
- Email notifications when specific criteria met

---

**Version**: 1.0  
**Last Updated**: January 2026  
**Compatibility**: Chrome 90+
