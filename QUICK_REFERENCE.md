# 🚀 Quick Reference - SPY Trading Assistant

## Installation (2 minutes)

```
1. chrome://extensions → Enable "Developer mode"
2. Click "Load unpacked" → Select /spy-monorepo/sofi-extension/
3. Refresh web app (Netlify URL)
4. Done! 🎉
```

## Daily Workflow (5 minutes)

```
SoFi Browser Window:
  1. Open contract details
  2. Click purple "📊 Capture" button
  3. Repeat for 5-10 contracts
  ↓
Web App "Import Data" Tab:
  4. Click "Sync Extension"
  5. Contracts appear in table
  ↓
Web App "Signals" Tab:
  6. Review top 10 by score
  7. Click "Copy" on winners
  ↓
Back to SoFi:
  8. Paste symbol into order entry
  9. Execute trade manually ✅
```

## 5 Tabs Explained

| Tab | What | When to Use |
|-----|------|-----------|
| **Dashboard** | Live SPY chart + options table | Browse all available contracts |
| **Signals** | Top 10 trades ranked by score | Find best opportunities |
| **Alerts** | Create alert rules | Get notified of specific setups |
| **Portfolio** | Import positions, track P&L | Monitor open trades |
| **Import Data** | Sync from extension or upload CSV | Get data into the system |

## Keyboard Shortcuts

```
F5               = Refresh data from Yahoo Finance API
Ctrl+Shift+Del   = Clear browser cache (if sync issues)
F12              = Open developer console (for debugging)
Ctrl+L           = Focus address bar (switch tabs)
```

## Scoring Scale

```
🟢 70-100  → STRONG    (Good risk/reward, high probability)
🟡 50-69   → CONSIDER  (Reasonable, acceptable risk)
🟠 30-49   → CAUTION   (Speculative, wait for better)
🔴 0-29    → AVOID     (Poor setup, skip it)
```

## Alert Conditions (Examples)

```
High IV Play:
  ✓ IV Min: 25%
  ✓ IV Max: 40%
  ✓ Delta: 0.4-0.6

Theta Play:
  ✓ Delta: 0.3-0.5
  ✓ Days to Exp: Max 14
  ✓ Volume: Min 1000

Volatility Crush:
  ✓ IV: Above 30%
  ✓ Time Decay: High theta
  ✓ Spread: <2%
```

## File Locations

| What | Where |
|------|-------|
| Extension code | `/sofi-extension/` |
| Web app code | `/src/components/` |
| Services (scoring, alerts) | `/src/services/` |
| TypeScript types | `/src/types/index.ts` |
| API backend | `/netlify/functions/fetchData.js` |
| Deployment config | `/netlify.toml` |

## Troubleshooting Quick Fixes

| Problem | Fix |
|---------|-----|
| Capture button not appearing | F5 refresh SoFi page |
| Sync not working | Check web app "Import Data" tab is open |
| CSV upload error | Ensure columns: Symbol, Type, Strike |
| Extension not loading | `chrome://extensions` → Refresh button |
| Build errors | `npm install` → `npm run build` |

## Git Commands

```bash
# See recent changes
git log --oneline -5

# Check current status
git status

# Push to deploy (auto-deploys to Netlify)
git push origin main

# View all commits
git log --graph --oneline --all
```

## Chrome Extension API

```javascript
// Get all captured contracts
chrome.storage.local.get(['contracts'], (result) => {
  console.log(result.contracts);
});

// Clear storage
chrome.storage.local.clear();

// Export to CSV
// (Click button in popup or web app)
```

## Environment Setup

```bash
# Install Node.js: https://nodejs.org (v18+)

# Clone project
git clone https://github.com/Joker281-has/spy-options-analyzer.git
cd spy-monorepo

# Install dependencies (one-time)
npm install

# Start dev server
npm run dev
# → http://localhost:5173

# Build production
npm run build
# → creates /dist/ folder

# Install extension
# → chrome://extensions → Load unpacked → /sofi-extension/
```

## Data Fields Extracted

```javascript
{
  symbol: "SPY_450_C",        // e.g., SPY_450_Call
  type: "call",               // "call" or "put"
  strike: 450,                // Strike price
  bid: 2.50,                  // Bid price
  ask: 2.60,                  // Ask price
  mid: 2.55,                  // Midpoint
  delta: 0.65,                // Delta Greek (0-1)
  gamma: 0.08,                // Gamma Greek
  theta: -0.05,               // Theta (daily decay)
  vega: 0.12,                 // Vega (IV sensitivity)
  iv: 25.5,                   // Implied Volatility %
  volume: 50000,              // Trading volume
  openInterest: 100000,       // Open interest
  expiration: "Jan 17, 2024", // Expiration date
  capturedAt: "2024-01-15T..."// ISO timestamp
}
```

## API Endpoints

```
GET /.netlify/functions/fetchData
  → Returns live SPY options from Yahoo Finance
  → Includes Greeks, IV, bid/ask, volume, OI

GET /sample.json
  → Fallback data if API fails
  → Used in production for reliability
```

## Scoring Weights (Customizable)

```typescript
// Edit in src/services/ScoringEngine.ts

baseScore = (premium / strike) × deltaFactor × ivFactor
deltaBonus = (delta between 0.3-0.7) ? +10 : 0
thetaBonus = (Math.abs(theta) * 5) // Higher = better
finalScore = clamp(baseScore + deltaBonus + thetaBonus, 0, 100)
```

## Performance Targets

```
Load time: < 2 seconds
API refresh: 30 seconds
Extension sync: 10 seconds  
Storage: < 500 KB
```

## Browser Support

```
✅ Chrome 90+
✅ Edge 90+
✅ Safari (PWA only, no extension)
❌ Firefox (extension TBD)
```

## Common Regex Patterns (in extension)

```javascript
// Contract identifier
/(SPY|QQQ|IWM)?\s*(\d+)\s*(Call|Put|C|P)/i

// Greeks
/Delta[:\s]+([\d.-]+)/i
/Theta[:\s]+([\d.-]+)/i

// Prices
/Bid[:\s]+(\$?[\d.]+)\s+Ask[:\s]+(\$?[\d.]+)/i

// Volume
/Volume[:\s]+([\d,]+)/i
```

## Feature Checklist

- [x] Live options data (Yahoo Finance v3 API)
- [x] Trade scoring engine (0-100 scale)
- [x] Alert system (browser notifications)
- [x] Portfolio P&L tracking
- [x] Chrome extension (data extraction)
- [x] CSV import/export
- [x] PWA (offline support)
- [x] Netlify deployment
- [x] TypeScript (full type safety)
- [x] Responsive design

## Documentation Files

```
SOFI_EXTENSION_GUIDE.md       → How to install & use extension
TRADING_ASSISTANT_FEATURES.md → Feature overview & architecture
IMPLEMENTATION_SUMMARY.md     → Complete technical summary
sofi-extension/README.md      → Extension-specific docs
```

## Safety Reminders

```
⚠️  This tool ANALYZES, does NOT TRADE
⚠️  Always verify data before trading
⚠️  Risk only what you can afford to lose
⚠️  Options trading has SIGNIFICANT risk
⚠️  NOT financial advice - consult advisor
⚠️  Keep records of all trades for taxes
```

---

**Save this file!** Bookmark it for quick reference during trading. 

**Version**: 1.0.0 | **Last Updated**: January 2026

For detailed guides, see documentation files linked above.
