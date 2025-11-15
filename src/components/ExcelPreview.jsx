import { useState } from 'react';

function ExcelPreview({ previewData, onConfirm, onCancel }) {
  const [showAll, setShowAll] = useState(false);
  
  if (!previewData) return null;

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Tampilkan semua data atau hanya preview
  const displayData = showAll ? previewData.allData : previewData.preview;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <h2 className="text-2xl font-bold mb-2">Preview Data Excel</h2>
          <p className="text-blue-100">Periksa data sebelum melanjutkan</p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* File Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm text-gray-600 mb-1">Nama File</div>
              <div className="font-semibold text-gray-900 truncate">{previewData.fileName}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-sm text-gray-600 mb-1">Total Transaksi</div>
              <div className="text-2xl font-bold text-green-700">{previewData.totalRows}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-sm text-gray-600 mb-1">Ukuran File</div>
              <div className="font-semibold text-gray-900">{formatFileSize(previewData.fileSize)}</div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              {showAll ? 'Semua Data' : `Preview Data (menampilkan ${previewData.preview.length} baris pertama)`}
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">No</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Customer Number (Original)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Customer Number (Untuk Request)</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b">Product Code</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayData.map((row) => (
                      <tr key={row.no} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{row.no}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono">{row.customer_no}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-mono text-blue-600 font-semibold">{row.customer_no_normalized}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{row.product_code}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {previewData.totalRows > 10 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="mt-3 w-full px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm"
              >
                📋 Lihat Semua Data ({previewData.totalRows} baris)
              </button>
            )}
            {showAll && (
              <button
                onClick={() => setShowAll(false)}
                className="mt-3 w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
              >
                ↑ Sembunyikan (tampilkan 10 baris pertama)
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
          >
            ✅ Konfirmasi & Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExcelPreview;
