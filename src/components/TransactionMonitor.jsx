import { useState, useMemo } from 'react';
import { FiCheckCircle, FiXCircle, FiActivity } from 'react-icons/fi';

function TransactionMonitor({ 
  progress, 
  results, 
  isProcessing, 
  isPaused, 
  remainingCount,
  pagination = null,
  onPageChange = null,
  loading = false,
  onDelete = null,
  onViewDetail = null
}) {
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'success', 'failed'
  const [searchQuery, setSearchQuery] = useState('');

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;

  // Filter dan search results
  const filteredResults = useMemo(() => {
    let filtered = results;

    // Filter by status
    if (statusFilter === 'success') {
      filtered = filtered.filter(r => r.success);
    } else if (statusFilter === 'failed') {
      filtered = filtered.filter(r => !r.success);
    }

    // Search by customer number or product code
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.customer_no?.toLowerCase().includes(query) ||
        r.product_code?.toLowerCase().includes(query) ||
        r.ref_id?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [results, statusFilter, searchQuery]);

  return (
    <div className="flex flex-col gap-6">
      {progress && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-gray-800">Progress</h3>
            <div className="flex items-center gap-3">
              {isPaused && remainingCount > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-semibold">
                  ⏸️ Dijeda ({remainingCount} tersisa)
                </span>
              )}
              <span className="font-bold text-blue-700 text-lg">
                {progress.current} / {progress.total} 
                <span className="text-base ml-1">({progress.progress.toFixed(1)}%)</span>
              </span>
            </div>
          </div>
          <div className="w-full h-7 bg-white rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          {isPaused && remainingCount > 0 && (
            <p className="text-sm text-yellow-700 mt-3 font-medium">
              ⏸️ Proses dihentikan. Klik tombol "Lanjutkan" untuk melanjutkan {remainingCount} transaksi yang tersisa.
            </p>
          )}
          {isProcessing && (
            <p className="text-sm text-gray-600 mt-2">
              Memproses transaksi ke-{progress.current}...
            </p>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Berhasil</p>
              <p className="text-3xl font-bold text-gray-900">{successCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Gagal</p>
              <p className="text-3xl font-bold text-gray-900">{failedCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <FiXCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total</p>
              <p className="text-3xl font-bold text-gray-900">{results.length}</p>
            </div>
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FiActivity className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex flex-col sm:flex-row gap-4 mb-4 items-start sm:items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Hasil Transaksi</h3>
          
          {/* Filter & Search */}
          {results.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Status Filter */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    statusFilter === 'all'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  All ({results.length})
                </button>
                <button
                  onClick={() => setStatusFilter('success')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    statusFilter === 'success'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✅ ({successCount})
                </button>
                <button
                  onClick={() => setStatusFilter('failed')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    statusFilter === 'failed'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ❌ ({failedCount})
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Search customer/product..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full sm:w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Count & Pagination Info */}
        <div className="mb-4 flex items-center justify-between">
          {pagination && (
            <div className="text-sm text-gray-600">
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} hasil
            </div>
          )}
          {!pagination && results.length > 0 && (statusFilter !== 'all' || searchQuery) && (
            <div className="text-sm text-gray-600">
              Menampilkan {filteredResults.length} dari {results.length} hasil
            </div>
          )}
          {loading && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Memuat data...
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Customer Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Product Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Ref ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      RC
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                      Aksi
                    </th>
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.length === 0 && !isProcessing && !loading && (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center">
                        <div className="text-5xl mb-3">📋</div>
                        <p className="text-gray-500 font-medium">Belum ada transaksi</p>
                        <p className="text-gray-400 text-sm mt-1">Mulai dengan upload Excel atau input manual untuk melihat data transaksi di sini</p>
                      </td>
                    </tr>
                  )}
                  {loading && results.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="animate-spin text-2xl">⏳</span>
                          <p className="text-gray-500 font-medium">Memuat data...</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {results.length > 0 && filteredResults.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-4 py-12 text-center">
                        <div className="text-5xl mb-3">🔍</div>
                        <p className="text-gray-500 font-medium">Tidak ada hasil yang sesuai filter</p>
                        <button
                          onClick={() => {
                            setStatusFilter('all');
                            setSearchQuery('');
                          }}
                          className="mt-3 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          Reset filter
                        </button>
                      </td>
                    </tr>
                  )}
                  {filteredResults.length > 0 && filteredResults.map((result, idx) => {
                    // Calculate row number based on pagination
                    const rowNumber = pagination 
                      ? ((pagination.page - 1) * pagination.limit) + idx + 1
                      : (result.index || idx + 1);
                    
                    return (
                    <tr 
                      key={result.ref_id || idx}
                      className={`hover:bg-gray-50 transition-colors ${
                        result.success ? 'bg-white' : 'bg-red-50/30'
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {rowNumber}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          result.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {result.success ? '✅ Success' : '❌ Failed'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-mono">
                          {result.customer_no}
                          {result.customer_no_used && result.customer_no_used !== result.customer_no && (
                            <div className="text-xs text-blue-600 mt-0.5">
                              → {result.customer_no_used}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {result.product_code}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span className="font-mono text-xs">{result.ref_id || '-'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {result.data?.rc || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {onViewDetail && (
                            <button
                              onClick={() => onViewDetail(result)}
                              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Lihat detail"
                            >
                              👁️ Detail
                            </button>
                          )}
                          {onDelete && result.id && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Yakin ingin menghapus transaksi dengan Ref ID: ${result.ref_id || result.id}?`)) {
                                  onDelete(result.id);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title="Hapus transaksi"
                            >
                              🗑️ Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && onPageChange && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-600">
              Halaman {pagination.page} dari {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(1)}
                disabled={pagination.page === 1 || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ««
              </button>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                « Prev
              </button>
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 text-sm font-medium rounded-lg ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next »
              </button>
              <button
                onClick={() => onPageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransactionMonitor;

