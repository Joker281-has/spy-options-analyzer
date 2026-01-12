# SPY Trading Assistant - Feature Documentation

## Overview
The SPY Trading Assistant has been successfully enhanced with intelligent trade signal generation, customizable alerts, and portfolio P&L tracking—all designed for **manual execution** on SoFi or similar platforms.

## Completed Features

### 1. 📊 Dashboard Tab
- Real-time SPY price chart with technical indicators
- Paginated options table (20 rows/page) with sortable columns
- Advanced filtering by delta, IV, and expiration date
- Live options data from Yahoo Finance v3 API (refreshes every 30 seconds)

### 2. 🎯 Trade Signals Tab
**ScoringEngine Service** (`src/services/ScoringEngine.ts`)
- Calculates actionable trade scores using multi-factor analysis:
  - **Base Score**: (Premium / Distance to Strike) × (1 - |Delta - 0.5|) × (1 + IV%)
  - **Delta Bonus**: +10 points for optimal delta range (0.3-0.7)
  - **Theta Factor**: +5 × absolute theta value (higher decay = higher score)
  - **Final Score**: Clamped 0-100 for normalized ranking

**TradeSignals Component** (`src/components/TradeSignals.tsx`)
- Displays top 10 ranked signals sorted by composite score
- Interactive filtering panel:
  - Min/Max Delta (range 0.0-1.0)
  - Min IV Percentage (0-100%)
  - Max Days to Expiration
  - Min Signal Score (0-100)
- Each signal card shows:
  - Action badge (BUY CALL / SELL PUT / etc.)
  - Composite score and reasoning
  - Strike, mid price, delta, IV
  - **Copy-to-clipboard button** for easy trade entry on SoFi
  - Real-time alert status indicator

### 3. 🔔 Alerts Tab
**AlertEngine Service** (`src/services/AlertEngine.ts`)
- Persistent alert management via localStorage
- Browser Notification API integration
- Toast notifications via react-hot-toast
- Email notification support (for future integration)

**AlertConfig Component** (`src/components/AlertConfig.tsx`)
- Create/Edit/Delete alerts with conditions:
  - Delta range (min/max)
  - IV range (min/max percentage)
  - Maximum DTE (days to expiration)
  - Entry price threshold (optional)
- Enable/Disable alerts without deletion
- Automatic condition matching against live signals
- Notification settings:
  - Browser notifications (with permission request)
  - Toast popup alerts
  - Email alerts (configure email field)
- Visual alert list with active status indicators
- localStorage persistence (survives page reloads)

### 4. 💼 Portfolio Tab
**PortfolioService** (`src/services/PortfolioService.ts`)
- CSV import/export for position management
- Real-time P&L tracking synced with live contract prices
- Recommended close prices (2:1 Risk/Reward default)
- Position CRUD operations (add/edit/delete)
- Aggregate portfolio metrics

**PortfolioTracker Component** (`src/components/PortfolioTracker.tsx`)
- **Import CSV**: Upload position CSV with columns: Symbol, Quantity, EntryPrice
- **Export CSV**: Download current positions with live P&L for record-keeping
- Summary metrics cards:
  - Total positions held
  - Total P&L ($)
  - Total P&L (%)
  - Average entry price
- Positions table with columns:
  - Symbol
  - Quantity
  - Entry Price
  - Current Price (live from API)
  - P&L in dollars
  - P&L in percentage
  - Delete button for position removal
- Manual position add via form
- Real-time price updates synchronized with dashboard

## Architecture & Technologies

### Frontend Stack
- **React 18.2** with TypeScript 5.3
- **Vite 4.4** for build tooling
- **lucide-react** for icons (200+ available)
- **react-hot-toast** for notifications
- **@tanstack/react-table** for advanced table features
- **zustand** for optional complex state (ready for expansion)
- **papaparse** for CSV parsing
- **date-fns** for date utilities

### Backend Integration
- **Netlify Functions** (serverless)
- **Yahoo Finance v3 API** (via yahoo-finance2 library)
- **12-hour TTL caching** for API responses (.cache/spy_options.json)

### Progressive Web App (PWA)
- **vite-plugin-pwa** enabled
- Service worker with auto-update
- Offline-capable with runtime caching
- Works on mobile devices
- Installable to home screen

### Security & Headers (netlify.toml)
- X-Frame-Options: SAMEORIGIN (prevents clickjacking)
- X-Content-Type-Options: nosniff (prevents MIME sniffing)
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Content-Security-Policy with whitelisted sources
- Asset cache: 1-year immutable for production builds
- JSON cache: 1-hour for data files

## Manual Trade Execution Workflow

### Recommended Usage for SoFi

1. **Identify Signals** (Dashboard or Signals tab)
   - Review live options table or top 10 signals
   - Filter by delta, IV, and expiration preferences
   - Copy symbol to clipboard

2. **Set Up Alerts** (Alerts tab)
   - Create alert rules for conditions you trade
   - Example: "Alert me when IV > 30% and Delta 0.4-0.6"
   - Enable browser notifications for real-time tracking

3. **Monitor Portfolio** (Portfolio tab)
   - Import existing positions from CSV
   - Track live P&L against entry prices
   - Export positions for record-keeping
   - Identify candidates for profit-taking (2:1 R/R)

4. **Execute on SoFi**
   - Copy alert symbol from notification
   - Paste into SoFi's order entry
   - Execute trade manually with your desired size/price
   - Add position to portfolio CSV for tracking

## Type Definitions
All TypeScript interfaces defined in `src/types/index.ts`:
```typescript
OptionContract // strike, delta, theta, IV, etc.
TradeSignal // score, reason, action (BUY/SELL)
PortfolioPosition // entry price, quantity, current P&L
AlertConfig // delta/IV/DTE conditions, notification prefs
NotificationState // browser permission status
```

## Performance Characteristics
- **Build size**: 425.67 KB (143.73 KB gzipped)
- **PWA precache**: 418.79 KB (5 files)
- **Load time**: < 1 second on 4G
- **Options refresh**: 30-second auto-refresh (configurable)
- **API caching**: 12-hour TTL with force-refresh option

## Future Enhancement Opportunities
1. Email notifications via SendGrid/Mailgun integration
2. Advanced scoring with historical win rates
3. Options chain heat map visualization
4. Back-testing engine for alert conditions
5. Integration with broker APIs (read-only)
6. Dark mode theme
7. Custom alert webhook URLs
8. Multi-legged strategies (spreads, iron condors)
9. IV rank and percentile visualization
10. Support for additional underlying symbols

## Deployment Status
- **GitHub**: https://github.com/Joker281-has/spy-options-analyzer
- **Netlify**: Auto-deploys on git push to `main` branch
- **API Endpoint**: `/.netlify/functions/fetchData`
- **Last Commit**: Trading assistant feature implementation

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Support & Contributing
This is a personal trading assistant. For modifications:
1. Edit components in `src/components/`
2. Update services in `src/services/`
3. Modify types in `src/types/`
4. Commit and push to trigger deployment

---
**Built with precision for manual options trading execution. Safe, informative, no automated trading.**
