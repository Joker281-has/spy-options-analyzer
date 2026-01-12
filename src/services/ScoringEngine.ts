import { OptionContract, TradeSignal } from '../types';

export class ScoringEngine {
  /**
   * Calculate trade score based on multiple criteria
   * Score = (R/R × POP × IV Factor) + Delta Factor + Theta Factor
   */
  static scoreContract(contract: OptionContract): number {
    const rewardRisk = this.calculateRewardRisk(contract);
    const pop = this.calculateProbabilityOfProfit(contract);
    const ivFactor = this.calculateIVFactor(contract);
    const deltaFactor = this.calculateDeltaFactor(contract);
    const thetaFactor = this.calculateThetaFactor(contract);

    const baseScore = rewardRisk * pop * (1 + ivFactor);
    const adjustedScore = baseScore + deltaFactor + thetaFactor;

    return Math.max(0, Math.min(100, adjustedScore)); // Clamp 0-100
  }

  private static calculateRewardRisk(contract: OptionContract): number {
    const premium = contract.mid;
    const distanceToStrike = Math.abs(contract.underlyingPrice - contract.strike);
    return premium / Math.max(0.01, distanceToStrike);
  }

  private static calculateProbabilityOfProfit(contract: OptionContract): number {
    const delta = Math.abs(contract.delta);
    // POP ≈ abs(delta) for call/puts at the money
    return 1 - Math.abs(delta - 0.5);
  }

  private static calculateIVFactor(contract: OptionContract): number {
    // IV rank (0-1 scale)
    // High IV = more premium = better for sellers
    // Low IV = cheaper = better for buyers
    const ivPercent = Math.min(100, Math.max(0, contract.iv * 100));
    return ivPercent / 100;
  }

  private static calculateDeltaFactor(contract: OptionContract): number {
    // Favor deltas around 0.3-0.7 (sweet spot for premium)
    const delta = Math.abs(contract.delta);
    if (delta >= 0.3 && delta <= 0.7) return 10;
    if (delta >= 0.2 && delta <= 0.8) return 5;
    return 0;
  }

  private static calculateThetaFactor(contract: OptionContract): number {
    // Theta decay (positive for sellers, negative for buyers)
    // More theta = better for time decay plays
    return Math.abs(contract.theta) * 5;
  }

  /**
   * Generate actionable trade signals
   */
  static generateSignals(
    contracts: OptionContract[],
    criteria: {
      minDelta?: number;
      maxDelta?: number;
      minIV?: number;
      maxDaysToExp?: number;
      minScore?: number;
    }
  ): TradeSignal[] {
    const signals: TradeSignal[] = [];

    for (const contract of contracts) {
      const score = this.scoreContract(contract);
      const daysToExp = this.calculateDaysToExpiration(contract.exp);

      // Apply filters
      if (criteria.minDelta && Math.abs(contract.delta) < criteria.minDelta) continue;
      if (criteria.maxDelta && Math.abs(contract.delta) > criteria.maxDelta) continue;
      if (criteria.minIV && contract.iv * 100 < criteria.minIV) continue;
      if (criteria.maxDaysToExp && daysToExp > criteria.maxDaysToExp) continue;
      if (criteria.minScore && score < criteria.minScore) continue;

      // Generate signal
      const signal: TradeSignal = {
        id: `${contract.symbol}-${Date.now()}`,
        contract,
        score,
        reason: this.generateReason(contract, score),
        timestamp: new Date(),
        action: this.determineAction(contract, score),
      };

      signals.push(signal);
    }

    // Sort by score (highest first)
    return signals.sort((a, b) => b.score - a.score).slice(0, 10); // Top 10
  }

  private static generateReason(contract: OptionContract, score: number): string {
    const reasons: string[] = [];

    if (Math.abs(contract.delta) >= 0.3 && Math.abs(contract.delta) <= 0.7) {
      reasons.push(`Delta ${contract.delta.toFixed(2)} (sweet spot)`);
    }

    if (contract.iv > 0.3) {
      reasons.push(`High IV ${(contract.iv * 100).toFixed(1)}%`);
    }

    if (contract.theta < -0.05) {
      reasons.push(`Time decay ${contract.theta.toFixed(3)}`);
    }

    if (contract.volume > 100) {
      reasons.push(`Liquid (Vol: ${contract.volume})`);
    }

    if (score > 75) {
      reasons.push(`High score: ${score.toFixed(0)}/100`);
    }

    return reasons.length > 0 ? reasons.join(' + ') : 'Check manually';
  }

  private static determineAction(contract: OptionContract, score: number): 'buy' | 'sell' {
    // Simple heuristic: high score + low theta = buy, high theta = sell
    if (contract.theta < -0.05 && score > 60) return 'sell';
    return 'buy';
  }

  private static calculateDaysToExpiration(expDate: string): number {
    const exp = new Date(expDate);
    const today = new Date();
    const diffMs = exp.getTime() - today.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
