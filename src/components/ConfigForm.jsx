import { useState, useEffect } from 'react';

function ConfigForm({ config, onChange, disabled, transactions = [] }) {
  const [estimatedTime, setEstimatedTime] = useState(null);

  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  // Calculate estimated time
  useEffect(() => {
    if (transactions.length > 0 && config.delay !== undefined && config.delay !== null) {
      const delay = parseFloat(config.delay) || 0;
      const totalDelay = delay * (transactions.length - 1); // Delay antar request
      const estimatedSeconds = totalDelay;
      
      if (estimatedSeconds > 0) {
        const minutes = Math.floor(estimatedSeconds / 60);
        const seconds = Math.floor(estimatedSeconds % 60);
        
        if (minutes > 0) {
          setEstimatedTime(`${minutes} menit ${seconds} detik`);
        } else {
          setEstimatedTime(`${seconds} detik`);
        }
      } else {
        setEstimatedTime('Sangat cepat');
      }
    } else {
      setEstimatedTime(null);
    }
  }, [transactions.length, config.delay]);

  // Preset delay buttons
  const delayPresets = [
    { label: 'Tanpa Delay', value: 0 },
    { label: '0.5s', value: 0.5 },
    { label: '1s', value: 1 },
    { label: '2s', value: 2 },
    { label: '5s', value: 5 }
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Delay Configuration */}
      <div className="flex flex-col gap-3">
        <label htmlFor="delay" className="font-semibold text-gray-700">Delay antar Request (detik)</label>
        <input
          id="delay"
          type="text"
          inputMode="decimal"
          pattern="[0-9]*\.?[0-9]*"
          value={config.delay === 0 || config.delay === null || config.delay === undefined ? '' : config.delay.toString()}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              handleChange('delay', 0);
              return;
            }
            if (/^\d*\.?\d*$/.test(val)) {
              const num = parseFloat(val);
              if (!isNaN(num)) {
                handleChange('delay', num);
              } else if (val === '.' || val === '0.') {
                handleChange('delay', 0);
              }
            }
          }}
          onBlur={(e) => {
            const val = e.target.value;
            if (val === '' || val === '.' || val === '0.') {
              handleChange('delay', 0);
            } else {
              const num = parseFloat(val);
              if (!isNaN(num)) {
                handleChange('delay', num);
              }
            }
          }}
          disabled={disabled}
          className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium"
          placeholder="0"
        />
        <small className="text-gray-500 text-sm flex items-center gap-1">
          <span>💡</span>
          <span>0 = tanpa delay (request langsung berurutan). Contoh: 1 = delay 1 detik, 0.5 = delay 0.5 detik</span>
        </small>
      </div>

      {/* Quick Preset Buttons */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-600">Quick Preset:</label>
        <div className="flex flex-wrap gap-2">
          {delayPresets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleChange('delay', preset.value)}
              disabled={disabled}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                config.delay === preset.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Estimated Time & Stats */}
      {transactions.length > 0 && (
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total Transaksi:</span>
            <span className="text-sm font-semibold text-gray-900">{transactions.length}</span>
          </div>
          {estimatedTime && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Estimasi Waktu:</span>
              <span className="text-sm font-semibold text-gray-900">{estimatedTime}</span>
            </div>
          )}
          {config.delay > 0 && transactions.length > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Total Delay:</span>
              <span className="text-sm font-semibold text-gray-900">
                {(config.delay * (transactions.length - 1)).toFixed(1)} detik
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tips Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <span className="font-semibold">💡 Tips:</span> Gunakan delay untuk menghindari rate limiting. 
            Delay 1-2 detik biasanya cukup aman untuk sebagian besar API.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ConfigForm;
