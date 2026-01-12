const fs = require('fs');
const path = require('path');
const YahooFinance = require('yahoo-finance2').default;

// Initialize Yahoo Finance
const yf = new YahooFinance();

const CACHE_DIR = path.resolve(__dirname, '../.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'spy_options.json');
const TTL_MS = 12 * 60 * 60 * 1000;
const RETRY_LIMIT = 3;
const RETRY_DELAY_MS = 1000;

const SAMPLE_DATA = {
  source: 'sample',
  optionsCount: 2,
  series: [
    { date: new Date('2026-01-09').toISOString(), close: 440, open: 439, high: 441, low: 438, volume: 1000000 },
    { date: new Date('2026-01-10').toISOString(), close: 442, open: 440, high: 443, low: 440, volume: 1200000 }
  ],
  indicators: { sma20: [null, null, 440.5], rsi14: [null, null, 55], histVol30: 0.18 },
  expirations: ['2026-01-16T00:00:00.000Z','2026-02-20T00:00:00.000Z'],
  optionsSample: [
    { contractSymbol: 'SPY  260121C440', strike: 440, type: 'call', expiration: '2026-01-16T00:00:00.000Z', dte: 5, lastPrice: 2.5, bid: 2.4, ask: 2.6, mid: 2.5, impliedVol: 0.18, volume: 120, openInterest: 300, greeks: { delta: 0.52, gamma: 0.02, theta: -0.01, vega: 0.12 } },
    { contractSymbol: 'SPY  260121P435', strike: 435, type: 'put', expiration: '2026-01-16T00:00:00.000Z', dte: 5, lastPrice: 1.2, bid: 1.1, ask: 1.3, mid: 1.2, impliedVol: 0.22, volume: 80, openInterest: 150, greeks: { delta: -0.48, gamma: 0.018, theta: -0.005, vega: 0.09 } }
  ]
};

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function readCache() {
  try {
    if (!fs.existsSync(CACHE_FILE)) return null;
    const raw = fs.readFileSync(CACHE_FILE, 'utf8');
    const obj = JSON.parse(raw);
    if (Date.now() - obj.fetchedAt > TTL_MS) return null;
    return obj.data;
  } catch (e) {
    return null;
  }
}

function writeCache(data) {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ fetchedAt: Date.now(), data }), 'utf8');
  } catch (e) {
    // ignore
  }
}

// Black-Scholes Greeks calculation
function computeGreeks(S, K, T, r, sigma, optionType = 'call') {
  if (T <= 0 || sigma <= 0) return { delta: 0.5, gamma: 0, theta: 0, vega: 0 };

  const d1 = (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  // Cumulative normal distribution approximation
  const N = (x) => {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);

    const t = 1.0 / (1.0 + p * absX);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;

    const erf = 1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * t) * Math.exp(-absX * absX);

    return 0.5 * (1.0 + sign * erf);
  };

  const n = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

  if (optionType === 'call') {
    return {
      delta: N(d1),
      gamma: n(d1) / (S * sigma * Math.sqrt(T)),
      theta: (-S * n(d1) * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * N(d2)) / 365,
      vega: S * n(d1) * Math.sqrt(T) / 100
    };
  } else {
    return {
      delta: N(d1) - 1,
      gamma: n(d1) / (S * sigma * Math.sqrt(T)),
      theta: (-S * n(d1) * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * N(-d2)) / 365,
      vega: S * n(d1) * Math.sqrt(T) / 100
    };
  }
}

// Calculate SMA
function calculateSMA(prices, period = 20) {
  const sma = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(null);
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

// Calculate RSI
function calculateRSI(prices, period = 14) {
  const rsi = [];
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  for (let i = 0; i < changes.length; i++) {
    if (i < period - 1) {
      rsi.push(null);
    } else {
      const gains = changes.slice(i - period + 1, i + 1).filter(c => c > 0).reduce((a, b) => a + b, 0);
      const losses = changes.slice(i - period + 1, i + 1).filter(c => c < 0).reduce((a, b) => a - b, 0);
      const rs = gains / (losses || 0.0001);
      rsi.push(100 - 100 / (1 + rs));
    }
  }
  return rsi;
}

// Retry wrapper for API calls
async function retryFetch(fn, attempt = 1) {
  try {
    return await fn();
  } catch (err) {
    if (attempt < RETRY_LIMIT) {
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
      return retryFetch(fn, attempt + 1);
    }
    throw err;
  }
}

// Fetch SPY price history from Yahoo Finance
async function fetchSPYPriceHistory() {
  try {
    return await retryFetch(async () => {
      const result = await yf.chart('SPY', {
        period1: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days back
        period2: new Date(),
        interval: '1d'
      });

      if (!result || !result.quotes) return [];

      return result.quotes.map(candle => ({
        date: new Date(candle.date * 1000).toISOString(),
        close: candle.close,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        volume: candle.volume || 0
      }));
    });
  } catch (err) {
    console.error('Error fetching SPY price history:', err.message);
    return [];
  }
}

// Fetch SPY options chain from Yahoo Finance v3 API
async function fetchSPYOptionsChain() {
  try {
    return await retryFetch(async () => {
      // Fetch options for SPY (get all expirations at once)
      const optionsData = await yf.options('SPY');
      
      if (!optionsData || !optionsData.options) {
        console.warn('No options data returned from Yahoo Finance');
        return [];
      }

      const allOptions = [];

      // The options property is an array of objects grouped by expiration date
      // Each item has: { expirationDate, hasMiniOptions, calls: [], puts: [] }
      for (const optionsByExp of optionsData.options) {
        if (!optionsByExp.calls || !optionsByExp.puts) continue;

        // Process calls
        for (const call of optionsByExp.calls) {
          if (call.strike && call.bid != null && call.ask != null) {
            allOptions.push({
              contractSymbol: call.contractSymbol,
              strike: call.strike,
              type: 'call',
              expiration: new Date(call.expiration).toISOString(),
              lastPrice: call.lastPrice || ((call.bid + call.ask) / 2) || 0.01,
              bid: call.bid,
              ask: call.ask,
              impliedVol: call.impliedVolatility || 0.2,
              volume: call.volume || 0,
              openInterest: call.openInterest || 0
            });
          }
        }

        // Process puts
        for (const put of optionsByExp.puts) {
          if (put.strike && put.bid != null && put.ask != null) {
            allOptions.push({
              contractSymbol: put.contractSymbol,
              strike: put.strike,
              type: 'put',
              expiration: new Date(put.expiration).toISOString(),
              lastPrice: put.lastPrice || ((put.bid + put.ask) / 2) || 0.01,
              bid: put.bid,
              ask: put.ask,
              impliedVol: put.impliedVolatility || 0.2,
              volume: put.volume || 0,
              openInterest: put.openInterest || 0
            });
          }
        }
      }

      console.log(`Fetched ${allOptions.length} total options from ${optionsData.options?.length || 0} expirations`);
      return allOptions;
    });
  } catch (err) {
    console.error('Error fetching SPY options chain:', err.message);
    return [];
  }
}

// Get current SPY quote
async function getSPYQuote() {
  try {
    return await retryFetch(async () => {
      const quote = await yf.quote('SPY', { fields: ['regularMarketPrice', 'regularMarketVolume'] });
      return {
        price: quote.regularMarketPrice,
        volume: quote.regularMarketVolume
      };
    });
  } catch (err) {
    console.error('Error fetching SPY quote:', err.message);
    return null;
  }
}

exports.handler = async function (event) {
  try {
    const qs = event && event.queryStringParameters ? event.queryStringParameters : {};
    const force = qs.force === '1' || qs.force === 'true';

    if (!force) {
      const cached = readCache();
      if (cached) return { statusCode: 200, body: JSON.stringify({ source: 'cache', ...cached }) };
    }

    // Fetch live data from Yahoo Finance
    const [series, optionsData, quoteResult] = await Promise.all([
      fetchSPYPriceHistory(),
      fetchSPYOptionsChain(),
      getSPYQuote()
    ]);

    // Fallback to sample data if API fails
    if (series.length === 0 || optionsData.length === 0 || !quoteResult) {
      console.warn('API fetch incomplete, using sample data fallback');
      const payload = { ...SAMPLE_DATA, source: 'fallback' };
      writeCache(payload);
      return { statusCode: 200, body: JSON.stringify(payload) };
    }

    // Compute indicators
    const prices = series.map(s => s.close);
    const sma20 = calculateSMA(prices, 20);
    const rsi14 = calculateRSI(prices, 14);
    
    // Historical volatility
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push(Math.log(prices[i] / prices[i - 1]));
    }
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length;
    const histVol = Math.sqrt(variance * 252);

    // Get unique expirations and current SPY price
    const expirations = [...new Set(optionsData.map(o => o.expiration))].sort();
    const currentPrice = quoteResult.price;
    const riskFreeRate = 0.05;

    // Compute greeks for each option and create sample
    const optionsSample = optionsData.slice(0, Math.min(20, optionsData.length)).map(opt => {
      const mid = (opt.bid + opt.ask) / 2;
      const expiryDate = new Date(opt.expiration);
      const today = new Date();
      const dte = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      const T = Math.max(0.001, dte / 365);

      const greeks = computeGreeks(currentPrice, opt.strike, T, riskFreeRate, opt.impliedVol || 0.2, opt.type);

      return {
        contractSymbol: opt.contractSymbol,
        strike: opt.strike,
        type: opt.type,
        expiration: opt.expiration,
        dte,
        lastPrice: opt.lastPrice,
        bid: opt.bid,
        ask: opt.ask,
        mid,
        impliedVol: opt.impliedVol || 0.2,
        volume: opt.volume,
        openInterest: opt.openInterest,
        greeks
      };
    });

    const payload = {
      source: 'live',
      optionsCount: optionsData.length,
      series,
      indicators: { sma20, rsi14, histVol },
      expirations,
      optionsSample
    };

    writeCache(payload);
    return { statusCode: 200, body: JSON.stringify(payload) };
  } catch (err) {
    console.error('Handler error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};

if (require.main === module) {
  (async () => {
    try {
      const res = await exports.handler({ queryStringParameters: { force: '1' } });
      console.log('status', res.statusCode);
      const body = JSON.parse(res.body);
      console.log('optionsCount', body.optionsCount);
      if (body.optionsSample && body.optionsSample[0]) console.log('sample option:', JSON.stringify(body.optionsSample[0], null, 2));
      process.exit(0);
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  })();
}
