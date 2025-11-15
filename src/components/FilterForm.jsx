import { useState } from 'react';

function FilterForm({ filters, onFilterChange, onReset }) {
  const [localFilters, setLocalFilters] = useState({
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
    status: filters.status || 'all',
    customerNo: filters.customerNo || '',
    productCode: filters.productCode || ''
  });

  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      status: 'all',
      customerNo: '',
      productCode: ''
    };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
    if (onReset) onReset();
  };

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700">Filter Transaksi</h4>
        <button
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-700 font-medium"
        >
          Reset Filter
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Tanggal Mulai */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={localFilters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Tanggal Akhir */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tanggal Akhir
          </label>
          <input
            type="date"
            value={localFilters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Status
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">Semua</option>
            <option value="success">Berhasil</option>
            <option value="failed">Gagal</option>
          </select>
        </div>

        {/* Customer Number */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Customer Number
          </label>
          <input
            type="text"
            placeholder="Cari customer..."
            value={localFilters.customerNo}
            onChange={(e) => handleChange('customerNo', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Product Code */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Product Code
          </label>
          <input
            type="text"
            placeholder="Cari product..."
            value={localFilters.productCode}
            onChange={(e) => handleChange('productCode', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export default FilterForm;

