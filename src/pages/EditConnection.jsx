import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getSettings as getSettingsFromAPI, saveSettings as saveSettingsToAPI } from '../services/settingsApi.js';
import { clearSettingsCache } from '../services/settingsService.js';

function EditConnection() {
  const navigate = useNavigate();
  const { connectionId } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connection, setConnection] = useState({
    id: connectionId || 'digiswitch',
    name: connectionId === 'digiflazz' ? 'Digiflazz' : 'Digiswitch',
    username: '',
    apiKey: '',
    endpoint: connectionId === 'digiflazz' 
      ? 'https://api.digiflazz.com/v1/transaction'
      : 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
  });
  const [originalConnection, setOriginalConnection] = useState(null);

  useEffect(() => {
    loadConnection();
  }, [connectionId]);

  const loadConnection = async () => {
    try {
      setLoading(true);
      const settings = await getSettingsFromAPI();
      
      const isDigiflazz = connectionId === 'digiflazz';
      
      const connectionData = {
        id: connectionId || 'digiswitch',
        name: isDigiflazz ? 'Digiflazz' : 'Digiswitch',
        username: isDigiflazz 
          ? (settings.digiflazz_username || '') 
          : (settings.digiprosb_username || ''),
        apiKey: isDigiflazz 
          ? (settings.digiflazz_api_key || '') 
          : (settings.digiprosb_api_key || ''),
        endpoint: isDigiflazz 
          ? (settings.digiflazz_endpoint || 'https://api.digiflazz.com/v1/transaction')
          : (settings.digiprosb_endpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction')
      };
      
      setConnection(connectionData);
      setOriginalConnection({ ...connectionData });
    } catch (error) {
      console.error('Error loading connection:', error);
      toast.error('Gagal memuat data koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConnection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validasi
    if (!connection.username || !connection.apiKey || !connection.endpoint) {
      toast.error('Username, API Key, dan Endpoint harus diisi!');
      return;
    }

    // Validasi URL endpoint
    try {
      new URL(connection.endpoint);
    } catch (e) {
      toast.error('API Endpoint harus berupa URL yang valid!');
      return;
    }

    try {
      setSaving(true);
      
      // Load current settings untuk keep other settings unchanged
      const currentSettings = await getSettingsFromAPI();
      
      const isDigiflazz = connectionId === 'digiflazz';
      
      // Save ke settings API
      const settingsToSave = {
        defaultDelay: currentSettings.default_delay || 0,
        defaultLimit: currentSettings.default_limit || 50,
        autoRefresh: currentSettings.auto_refresh || false,
        refreshInterval: currentSettings.refresh_interval || 30,
        showNotifications: currentSettings.show_notifications !== undefined ? currentSettings.show_notifications : true,
        exportFormat: currentSettings.export_format || 'excel',
        telegramBotToken: currentSettings.telegram_bot_token || '',
        // Digiswitch settings
        digiprosbUsername: isDigiflazz ? (currentSettings.digiprosb_username || '') : connection.username,
        digiprosbApiKey: isDigiflazz ? (currentSettings.digiprosb_api_key || '') : connection.apiKey,
        digiprosbEndpoint: isDigiflazz ? (currentSettings.digiprosb_endpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction') : connection.endpoint,
        // Digiflazz settings
        digiflazzUsername: isDigiflazz ? connection.username : (currentSettings.digiflazz_username || ''),
        digiflazzApiKey: isDigiflazz ? connection.apiKey : (currentSettings.digiflazz_api_key || ''),
        digiflazzEndpoint: isDigiflazz ? connection.endpoint : (currentSettings.digiflazz_endpoint || 'https://api.digiflazz.com/v1/transaction')
      };

      await saveSettingsToAPI(settingsToSave);
      clearSettingsCache();
      
      toast.success('Koneksi berhasil disimpan!');
      navigate('/connections');
    } catch (error) {
      console.error('Error saving connection:', error);
      toast.error(error.message || 'Gagal menyimpan koneksi');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalConnection) {
      setConnection({ ...originalConnection });
    }
    navigate('/connections');
  };

  const hasChanges = () => {
    if (!originalConnection) return false;
    return (
      connection.username !== originalConnection.username ||
      connection.apiKey !== originalConnection.apiKey ||
      connection.endpoint !== originalConnection.endpoint
    );
  };

  const isConfigured = connection.username && connection.apiKey && connection.endpoint;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Memuat data koneksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Kembali"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Koneksi</h1>
            <p className="text-gray-600">Konfigurasi koneksi {connection.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              <FiCheckCircle className="w-4 h-4" />
              <span>Terkonfigurasi</span>
            </div>
          )}
          {!isConfigured && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
              <FiXCircle className="w-4 h-4" />
              <span>Belum Dikonfigurasi</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 ${connectionId === 'digiflazz' ? 'bg-blue-100' : 'bg-orange-100'} rounded-xl flex items-center justify-center`}>
            <span className={`${connectionId === 'digiflazz' ? 'text-blue-600' : 'text-orange-600'} text-2xl`}>
              {connectionId === 'digiflazz' ? '🔌' : '🔑'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{connection.name}</h2>
            <p className="text-sm text-gray-500">ID: {connection.id}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={connection.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Masukkan username"
            />
            <p className="mt-1 text-xs text-gray-500">Username untuk autentikasi API</p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={connection.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                placeholder="Masukkan API Key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showApiKey ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">API Key untuk autentikasi dan signature generation</p>
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={connection.endpoint}
              onChange={(e) => handleChange('endpoint', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
              placeholder={connectionId === 'digiflazz' ? 'https://api.digiflazz.com/v1/transaction' : 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'}
            />
            <p className="mt-1 text-xs text-gray-500">URL endpoint untuk API</p>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Informasi:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Pastikan username dan API key sudah benar</li>
                  <li>API key akan digunakan untuk generate signature MD5</li>
                  <li>Setting ini akan digunakan untuk semua request transaksi</li>
                  <li>Perubahan akan berlaku setelah disimpan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges() || !isConfigured}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin">⏳</div>
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              <span>Simpan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default EditConnection;



import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getSettings as getSettingsFromAPI, saveSettings as saveSettingsToAPI } from '../services/settingsApi.js';
import { clearSettingsCache } from '../services/settingsService.js';

function EditConnection() {
  const navigate = useNavigate();
  const { connectionId } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [connection, setConnection] = useState({
    id: connectionId || 'digiswitch',
    name: connectionId === 'digiflazz' ? 'Digiflazz' : 'Digiswitch',
    username: '',
    apiKey: '',
    endpoint: connectionId === 'digiflazz' 
      ? 'https://api.digiflazz.com/v1/transaction'
      : 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
  });
  const [originalConnection, setOriginalConnection] = useState(null);

  useEffect(() => {
    loadConnection();
  }, [connectionId]);

  const loadConnection = async () => {
    try {
      setLoading(true);
      const settings = await getSettingsFromAPI();
      
      const isDigiflazz = connectionId === 'digiflazz';
      
      const connectionData = {
        id: connectionId || 'digiswitch',
        name: isDigiflazz ? 'Digiflazz' : 'Digiswitch',
        username: isDigiflazz 
          ? (settings.digiflazz_username || '') 
          : (settings.digiprosb_username || ''),
        apiKey: isDigiflazz 
          ? (settings.digiflazz_api_key || '') 
          : (settings.digiprosb_api_key || ''),
        endpoint: isDigiflazz 
          ? (settings.digiflazz_endpoint || 'https://api.digiflazz.com/v1/transaction')
          : (settings.digiprosb_endpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction')
      };
      
      setConnection(connectionData);
      setOriginalConnection({ ...connectionData });
    } catch (error) {
      console.error('Error loading connection:', error);
      toast.error('Gagal memuat data koneksi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setConnection(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // Validasi
    if (!connection.username || !connection.apiKey || !connection.endpoint) {
      toast.error('Username, API Key, dan Endpoint harus diisi!');
      return;
    }

    // Validasi URL endpoint
    try {
      new URL(connection.endpoint);
    } catch (e) {
      toast.error('API Endpoint harus berupa URL yang valid!');
      return;
    }

    try {
      setSaving(true);
      
      // Load current settings untuk keep other settings unchanged
      const currentSettings = await getSettingsFromAPI();
      
      const isDigiflazz = connectionId === 'digiflazz';
      
      // Save ke settings API
      const settingsToSave = {
        defaultDelay: currentSettings.default_delay || 0,
        defaultLimit: currentSettings.default_limit || 50,
        autoRefresh: currentSettings.auto_refresh || false,
        refreshInterval: currentSettings.refresh_interval || 30,
        showNotifications: currentSettings.show_notifications !== undefined ? currentSettings.show_notifications : true,
        exportFormat: currentSettings.export_format || 'excel',
        telegramBotToken: currentSettings.telegram_bot_token || '',
        // Digiswitch settings
        digiprosbUsername: isDigiflazz ? (currentSettings.digiprosb_username || '') : connection.username,
        digiprosbApiKey: isDigiflazz ? (currentSettings.digiprosb_api_key || '') : connection.apiKey,
        digiprosbEndpoint: isDigiflazz ? (currentSettings.digiprosb_endpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction') : connection.endpoint,
        // Digiflazz settings
        digiflazzUsername: isDigiflazz ? connection.username : (currentSettings.digiflazz_username || ''),
        digiflazzApiKey: isDigiflazz ? connection.apiKey : (currentSettings.digiflazz_api_key || ''),
        digiflazzEndpoint: isDigiflazz ? connection.endpoint : (currentSettings.digiflazz_endpoint || 'https://api.digiflazz.com/v1/transaction')
      };

      await saveSettingsToAPI(settingsToSave);
      clearSettingsCache();
      
      toast.success('Koneksi berhasil disimpan!');
      navigate('/connections');
    } catch (error) {
      console.error('Error saving connection:', error);
      toast.error(error.message || 'Gagal menyimpan koneksi');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalConnection) {
      setConnection({ ...originalConnection });
    }
    navigate('/connections');
  };

  const hasChanges = () => {
    if (!originalConnection) return false;
    return (
      connection.username !== originalConnection.username ||
      connection.apiKey !== originalConnection.apiKey ||
      connection.endpoint !== originalConnection.endpoint
    );
  };

  const isConfigured = connection.username && connection.apiKey && connection.endpoint;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Memuat data koneksi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Kembali"
          >
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Edit Koneksi</h1>
            <p className="text-gray-600">Konfigurasi koneksi {connection.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              <FiCheckCircle className="w-4 h-4" />
              <span>Terkonfigurasi</span>
            </div>
          )}
          {!isConfigured && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
              <FiXCircle className="w-4 h-4" />
              <span>Belum Dikonfigurasi</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection Info Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-14 h-14 ${connectionId === 'digiflazz' ? 'bg-blue-100' : 'bg-orange-100'} rounded-xl flex items-center justify-center`}>
            <span className={`${connectionId === 'digiflazz' ? 'text-blue-600' : 'text-orange-600'} text-2xl`}>
              {connectionId === 'digiflazz' ? '🔌' : '🔑'}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{connection.name}</h2>
            <p className="text-sm text-gray-500">ID: {connection.id}</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={connection.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="Masukkan username"
            />
            <p className="mt-1 text-xs text-gray-500">Username untuk autentikasi API</p>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={connection.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
                placeholder="Masukkan API Key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
              >
                {showApiKey ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">API Key untuk autentikasi dan signature generation</p>
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Endpoint <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={connection.endpoint}
              onChange={(e) => handleChange('endpoint', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm transition-all"
              placeholder={connectionId === 'digiflazz' ? 'https://api.digiflazz.com/v1/transaction' : 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'}
            />
            <p className="mt-1 text-xs text-gray-500">URL endpoint untuk API</p>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 text-lg">ℹ️</span>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Informasi:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Pastikan username dan API key sudah benar</li>
                  <li>API key akan digunakan untuk generate signature MD5</li>
                  <li>Setting ini akan digunakan untuk semua request transaksi</li>
                  <li>Perubahan akan berlaku setelah disimpan</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <button
          onClick={handleCancel}
          disabled={saving}
          className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Batal
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges() || !isConfigured}
          className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin">⏳</div>
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <FiSave className="w-4 h-4" />
              <span>Simpan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default EditConnection;


