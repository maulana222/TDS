import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getCurrentUser } from '../services/authService';
import { getSettings as getSettingsFromAPI, saveSettings as saveSettingsToAPI, resetSettings as resetSettingsFromAPI } from '../services/settingsApi.js';
import { clearSettingsCache } from '../services/settingsService.js';

function Settings() {
  const [settings, setSettings] = useState({
    defaultDelay: 0,
    defaultLimit: 50,
    autoRefresh: false,
    refreshInterval: 30,
    showNotifications: true,
    exportFormat: 'excel',
    // Digiprosb API Settings
    digiprosbUsername: '',
    digiprosbApiKey: '',
    digiprosbEndpoint: 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
  });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadSettings();
    loadUserInfo();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const apiSettings = await getSettingsFromAPI();
      
      // Convert backend format ke frontend format
      setSettings({
        defaultDelay: apiSettings.default_delay || 0,
        defaultLimit: apiSettings.default_limit || 50,
        autoRefresh: apiSettings.auto_refresh || false,
        refreshInterval: apiSettings.refresh_interval || 30,
        showNotifications: apiSettings.show_notifications !== undefined ? apiSettings.show_notifications : true,
        exportFormat: apiSettings.export_format || 'excel',
        digiprosbUsername: apiSettings.digiprosb_username || '',
        digiprosbApiKey: apiSettings.digiprosb_api_key || '',
        digiprosbEndpoint: apiSettings.digiprosb_endpoint || 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Gagal memuat pengaturan dari server');
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = () => {
    try {
      const currentUser = getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const saveSettings = async () => {
    try {
      // Validasi Digiprosb API Settings
      if (!settings.digiprosbUsername || !settings.digiprosbApiKey || !settings.digiprosbEndpoint) {
        toast.error('Username, API Key, dan API Endpoint harus diisi!');
        return;
      }

      // Validasi URL endpoint
      try {
        new URL(settings.digiprosbEndpoint);
      } catch (e) {
        toast.error('API Endpoint harus berupa URL yang valid!');
        return;
      }

      setLoading(true);
      await saveSettingsToAPI(settings);
      clearSettingsCache(); // Clear cache setelah save
      toast.success('Pengaturan berhasil disimpan!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Gagal menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  const resetSettings = async () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan pengaturan ke default?')) {
      try {
        setLoading(true);
        await resetSettingsFromAPI();
        clearSettingsCache(); // Clear cache setelah reset
        await loadSettings(); // Reload settings
        toast.success('Pengaturan telah direset ke default');
      } catch (error) {
        console.error('Error resetting settings:', error);
        toast.error('Gagal mereset pengaturan');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Kelola pengaturan aplikasi</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">⚙️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Pengaturan Umum</h2>
            </div>

            <div className="space-y-5">
              {/* Default Delay */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Delay antar Request (detik)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={settings.defaultDelay}
                  onChange={(e) => handleChange('defaultDelay', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <p className="mt-1 text-xs text-gray-500">Delay default yang akan digunakan saat memulai request</p>
              </div>

              {/* Default Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Limit Pagination
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={settings.defaultLimit}
                  onChange={(e) => handleChange('defaultLimit', parseInt(e.target.value) || 50)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="50"
                />
                <p className="mt-1 text-xs text-gray-500">Jumlah data per halaman (10-1000)</p>
              </div>

              {/* Export Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format Export Default
                </label>
                <select
                  value={settings.exportFormat}
                  onChange={(e) => handleChange('exportFormat', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Format file saat export hasil transaksi</p>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">🔔</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Pengaturan Notifikasi</h2>
            </div>

            <div className="space-y-5">
              {/* Show Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tampilkan Notifikasi
                  </label>
                  <p className="text-xs text-gray-500">Aktifkan notifikasi toast untuk update transaksi</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showNotifications}
                    onChange={(e) => handleChange('showNotifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Auto Refresh Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">🔄</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Auto Refresh</h2>
            </div>

            <div className="space-y-5">
              {/* Auto Refresh Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Aktifkan Auto Refresh
                  </label>
                  <p className="text-xs text-gray-500">Otomatis refresh data dari database secara berkala</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoRefresh}
                    onChange={(e) => handleChange('autoRefresh', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Refresh Interval */}
              {settings.autoRefresh && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interval Refresh (detik)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    step="5"
                    value={settings.refreshInterval}
                    onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value) || 30)}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="30"
                  />
                  <p className="mt-1 text-xs text-gray-500">Interval refresh otomatis (5-300 detik)</p>
                </div>
              )}
            </div>
          </div>

          {/* Digiprosb API Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">🔑</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Digiprosb API Settings</h2>
            </div>

            <div className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={settings.digiprosbUsername}
                  onChange={(e) => handleChange('digiprosbUsername', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan username Digiprosb"
                />
                <p className="mt-1 text-xs text-gray-500">Username untuk autentikasi API Digiprosb</p>
              </div>

              {/* API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={settings.digiprosbApiKey}
                  onChange={(e) => handleChange('digiprosbApiKey', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="Masukkan API Key Digiprosb"
                />
                <p className="mt-1 text-xs text-gray-500">API Key untuk autentikasi dan signature generation</p>
              </div>

              {/* API Endpoint */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Endpoint <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={settings.digiprosbEndpoint}
                  onChange={(e) => handleChange('digiprosbEndpoint', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                  placeholder="https://digiprosb.api.digiswitch.id/v1/user/api/transaction"
                />
                <p className="mt-1 text-xs text-gray-500">URL endpoint untuk API Digiprosb</p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Penting:</p>
                    <ul className="list-disc list-inside space-y-1 text-yellow-700">
                      <li>Pastikan username dan API key sudah benar</li>
                      <li>API key akan digunakan untuk generate signature MD5</li>
                      <li>Setting ini akan digunakan untuk semua request transaksi</li>
                      <li>Perubahan setting akan berlaku setelah disimpan</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={saveSettings}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Menyimpan...' : '💾 Simpan Pengaturan'}
            </button>
            <button
              onClick={resetSettings}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-all duration-200"
            >
              🔄 Reset
            </button>
          </div>
        </div>

        {/* User Info Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 text-xl">👤</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Informasi User</h2>
            </div>

            {user ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
                  <p className="text-sm font-semibold text-gray-900">{user.username || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <p className="text-sm font-semibold text-gray-900">{user.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">User ID</label>
                  <p className="text-sm font-mono text-gray-600">{user.id || '-'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-gray-500 text-sm">Tidak ada informasi user</p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Informasi Aplikasi</h3>
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Version:</span>
                  <span className="font-mono">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="font-mono">{import.meta.env.MODE || 'development'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;

