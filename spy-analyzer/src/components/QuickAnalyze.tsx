/**
 * QuickAnalyze Component
 * Allows manual input and analysis of a single contract
 */

import { useState } from 'react';
import { Contract, AnalysisResult } from '../types/contract';
import { scoreContract } from '../utils/scoring';
import { BarChart3, ArrowRight } from 'lucide-react';

export function QuickAnalyze() {
  const [input, setInput] = useState<Partial<Contract>>({
    strike: 580,
    type: 'CALL',
    bid: 2.45,
    ask: 2.48,
    delta: 0.52,
    iv: 0.28,
    volume: 12500,
    openInterest: 8400,
    expiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleInputChange = (field: keyof Contract, value: any) => {
    setInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAnalyze = () => {
    if (!input.strike || !input.bid || !input.ask || !input.type) {
      alert('Please fill in all required fields');
      return;
    }

    const contract: Contract = {
      strike: input.strike,
      type: input.type as 'CALL' | 'PUT',
      bid: input.bid,
      ask: input.ask,
      delta: input.delta || 0.5,
      iv: input.iv || 0.25,
      volume: input.volume || 0,
      openInterest: input.openInterest || 0,
      expiration: input.expiration || new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      symbol: `SPY ${input.expiration} ${input.strike} ${input.type}`
    };

    const scored = scoreContract(contract);
    
    // Generate analysis
    const mid = (contract.bid + contract.ask) / 2;
    const spread = ((contract.ask - contract.bid) / mid * 100).toFixed(2);

    let analysis = '';
    if (scored.recommendation === 'STRONG') {
      analysis = `✅ Excellent opportunity. This contract offers strong characteristics across all metrics. The ${contract.type === 'CALL' ? 'bullish' : 'bearish'} position has good delta exposure (${contract.delta.toFixed(2)}), reasonable volatility (${(contract.iv * 100).toFixed(1)}%), and solid liquidity (${contract.volume} volume).`;
    } else if (scored.recommendation === 'CONSIDER') {
      analysis = `⚠️ Worth evaluating. This contract has acceptable metrics but some areas to monitor. Check the bid-ask spread (${spread}%) and ensure sufficient volume for your position size.`;
    } else if (scored.recommendation === 'CAUTION') {
      analysis = `⛔ Proceed carefully. This contract has several weaker metrics. Consider whether the risk/reward aligns with your strategy before entering.`;
    } else {
      analysis = `🚫 Not recommended. The combination of these metrics suggests this contract may not be suitable. Look for alternatives with better scores.`;
    }

    setResult({
      overallScore: scored.score,
      recommendation: scored.recommendation,
      analysis: analysis,
      riskLevel: scored.score >= 70 ? 'LOW' : scored.score >= 50 ? 'MEDIUM' : 'HIGH'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart3 size={24} />
          Quick Contract Analysis
        </h2>

        {/* Input Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Strike</label>
            <input
              type="number"
              value={input.strike || ''}
              onChange={(e) => handleInputChange('strike', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="580"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={input.type || 'CALL'}
              onChange={(e) => handleInputChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="CALL">CALL</option>
              <option value="PUT">PUT</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Expiration</label>
            <input
              type="date"
              value={input.expiration || ''}
              onChange={(e) => handleInputChange('expiration', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bid</label>
            <input
              type="number"
              step="0.01"
              value={input.bid || ''}
              onChange={(e) => handleInputChange('bid', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="2.45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ask</label>
            <input
              type="number"
              step="0.01"
              value={input.ask || ''}
              onChange={(e) => handleInputChange('ask', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="2.48"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delta</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={input.delta || ''}
              onChange={(e) => handleInputChange('delta', parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="0.52"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">IV (%)</label>
            <input
              type="number"
              step="0.1"
              value={input.iv ? input.iv * 100 : ''}
              onChange={(e) => handleInputChange('iv', parseFloat(e.target.value) / 100)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="28"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Volume</label>
            <input
              type="number"
              value={input.volume || ''}
              onChange={(e) => handleInputChange('volume', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="12500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Open Interest</label>
            <input
              type="number"
              value={input.openInterest || ''}
              onChange={(e) => handleInputChange('openInterest', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="8400"
            />
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          className="w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition flex items-center justify-center gap-2"
        >
          <ArrowRight size={20} />
          Analyze Contract
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Analysis Result</h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-700">Overall Score</p>
              <p className="text-4xl font-bold text-purple-700">{result.overallScore}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-700">Recommendation</p>
              <p className="text-2xl font-bold text-blue-700">{result.recommendation}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-700">Risk Level</p>
              <p className="text-2xl font-bold text-orange-700">{result.riskLevel}</p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-gray-800">{result.analysis}</p>
          </div>
        </div>
      )}
    </div>
  );
}
