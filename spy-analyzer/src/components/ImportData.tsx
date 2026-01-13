/**
 * ImportData Component
 * Handles CSV imports and extension sync
 */

import { useState } from 'react';
import { Contract } from '../types/contract';
import { parseCSV, validateCSV, exportToCSV, downloadCSV } from '../utils/csv';
import { saveContracts, deduplicateContracts, getStoredContracts } from '../utils/storage';
import { Upload, Zap, FileDown } from 'lucide-react';

interface ImportDataProps {
  onImportComplete?: (contracts: Contract[]) => void;
}

export function ImportData({ onImportComplete }: ImportDataProps) {
  const [csvContent, setCsvContent] = useState('');
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [imported, setImported] = useState<Contract[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      
      // Validate immediately
      const validation = validateCSV(content);
      if (validation.valid) {
        setImportStatus('idle');
        setImportMessage('CSV is valid. Click "Import" to proceed.');
      } else {
        setImportStatus('error');
        setImportMessage(validation.error || 'Invalid CSV format');
      }
    };

    reader.onerror = () => {
      setImportStatus('error');
      setImportMessage('Failed to read file');
    };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-purple-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-purple-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-purple-50');
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvContent(content);
        
        const validation = validateCSV(content);
        if (validation.valid) {
          setImportStatus('idle');
          setImportMessage('CSV is valid. Click "Import" to proceed.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportCSV = async () => {
    const parsed = parseCSV(csvContent);
    if (parsed.length === 0) {
      setImportStatus('error');
      setImportMessage('No valid contracts found in CSV');
      return;
    }

    try {
      // Get existing contracts
      const existing = await getStoredContracts();
      
      // Merge and deduplicate
      const merged = deduplicateContracts([...existing, ...parsed]);
      
      // Save
      await saveContracts(merged);
      
      setImported(parsed);
      setImportStatus('success');
      setImportMessage(`✅ Successfully imported ${parsed.length} contracts. Total: ${merged.length}`);
      
      if (onImportComplete) {
        onImportComplete(merged);
      }
    } catch (error) {
      setImportStatus('error');
      setImportMessage(`Failed to import: ${error}`);
    }
  };

  const handleSyncExtension = async () => {
    try {
      const stored = await getStoredContracts();
      setImported(stored);
      setImportStatus('success');
      setImportMessage(`✅ Synced ${stored.length} contracts from extension`);
    } catch (error) {
      setImportStatus('error');
      setImportMessage('Failed to sync with extension');
    }
  };

  const handleExportData = async () => {
    try {
      const stored = await getStoredContracts();
      const csv = exportToCSV(stored);
      downloadCSV(csv, `spy-contracts-${new Date().toISOString().split('T')[0]}.csv`);
      setImportMessage('✅ Export successful');
    } catch (error) {
      setImportMessage('Failed to export');
    }
  };

  return (
    <div className="space-y-6">
      {/* CSV Upload */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Upload size={24} />
          Import Data
        </h2>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center transition cursor-pointer"
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className="cursor-pointer">
            <p className="text-lg font-semibold text-gray-700 mb-2">
              Drop CSV file here or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports CSV files with columns: strike, type, bid, ask, delta, iv, volume, open_interest
            </p>
          </label>
        </div>

        {csvContent && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Preview (first 100 chars):</p>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
              {csvContent.substring(0, 100)}...
            </pre>
          </div>
        )}

        {importMessage && (
          <div className={`mt-4 p-3 rounded ${
            importStatus === 'success' ? 'bg-green-50 text-green-800' :
            importStatus === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {importMessage}
          </div>
        )}

        <button
          onClick={handleImportCSV}
          disabled={!csvContent}
          className="mt-4 w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Import CSV
        </button>
      </div>

      {/* Extension Sync */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Zap size={24} />
          Sync Extension
        </h2>

        <p className="text-gray-600 mb-4">
          Pull captured contracts directly from the SoFi Options Extractor extension.
        </p>

        <button
          onClick={handleSyncExtension}
          className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Zap size={20} />
          Sync from Extension
        </button>
      </div>

      {/* Export */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FileDown size={24} />
          Export Data
        </h2>

        <p className="text-gray-600 mb-4">
          Download all captured contracts as CSV for analysis in Excel or other tools.
        </p>

        <button
          onClick={handleExportData}
          className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2"
        >
          <FileDown size={20} />
          Export to CSV
        </button>
      </div>

      {/* Imported Data Preview */}
      {imported.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Imported Contracts ({imported.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left">Strike</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Bid</th>
                  <th className="px-4 py-2 text-left">Ask</th>
                  <th className="px-4 py-2 text-left">Delta</th>
                  <th className="px-4 py-2 text-left">IV</th>
                  <th className="px-4 py-2 text-left">Volume</th>
                </tr>
              </thead>
              <tbody>
                {imported.slice(0, 10).map((contract, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{contract.strike}</td>
                    <td className="px-4 py-2 font-semibold">{contract.type}</td>
                    <td className="px-4 py-2">${contract.bid.toFixed(2)}</td>
                    <td className="px-4 py-2">${contract.ask.toFixed(2)}</td>
                    <td className="px-4 py-2">{contract.delta.toFixed(2)}</td>
                    <td className="px-4 py-2">{(contract.iv * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2">{contract.volume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {imported.length > 10 && (
            <p className="mt-2 text-sm text-gray-600">
              ... and {imported.length - 10} more contracts
            </p>
          )}
        </div>
      )}
    </div>
  );
}
