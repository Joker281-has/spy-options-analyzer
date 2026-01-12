export interface OptionContract {
  symbol: string;
  type: 'call' | 'put';
  strike: number;
  exp: string;
  bid: number;
  ask: number;
  mid: number;
  volume: number;
  openInterest: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  iv: number;
  underlyingPrice: number;
}

export interface TradeSignal {
  id: string;
  contract: OptionContract;
  score: number;
  reason: string;
  timestamp: Date;
  action: 'buy' | 'sell';
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface AlertConfig {
  id: string;
  name: string;
  conditions: {
    deltaMin?: number;
    deltaMax?: number;
    ivMin?: number;
    ivMax?: number;
    expDaysMax?: number;
  };
  enabled: boolean;
  notifyBrowser: boolean;
  notifyEmail?: string;
}

export interface NotificationState {
  enabled: boolean;
  count: number;
  lastAlert?: TradeSignal;
}
