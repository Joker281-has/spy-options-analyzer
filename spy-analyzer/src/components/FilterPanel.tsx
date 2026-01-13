/**
 * FilterPanel Component
 * Provides filtering controls for the options scanner
 */

import { useState } from 'react';
import { FilterConfig } from '../types/contract';

interface FilterPanelProps {
  onFilterChange: (filters: FilterConfig) => void;
}

export function FilterPanel({ onFilterChange }: FilterPanelProps) {
  const [deltaMin, setDeltaMin] = useState(0.2);
  const [deltaMax, setDeltaMax] = useState(0.8);
  const [ivMin, setIvMin] = useState(15);
  const [ivMax, setIvMax] = useState(45);
  const [minVolume, setMinVolume] = useState(1000);
  const [expiration, setExpiration] = useState('');

  const handleApply = () => {
    onFilterChange({
      deltaRange: [deltaMin, deltaMax],
      ivRange: [ivMin / 100, ivMax / 100],
      minVolume: minVolume,
      expiration: expiration || undefined
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Filters</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Delta Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delta Range
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={deltaMin}
              onChange={(e) => setDeltaMin(parseFloat(e.target.value))}
              className="w-full"
            />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={deltaMax}
              onChange={(e) => setDeltaMax(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-600">
              {deltaMin.toFixed(2)} - {deltaMax.toFixed(2)}
            </div>
          </div>
        </div>

        {/* IV Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            IV Range (%)
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={ivMin}
              onChange={(e) => setIvMin(parseFloat(e.target.value))}
              className="w-full"
            />
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={ivMax}
              onChange={(e) => setIvMax(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-gray-600">
              {ivMin}% - {ivMax}%
            </div>
          </div>
        </div>

        {/* Min Volume */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Min Volume
          </label>
          <input
            type="number"
            min="0"
            value={minVolume}
            onChange={(e) => setMinVolume(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiration Date
          </label>
          <input
            type="date"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <button
        onClick={handleApply}
        className="mt-4 w-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-bold py-2 px-4 rounded-lg hover:shadow-lg transition"
      >
        Apply Filters
      </button>
    </div>
  );
}
