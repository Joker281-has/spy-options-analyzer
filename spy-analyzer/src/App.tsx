/**
 * Main App Component
 * Tab-based interface for SPY options analysis
 */

import { useState } from 'react';
import { Contract } from './types/contract';
import { exportToCSV, downloadCSV } from './utils/csv';
import { Scanner } from './components/Scanner';
import { QuickAnalyze } from './components/QuickAnalyze';
import { ImportData } from './components/ImportData';
import { BarChart3, TrendingUp, Upload } from 'lucide-react';

type Tab = 'scanner' | 'analyze' | 'import';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('scanner');

  const handleExport = (contracts: Contract[]) => {
    const csv = exportToCSV(contracts);
    downloadCSV(csv, `spy-filtered-${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2">SPY Options Analyzer</h1>
          <p className="text-purple-100">Real-time options chain analysis and trading signals</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('scanner')}
              className={`px-4 py-4 font-medium border-b-2 transition ${
                activeTab === 'scanner'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={20} />
                Scanner
              </div>
            </button>

            <button
              onClick={() => setActiveTab('analyze')}
              className={`px-4 py-4 font-medium border-b-2 transition ${
                activeTab === 'analyze'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={20} />
                Analyze
              </div>
            </button>

            <button
              onClick={() => setActiveTab('import')}
              className={`px-4 py-4 font-medium border-b-2 transition ${
                activeTab === 'import'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Upload size={20} />
                Import
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'scanner' && (
          <Scanner onExport={handleExport} />
        )}

        {activeTab === 'analyze' && (
          <QuickAnalyze />
        )}

        {activeTab === 'import' && (
          <ImportData />
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-300 text-center py-8 mt-16">
        <p className="text-sm">
          SoFi Options Extractor v1.0.0 | 
          <span className="ml-2">
            Real-time analysis for risk-aware trading
          </span>
        </p>
      </div>
    </div>
  );
}

export default App;
