/**
 * Scanner Component
 * Main tab for viewing and filtering all captured options
 */

import { useState, useEffect } from 'react';
import { Contract, FilterConfig, ScoredContract } from '../types/contract';
import { scoreContracts } from '../utils/scoring';
import { getStoredContracts, onStorageChange } from '../utils/storage';
import { FilterPanel } from './FilterPanel';
import { ContractCard } from './ContractCard';
import { Download, Trash2 } from 'lucide-react';

interface ScannerProps {
  onExport?: (contracts: Contract[]) => void;
}

export function Scanner({ onExport }: ScannerProps) {
  const [contracts, setContracts] = useState<ScoredContract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ScoredContract[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({
    deltaRange: [0.2, 0.8],
    ivRange: [0.15, 0.45],
    minVolume: 1000
  });
  const [loading, setLoading] = useState(true);

  // Load contracts on mount
  useEffect(() => {
    loadContracts();
    
    // Listen for storage changes
    onStorageChange((updatedContracts) => {
      const scored = scoreContracts(updatedContracts);
      setContracts(scored);
    });
  }, []);

  // Apply filters when contracts or filters change
  useEffect(() => {
    applyFilters();
  }, [contracts, filters]);

  async function loadContracts() {
    setLoading(true);
    try {
      const stored = await getStoredContracts();
      const scored = scoreContracts(stored);
      setContracts(scored);
    } catch (error) {
      console.error('Failed to load contracts:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    const filtered = contracts.filter(contract => {
      // Delta filter
      if (contract.delta < filters.deltaRange[0] || contract.delta > filters.deltaRange[1]) {
        return false;
      }

      // IV filter
      if (contract.iv < filters.ivRange[0] || contract.iv > filters.ivRange[1]) {
        return false;
      }

      // Volume filter
      if (contract.volume < filters.minVolume) {
        return false;
      }

      // Expiration filter
      if (filters.expiration && contract.expiration !== filters.expiration) {
        return false;
      }

      return true;
    });

    setFilteredContracts(filtered);
  }

  const handleExport = () => {
    if (onExport) {
      onExport(filteredContracts);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear all contracts? This cannot be undone.')) {
      // Clear storage implementation
      localStorage.removeItem('capturedContracts');
      setContracts([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-600">Loading contracts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p className="text-gray-600 text-sm">Total Contracts</p>
          <p className="text-3xl font-bold text-purple-600">{contracts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p className="text-gray-600 text-sm">Matching Filters</p>
          <p className="text-3xl font-bold text-blue-600">{filteredContracts.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p className="text-gray-600 text-sm">Avg Score</p>
          <p className="text-3xl font-bold text-green-600">
            {filteredContracts.length > 0
              ? (filteredContracts.reduce((sum, c) => sum + c.score, 0) / filteredContracts.length).toFixed(0)
              : '-'}
          </p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-md">
          <p className="text-gray-600 text-sm">Top Score</p>
          <p className="text-3xl font-bold text-orange-600">
            {filteredContracts.length > 0 ? filteredContracts[0].score : '-'}
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel onFilterChange={setFilters} />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          <Download size={20} />
          Export CSV
        </button>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          <Trash2 size={20} />
          Clear All
        </button>
      </div>

      {/* Results */}
      {filteredContracts.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center">
          <p className="text-gray-600">No contracts match your filters.</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((contract) => (
            <ContractCard key={`${contract.strike}-${contract.type}-${contract.expiration}`} contract={contract} />
          ))}
        </div>
      )}
    </div>
  );
}
