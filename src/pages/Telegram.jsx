import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiSend, FiMessageSquare, FiUser, FiHash, FiTrendingUp, FiScissors } from 'react-icons/fi';
import { sendTelegramMessage, sendBulkTelegramMessages } from '../services/telegramService';
import MarketingTarget from '../components/MarketingTarget';
import SplitTextAnalyzer from '../components/SplitTextAnalyzer';

function Telegram() {
  const [activeTab, setActiveTab] = useState('send'); // 'send', 'marketing', 'split'
  
  // Send Message Tab State
  const [chatId, setChatId] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messageHistory, setMessageHistory] = useState([]);

  // Marketing Tab State
  const [marketingTargets, setMarketingTargets] = useState([]);
  const [marketingMessage, setMarketingMessage] = useState('');
  const [marketingDelay, setMarketingDelay] = useState(1000);
  const [isMarketing, setIsMarketing] = useState(false);
  const [marketingProgress, setMarketingProgress] = useState(null);
  const [marketingResults, setMarketingResults] = useState(null);

  const handleSend = async () => {
    if (!chatId.trim()) {
      toast.error('Chat ID tidak boleh kosong');
      return;
    }

    if (!message.trim()) {
      toast.error('Pesan tidak boleh kosong');
      return;
    }

    setIsSending(true);
    try {
      const result = await sendTelegramMessage(chatId.trim(), message.trim());
      
      if (result.success) {
        toast.success('Pesan berhasil dikirim!');
        
        setMessageHistory(prev => [{
          id: Date.now(),
          chatId: chatId.trim(),
          message: message.trim(),
          timestamp: new Date().toLocaleString('id-ID'),
          success: true
        }, ...prev]);
        
        setMessage('');
      } else {
        throw new Error(result.message || 'Gagal mengirim pesan');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Gagal mengirim pesan');
      
      setMessageHistory(prev => [{
        id: Date.now(),
        chatId: chatId.trim(),
        message: message.trim(),
        timestamp: new Date().toLocaleString('id-ID'),
        success: false,
        error: error.message
      }, ...prev]);
    } finally {
      setIsSending(false);
    }
  };

  const handleMarketingSend = async () => {
    if (marketingTargets.length === 0) {
      toast.error('Tidak ada target marketing');
      return;
    }

    if (!marketingMessage.trim()) {
      toast.error('Pesan marketing tidak boleh kosong');
      return;
    }

    setIsMarketing(true);
    setMarketingProgress({ current: 0, total: marketingTargets.length, success: 0, failed: 0 });
    setMarketingResults(null);

    try {
      const targets = marketingTargets.map(t => t.username);
      const results = await sendBulkTelegramMessages(
        targets,
        marketingMessage.trim(),
        (progress) => {
          setMarketingProgress(progress);
        },
        marketingDelay
      );

      setMarketingResults(results);
      toast.success(`Marketing selesai! ${results.success} berhasil, ${results.failed} gagal`);
    } catch (error) {
      console.error('Error sending marketing:', error);
      toast.error(error.message || 'Gagal mengirim marketing');
    } finally {
      setIsMarketing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      if (activeTab === 'send') {
        handleSend();
      }
    }
  };

  const tabs = [
    { id: 'send', label: 'Kirim Pesan', icon: FiSend },
    { id: 'marketing', label: 'Marketing Produk', icon: FiTrendingUp },
    { id: 'split', label: 'Split Teks', icon: FiScissors }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
            <FiMessageSquare className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Telegram Tools</h1>
            <p className="text-gray-600">Kirim pesan, marketing produk, dan analisis teks dengan Telegram Bot API</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-2">
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Send Message Tab */}
        {activeTab === 'send' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiSend className="w-5 h-5 text-blue-600" />
                  Kirim Pesan
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FiHash className="w-4 h-4" />
                      Chat ID
                    </label>
                    <input
                      type="text"
                      value={chatId}
                      onChange={(e) => setChatId(e.target.value)}
                      placeholder="Contoh: 123456789 atau @username"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <FiMessageSquare className="w-4 h-4" />
                      Pesan
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Tulis pesan yang ingin dikirim..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={isSending || !chatId.trim() || !message.trim()}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {isSending ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <FiSend className="w-5 h-5" />
                        <span>Kirim Pesan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiUser className="w-5 h-5 text-blue-600" />
                  Riwayat Pesan
                </h2>

                {messageHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <FiMessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada riwayat pesan</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {messageHistory.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg border-2 ${
                          item.success
                            ? 'border-green-200 bg-green-50'
                            : 'border-red-200 bg-red-50'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                item.success ? 'bg-green-500' : 'bg-red-500'
                              }`}
                            ></div>
                            <span className="text-xs font-medium text-gray-600">
                              {item.chatId}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">{item.timestamp}</span>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">{item.message}</p>
                        {item.error && (
                          <p className="text-xs text-red-600 mt-1">{item.error}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Marketing Tab */}
        {activeTab === 'marketing' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Target Input */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiTrendingUp className="w-5 h-5 text-blue-600" />
                  Target Marketing
                </h2>
                <MarketingTarget
                  targets={marketingTargets}
                  setTargets={setMarketingTargets}
                />
              </div>

              {/* Message & Settings */}
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMessageSquare className="w-5 h-5 text-blue-600" />
                  Pesan Marketing
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pesan Marketing
                    </label>
                    <textarea
                      value={marketingMessage}
                      onChange={(e) => setMarketingMessage(e.target.value)}
                      placeholder="Tulis pesan marketing yang akan dikirim ke semua target..."
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delay antar Pesan (ms)
                    </label>
                    <input
                      type="number"
                      value={marketingDelay}
                      onChange={(e) => setMarketingDelay(parseInt(e.target.value) || 1000)}
                      min="0"
                      step="100"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Delay untuk menghindari rate limit (disarankan: 1000ms = 1 detik)
                    </p>
                  </div>

                  <button
                    onClick={handleMarketingSend}
                    disabled={isMarketing || marketingTargets.length === 0 || !marketingMessage.trim()}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {isMarketing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Mengirim Marketing...</span>
                      </>
                    ) : (
                      <>
                        <FiTrendingUp className="w-5 h-5" />
                        <span>Kirim ke {marketingTargets.length} Target</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Progress & Results */}
            {(marketingProgress || marketingResults) && (
              <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Hasil Marketing</h2>
                
                {marketingProgress && !marketingResults && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{marketingProgress.current} / {marketingProgress.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(marketingProgress.current / marketingProgress.total) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-600">✓ Berhasil: {marketingProgress.success}</span>
                      <span className="text-red-600">✗ Gagal: {marketingProgress.failed}</span>
                    </div>
                  </div>
                )}

                {marketingResults && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-600">{marketingResults.total}</div>
                        <div className="text-sm text-gray-600">Total Target</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">{marketingResults.success}</div>
                        <div className="text-sm text-gray-600">Berhasil</div>
                      </div>
                      <div className="bg-red-50 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-red-600">{marketingResults.failed}</div>
                        <div className="text-sm text-gray-600">Gagal</div>
                      </div>
                    </div>

                    {marketingResults.details.length > 0 && (
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {marketingResults.details.slice(0, 10).map((detail, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded-lg text-sm ${
                              detail.success ? 'bg-green-50' : 'bg-red-50'
                            }`}
                          >
                            <span className={detail.success ? 'text-green-700' : 'text-red-700'}>
                              {detail.target}: {detail.success ? '✓' : `✗ ${detail.error}`}
                            </span>
                          </div>
                        ))}
                        {marketingResults.details.length > 10 && (
                          <p className="text-xs text-gray-500 text-center">
                            ... dan {marketingResults.details.length - 10} hasil lainnya
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Split Text Tab */}
        {activeTab === 'split' && (
          <SplitTextAnalyzer />
        )}
      </div>

      {/* Info Section */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <FiMessageSquare className="w-5 h-5 text-blue-600" />
          Informasi
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          {activeTab === 'send' && (
            <>
              <p><strong>Kirim Pesan:</strong> Kirim pesan ke satu target Telegram.</p>
              <p><strong>Chat ID:</strong> Masukkan Chat ID atau username (contoh: 123456789 atau @username).</p>
            </>
          )}
          {activeTab === 'marketing' && (
            <>
              <p><strong>Marketing Produk:</strong> Kirim pesan marketing ke banyak target sekaligus.</p>
              <p><strong>Target:</strong> Bisa input manual atau import dari Excel. Format Excel: Username (kolom A), Name (kolom B, optional).</p>
              <p><strong>Delay:</strong> Disarankan minimal 1000ms (1 detik) untuk menghindari rate limit Telegram.</p>
            </>
          )}
          {activeTab === 'split' && (
            <>
              <p><strong>Split Teks:</strong> Analisis teks untuk memahami kebutuhan pelanggan dengan split kata.</p>
              <p><strong>Kegunaan:</strong> Deteksi kata kunci, intent (promo, beli, harga, stok), dan analisis pesan pelanggan.</p>
            </>
          )}
          <p className="mt-3 text-xs text-gray-600">
            <strong>Catatan:</strong> Pastikan Bot Token Telegram sudah dikonfigurasi di Settings.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Telegram;
