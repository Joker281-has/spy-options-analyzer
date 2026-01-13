/**
 * Contract type definitions for SPY options
 */

export interface Contract {
  strike: number;
  type: 'CALL' | 'PUT';
  bid: number;
  ask: number;
  delta: number;
  iv: number;
  volume: number;
  openInterest: number;
  expiration: string;
  timestamp: string;
  symbol: string;
  spread?: string;
}

export interface ScoredContract extends Contract {
  score: number;
  scoreBreakdown: {
    deltaScore: number;
    ivScore: number;
    volumeScore: number;
    spreadScore: number;
    oiScore: number;
  };
  recommendation: 'STRONG' | 'CONSIDER' | 'CAUTION' | 'AVOID';
}

export interface FilterConfig {
  deltaRange: [number, number];
  ivRange: [number, number];
  minVolume: number;
  expiration?: string;
}

export interface FilterPanelProps {
  onFilterChange: (filters: FilterConfig) => void;
}

export interface ContractCardProps {
  contract: ScoredContract;
}

export interface AnalysisResult {
  overallScore: number;
  recommendation: string;
  analysis: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
