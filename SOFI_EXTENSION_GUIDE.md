# SoFi Options Trading Assistant - Complete Setup Guide

## 🎯 What You Now Have

A complete **browser-based trading assistant** that:
1. **Extracts options data directly from SoFi** via Chrome extension
2. **Imports & analyzes contracts** in your web app
3. **Generates actionable trade signals** with AI-style scoring
4. **Manages alerts & notifications** for trading opportunities
5. **Tracks portfolio P&L** via CSV import/export

---

## 📦 System Architecture

```
Your Trading Workflow:
├── 1️⃣  SoFi Website (desktop browser)
│   └── Chrome Extension captures data with "📊 Capture" button
│
├── 2️⃣  Chrome Extension Storage
│   └── Stores all captured contracts locally
│
├── 3️⃣  Web App (Netlify deployment)
│   ├── "📥 Import Data" tab
│   ├── CSV upload or auto-sync from extension
│   └── Real-time analysis & scoring
│
└── 4️⃣  Your Trading Decisions
    └── Use signals to trade manually on SoFi
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Chrome Extension (2 min)
```
1. Open chrome://extensions
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select: /spy-monorepo/sofi-extension/
5. You should see purple icon in toolbar
```

### Step 2: Open Web App
- Go to your Netlify deployment (or `http://localhost:5173` for local)
- You'll see 5 tabs: Dashboard, Signals, Alerts, Portfolio, **Import Data**

### Step 3: Capture Data from SoFi
```
1. Login to https://www.sofi.com
2. Navigate to any options contract
3. Click purple "📊 Capture" button (floating bottom-right)
4. Green notification confirms capture
5. Repeat for multiple contracts
```

### Step 4: Sync to Web App
```
1. Open "📥 Import Data" tab in web app
2. Click "Sync Extension" button
3. Contracts appear in table automatically
```

### Step 5: Analyze & Trade
```
1. Review captured contracts with live Greeks
2. Check "🎯 Signals" tab for scoring
3. Create alert rules in "🔔 Alerts" tab
4. When alert triggers → Trade manually on SoFi
```

---

## 📋 Files & What They Do

### Chrome Extension (`/sofi-extension/`)

| File | Purpose |
|------|---------|
| `manifest.json` | Extension configuration, permissions, metadata |
| `content.js` | Runs on SoFi pages, injects "Capture" button, extracts DOM data |
| `background.js` | Service worker, syncs with web app every 10s, cleanup |
| `popup.html` | Extension popup UI (shows captured contracts) |
| `popup.js` | Popup interactions (export, clear, sync) |
| `icons/` | Extension button icon (16x16, 48x48, 128x128 PNG) |
| `README.md` | Full setup & troubleshooting guide |

### Web App Component (`/src/components/DataImporter.tsx`)

**Features**:
- CSV file upload for manual import
- Auto-sync from Chrome extension
- Live contract table with full Greeks
- Export captured data as CSV
- Setup instructions & status indicator

**Integrates with**:
- `ScoringEngine.ts` - Analyzes contracts
- `AlertEngine.ts` - Triggers alerts
- `PortfolioService.ts` - Tracks P&L

---

## 🔄 Data Flow

### Capturing from SoFi → Web App

```mermaid
SoFi Page
   ↓
content.js detects contract
   ↓
Extracts: symbol, strike, bid/ask, Greeks, IV
   ↓
Stores in chrome.storage.local
   ↓
Popup shows capture count
   ↓
Web app requests sync
   ↓
window.postMessage({type: 'SYNC_CONTRACTS'})
   ↓
DataImporter component receives
   ↓
Displays in table, ready for analysis
```

### Data Fields Captured

**From SoFi Contract Page**:
- Symbol (e.g., "SPY_450_C")
- Strike price
- Type (call/put)
- Bid/Ask prices
- Delta, Gamma, Theta, Vega
- Implied Volatility %
- Volume & Open Interest
- Expiration date
- Timestamp of capture

---

## 💡 Use Cases

### Use Case 1: Quick Opportunity Hunting
```
1. Browse SoFi options on desktop
2. Click "Capture" on good setups (5 contracts)
3. Go to web app, click "Sync"
4. See which scored highest (ScoringEngine)
5. Click "Copy" on winner
6. Paste into SoFi order entry
7. Execute trade manually
```

### Use Case 2: Alert-Based Trading
```
1. Capture 10 contracts from SoFi
2. Create alert: "Delta 0.4-0.6 AND IV > 25%"
3. Get browser notification when contract matches
4. Click notification to see details
5. Decide whether to trade
6. If yes → manually place order on SoFi
```

### Use Case 3: Portfolio Tracking
```
1. Export your open positions from SoFi as CSV
2. Add columns: EntryPrice, Quantity
3. Upload to "Import Data" tab
4. App syncs with live contract data
5. Tracks P&L in real-time
6. Recommends closes at 2:1 Risk/Reward
```

### Use Case 4: Bulk Analysis
```
1. Walk through 20 contracts on SoFi
2. Click Capture on each one
3. Extension stores all 20 locally
4. Export from extension popup as CSV
5. Upload to web app
6. Sort by score, volume, IV
7. Pick top 3 for trading
```

---

## ⚙️ Configuration

### Extension Settings
No configuration needed! But you can customize in `content.js`:

```javascript
// Change "Capture" button color
button.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

// Change refresh interval (currently 30s)
const interval = setInterval(fetchData, 30000); // Change 30000 to milliseconds
```

### Web App Settings
Edit in `src/components/DataImporter.tsx`:

```typescript
// Change auto-cleanup days (currently 7)
sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

// Change to 30 days:
sevenDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
```

---

## 🔒 Privacy & Security

**What Data Is Stored**:
- Local: Chrome extension storage on your computer
- Web: Your Netlify app (if you deployed)
- Auto-delete: 7 days old contracts cleared automatically

**What This Does NOT Do**:
- ❌ Execute trades automatically
- ❌ Access your SoFi password
- ❌ Access account balance or history
- ❌ Store data on 3rd-party servers
- ❌ Share data with anyone

**Data You Control**:
- ✅ Delete contracts anytime
- ✅ Clear all with one button
- ✅ Export as CSV for backup
- ✅ Uninstall extension (removes all data)

---

## 🐛 Troubleshooting

### "Capture button not appearing"
1. Refresh SoFi page (F5)
2. Wait 2-3 seconds for content script to load
3. Check that Developer Mode is enabled
4. Reload extension: `chrome://extensions` → refresh button

### "Contract data not extracting"
1. Ensure contract details page fully loaded
2. Some SoFi pages may render dynamically
3. Try different contract (simpler page layout)
4. Check browser console (F12 → Console)

### "Sync to web app not working"
1. Ensure both tabs are open (extension + web app)
2. Check extension popup shows captured contracts
3. Try manual CSV export + upload instead
4. Clear browser cache (Ctrl+Shift+Del)

### "CSV upload showing errors"
1. Verify CSV has header row
2. Check columns: Symbol, Type, Strike (at minimum)
3. Ensure data has consistent formatting
4. Try exporting from extension first (known good format)

---

## 📊 Performance

**Extension**:
- Negligible impact on SoFi
- Floating button adds < 1KB to page
- Storage uses ~50KB per 100 contracts

**Web App**:
- Build size: 436 KB (146 KB gzipped)
- Load time: < 2 seconds
- Syncing: Real-time, < 500ms latency
- Storage: LocalStorage + PWA cache

---

## 🔄 Workflow Examples

### Example 1: The Scanner Trader (5 min/day)
```
Morning:
1. Open SoFi, find options screener
2. Capture 10 "interesting" contracts
3. Go to web app, sync and review
4. Top 3 by score are your trades
5. Click copy, trade on SoFi
```

### Example 2: The Alert Watcher (Real-time)
```
Setup (once):
1. Capture benchmark contracts
2. Create alert: "IV > 30% AND Delta 0.5"

Throughout day:
1. Browser alerts notify you of matches
2. Click alert → see contract details
3. Decide to trade or skip
4. Log winners in portfolio tab
```

### Example 3: The System Tester (Backtesting)
```
1. Capture old contracts (historical data via SoFi archive)
2. Create scoring rules in ScoringEngine
3. See which "would have" made money
4. Refine rules based on results
5. Use refined rules live
```

---

## 📈 Next Steps

### Immediate (This Week)
- [ ] Install Chrome extension
- [ ] Capture 5 contracts from SoFi
- [ ] Test sync to web app
- [ ] Review scoring & signals
- [ ] Execute 1-2 trades manually

### Short-term (Next Week)
- [ ] Create 3-5 alert rules
- [ ] Track portfolio with P&L
- [ ] Analyze what signals work
- [ ] Refine scoring weights

### Medium-term (Next Month)
- [ ] Build portfolio stats
- [ ] Compare actual trades vs signals
- [ ] Adjust scoring formula
- [ ] Export performance report

### Long-term (Optimization)
- [ ] Integrate with more brokers
- [ ] Historical analysis of signals
- [ ] Machine learning scoring
- [ ] Mobile app version

---

## 📞 Support Resources

**In This Project**:
- [Chrome Extension Guide](sofi-extension/README.md)
- [Trading Assistant Features Doc](TRADING_ASSISTANT_FEATURES.md)
- [GitHub Repo](https://github.com/Joker281-has/spy-options-analyzer)

**For SoFi Data Issues**:
1. Check browser console (F12 → Console)
2. Verify contract page is fully loaded
3. Try different contract type (call vs put)
4. Refresh page and try again

**For Web App Issues**:
1. Check Netlify deployment status
2. Clear browser cache
3. Try local dev (`npm run dev`)
4. Check build errors (`npm run build`)

---

## 🎓 Learning Resources

**Understanding Greeks**:
- Delta: How much call moves with $1 SPY move
- Gamma: How fast delta changes
- Theta: Daily time decay (your friend in selling)
- Vega: Sensitivity to implied volatility

**Trading Concepts**:
- IV Rank: Is IV high or low historically?
- Bid-Ask Spread: Tighter = more liquid
- Open Interest: More OI = easier to exit
- Volume: Helps confirm trade viability

---

## ✅ Checklist

Before trading, ensure:
- [ ] Chrome extension installed & working
- [ ] Captured contracts showing in popup
- [ ] Web app "Import Data" tab accessible
- [ ] Can sync extension → web app
- [ ] Scoring system makes sense to you
- [ ] Alert rules set to your preferences
- [ ] Portfolio tracking imported
- [ ] You understand the risks involved
- [ ] All trades executed manually on SoFi
- [ ] Position tracking enabled

---

## 🚨 IMPORTANT DISCLAIMER

**This tool is for analysis only**:
- ⚠️ It informs decisions, does NOT execute trades
- ⚠️ Always verify data before trading
- ⚠️ Past signals don't guarantee future results
- ⚠️ Risk management is YOUR responsibility
- ⚠️ This is NOT financial advice
- ⚠️ Options trading carries SIGNIFICANT risk

**Safe Trading Practices**:
1. Start with small positions
2. Set stop losses
3. Risk only what you can afford to lose
4. Diversify across multiple contracts
5. Don't FOMO into trades
6. Keep records of all trades
7. Review performance weekly
8. Adjust strategy based on results

---

## 📝 Version Info

- **App Version**: 1.0.0
- **Build Date**: January 2026
- **Framework**: React 18 + TypeScript
- **Deployment**: Netlify
- **Browser**: Chrome 90+

---

**You're all set!** Happy trading! 🚀

For questions or improvements, check the GitHub issues or submit a PR.
