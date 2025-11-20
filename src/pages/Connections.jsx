import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiWifi, FiWifiOff, FiEdit2, FiCheckCircle, FiXCircle, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getSettings as getSettingsFromAPI } from '../services/settingsApi';
import { getBackendUrl } from '../services/authService';

function Connections() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([
    {
      id: 'digiswitch',
      name: 'Digiswitch',
      type: 'API',
      status: 'tidak_aktif',
      username: '',
      apiKey: '',
      balance: null,
      lastChecked: null,
      isConfigured: false
    },
    {
      id: 'digiflazz',
      name: 'Digiflazz',
      type: 'API',
      status: 'tidak_aktif',
      username: '',
      apiKey: '',
      balance: null,
      lastChecked: null,
      isConfigured: false
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const settings = await getSettingsFromAPI();
      
      setConnections(prev => prev.map(conn => {
        if (conn.id === 'digiswitch') {
          const hasUsername = !!(settings.digiprosb_username);
          const hasApiKey = !!(settings.digiprosb_api_key);
          const isConfigured = hasUsername && hasApiKey;
          return {
            ...conn,
            username: settings.digiprosb_username || '',
            apiKey: settings.digiprosb_api_key || '',
            isConfigured,
            status: isConfigured ? 'aktif' : 'tidak_aktif'
          };
        }
        if (conn.id === 'digiflazz') {
          const hasUsername = !!(settings.digiflazz_username);
          const hasApiKey = !!(settings.digiflazz_api_key);
          const isConfigured = hasUsername && hasApiKey;
          return {
            ...conn,
            username: settings.digiflazz_username || '',
            apiKey: settings.digiflazz_api_key || '',
            isConfigured,
            status: isConfigured ? 'aktif' : 'tidak_aktif'
          };
        }
        return conn;
      }));
    } catch (error) {
      console.error('Error loading connections:', error);
      toast.error('Gagal memuat data koneksi');
    } finally {
      setLoading(false);
    }
  };

  const checkBalance = async (connectionId) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    if (!connection.isConfigured || !connection.username || !connection.apiKey) {
      toast.error('Koneksi belum dikonfigurasi. Silakan isi settings terlebih dahulu.');
      return;
    }

    try {
      setCheckingBalance(connectionId);
      
      if (connectionId === 'digiswitch') {
        // Request ke backend proxy endpoint
        const backendUrl = getBackendUrl();
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${backendUrl}/api/connections/check-balance`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();
        
        if (response.ok && data.success && data.data && data.data.balance !== undefined) {
          const balance = parseFloat(data.data.balance);
          
          // Update balance dan status
          setConnections(prev => prev.map(conn => {
            if (conn.id === connectionId) {
              return {
                ...conn,
                balance: balance,
                lastChecked: new Date().toISOString(),
                status: 'aktif'
              };
            }
            return conn;
          }));

          toast.success(`Saldo ${connection.name}: Rp ${balance.toLocaleString('id-ID')}`);
        } else {
          throw new Error(data.message || 'Gagal mendapatkan saldo');
        }
      }
    } catch (error) {
      console.error(`Error checking balance ${connectionId}:`, error);
      setConnections(prev => prev.map(conn => {
        if (conn.id === connectionId) {
          return {
            ...conn,
            balance: null,
            lastChecked: new Date().toISOString()
          };
        }
        return conn;
      }));
      toast.error(`Gagal mengecek saldo ${connection.name}: ${error.message || 'Unknown error'}`);
    } finally {
      setCheckingBalance(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aktif':
        return 'text-green-600 bg-green-100';
      case 'tidak_aktif':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'aktif':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'tidak_aktif':
        return <FiXCircle className="w-5 h-5" />;
      default:
        return <FiXCircle className="w-5 h-5" />;
    }
  };

  const formatBalance = (balance) => {
    if (balance === null || balance === undefined) return '-';
    return `Rp ${balance.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Koneksi</h1>
        <p className="text-gray-600">Kelola dan monitor koneksi API</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={loadConnections}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Connections Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Nama Koneksi
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Tipe
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Saldo
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {connections.map((connection) => (
                <tr key={connection.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {connection.id === 'digiswitch' ? (
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                          <span className="text-orange-600 text-xl">🔑</span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 text-xl">🔌</span>
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                          {connection.id === 'digiswitch' ? (
                            <span className="text-orange-600">🔑</span>
                          ) : (
                            <span className="text-blue-600">🔌</span>
                          )}
                          {connection.name}
                        </div>
                        <div className="text-xs text-gray-500">ID: {connection.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {connection.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(connection.status)}`}>
                      {getStatusIcon(connection.status)}
                      <span>
                        {connection.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {checkingBalance === connection.id && (
                        <FiRefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                      )}
                      <span className="text-sm font-semibold text-gray-900">
                        {formatBalance(connection.balance)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => checkBalance(connection.id)}
                        disabled={checkingBalance === connection.id || !connection.isConfigured}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cek Saldo"
                      >
                        {checkingBalance === connection.id ? (
                          <FiRefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <FiRefreshCw className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/connections/edit/${connection.id}`)}
                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Edit Koneksi"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 text-lg">ℹ️</span>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Informasi Koneksi:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Status "Aktif" jika Username dan API Key sudah dikonfigurasi</li>
              <li>Klik tombol Cek Saldo untuk melihat saldo deposit</li>
              <li>Untuk mengubah konfigurasi, klik tombol Edit dan arahkan ke halaman Settings</li>
              <li>Pastikan Username dan API Key sudah diisi di Settings</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Connections;

