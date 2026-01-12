# SPY Options Analyzer

Production-ready system to identify statistically favorable options trades on SPY using free data sources.

## Quick start

```bash
cd C:\spy-monorepo
npm install
npm run dev
```

Open http://localhost:5173 in a browser.

## Test backend

```bash
npm test:fetch
```

Expected output: `status: 200`, `optionsCount: <number>`.

## Features

- Real-time SPY options chain data with Greeks (delta, gamma, theta, vega)
- Technical indicators: SMA20, RSI14, ATR, Historical volatility
- Trade scoring and ranking by risk/reward
- IV percentile filtering
- Delta filtering
- Expiration date filtering
- Interactive chart with price and SMA
- Fallback to sample data if backend unavailable

## Structure

- `netlify/functions/fetchData.js` — Netlify serverless function (options + greeks)
- `scripts/testFetch.js` — Backend smoke test
- `src/` — React + TypeScript frontend
- `public/sample.json` — Fallback data for dev/offline mode

## Deployment

To deploy to Netlify:
1. Connect this repo to GitHub
2. Set build command: `npm install && npm run build`
3. Set publish directory: `dist`
4. Functions directory: `netlify/functions`

The frontend builds to `dist/` and the backend functions are auto-detected from `netlify/functions/`.
