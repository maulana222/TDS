import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiClock, FiTrash2, FiEye, FiFileText, FiSearch, FiX, FiDatabase } from 'react-icons/fi';
import { listHistoryFiles, loadTransactionHistory, deleteHistoryFile, clearAllHistory } from '../utils/storage';
import { deleteAllTransactions, deleteTransactionById } from '../services/deleteApi';
import { getTransactions } from '../services/transactionApi';
import { getCurrentUser, getUserRoles } from '../services/authService';

function History() {
  const [historyFiles, setHistoryFiles] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Cek apakah user adalah member (bukan admin)
  const userRoles = getUserRoles();
  const isMember = userRoles.includes('member') && !userRoles.includes('admin');

  useEffect(() => {
    // Jika member, jangan load history
    if (!isMember) {
      loadHistoryList();
    } else {
      // Set empty untuk member
      setHistoryFiles([]);
      setSelectedHistory(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMember]);

  const loadHistoryList = async () => {
    try {
      setLoading(true);
      const files = await listHistoryFiles();
      
      // Debug: Log files
      console.log('History files found:', {
        count: files.length,
        files: files
      });
      
      setHistoryFiles(files);
      
      if (files.length === 0) {
        console.log('Tidak ada history files di localStorage');
      }
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
      
      // Debug: Log data structure
      console.log('Loaded history data:', {
        filename,
        hasResults: !!data.results,
        resultsCount: data.results?.length || 0,
        hasTransactions: !!data.transactions,
        transactionsCount: data.transactions?.length || 0,
        batchId: data.batch_id,
        timestamp: data.timestamp,
        fullData: data
      });
      
      // Validasi data structure
      if (!data) {
        throw new Error('Data history kosong');
      }
      
      // Pastikan results ada dan dalam format array
      if (!data.results || !Array.isArray(data.results)) {
        console.warn('History data tidak memiliki results array, menggunakan empty array');
        data.results = [];
      }
      
      setSelectedHistory({ ...data, filename });
      setStatusFilter('all');
      setSearchQuery('');
      
      // Notifikasi jika data berhasil di-load
      if (data.results && data.results.length > 0) {
        toast.success(`Berhasil memuat ${data.results.length} transaksi dari history`);
      } else {
        toast.warning('History file ditemukan tapi tidak ada data transaksi');
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error(`Error loading history: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHistoryFile = async (filename, e) => {
    e.stopPropagation(); // Prevent loading history when clicking delete
    
    if (!window.confirm(`Yakin ingin menghapus history file "${filename}"?`)) {
      return;
    }

    try {
      await deleteHistoryFile(filename);
      toast.success('History file berhasil dihapus');
      
      // Clear selected history if it's the deleted file
      if (selectedHistory?.filename === filename) {
        setSelectedHistory(null);
      }
      
      // Reload history list
      await loadHistoryList();
    } catch (error) {
      console.error('Error deleting history file:', error);
      toast.error(error.message || 'Gagal menghapus history file');
    }
  };

  const handleDeleteAllHistoryFiles = async () => {
    if (historyFiles.length === 0) {
      toast.error('Tidak ada history file untuk dihapus');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus semua history file (${historyFiles.length} file)?\n\nTindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    try {
      await clearAllHistory();
      toast.success(`Berhasil menghapus ${historyFiles.length} history file`);
      
      // Clear selected history
      setSelectedHistory(null);
      
      // Reload history list
      await loadHistoryList();
    } catch (error) {
      console.error('Error deleting all history files:', error);
      toast.error(error.message || 'Gagal menghapus history files');
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

  const handleDeleteSingle = async (transaction) => {
    const transactionId = transaction.id;
    const refId = transaction.ref_id;

    if (!transactionId && !refId) {
      toast.error('Transaction ID atau Ref ID tidak ditemukan');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus transaksi dengan Ref ID: ${refId || transactionId}?`)) {
      return;
    }

    try {
      toast.loading('Menghapus transaksi...', { id: 'delete-single' });
      
      // Jika tidak ada ID, coba hapus berdasarkan ref_id dengan mencari di database dulu
      if (!transactionId && refId) {
        // Cari transaksi di database berdasarkan ref_id
        const { getTransactions } = await import('../services/transactionApi');
        const response = await getTransactions({ ref_id: refId }, { page: 1, limit: 1 });
        
        if (response.success && response.data && response.data.length > 0) {
          const dbTransaction = response.data[0];
          await deleteTransactionById(dbTransaction.id);
        } else {
          throw new Error('Transaksi tidak ditemukan di database');
        }
      } else {
        await deleteTransactionById(transactionId);
      }
      
      toast.dismiss('delete-single');
      toast.success('Berhasil menghapus transaksi');
      
      // Remove from selected history
      if (selectedHistory && selectedHistory.results) {
        const updatedResults = selectedHistory.results.filter(r => {
          if (transactionId) {
            return r.id !== transactionId;
          } else if (refId) {
            return r.ref_id !== refId;
          }
          return true;
        });
        setSelectedHistory({
          ...selectedHistory,
          results: updatedResults
        });
      }
      
      // Reload history list
      await loadHistoryList();
    } catch (error) {
      toast.dismiss('delete-single');
      console.error('Error deleting transaction:', error);
      toast.error(error.message || 'Gagal menghapus transaksi');
    }
  };

  const handleViewDetail = (transaction) => {
    const detail = `
Ref ID: ${transaction.ref_id || '-'}
Customer Number: ${transaction.customer_no || '-'}
Product Code: ${transaction.product_code || '-'}
Status: ${transaction.success ? 'Success' : 'Failed'}
SN: ${transaction.sn || transaction.data?.sn || '-'}
RC: ${transaction.data?.rc || '-'}
Message: ${transaction.data?.message || transaction.error || '-'}
Response Time: ${transaction.responseTime ? `${transaction.responseTime}ms` : '-'}
Timestamp: ${transaction.timestamp ? new Date(transaction.timestamp).toLocaleString('id-ID') : '-'}
    `.trim();
    
    alert(detail);
  };

  const filteredResults = getFilteredResults();
  const successCount = selectedHistory?.results?.filter(r => r.success).length || 0;
  const failedCount = selectedHistory?.results?.filter(r => !r.success).length || 0;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 px-4 py-6">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
            <FiClock className="w-7 h-7 text-gray-700" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Transaction History</h1>
            <p className="text-gray-600">Lihat dan kelola riwayat transaksi sebelumnya</p>
          </div>
        </div>
        {!isMember && (
          <button
            onClick={handleDeleteAll}
            disabled={deleting}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <FiTrash2 className="w-4 h-4" />
                <span>Hapus Semua</span>
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <FiFileText className="w-5 h-5 text-gray-700" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">History Files</h2>
            </div>
            {!isMember && historyFiles.length > 0 && (
              <button
                onClick={handleDeleteAllHistoryFiles}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1.5"
                title="Hapus semua history files"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                Hapus Semua
              </button>
            )}
          </div>
          
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin text-3xl mb-2">⏳</div>
              <p className="text-gray-500">Loading...</p>
            </div>
          )}
          
          {historyFiles.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3 text-gray-400">📭</div>
              <p className="text-gray-500 font-medium text-sm">
                {isMember ? 'Tidak ada data history untuk member' : 'Belum ada history transaksi'}
              </p>
            </div>
          )}
          
          <ul className="space-y-2">
            {historyFiles.map((file, idx) => (
              <li key={idx}>
                <div className={`group flex items-center gap-2 px-4 py-3 border rounded-lg transition-all duration-200 ${
                  selectedHistory?.filename === file
                    ? 'bg-gray-50 border-gray-300'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}>
                  <button 
                    onClick={() => !isMember && handleLoadHistory(file)}
                    disabled={isMember}
                    className="flex-1 flex items-center gap-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiFileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{file}</span>
                  </button>
                  {!isMember && (
                    <button
                      onClick={(e) => handleDeleteHistoryFile(file, e)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Hapus history file"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          {selectedHistory && (
            <div>
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                      <FiClock className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-800">Detail History</h2>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <span className="block text-xs font-medium text-gray-600 mb-1">Berhasil</span>
                    <span className="block text-2xl font-bold text-gray-900">{successCount}</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <span className="block text-xs font-medium text-gray-600 mb-1">Gagal</span>
                    <span className="block text-2xl font-bold text-gray-900">{failedCount}</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                    <span className="block text-xs font-medium text-gray-600 mb-1">Total</span>
                    <span className="block text-2xl font-bold text-gray-900">{selectedHistory.results?.length || 0}</span>
                  </div>
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
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customer/product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-gray-400 text-sm w-full sm:w-64 bg-white"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        title="Clear search"
                      >
                        <FiX className="w-4 h-4" />
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
                              SN
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                              RC
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                              Timestamp
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                              Aksi
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
                                {(() => {
                                  const statusString = result.statusString || result.data?.status || (result.success ? 'Sukses' : 'Gagal');
                                  const isPending = statusString === 'Pending' || statusString === 'pending' || result.data?.rc === '03';
                                  
                                  if (isPending) {
                                    return (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Pending
                                      </span>
                                    );
                                  } else if (result.success || statusString === 'Sukses' || statusString === 'sukses') {
                                    return (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        Success
                                      </span>
                                    );
                                  } else {
                                    return (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Failed
                                      </span>
                                    );
                                  }
                                })()}
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
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="font-mono text-xs">{result.sn || result.data?.sn || '-'}</span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {result.data?.rc || '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {result.timestamp ? new Date(result.timestamp).toLocaleString('id-ID') : '-'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleViewDetail(result)}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-1"
                                    title="Lihat detail"
                                  >
                                    <FiEye className="w-3 h-3" />
                                    Detail
                                  </button>
                                  {(result.id || result.ref_id) && (
                                    <button
                                      onClick={() => handleDeleteSingle(result)}
                                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors flex items-center gap-1"
                                      title="Hapus transaksi"
                                    >
                                      <FiTrash2 className="w-3 h-3" />
                                      Hapus
                                    </button>
                                  )}
                                </div>
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
              <p className="text-gray-500 font-medium text-lg">
                {isMember ? 'Tidak ada data history untuk member' : 'Pilih file history untuk melihat detail'}
              </p>
              {!isMember && (
                <p className="text-gray-400 text-sm mt-2">Klik salah satu file di sebelah kiri</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;

