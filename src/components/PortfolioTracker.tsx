import React from 'react';
import { PortfolioPosition, OptionContract } from '../types';
import { PortfolioService } from '../services/PortfolioService';
import { Briefcase, Upload, Download, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

interface PortfolioTrackerProps {
  contracts: OptionContract[];
}

export const PortfolioTracker: React.FC<PortfolioTrackerProps> = ({ contracts }) => {
  const [positions, setPositions] = React.useState<PortfolioPosition[]>([]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    symbol: '',
    quantity: 1,
    entryPrice: 0,
  });

  React.useEffect(() => {
    PortfolioService.loadFromStorage();
    PortfolioService.updateWithLiveData(contracts);
    setPositions(PortfolioService.getPositions());
  }, [contracts]);

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await PortfolioService.importFromCSV(file);
      setPositions(imported);
      toast.success(`Imported ${imported.length} position${imported.length !== 1 ? 's' : ''}`);
    } catch (e) {
      toast.error('Failed to import CSV: ' + String(e));
    }

    event.target.value = '';
  };

  const handleExportCSV = () => {
    const csv = PortfolioService.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spy-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddPosition = () => {
    if (!formData.symbol || formData.quantity <= 0 || formData.entryPrice <= 0) {
      toast.error('Please fill in all fields');
      return;
    }

    const newPosition: PortfolioPosition = {
      symbol: formData.symbol,
      quantity: formData.quantity,
      entryPrice: formData.entryPrice,
      currentPrice: formData.entryPrice,
      pnl: 0,
      pnlPercent: 0,
    };

    PortfolioService.addPosition(newPosition);
    setPositions(PortfolioService.getPositions());
    setFormData({ symbol: '', quantity: 1, entryPrice: 0 });
    setShowAddForm(false);
    toast.success('Position added');
  };

  const handleDeletePosition = (symbol: string) => {
    PortfolioService.deletePosition(symbol);
    setPositions(PortfolioService.getPositions());
    toast.success('Position deleted');
  };

  const totalPnL = PortfolioService.getTotalPnL();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-purple-600" />
          Portfolio Tracker
        </h2>

        {/* Import/Export Controls */}
        <div className="flex gap-2 mb-4">
          <label className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportCSV}
            disabled={positions.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Position
          </button>
        </div>

        {/* Add Position Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="font-bold mb-3">Add New Position</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Symbol (e.g., SPY250117C00450000)"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="px-3 py-2 border border-gray-300 rounded"
              />
              <input
                type="number"
                placeholder="Entry Price"
                step="0.01"
                value={formData.entryPrice}
                onChange={(e) => setFormData({ ...formData, entryPrice: parseFloat(e.target.value) || 0 })}
                className="px-3 py-2 border border-gray-300 rounded"
              />
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleAddPosition}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Portfolio Summary */}
        {positions.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Positions</p>
                <p className="text-2xl font-bold text-gray-900">{positions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total P&L</p>
                <p className={`text-2xl font-bold ${totalPnL.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${totalPnL.pnl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">P&L %</p>
                <p className={`text-2xl font-bold ${totalPnL.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalPnL.pnlPercent.toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Entry</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(positions.reduce((sum, p) => sum + p.entryPrice * p.quantity, 0) / positions.reduce((sum, p) => sum + p.quantity, 0)).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Positions Table */}
        {positions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-4">No positions tracked. Import a CSV or add manually.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Symbol</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Quantity</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Entry Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Current Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">P&L</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">P&L %</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {positions.map((pos) => (
                  <tr key={pos.symbol} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">{pos.symbol}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{pos.quantity}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">${pos.entryPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">${pos.currentPrice.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${pos.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${pos.pnl.toFixed(2)}
                    </td>
                    <td className={`px-4 py-3 text-sm font-semibold ${pos.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {pos.pnlPercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeletePosition(pos.symbol)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded inline-block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
