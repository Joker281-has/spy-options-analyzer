import React, { useState, useEffect } from 'react';
import { Upload, Download, Trash2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImportedContract {
  symbol: string;
  type: 'call' | 'put';
  strike: number;
  bid?: number;
  ask?: number;
  mid?: number;
  delta?: number;
  gamma?: number;
  theta?: number;
  vega?: number;
  iv?: number;
  volume?: number;
  openInterest?: number;
  expiration?: string;
  capturedAt?: string;
}

interface DataImporterProps {
  onContractsImported?: (contracts: ImportedContract[]) => void;
}

export const DataImporter: React.FC<DataImporterProps> = ({ onContractsImported }) => {
  const [contracts, setContracts] = useState<ImportedContract[]>([]);
  const [synced, setSynced] = useState(false);

  // Listen for messages from Chrome extension
  useEffect(() => {
    const handleMessage = (event: any) => {
      if (event.data.type === 'SYNC_CONTRACTS' && event.data.contracts) {
        setContracts(event.data.contracts);
        setSynced(true);
        onContractsImported?.(event.data.contracts);
        toast.success(`Synced ${event.data.contracts.length} contracts from SoFi`);
      } else if (event.data.type === 'RECEIVE_CONTRACTS' && event.data.contracts) {
        setContracts(event.data.contracts);
        onContractsImported?.(event.data.contracts);
        toast.success(`Received ${event.data.contracts.length} contracts`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onContractsImported]);

  // Handle CSV file upload
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(l => l.trim());
        
        if (lines.length < 2) {
          toast.error('CSV file must have headers and at least 1 contract');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const parsed: ImportedContract[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length < 3) continue;

          const contract: ImportedContract = {
            symbol: values[headers.indexOf('symbol')] || `Contract_${i}`,
            type: (values[headers.indexOf('type')] || 'call').toLowerCase() as 'call' | 'put',
            strike: parseFloat(values[headers.indexOf('strike')] || '0'),
            bid: parseFloat(values[headers.indexOf('bid')] || '') || undefined,
            ask: parseFloat(values[headers.indexOf('ask')] || '') || undefined,
            mid: parseFloat(values[headers.indexOf('mid')] || '') || undefined,
            delta: parseFloat(values[headers.indexOf('delta')] || '') || undefined,
            gamma: parseFloat(values[headers.indexOf('gamma')] || '') || undefined,
            theta: parseFloat(values[headers.indexOf('theta')] || '') || undefined,
            vega: parseFloat(values[headers.indexOf('vega')] || '') || undefined,
            iv: parseFloat(values[headers.indexOf('iv')] || values[headers.indexOf('iv %')] || '') || undefined,
            volume: parseInt(values[headers.indexOf('volume')] || '0') || undefined,
            openInterest: parseInt(values[headers.indexOf('open interest')] || values[headers.indexOf('openinterest')] || '0') || undefined,
            expiration: values[headers.indexOf('expiration')] || undefined,
            capturedAt: new Date().toISOString()
          };

          parsed.push(contract);
        }

        if (parsed.length === 0) {
          toast.error('No valid contracts found in CSV');
          return;
        }

        setContracts(parsed);
        onContractsImported?.(parsed);
        toast.success(`Imported ${parsed.length} contracts from CSV`);
      } catch (error) {
        toast.error('Error parsing CSV file');
        console.error(error);
      }
    };

    reader.readAsText(file);
  };

  // Export contracts to CSV
  const handleExport = () => {
    if (contracts.length === 0) {
      toast.error('No contracts to export');
      return;
    }

    const headers = [
      'Symbol', 'Type', 'Strike', 'Bid', 'Ask', 'Mid', 'Delta', 'Gamma',
      'Theta', 'Vega', 'IV %', 'Volume', 'Open Interest', 'Expiration', 'Captured At'
    ];

    const rows = contracts.map(c => [
      c.symbol,
      c.type,
      c.strike,
      c.bid || '',
      c.ask || '',
      c.mid || '',
      c.delta || '',
      c.gamma || '',
      c.theta || '',
      c.vega || '',
      c.iv || '',
      c.volume || '',
      c.openInterest || '',
      c.expiration || '',
      c.capturedAt ? new Date(c.capturedAt).toLocaleString() : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sofi-contracts-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${contracts.length} contracts`);
  };

  // Clear all contracts
  const handleClear = () => {
    if (!window.confirm('Clear all contracts?')) return;
    setContracts([]);
    setSynced(false);
    toast.success('Contracts cleared');
  };

  // Request sync from extension
  const handleSync = () => {
    window.postMessage({ type: 'REQUEST_SYNC' }, '*');
    toast.loading('Syncing with extension...');
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Data Import Status</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{contracts.length}</div>
            <div className="text-sm text-gray-600 mt-2">Contracts Imported</div>
          </div>
          
          <div className={`rounded-lg p-4 text-center ${synced ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className={`text-2xl font-bold ${synced ? 'text-green-600' : 'text-gray-400'}`}>
              {synced ? '✓' : '○'}
            </div>
            <div className="text-sm text-gray-600 mt-2">Extension Synced</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl">🔄</div>
            <div className="text-sm text-gray-600 mt-2">Ready to Analyze</div>
          </div>
        </div>

        {synced && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
            ✓ Extension is connected and syncing data automatically
          </div>
        )}
      </div>

      {/* Import Options */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">📥 Import Methods</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* CSV Upload */}
          <label className="cursor-pointer">
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:bg-blue-50 transition">
              <Upload className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <div className="font-semibold text-sm text-gray-700">Upload CSV</div>
              <div className="text-xs text-gray-500 mt-1">From extension or manual</div>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
          </label>

          {/* Extension Sync */}
          <button
            onClick={handleSync}
            className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:bg-green-50 transition cursor-pointer"
          >
            <RefreshCw className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="font-semibold text-sm text-gray-700">Sync Extension</div>
            <div className="text-xs text-gray-500 mt-1">Auto-extract from SoFi</div>
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
          <strong>Tip:</strong> Install the Chrome extension for automatic data extraction from SoFi. See instructions below.
        </div>
      </div>

      {/* Contracts Table */}
      {contracts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold">📋 Imported Contracts</h3>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Symbol</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Type</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-700">Strike</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-700">Bid</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-700">Ask</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-700">Delta</th>
                  <th className="text-right px-6 py-3 font-semibold text-gray-700">IV %</th>
                  <th className="text-left px-6 py-3 font-semibold text-gray-700">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {contracts.map((contract, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">{contract.symbol}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        contract.type === 'call' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contract.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700">${contract.strike.toFixed(2)}</td>
                    <td className="px-6 py-3 text-right text-gray-700">
                      {contract.bid ? `$${contract.bid.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700">
                      {contract.ask ? `$${contract.ask.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700">
                      {contract.delta ? contract.delta.toFixed(2) : '-'}
                    </td>
                    <td className="px-6 py-3 text-right text-gray-700">
                      {contract.iv ? `${contract.iv.toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{contract.expiration || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">🚀 Setup Instructions</h3>
        
        <div className="space-y-4">
          <div className="border-l-4 border-blue-500 bg-blue-50 p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Step 1: Install Chrome Extension</h4>
            <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
              <li>Open Chrome and go to <code className="bg-blue-100 px-2 py-1 rounded">chrome://extensions</code></li>
              <li>Enable "Developer mode" (toggle in top right)</li>
              <li>Click "Load unpacked"</li>
              <li>Select the <code className="bg-blue-100 px-2 py-1 rounded">sofi-extension</code> folder</li>
              <li>You should see a purple icon in your toolbar</li>
            </ol>
          </div>

          <div className="border-l-4 border-green-500 bg-green-50 p-4">
            <h4 className="font-semibold text-green-900 mb-2">Step 2: Use on SoFi</h4>
            <ol className="text-sm text-green-800 space-y-1 ml-4 list-decimal">
              <li>Login to SoFi (https://www.sofi.com)</li>
              <li>Browse to any options contract</li>
              <li>Click the purple "📊 Capture" button (floating bottom-right)</li>
              <li>Data automatically extracts and saves</li>
              <li>Repeat for multiple contracts</li>
            </ol>
          </div>

          <div className="border-l-4 border-purple-500 bg-purple-50 p-4">
            <h4 className="font-semibold text-purple-900 mb-2">Step 3: Sync to Web App</h4>
            <ol className="text-sm text-purple-800 space-y-1 ml-4 list-decimal">
              <li>Click extension icon → "Sync to App" button</li>
              <li>Or click "Sync Extension" button above</li>
              <li>Contracts appear automatically in this table</li>
              <li>Export as CSV anytime</li>
            </ol>
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <strong className="text-yellow-800">⚠️ Note:</strong>
          <div className="text-sm text-yellow-800 mt-1">
            The extension extracts data via DOM parsing. For best results, ensure SoFi contract details are fully loaded on the page before clicking Capture.
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataImporter;
