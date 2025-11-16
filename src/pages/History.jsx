import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { listHistoryFiles, loadTransactionHistory } from '../utils/storage';
import { deleteAllTransactions, deleteTransactionsByDateRange } from '../services/deleteApi';

function History() {
  const [historyFiles, setHistoryFiles] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadHistoryList();
  }, []);

  const loadHistoryList = async () => {
    try {
      setLoading(true);
      const files = await listHistoryFiles();
      setHistoryFiles(files);
    } catch (error) {
      console.error('Error loading history list:', error);
      toast.error('Gagal memuat daftar history');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadHistory = async (filename) => {
    try {
      setLoading(true);
      const data = await loadTransactionHistory(filename);
      setSelectedHistory(data);
      setStatusFilter('all');
      setSearchQuery('');
    } catch (error) {
      toast.error(`Error loading history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter results
  const getFilteredResults = () => {
    if (!selectedHistory || !selectedHistory.results) return [];
    
    let filtered = selectedHistory.results;
    
    // Filter by status
    if (statusFilter === 'success') {
      filtered = filtered.filter(r => r.success);
    } else if (statusFilter === 'failed') {
      filtered = filtered.filter(r => !r.success);
    }
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.customer_no?.toLowerCase().includes(query) ||
        r.product_code?.toLowerCase().includes(query) ||
        r.ref_id?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('⚠️ PERINGATAN!\n\nApakah Anda yakin ingin menghapus SEMUA transaksi dari database?\n\nTindakan ini TIDAK DAPAT DIBATALKAN!')) {
      return;
    }

    // Double confirmation
    const confirmText = prompt('Ketik "HAPUS SEMUA" untuk konfirmasi:');
    if (confirmText !== 'HAPUS SEMUA') {
      toast.error('Konfirmasi dibatalkan');
      return;
    }

    try {
      setDeleting(true);
      const result = await deleteAllTransactions();
      toast.success(`Berhasil menghapus ${result.deleted_count} transaksi`);
      
      // Clear selected history
      setSelectedHistory(null);
      
      // Reload history list
      await loadHistoryList();
    } catch (error) {
      console.error('Error deleting transactions:', error);
      toast.error(error.message || 'Gagal menghapus transaksi');
    } finally {
      setDeleting(false);
    }
  };

  const filteredResults = getFilteredResults();
  const successCount = selectedHistory?.results?.filter(r => r.success).length || 0;
  const failedCount = selectedHistory?.results?.filter(r => !r.success).length || 0;

  return (
    <div className="w-full space-y-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">Lihat dan kelola riwayat transaksi sebelumnya</p>
        </div>
        <button
          onClick={handleDeleteAll}
          disabled={deleting}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Menghapus...
            </span>
          ) : (
            '🗑️ Hapus Semua Transaksi'
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-orange-600 text-xl">📁</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">History Files</h2>
          </div>
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              <p className="text-gray-500">Loading...</p>
            </div>
          )}
          
          {historyFiles.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-500 font-medium">Belum ada history transaksi</p>
            </div>
          )}
          
          <ul className="space-y-2">
            {historyFiles.map((file, idx) => (
              <li key={idx}>
                <button 
                  onClick={() => handleLoadHistory(file)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-lg text-left hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <span>📄</span>
                    <span className="truncate">{file}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedHistory && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-xl">📊</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Detail History</h2>
                    {selectedHistory.timestamp && (
                      <p className="text-sm text-gray-500 mt-1">
                        {new Date(selectedHistory.timestamp).toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
                {selectedHistory.batch_id && (
                  <div className="text-sm text-gray-600">
                    Batch ID: <span className="font-mono font-semibold">{selectedHistory.batch_id}</span>
                  </div>
                )}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 text-center shadow-sm">
                  <span className="block text-sm font-semibold text-green-700 mb-1">Berhasil</span>
                  <span className="block text-3xl font-bold text-green-700">{successCount}</span>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-300 rounded-xl p-4 text-center shadow-sm">
                  <span className="block text-sm font-semibold text-red-700 mb-1">Gagal</span>
                  <span className="block text-3xl font-bold text-red-700">{failedCount}</span>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 text-center shadow-sm">
                  <span className="block text-sm font-semibold text-blue-700 mb-1">Total</span>
                  <span className="block text-3xl font-bold text-blue-700">{selectedHistory.results?.length || 0}</span>
                </div>
              </div>

              {/* Filter & Search */}
              {selectedHistory.results && selectedHistory.results.length > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
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
                      All ({selectedHistory.results.length})
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

              {/* Results Count */}
              {selectedHistory.results && selectedHistory.results.length > 0 && (statusFilter !== 'all' || searchQuery) && (
                <div className="mb-4 text-sm text-gray-600">
                  Menampilkan {filteredResults.length} dari {selectedHistory.results.length} hasil
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                {!selectedHistory.results || selectedHistory.results.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">📋</div>
                    <p className="text-gray-500 font-medium">Tidak ada data transaksi</p>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🔍</div>
                    <p className="text-gray-500 font-medium">Tidak ada hasil yang sesuai filter</p>
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setSearchQuery('');
                      }}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Reset filter
                    </button>
                  </div>
                ) : (
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
                              Message/Error
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                              Response Time
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                              Timestamp
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredResults.map((result, idx) => (
                            <tr 
                              key={result.ref_id || idx}
                              className={`hover:bg-gray-50 transition-colors ${
                                result.success ? 'bg-white' : 'bg-red-50/30'
                              }`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {idx + 1}
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
                              <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                                <div className="truncate" title={result.data?.message || result.error || '-'}>
                                  {result.data?.message || result.error || '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {result.responseTime ? `${result.responseTime}ms` : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {result.timestamp ? new Date(result.timestamp).toLocaleString('id-ID') : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {!selectedHistory && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 font-medium text-lg">Pilih file history untuk melihat detail</p>
              <p className="text-gray-400 text-sm mt-2">Klik salah satu file di sebelah kiri</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;

