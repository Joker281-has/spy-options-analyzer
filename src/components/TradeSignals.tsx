import React from 'react';
import { TradeSignal, OptionContract } from '../types';
import { ScoringEngine } from '../services/ScoringEngine';
import { AlertEngine } from '../services/AlertEngine';
import { TrendingUp, Copy, AlertCircle } from 'lucide-react';

interface TradeSignalsProps {
  contracts: OptionContract[];
}

export const TradeSignals: React.FC<TradeSignalsProps> = ({ contracts }) => {
  const [signals, setSignals] = React.useState<TradeSignal[]>([]);
  const [filters, setFilters] = React.useState({
    minDelta: 0.3,
    maxDelta: 0.7,
    minIV: 15,
    maxDaysToExp: 60,
    minScore: 50,
  });

  React.useEffect(() => {
    const newSignals = ScoringEngine.generateSignals(contracts, {
      minDelta: filters.minDelta,
      maxDelta: filters.maxDelta,
      minIV: filters.minIV / 100,
      maxDaysToExp: filters.maxDaysToExp,
      minScore: filters.minScore,
    });

    setSignals(newSignals);

    // Check alerts
    for (const signal of newSignals) {
      const matchedAlert = AlertEngine.checkSignal(signal);
      if (matchedAlert) {
        AlertEngine.triggerAlert(signal, matchedAlert);
      }
    }
  }, [contracts, filters]);

  const copyToClipboard = (signal: TradeSignal) => {
    const text = `${signal.contract.symbol} ${signal.contract.type} ${signal.contract.strike} - Score: ${signal.score.toFixed(0)}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Trade Signals
        </h2>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Delta</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={filters.minDelta}
                onChange={(e) => setFilters({ ...filters, minDelta: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Delta</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={filters.maxDelta}
                onChange={(e) => setFilters({ ...filters, maxDelta: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min IV %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minIV}
                onChange={(e) => setFilters({ ...filters, minIV: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max DTE</label>
              <input
                type="number"
                min="1"
                max="365"
                value={filters.maxDaysToExp}
                onChange={(e) => setFilters({ ...filters, maxDaysToExp: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Score</label>
              <input
                type="number"
                min="0"
                max="100"
                value={filters.minScore}
                onChange={(e) => setFilters({ ...filters, minScore: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>

        {signals.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No signals match your criteria. Adjust filters to see more opportunities.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal) => (
              <div
                key={signal.id}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600 p-4 hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-lg text-gray-900">{signal.contract.symbol}</h3>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${
                        signal.action === 'buy'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {signal.action.toUpperCase()}
                      </span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
                        Score: {signal.score.toFixed(0)}/100
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{signal.reason}</p>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Strike:</span>
                        <span className="font-semibold ml-1">${signal.contract.strike}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Mid:</span>
                        <span className="font-semibold ml-1">${signal.contract.mid.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Delta:</span>
                        <span className="font-semibold ml-1">{signal.contract.delta.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">IV:</span>
                        <span className="font-semibold ml-1">{(signal.contract.iv * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(signal)}
                    className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-white transition"
                    title="Copy symbol"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-sm text-gray-600 mt-4">
          Found {signals.length} high-quality trade signal{signals.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
