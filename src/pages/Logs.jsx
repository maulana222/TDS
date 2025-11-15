import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getLogs, getLogStats } from '../services/logApi';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    log_type: 'all',
    direction: 'all',
    ref_id: '',
    start_date: '',
    end_date: ''
  });
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [pagination.page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      const filterParams = {};
      if (filters.log_type !== 'all') filterParams.log_type = filters.log_type;
      if (filters.direction !== 'all') filterParams.direction = filters.direction;
      if (filters.ref_id) filterParams.ref_id = filters.ref_id;
      if (filters.start_date) {
        const startDate = new Date(filters.start_date);
        startDate.setHours(0, 0, 0, 0);
        filterParams.start_date = startDate.toISOString();
      }
      if (filters.end_date) {
        const endDate = new Date(filters.end_date);
        endDate.setHours(23, 59, 59, 999);
        filterParams.end_date = endDate.toISOString();
      }

      const response = await getLogs(filterParams, {
        page: pagination.page,
        limit: pagination.limit
      });

      if (response.success) {
        setLogs(response.data || []);
        
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
      console.error('Error loading logs:', error);
      toast.error('Gagal memuat log');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const filterParams = {};
      if (filters.start_date) {
        const startDate = new Date(filters.start_date);
        startDate.setHours(0, 0, 0, 0);
        filterParams.start_date = startDate.toISOString();
      }
      if (filters.end_date) {
        const endDate = new Date(filters.end_date);
        endDate.setHours(23, 59, 59, 999);
        filterParams.end_date = endDate.toISOString();
      }

      const statsData = await getLogStats(filterParams);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getLogTypeLabel = (type) => {
    const labels = {
      'callback_in': 'Callback In',
      'callback_out': 'Callback Out',
      'transaction_request': 'Transaction Request',
      'transaction_response': 'Transaction Response',
      'error': 'Error'
    };
    return labels[type] || type;
  };

  const getLogTypeColor = (type) => {
    const colors = {
      'callback_in': 'bg-blue-100 text-blue-800',
      'callback_out': 'bg-purple-100 text-purple-800',
      'transaction_request': 'bg-green-100 text-green-800',
      'transaction_response': 'bg-emerald-100 text-emerald-800',
      'error': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getDirectionIcon = (direction) => {
    return direction === 'incoming' ? '⬇️' : '⬆️';
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Transaction Logs</h1>
        <p className="text-gray-600">Lihat log callback dan transaksi</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
            <span className="block text-sm font-semibold text-gray-700 mb-1">Total</span>
            <span className="block text-2xl font-bold text-gray-900">{stats.total || 0}</span>
          </div>
          <div className="bg-blue-50 rounded-xl shadow-sm border border-blue-200 p-4 text-center">
            <span className="block text-sm font-semibold text-blue-700 mb-1">Callback In</span>
            <span className="block text-2xl font-bold text-blue-900">{stats.callback_in_count || 0}</span>
          </div>
          <div className="bg-purple-50 rounded-xl shadow-sm border border-purple-200 p-4 text-center">
            <span className="block text-sm font-semibold text-purple-700 mb-1">Callback Out</span>
            <span className="block text-2xl font-bold text-purple-900">{stats.callback_out_count || 0}</span>
          </div>
          <div className="bg-green-50 rounded-xl shadow-sm border border-green-200 p-4 text-center">
            <span className="block text-sm font-semibold text-green-700 mb-1">Request</span>
            <span className="block text-2xl font-bold text-green-900">{stats.transaction_request_count || 0}</span>
          </div>
          <div className="bg-emerald-50 rounded-xl shadow-sm border border-emerald-200 p-4 text-center">
            <span className="block text-sm font-semibold text-emerald-700 mb-1">Response</span>
            <span className="block text-2xl font-bold text-emerald-900">{stats.transaction_response_count || 0}</span>
          </div>
          <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 p-4 text-center">
            <span className="block text-sm font-semibold text-red-700 mb-1">Error</span>
            <span className="block text-2xl font-bold text-red-900">{stats.error_count || 0}</span>
          </div>
          <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-200 p-4 text-center">
            <span className="block text-sm font-semibold text-indigo-700 mb-1">Incoming</span>
            <span className="block text-2xl font-bold text-indigo-900">{stats.incoming_count || 0}</span>
          </div>
          <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-200 p-4 text-center">
            <span className="block text-sm font-semibold text-yellow-700 mb-1">Outgoing</span>
            <span className="block text-2xl font-bold text-yellow-900">{stats.outgoing_count || 0}</span>
          </div>
        </div>
      )}

      {/* Filter Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <span className="text-indigo-600 text-xl">🔍</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Filter Logs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Log Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Log Type
            </label>
            <select
              value={filters.log_type}
              onChange={(e) => handleFilterChange('log_type', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua</option>
              <option value="callback_in">Callback In</option>
              <option value="callback_out">Callback Out</option>
              <option value="transaction_request">Transaction Request</option>
              <option value="transaction_response">Transaction Response</option>
              <option value="error">Error</option>
            </select>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Direction
            </label>
            <select
              value={filters.direction}
              onChange={(e) => handleFilterChange('direction', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Semua</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>
          </div>

          {/* Ref ID */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Ref ID
            </label>
            <input
              type="text"
              placeholder="Cari ref_id..."
              value={filters.ref_id}
              onChange={(e) => handleFilterChange('ref_id', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={() => {
              setFilters({
                log_type: 'all',
                direction: 'all',
                ref_id: '',
                start_date: '',
                end_date: ''
              });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Reset Filter
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Logs</h2>
          <button
            onClick={loadLogs}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 text-sm disabled:opacity-50"
          >
            {loading ? '⏳ Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Pagination Info */}
        {pagination.total > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} log
          </div>
        )}

        <div className="overflow-x-auto">
          {logs.length === 0 && !loading ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-500 font-medium">Belum ada log</p>
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
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Direction
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Ref ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Method
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Timestamp
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log, idx) => {
                      const rowNumber = ((pagination.page - 1) * pagination.limit) + idx + 1;
                      return (
                        <tr 
                          key={log.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {rowNumber}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLogTypeColor(log.log_type)}`}>
                              {getLogTypeLabel(log.log_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className="text-lg">{getDirectionIcon(log.direction)}</span>
                            <span className="ml-1 capitalize">{log.direction}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="font-mono text-xs">{log.ref_id || '-'}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <span className="font-semibold">{log.method || '-'}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                            <div className="truncate font-mono text-xs" title={log.endpoint || '-'}>
                              {log.endpoint || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.status_code ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                log.status_code >= 200 && log.status_code < 300
                                  ? 'bg-green-100 text-green-800'
                                  : log.status_code >= 400
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {log.status_code}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {log.execution_time ? `${log.execution_time}ms` : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="text-sm text-gray-600">
              Halaman {pagination.page} dari {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(1)}
                disabled={pagination.page === 1 || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ««
              </button>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1 || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                « Prev
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
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next »
              </button>
              <button
                onClick={() => handlePageChange(pagination.totalPages)}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Log Detail</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Log Type</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLogTypeColor(selectedLog.log_type)}`}>
                      {getLogTypeLabel(selectedLog.log_type)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
                    <p className="text-sm text-gray-900 capitalize">{selectedLog.direction}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ref ID</label>
                    <p className="text-sm font-mono text-gray-900">{selectedLog.ref_id || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Code</label>
                    <p className="text-sm text-gray-900">{selectedLog.status_code || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                    <p className="text-sm text-gray-900">{selectedLog.method || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Execution Time</label>
                    <p className="text-sm text-gray-900">{selectedLog.execution_time ? `${selectedLog.execution_time}ms` : '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                    <p className="text-sm text-gray-900">{selectedLog.ip_address || '-'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timestamp</label>
                    <p className="text-sm text-gray-900">{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('id-ID') : '-'}</p>
                  </div>
                </div>

                {selectedLog.endpoint && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                    <p className="text-sm font-mono text-gray-900 bg-gray-50 p-2 rounded">{selectedLog.endpoint}</p>
                  </div>
                )}

                {selectedLog.request_body && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Request Body</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-60">
                      {JSON.stringify(selectedLog.request_body, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.response_body && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Response Body</label>
                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto max-h-60">
                      {JSON.stringify(selectedLog.response_body, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.error_message && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                    <p className="text-sm text-red-600 bg-red-50 p-3 rounded">{selectedLog.error_message}</p>
                  </div>
                )}

                {selectedLog.user_agent && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Agent</label>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{selectedLog.user_agent}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Logs;

