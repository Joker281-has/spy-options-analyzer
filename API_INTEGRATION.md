# Live Yahoo Finance v3 API Integration

## Status: ✅ COMPLETE

The SPY Options Analyzer now pulls **real, live data** from Yahoo Finance v3 API using the `yahoo-finance2` library.

## What's Live

### Backend (`netlify/functions/fetchData.js`)
- ✅ **Live Options Chain**: Fetches all SPY options from all available expiration dates
- ✅ **Live Price History**: Fetches 60-day SPY price history for technical analysis  
- ✅ **Current Quote**: Gets real-time SPY bid/ask/price data
- ✅ **Computed Greeks**: Black-Scholes greeks (delta, gamma, theta, vega) calculated per option
- ✅ **Technical Indicators**: SMA20, RSI14, Historical Volatility computed from live price data
- ✅ **Intelligent Caching**: 12-hour TTL to minimize API calls (configurable)
- ✅ **Retry Logic**: Exponential backoff (3 attempts) for reliability

### Frontend (`src/App.tsx` + components)
- ✅ **Pagination**: 20 rows/page, browse all options
- ✅ **Sorting**: 6 sortable columns (score, delta, strike, mid, IV, DTE)
- ✅ **Filtering**: Delta range, IV percentile, expiration date, symbol search
- ✅ **Trade Ranking**: Automatic scoring based on R/R × POP × IV factor
- ✅ **Price Chart**: 60-day SPY price with SMA20 overlay
- ✅ **Error Boundary**: Graceful fallback to sample data if API fails

## API Response Format

```javascript
{
  source: "live",           // "live", "cache", or "fallback"
  optionsCount: 150,        // Total options fetched
  series: [                 // 60-day price history
    { date, close, open, high, low, volume }
  ],
  indicators: {
    sma20: [...],           // 20-period moving average
    rsi14: [...],           // 14-period RSI
    histVol: 0.18           // 30-day historical volatility
  },
  expirations: [            // Unique expiration dates
    "2026-01-12T00:00:00.000Z",
    ...
  ],
  optionsSample: [          // First 20 options with greeks
    {
      contractSymbol: "SPY260112C00550000",
      strike: 550,
      type: "call",
      dte: 0,
      bid: 142.6,
      ask: 145.4,
      mid: 144,
      impliedVol: 2.54,
      volume: 0,
      openInterest: 5,
      greeks: {
        delta: 0.9999,
        gamma: 0.00009,
        theta: -0.484,
        vega: 0.0011
      }
    }
  ]
}
```

## Tech Stack

- **Data Source**: Yahoo Finance v3 (via `yahoo-finance2` npm package)
- **Backend**: Node.js + Netlify Functions
- **Frontend**: React 18 + TypeScript + Vite
- **Charts**: Chart.js with SMA technical overlay
- **Caching**: File-based JSON with TTL (12 hours default)

## Deployment Ready

### Build & Deploy to Netlify

```bash
cd /spy-monorepo
npm run build              # Creates dist/ folder
# Push to GitHub → Connect to Netlify → Auto-deploy
```

Netlify will:
1. Run `npm run build` to generate frontend bundle in `dist/`
2. Deploy functions from `/netlify/functions/` automatically
3. Serve frontend from dist/ at root
4. Proxy API calls to `/.netlify/functions/fetchData`

### Local Testing

```bash
# Backend smoke test
npm run test:fetch

# Frontend dev server with HMR
npm run dev

# Both together (in separate terminals)
npm run dev                # Port 5173
npm start:functions        # Netlify dev server
```

## Next Steps (Optional)

1. **Improve IV Percentile Calculation**: Use rolling 1-year IV history to compute IV rank/percentile
2. **Add Greeks Heat Map**: Visualize how greeks change across strikes/expirations
3. **P&L Scenarios**: Show profit/loss at different price targets with real mid prices
4. **Watchlist**: Save favorite trades, track historical performance
5. **Mobile Responsive**: Optimize table/charts for mobile devices
6. **Rate Limiting**: Add API key pooling to increase call limits
7. **Webhook Alerts**: Notify when IV breaks above/below certain levels

## API Limits

- **Yahoo Finance**: ~2000 calls/hour per IP
- **Our Cache**: 12-hour TTL minimizes calls
- **Expected Usage**: ~4-5 API calls per fetch (quote, chart, options) = ~200-250 calls/hour typical

## Known Behaviors

- **DTE Calc**: Uses `(expirationDate - today) / (24*60*60*1000)` in milliseconds  
- **Implied Vol**: Returned as decimal (e.g., 0.25 = 25%)
- **Greeks**: Based on current spot price, T = DTE/365 (daily compounding)
- **Risk-Free Rate**: Hardcoded to 5% (can be updated from FRED API)
