import Papa from 'papaparse';
import { PortfolioPosition, OptionContract } from '../types';

export interface CSVPosition {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice?: number;
}

export class PortfolioService {
  private static readonly STORAGE_KEY = 'spy-portfolio';
  private static positions: PortfolioPosition[] = [];

  /**
   * Load portfolio from localStorage
   */
  static loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.positions = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load portfolio:', e);
    }
  }

  /**
   * Save portfolio to localStorage
   */
  static saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.positions));
    } catch (e) {
      console.error('Failed to save portfolio:', e);
    }
  }

  /**
   * Import positions from CSV file
   * Expected format: symbol, quantity, entryPrice, currentPrice (optional)
   */
  static importFromCSV(file: File): Promise<PortfolioPosition[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const positions: PortfolioPosition[] = results.data
              .map((row: any) => ({
                symbol: row.symbol?.trim(),
                quantity: parseInt(row.quantity) || 0,
                entryPrice: parseFloat(row.entryPrice) || 0,
                currentPrice: parseFloat(row.currentPrice) || 0,
                pnl: 0,
                pnlPercent: 0,
              }))
              .filter((p: any) => p.symbol && p.quantity > 0);

            this.positions = positions;
            this.saveToStorage();
            resolve(positions);
          } catch (e) {
            reject(e);
          }
        },
        error: (error) => reject(error),
      });
    });
  }

  /**
   * Export portfolio to CSV
   */
  static exportToCSV(): string {
    const headers = ['symbol', 'quantity', 'entryPrice', 'currentPrice', 'pnl', 'pnlPercent'];
    const rows = this.positions.map(p => [
      p.symbol,
      p.quantity,
      p.entryPrice.toFixed(2),
      p.currentPrice.toFixed(2),
      p.pnl.toFixed(2),
      p.pnlPercent.toFixed(2),
    ]);

    return Papa.unparse([headers, ...rows]);
  }

  /**
   * Add position to portfolio
   */
  static addPosition(position: PortfolioPosition): void {
    // Remove if exists
    this.positions = this.positions.filter(p => p.symbol !== position.symbol);
    this.positions.push(position);
    this.saveToStorage();
  }

  /**
   * Update position prices
   */
  static updatePositionPrices(symbol: string, currentPrice: number): void {
    const position = this.positions.find(p => p.symbol === symbol);
    if (position) {
      position.currentPrice = currentPrice;
      position.pnl = (currentPrice - position.entryPrice) * position.quantity;
      position.pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
      this.saveToStorage();
    }
  }

  /**
   * Get all positions
   */
  static getPositions(): PortfolioPosition[] {
    return [...this.positions];
  }

  /**
   * Calculate total portfolio P&L
   */
  static getTotalPnL(): { pnl: number; pnlPercent: number } {
    let totalPnl = 0;
    let totalInvested = 0;

    for (const pos of this.positions) {
      totalPnl += pos.pnl;
      totalInvested += pos.entryPrice * pos.quantity;
    }

    return {
      pnl: totalPnl,
      pnlPercent: totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0,
    };
  }

  /**
   * Match positions with contracts for P&L calculation
   */
  static updateWithLiveData(contracts: OptionContract[]): void {
    for (const pos of this.positions) {
      const contract = contracts.find(c => c.symbol === pos.symbol);
      if (contract) {
        this.updatePositionPrices(pos.symbol, contract.mid);
      }
    }
  }

  /**
   * Get recommended close prices for profit taking
   */
  static getRecommendedClosePrices(
    riskRewardRatio: number = 2
  ): Map<string, { target: number; stop: number }> {
    const recommendations = new Map<string, { target: number; stop: number }>();

    for (const pos of this.positions) {
      const riskAmount = pos.entryPrice * 0.02; // 2% risk per trade
      const targetPrice = pos.entryPrice + riskAmount * riskRewardRatio;
      const stopPrice = pos.entryPrice - riskAmount;

      recommendations.set(pos.symbol, {
        target: targetPrice,
        stop: stopPrice,
      });
    }

    return recommendations;
  }

  /**
   * Delete position
   */
  static deletePosition(symbol: string): void {
    this.positions = this.positions.filter(p => p.symbol !== symbol);
    this.saveToStorage();
  }

  /**
   * Clear all positions
   */
  static clear(): void {
    this.positions = [];
    this.saveToStorage();
  }
}
