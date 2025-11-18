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
    <div className="border-b border-gray-200 pb-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-base font-semibold text-gray-900">Filter Transaksi</h4>
        <button
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Tanggal Mulai */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Tanggal Mulai
          </label>
          <input
            type="date"
            value={localFilters.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>

        {/* Tanggal Akhir */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Tanggal Akhir
          </label>
          <input
            type="date"
            value={localFilters.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={localFilters.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white"
          >
            <option value="all">Semua</option>
            <option value="success">Berhasil</option>
            <option value="failed">Gagal</option>
          </select>
        </div>

        {/* Customer Number */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Customer Number
          </label>
          <input
            type="text"
            placeholder="Cari customer..."
            value={localFilters.customerNo}
            onChange={(e) => handleChange('customerNo', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white placeholder-gray-400"
          />
        </div>

        {/* Product Code */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            Product Code
          </label>
          <input
            type="text"
            placeholder="Cari product..."
            value={localFilters.productCode}
            onChange={(e) => handleChange('productCode', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 bg-white placeholder-gray-400"
          />
        </div>
      </div>
    </div>
  );
}

export default FilterForm;

