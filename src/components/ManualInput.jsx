import { useState } from 'react';

function ManualInput({ onGenerateTransactions, disabled }) {
  const [formData, setFormData] = useState({
    productCode: '',
    customerNumber: '',
    totalRequests: 1
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.productCode.trim()) {
      alert('Product Code harus diisi');
      return;
    }
    
    if (!formData.customerNumber.trim()) {
      alert('Customer Number harus diisi');
      return;
    }
    
    const total = parseInt(formData.totalRequests) || 1;
    if (total < 1 || total > 1000) {
      alert('Jumlah request harus antara 1-1000');
      return;
    }
    
    // Generate transactions array
    const transactions = Array.from({ length: total }, (_, index) => ({
      customer_no: formData.customerNumber.trim(),
      product_code: formData.productCode.trim(),
      row_number: index + 1
    }));
    
    onGenerateTransactions(transactions);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="productCode" className="font-semibold text-gray-700 text-sm">
          Product Code <span className="text-red-500">*</span>
        </label>
        <input
          id="productCode"
          type="text"
          value={formData.productCode}
          onChange={(e) => handleChange('productCode', e.target.value.toUpperCase())}
          disabled={disabled}
          placeholder="Contoh: MLK24"
          className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="customerNumber" className="font-semibold text-gray-700 text-sm">
          Customer Number <span className="text-red-500">*</span>
        </label>
        <input
          id="customerNumber"
          type="text"
          value={formData.customerNumber}
          onChange={(e) => handleChange('customerNumber', e.target.value)}
          disabled={disabled}
          placeholder="Contoh: 681208532121"
          className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="totalRequests" className="font-semibold text-gray-700 text-sm">
          Jumlah Request <span className="text-red-500">*</span>
        </label>
        <input
          id="totalRequests"
          type="number"
          min="1"
          max="1000"
          value={formData.totalRequests}
          onChange={(e) => {
            const val = parseInt(e.target.value) || 1;
            if (val >= 1 && val <= 1000) {
              handleChange('totalRequests', val);
            }
          }}
          disabled={disabled}
          placeholder="1-1000"
          className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all font-medium"
        />
        <small className="text-gray-500 text-xs flex items-center gap-1">
          <span>💡</span>
          <span>Jumlah request yang akan dibuat dengan product code dan customer number yang sama</span>
        </small>
      </div>

      <button
        type="submit"
        disabled={disabled || !formData.productCode.trim() || !formData.customerNumber.trim()}
        className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
      >
        🚀 Generate & Proses Transaksi
      </button>
    </form>
  );
}

export default ManualInput;

