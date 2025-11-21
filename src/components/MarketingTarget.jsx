import { useState } from 'react';
import { FiUpload, FiX, FiDownload, FiUser, FiFileText } from 'react-icons/fi';
import { parseMarketingTargetExcel, downloadMarketingTemplate } from '../services/marketingService';
import toast from 'react-hot-toast';

function MarketingTarget({ targets, setTargets }) {
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'excel'
  const [manualInput, setManualInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleManualAdd = () => {
    if (!manualInput.trim()) {
      toast.error('Username tidak boleh kosong');
      return;
    }

    // Parse multiple usernames (separated by comma, newline, or space)
    const usernames = manualInput
      .split(/[,\n\s]+/)
      .map(u => u.trim())
      .filter(u => u && u.length > 0)
      .map(u => u.startsWith('@') ? u : `@${u}`);

    if (usernames.length === 0) {
      toast.error('Tidak ada username valid');
      return;
    }

    // Add to targets (avoid duplicates)
    const newTargets = [...targets];
    usernames.forEach(username => {
      if (!newTargets.find(t => t.username === username)) {
        newTargets.push({
          id: Date.now() + Math.random(),
          username: username,
          source: 'manual'
        });
      }
    });

    setTargets(newTargets);
    setManualInput('');
    toast.success(`${usernames.length} target ditambahkan`);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsed = await parseMarketingTargetExcel(file);
      const newTargets = parsed.targets.map((t, idx) => ({
        id: Date.now() + idx,
        username: t.username,
        name: t.name || '',
        source: 'excel'
      }));

      // Merge dengan existing targets (avoid duplicates)
      const merged = [...targets];
      newTargets.forEach(target => {
        if (!merged.find(t => t.username === target.username)) {
          merged.push(target);
        }
      });

      setTargets(merged);
      toast.success(`${newTargets.length} target berhasil diimport dari Excel`);
    } catch (error) {
      toast.error(error.message || 'Error membaca file Excel');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleRemoveTarget = (id) => {
    setTargets(targets.filter(t => t.id !== id));
    toast.success('Target dihapus');
  };

  const handleDownloadTemplate = () => {
    downloadMarketingTemplate();
    toast.success('Template Excel berhasil didownload');
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="flex gap-2">
        <button
          onClick={() => setInputMode('manual')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            inputMode === 'manual'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiUser className="inline w-4 h-4 mr-2" />
          Manual Input
        </button>
        <button
          onClick={() => setInputMode('excel')}
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
            inputMode === 'excel'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FiFileText className="inline w-4 h-4 mr-2" />
          Import Excel
        </button>
      </div>

      {/* Manual Input */}
      {inputMode === 'manual' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username Telegram (pisahkan dengan koma, spasi, atau baris baru)
            </label>
            <textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Contoh: @username1, @username2, @username3"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Bisa memasukkan beberapa username sekaligus, dipisahkan dengan koma, spasi, atau baris baru
            </p>
          </div>
          <button
            onClick={handleManualAdd}
            disabled={!manualInput.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Tambahkan Target
          </button>
        </div>
      )}

      {/* Excel Upload */}
      {inputMode === 'excel' && (
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="excel-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="excel-upload"
              className={`cursor-pointer flex flex-col items-center gap-2 ${
                isUploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <FiUpload className="w-8 h-8 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                {isUploading ? 'Mengupload...' : 'Klik untuk upload Excel'}
              </span>
              <span className="text-xs text-gray-500">
                Format: .xlsx atau .xls
              </span>
            </label>
          </div>
          <button
            onClick={handleDownloadTemplate}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <FiDownload className="w-4 h-4" />
            Download Template Excel
          </button>
        </div>
      )}

      {/* Target List */}
      {targets.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">
              Daftar Target ({targets.length})
            </h3>
            <button
              onClick={() => {
                setTargets([]);
                toast.success('Semua target dihapus');
              }}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Hapus Semua
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
            {targets.map((target) => (
              <div
                key={target.id}
                className="flex items-center justify-between bg-gray-50 p-2 rounded-lg"
              >
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700">
                    {target.username}
                  </span>
                  {target.name && (
                    <span className="text-xs text-gray-500 ml-2">
                      ({target.name})
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-2">
                    [{target.source}]
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveTarget(target.id)}
                  className="p-1 hover:bg-red-100 rounded text-red-600 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketingTarget;



