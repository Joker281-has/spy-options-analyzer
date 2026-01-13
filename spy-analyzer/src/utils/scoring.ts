/**
 * Scoring engine for SPY options contracts
 */

import { Contract, ScoredContract } from '../types/contract';

const SCORING_WEIGHTS = {
  delta: 0.40,      // 40% weight
  iv: 0.25,         // 25% weight
  volume: 0.20,     // 20% weight
  spread: 0.10,     // 10% weight
  oi: 0.05          // 5% weight
};

const OPTIMAL_DELTA_RANGE = [0.3, 0.7];
const OPTIMAL_IV_RANGE = [0.20, 0.35];
const MIN_VOLUME_THRESHOLD = 5000;
const MAX_SPREAD_PERCENTAGE = 2;
const MIN_OI_THRESHOLD = 3000;

/**
 * Calculate delta proximity score (40% weight)
 * Best when delta is near 0.5 (ATM options)
 */
function calculateDeltaScore(delta: number): number {
  if (delta < OPTIMAL_DELTA_RANGE[0] || delta > OPTIMAL_DELTA_RANGE[1]) {
    return 30; // Low score outside optimal range
  }
  
  // Higher score as delta approaches 0.5
  const distanceFrom50 = Math.abs(delta - 0.5);
  return Math.round(100 - (distanceFrom50 * 100));
}

/**
 * Calculate IV score (25% weight)
 * Best when IV is in optimal range
 */
function calculateIvScore(iv: number): number {
  const ivPercent = iv * 100;
  
  if (ivPercent < OPTIMAL_IV_RANGE[0] || ivPercent > OPTIMAL_IV_RANGE[1]) {
    if (ivPercent < 15 || ivPercent > 50) {
      return 20; // Very low outside extremes
    }
    return 50;
  }
  
  // Perfect score in optimal range
  return 100;
}

/**
 * Calculate volume score (20% weight)
 * Higher volume is better for liquidity
 */
function calculateVolumeScore(volume: number): number {
  if (volume < 100) return 0;
  if (volume < MIN_VOLUME_THRESHOLD) {
    return Math.round((volume / MIN_VOLUME_THRESHOLD) * 50);
  }
  
  // Scale from 50 to 100 for volumes above threshold
  const excessVolume = Math.min(volume - MIN_VOLUME_THRESHOLD, 50000);
  return Math.round(50 + (excessVolume / 50000) * 50);
}

/**
 * Calculate spread score (10% weight)
 * Tighter spread is better
 */
function calculateSpreadScore(bid: number, ask: number): number {
  if (bid <= 0 || ask <= 0) return 0;
  
  const mid = (bid + ask) / 2;
  const spreadPercent = ((ask - bid) / mid) * 100;
  
  if (spreadPercent > MAX_SPREAD_PERCENTAGE * 2) return 0;
  if (spreadPercent > MAX_SPREAD_PERCENTAGE) return 40;
  
  // Perfect score for tight spreads
  return 100 - (spreadPercent * 20);
}

/**
 * Calculate open interest score (5% weight)
 * Higher OI indicates better contract health
 */
function calculateOiScore(openInterest: number): number {
  if (openInterest < 100) return 0;
  if (openInterest < MIN_OI_THRESHOLD) {
    return Math.round((openInterest / MIN_OI_THRESHOLD) * 50);
  }
  
  return 100;
}

/**
 * Score a single contract
 */
export function scoreContract(contract: Contract): ScoredContract {
  const deltaScore = calculateDeltaScore(contract.delta);
  const ivScore = calculateIvScore(contract.iv);
  const volumeScore = calculateVolumeScore(contract.volume);
  const spreadScore = calculateSpreadScore(contract.bid, contract.ask);
  const oiScore = calculateOiScore(contract.openInterest);

  const weightedScore =
    (deltaScore * SCORING_WEIGHTS.delta) +
    (ivScore * SCORING_WEIGHTS.iv) +
    (volumeScore * SCORING_WEIGHTS.volume) +
    (spreadScore * SCORING_WEIGHTS.spread) +
    (oiScore * SCORING_WEIGHTS.oi);

  const finalScore = Math.round(Math.max(0, Math.min(100, weightedScore)));

  let recommendation: 'STRONG' | 'CONSIDER' | 'CAUTION' | 'AVOID';
  if (finalScore >= 70) {
    recommendation = 'STRONG';
  } else if (finalScore >= 50) {
    recommendation = 'CONSIDER';
  } else if (finalScore >= 30) {
    recommendation = 'CAUTION';
  } else {
    recommendation = 'AVOID';
  }

  return {
    ...contract,
    score: finalScore,
    scoreBreakdown: {
      deltaScore,
      ivScore,
      volumeScore,
      spreadScore,
      oiScore
    },
    recommendation
  };
}

/**
 * Score multiple contracts
 */
export function scoreContracts(contracts: Contract[]): ScoredContract[] {
  return contracts.map(scoreContract).sort((a, b) => b.score - a.score);
}

/**
 * Get recommendation text
 */
export function getRecommendationText(recommendation: string): string {
  const texts: Record<string, string> = {
    STRONG: '✅ Strong opportunity - High confidence trade',
    CONSIDER: '⚠️ Worth considering - Review risk/reward',
    CAUTION: '⛔ Proceed with caution - Higher risk',
    AVOID: '🚫 Avoid this contract - Poor metrics'
  };
  return texts[recommendation] || 'Unknown';
}

/**
 * Get color for score badge
 */
export function getScoreColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}
