/**
 * ContractCard Component
 * Displays individual contract details with score
 */

import { ScoredContract } from '../types/contract';
import { getScoreColor } from '../utils/scoring';
import { AlertCircle } from 'lucide-react';

interface ContractCardProps {
  contract: ScoredContract;
}

export function ContractCard({ contract }: ContractCardProps) {
  const spread = ((contract.ask - contract.bid) / ((contract.ask + contract.bid) / 2) * 100).toFixed(2);
  const mid = ((contract.bid + contract.ask) / 2).toFixed(2);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
      {/* Header with score */}
      <div className={`${getScoreColor(contract.score)} p-4 text-white`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold">
              SPY {contract.strike} {contract.type}
            </h3>
            <p className="text-sm opacity-90">
              Exp: {contract.expiration}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{contract.score}</div>
            <p className="text-xs opacity-90">{contract.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Prices */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-600">Bid</p>
            <p className="text-lg font-bold text-green-600">${contract.bid.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Mid</p>
            <p className="text-lg font-bold text-gray-800">${mid}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Ask</p>
            <p className="text-lg font-bold text-red-600">${contract.ask.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Spread</p>
            <p className="text-lg font-bold text-orange-600">{spread}%</p>
          </div>
        </div>
      </div>

      {/* Greeks */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600">Delta</p>
            <p className="text-sm font-semibold">{contract.delta.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">IV</p>
            <p className="text-sm font-semibold">{(contract.iv * 100).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Volume</p>
            <p className="text-sm font-semibold">{contract.volume}</p>
          </div>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="p-4 bg-gray-50">
        <p className="text-xs font-semibold text-gray-700 mb-2">Score Breakdown</p>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Delta:</span>
            <span className="font-semibold">{contract.scoreBreakdown.deltaScore}</span>
          </div>
          <div className="flex justify-between">
            <span>IV:</span>
            <span className="font-semibold">{contract.scoreBreakdown.ivScore}</span>
          </div>
          <div className="flex justify-between">
            <span>Volume:</span>
            <span className="font-semibold">{contract.scoreBreakdown.volumeScore}</span>
          </div>
          <div className="flex justify-between">
            <span>Spread:</span>
            <span className="font-semibold">{contract.scoreBreakdown.spreadScore}</span>
          </div>
          <div className="flex justify-between">
            <span>Open Interest:</span>
            <span className="font-semibold">{contract.scoreBreakdown.oiScore}</span>
          </div>
        </div>
      </div>

      {/* Recommendation text */}
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-blue-600" />
          <p className="text-sm text-blue-800">
            {contract.recommendation === 'STRONG' && '✅ Strong opportunity - High confidence trade'}
            {contract.recommendation === 'CONSIDER' && '⚠️ Worth considering - Review risk/reward'}
            {contract.recommendation === 'CAUTION' && '⛔ Proceed with caution - Higher risk'}
            {contract.recommendation === 'AVOID' && '🚫 Avoid this contract - Poor metrics'}
          </p>
        </div>
      </div>
    </div>
  );
}
