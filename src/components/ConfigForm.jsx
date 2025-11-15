function ConfigForm({ config, onChange, disabled }) {
  const handleChange = (field, value) => {
    onChange({
      ...config,
      [field]: value
    });
  };

  return (
    <div className="flex flex-col gap-4">
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
            // Allow empty, angka, dan titik desimal
            if (val === '') {
              handleChange('delay', 0);
              return;
            }
            // Validasi hanya angka dan titik desimal
            if (/^\d*\.?\d*$/.test(val)) {
              const num = parseFloat(val);
              if (!isNaN(num)) {
                handleChange('delay', num);
              } else if (val === '.' || val === '0.') {
                // Allow typing decimal
                handleChange('delay', 0);
              }
            }
          }}
          onBlur={(e) => {
            // Pastikan value valid saat blur
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
        />
        <small className="text-gray-500 text-sm flex items-center gap-1">
          <span>💡</span>
          <span>0 = tanpa delay (request langsung berurutan). Contoh: 1 = delay 1 detik, 0.5 = delay 0.5 detik</span>
        </small>
      </div>
    </div>
  );
}

export default ConfigForm;

