import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  FiRefreshCw, 
  FiFilter, 
  FiDownload, 
  FiTrash2, 
  FiEye, 
  FiX, 
  FiDatabase 
} from 'react-icons/fi';
import { getTransactions } from '../services/transactionApi';
import { deleteTransactionById } from '../services/deleteApi';
import { onTransactionUpdate, getSocket } from '../services/socketService';

function TransactionManagement() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    customerNo: '',
    productCode: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    if (pagination.page === 1) {
      loadTransactions();
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.startDate, filters.endDate, filters.status, filters.customerNo, filters.productCode]);

  // Setup Socket.IO untuk real-time updates
  useEffect(() => {
    const unsubscribeTransaction = onTransactionUpdate((updatedTransaction) => {
      
      // Update transactions jika ref_id match
      setTransactions(prevTransactions => {
        const index = prevTransactions.findIndex(t => t.ref_id === updatedTransaction.ref_id);
        
        if (index >= 0) {
          // Update existing transaction dengan semua field yang diperlukan
          const existingTransaction = prevTransactions[index];
          
          // Check apakah ada perubahan yang signifikan (tanpa JSON.stringify untuk performa)
          const hasChanged = 
            existingTransaction.success !== updatedTransaction.success ||
            existingTransaction.status_code !== updatedTransaction.status_code ||
            existingTransaction.status !== updatedTransaction.status ||
            existingTransaction.sn !== updatedTransaction.sn ||
            (updatedTransaction.response_data && 
             (existingTransaction.response_data?.rc !== updatedTransaction.response_data?.rc ||
              existingTransaction.response_data?.status !== updatedTransaction.response_data?.status));
          
          // Selalu update untuk memastikan data terbaru, bahkan jika tidak ada perubahan signifikan
          // Ini penting untuk memastikan real-time update terlihat
          
          // Buat array baru dengan transaction yang di-update (selalu update untuk memastikan re-render)
          const newTransactions = prevTransactions.map((tx, i) => {
            if (i === index) {
              // Update transaction yang match dengan semua field terbaru
              return {
                ...tx,
                success: updatedTransaction.success !== undefined ? updatedTransaction.success : tx.success,
                status_code: updatedTransaction.status_code !== undefined ? updatedTransaction.status_code : tx.status_code,
                status: updatedTransaction.status !== undefined ? updatedTransaction.status : tx.status,
                response_data: updatedTransaction.response_data !== undefined ? updatedTransaction.response_data : tx.response_data,
                error_message: updatedTransaction.error_message !== undefined ? updatedTransaction.error_message : tx.error_message,
                raw_response: updatedTransaction.raw_response !== undefined ? updatedTransaction.raw_response : tx.raw_response,
                sn: updatedTransaction.sn !== undefined ? updatedTransaction.sn : tx.sn,
                updated_at: updatedTransaction.updated_at || updatedTransaction.created_at || tx.updated_at || tx.created_at
              };
            }
            return tx;
          });
          
          // Return array baru untuk force re-render
          return newTransactions;
        }
        
        // Jika transaction belum ada di list, tidak perlu reload
        // Karena mungkin tidak sesuai dengan filter atau pagination saat ini
        return prevTransactions;
      });
    });

    // Cleanup saat unmount
    return () => {
      unsubscribeTransaction();
    };
  }, []); // Hanya run sekali saat mount

  const loadTransactions = async () => {
    try {
      setLoading(true);
      
      const filterParams = {};
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        filterParams.start_date = startDate.toISOString();
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        filterParams.end_date = endDate.toISOString();
      } else if (filters.startDate) {
        const endDate = new Date(filters.startDate);
        endDate.setHours(23, 59, 59, 999);
        filterParams.end_date = endDate.toISOString();
      }
      
      if (filters.status === 'success') {
        filterParams.success = 'true';
      } else if (filters.status === 'failed') {
        filterParams.success = 'false';
      }
      
      if (filters.customerNo) {
        filterParams.customer_no = filters.customerNo;
      }
      
      if (filters.productCode) {
        filterParams.product_code = filters.productCode;
      }

      const response = await getTransactions(
        filterParams,
        {
          page: pagination.page,
          limit: pagination.limit
        }
      );

      if (response.success && response.data) {
        setTransactions(response.data);
        
        if (response.pagination) {
          setPagination(prev => ({
            ...prev,
            page: response.pagination.page || pagination.page,
            total: response.pagination.total || 0,
            totalPages: Math.ceil((response.pagination.total || 0) / pagination.limit)
          }));
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: 'all',
      customerNo: '',
      productCode: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleDelete = async (transactionId, refId) => {
    if (!window.confirm(`Yakin ingin menghapus transaksi dengan Ref ID: ${refId || transactionId}?`)) {
      return;
    }

    try {
      toast.loading('Menghapus transaksi...', { id: 'delete' });
      await deleteTransactionById(transactionId);
      toast.dismiss('delete');
      toast.success('Transaksi berhasil dihapus');
      loadTransactions();
    } catch (error) {
      toast.dismiss('delete');
      console.error('Error deleting transaction:', error);
      toast.error(error.message || 'Gagal menghapus transaksi');
    }
  };

  const handleViewDetail = (transaction) => {
    setSelectedTransaction(transaction);
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Memuat data transaksi...</p>
        </div>
      </div>
    );
  }

  const successCount = transactions.filter(t => t.success).length;
  const failedCount = transactions.filter(t => !t.success).length;

  return (
    <div className="w-full space-y-6 px-2 md:px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Management Transaksi</h1>
          <p className="text-gray-500 text-sm">Kelola dan monitor semua transaksi</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <FiFilter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Section - Collapsible */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Filter Transaksi</h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Mulai</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Tanggal Akhir</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Semua</option>
                <option value="success">Berhasil</option>
                <option value="failed">Gagal</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Customer Number</label>
              <input
                type="text"
                placeholder="Cari..."
                value={filters.customerNo}
                onChange={(e) => handleFilterChange('customerNo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Product Code</label>
              <input
                type="text"
                placeholder="Cari..."
                value={filters.productCode}
                onChange={(e) => handleFilterChange('productCode', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Statistics - Only show if there are transactions */}
      {pagination.total > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1">Total Transaksi</p>
                <p className="text-2xl font-bold text-blue-900">{pagination.total}</p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                <FiDatabase className="w-5 h-5 text-blue-700" />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 mb-1">Berhasil</p>
                <p className="text-2xl font-bold text-green-900">{successCount}</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-lg flex items-center justify-center">
                <span className="text-lg">✅</span>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 mb-1">Gagal</p>
                <p className="text-2xl font-bold text-red-900">{failedCount}</p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center">
                <span className="text-lg">❌</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">
            Daftar Transaksi {pagination.total > 0 && `(${pagination.total})`}
          </h3>
          {transactions.length > 0 && (
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
              title="Export to Excel"
            >
              <FiDownload className="w-4 h-4" />
              Export
            </button>
          )}
        </div>
        
        <div className="overflow-x-auto p-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">Ref ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">SN</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase border-r border-gray-200">RC</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-16 text-center">
                    <p className="text-gray-500">Tidak ada transaksi</p>
                    <p className="text-sm text-gray-400 mt-1">Gunakan filter untuk mencari atau refresh untuk memuat data</p>
                  </td>
                </tr>
               ) : (
                 transactions.map((transaction, idx) => {
                   return (
                     <tr 
                       key={`${transaction.id}_${transaction.success}_${transaction.status_code}_${transaction.updated_at || transaction.created_at}`} 
                       className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
                     >
                      <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                        {new Date(transaction.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        {(() => {
                          const statusString = transaction.status || transaction.response_data?.status || (transaction.success ? 'Sukses' : 'Gagal');
                          const isPending = statusString === 'Pending' || statusString === 'pending' || transaction.response_data?.rc === '03';
                          
                          if (isPending) {
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                Pending
                              </span>
                            );
                          } else if (transaction.success || statusString === 'Sukses' || statusString === 'sukses') {
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                Success
                              </span>
                            );
                          } else {
                            return (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                                Failed
                              </span>
                            );
                          }
                        })()}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <span className="text-sm text-gray-900 font-mono">
                          {transaction.customer_no_used || transaction.customer_no}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium border-r border-gray-200">
                        {transaction.product_code}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-200">
                        <span className="text-sm font-mono text-gray-700">{transaction.ref_id || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-200">
                        <span className="font-mono text-xs">{transaction.sn || transaction.response_data?.sn || '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-200">
                        {transaction.response_data?.rc || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetail(transaction)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Lihat detail"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id, transaction.ref_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus transaksi"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-600">
                Menampilkan <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> - <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> dari <span className="font-medium">{pagination.total}</span> hasil
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">Per halaman:</span>
                  <select
                    value={pagination.limit}
                    onChange={(e) => {
                      setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
                    }}
                    className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={200}>200</option>
                  </select>
                </div>
              )}
            </div>
            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1 || loading}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Halaman pertama"
                >
                  ««
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1 || loading}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Halaman sebelumnya"
                >
                  «
                </button>
                
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
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
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
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Halaman berikutnya"
                >
                  »
                </button>
                <button
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages || loading}
                  className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Halaman terakhir"
                >
                  »»
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Detail Transaksi</h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Ref ID</p>
                  <p className="text-sm font-mono text-gray-900">{selectedTransaction.ref_id || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    selectedTransaction.success 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedTransaction.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Customer Number</p>
                  <p className="text-sm font-mono text-gray-900">{selectedTransaction.customer_no}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Product Code</p>
                  <p className="text-sm text-gray-900">{selectedTransaction.product_code}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">RC</p>
                  <p className="text-sm text-gray-900">{selectedTransaction.response_data?.rc || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Tanggal</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedTransaction.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              {selectedTransaction.response_data && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Response Data</p>
                  <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                    {JSON.stringify(selectedTransaction.response_data, null, 2)}
                  </pre>
                </div>
              )}
              {selectedTransaction.error_message && (
                <div>
                  <p className="text-xs font-medium text-red-500 mb-2">Error Message</p>
                  <p className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">{selectedTransaction.error_message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionManagement;

