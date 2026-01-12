import React from 'react';
import { AlertConfig } from '../types';
import { AlertEngine } from '../services/AlertEngine';
import { Bell, Plus, Trash2, Check } from 'lucide-react';

interface AlertConfigState {
  alerts: AlertConfig[];
  showForm: boolean;
  formData: Partial<AlertConfig>;
}

export const AlertConfigPanel: React.FC = () => {
  const [state, setState] = React.useState<AlertConfigState>({
    alerts: [],
    showForm: false,
    formData: {
      name: '',
      conditions: {},
      enabled: true,
      notifyBrowser: true,
    },
  });

  React.useEffect(() => {
    AlertEngine.loadFromStorage();
    setState(prev => ({
      ...prev,
      alerts: AlertEngine.getAllAlerts(),
    }));

    // Request notification permission
    AlertEngine.requestNotificationPermission();
  }, []);

  const handleCreateAlert = () => {
    if (!state.formData.name || !state.formData.conditions) {
      alert('Please fill in all required fields');
      return;
    }

    AlertEngine.createAlert({
      name: state.formData.name!,
      conditions: state.formData.conditions!,
      enabled: state.formData.enabled ?? true,
      notifyBrowser: state.formData.notifyBrowser ?? true,
      notifyEmail: state.formData.notifyEmail,
    });

    setState(prev => ({
      ...prev,
      alerts: AlertEngine.getAllAlerts(),
      showForm: false,
      formData: {
        name: '',
        conditions: {},
        enabled: true,
        notifyBrowser: true,
      },
    }));
  };

  const handleToggleAlert = (id: string) => {
    const alert = state.alerts.find(a => a.id === id);
    if (alert) {
      AlertEngine.updateAlert(id, { enabled: !alert.enabled });
      setState(prev => ({
        ...prev,
        alerts: AlertEngine.getAllAlerts(),
      }));
    }
  };

  const handleDeleteAlert = (id: string) => {
    AlertEngine.deleteAlert(id);
    setState(prev => ({
      ...prev,
      alerts: AlertEngine.getAllAlerts(),
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-600" />
          Trade Alerts
        </h2>

        {/* Create Alert Button */}
        {!state.showForm && (
          <button
            onClick={() => setState(prev => ({ ...prev, showForm: true }))}
            className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create New Alert
          </button>
        )}

        {/* Create Alert Form */}
        {state.showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h3 className="font-bold text-lg mb-4">New Alert Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Name</label>
                <input
                  type="text"
                  placeholder="e.g., High IV Spreads"
                  value={state.formData.name || ''}
                  onChange={(e) =>
                    setState(prev => ({
                      ...prev,
                      formData: { ...prev.formData, name: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={state.formData.notifyEmail || ''}
                  onChange={(e) =>
                    setState(prev => ({
                      ...prev,
                      formData: { ...prev.formData, notifyEmail: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            {/* Conditions */}
            <div className="bg-gray-50 rounded p-3 mb-4">
              <h4 className="font-medium mb-3">Alert Conditions</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Min Delta</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={state.formData.conditions?.deltaMin || 0}
                    onChange={(e) =>
                      setState(prev => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          conditions: {
                            ...prev.formData.conditions,
                            deltaMin: parseFloat(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Max Delta</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={state.formData.conditions?.deltaMax || 1}
                    onChange={(e) =>
                      setState(prev => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          conditions: {
                            ...prev.formData.conditions,
                            deltaMax: parseFloat(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Min IV %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={state.formData.conditions?.ivMin || 0}
                    onChange={(e) =>
                      setState(prev => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          conditions: {
                            ...prev.formData.conditions,
                            ivMin: parseFloat(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Max DTE</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={state.formData.conditions?.expDaysMax || 60}
                    onChange={(e) =>
                      setState(prev => ({
                        ...prev,
                        formData: {
                          ...prev.formData,
                          conditions: {
                            ...prev.formData.conditions,
                            expDaysMax: parseInt(e.target.value),
                          },
                        },
                      }))
                    }
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Notification Options */}
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.formData.notifyBrowser ?? true}
                  onChange={(e) =>
                    setState(prev => ({
                      ...prev,
                      formData: { ...prev.formData, notifyBrowser: e.target.checked },
                    }))
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Browser Notification</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleCreateAlert}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Create Alert
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, showForm: false }))}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Alerts List */}
        {state.alerts.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No alerts configured. Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {state.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`rounded-lg border p-4 ${
                  alert.enabled
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 mb-2">{alert.name}</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      {alert.conditions.deltaMin !== undefined && (
                        <div>
                          Delta: {alert.conditions.deltaMin.toFixed(1)} -{' '}
                          {alert.conditions.deltaMax?.toFixed(1) || '1.0'}
                        </div>
                      )}
                      {alert.conditions.ivMin !== undefined && (
                        <div>IV: {alert.conditions.ivMin.toFixed(1)}% minimum</div>
                      )}
                      {alert.conditions.expDaysMax !== undefined && (
                        <div>Max {alert.conditions.expDaysMax} days to expiration</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleAlert(alert.id)}
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        alert.enabled
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-gray-400 text-white hover:bg-gray-500'
                      }`}
                    >
                      {alert.enabled ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
