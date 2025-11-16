import { useState } from 'react';
import { FiScissors, FiSearch, FiMessageSquare, FiTrendingUp, FiPlus, FiX } from 'react-icons/fi';
import { splitTeks, extractKeywords, detectIntent } from '../services/marketingService';

function SplitTextAnalyzer() {
  const [inputText, setInputText] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keywordList, setKeywordList] = useState([]);
  const [removeStopwords, setRemoveStopwords] = useState(false);
  const [minLength, setMinLength] = useState(1);
  const [analysis, setAnalysis] = useState(null);

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) {
      return;
    }

    const keyword = keywordInput.trim().toLowerCase();
    
    // Avoid duplicates
    if (!keywordList.includes(keyword)) {
      setKeywordList([...keywordList, keyword]);
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (keyword) => {
    setKeywordList(keywordList.filter(k => k !== keyword));
  };

  const handleKeyPressKeyword = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  const handleAnalyze = () => {
    if (!inputText.trim()) {
      return;
    }

    const options = {
      removeStopwords,
      minLength: parseInt(minLength) || 1
    };

    const words = splitTeks(inputText, options);
    
    // Combine custom keywords from input and badge list
    const keywordsFromInput = customKeywords
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    const allKeywords = [...new Set([...keywordList, ...keywordsFromInput])];
    
    const foundKeywords = extractKeywords(inputText, allKeywords, options);
    const intents = detectIntent(inputText, {}, options);

    setAnalysis({
      words,
      foundKeywords,
      intents,
      wordCount: words.length,
      uniqueWords: [...new Set(words)],
      allKeywords: allKeywords,
      options
    });
  };

  const exampleTexts = [
    "Bang, saya mau beli paket premium yang diskon.",
    "Halo kak, mau tanya promo terbaru.",
    "Ada stok untuk produk ini?",
    "Berapa harga paket premium?",
    "Saya ingin pesan voucher murah."
  ];

  const handleExampleClick = (text) => {
    setInputText(text);
    setTimeout(() => handleAnalyze(), 100);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiScissors className="w-5 h-5 text-blue-600" />
          Analisis Split Teks
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Masukkan Teks untuk Dianalisis
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onBlur={handleAnalyze}
              placeholder="Contoh: Bang, saya mau beli paket premium yang diskon."
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Keyword Badge Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tambah Kata Kunci (Badge)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={handleKeyPressKeyword}
                placeholder="Masukkan kata kunci lalu tekan Enter"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                <FiPlus className="w-4 h-4" />
                Tambah
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Tambahkan kata kunci yang ingin dideteksi. Tekan Enter atau klik Tambah.
            </p>
          </div>

          {/* Keyword Badges */}
          {keywordList.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kata Kunci yang Ditambahkan
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                {keywordList.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <FiX className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <button
                onClick={() => {
                  setKeywordList([]);
                }}
                className="mt-2 text-xs text-red-600 hover:text-red-700"
              >
                Hapus Semua
              </button>
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={removeStopwords}
                  onChange={(e) => setRemoveStopwords(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Hapus Stopwords
                </span>
              </label>
              <p className="text-xs text-gray-500 ml-6">
                Hapus kata umum seperti "yang", "di", "saya", dll
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min. Panjang Kata
              </label>
              <input
                type="number"
                value={minLength}
                onChange={(e) => setMinLength(e.target.value)}
                min="1"
                max="20"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Filter kata dengan panjang minimum
              </p>
            </div>
          </div>

          {/* Legacy Custom Keywords Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kata Kunci Kustom (pisahkan dengan koma) - Legacy
            </label>
            <input
              type="text"
              value={customKeywords}
              onChange={(e) => setCustomKeywords(e.target.value)}
              onBlur={handleAnalyze}
              placeholder="promo, diskon, beli, harga, stok"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Atau masukkan kata kunci dipisahkan koma (cara lama)
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!inputText.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <FiSearch className="w-4 h-4" />
            Analisis Teks
          </button>
        </div>
      </div>

      {/* Example Texts */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <FiMessageSquare className="w-4 h-4 text-blue-600" />
          Contoh Teks (Klik untuk coba)
        </h4>
        <div className="space-y-2">
          {exampleTexts.map((text, idx) => (
            <button
              key={idx}
              onClick={() => handleExampleClick(text)}
              className="w-full text-left text-xs text-gray-600 hover:text-blue-600 hover:bg-blue-100 p-2 rounded transition-all"
            >
              "{text}"
            </button>
          ))}
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Words Split */}
          <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FiScissors className="w-4 h-4 text-blue-600" />
              Hasil Split Teks
            </h4>
            <div className="flex flex-wrap gap-2">
              {analysis.words.map((word, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {word}
                </span>
              ))}
            </div>
            <div className="mt-4 flex gap-4 text-sm text-gray-600">
              <span>Total kata: <strong>{analysis.wordCount}</strong></span>
              <span>Kata unik: <strong>{analysis.uniqueWords.length}</strong></span>
            </div>
          </div>

          {/* All Keywords Used */}
          {analysis.allKeywords && analysis.allKeywords.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiSearch className="w-4 h-4 text-gray-600" />
                Semua Kata Kunci yang Dicari
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.allKeywords.map((keyword, idx) => {
                  const isFound = analysis.foundKeywords.includes(keyword);
                  return (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isFound
                          ? 'bg-green-100 text-green-700 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                      }`}
                    >
                      {keyword} {isFound && '✓'}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Found Keywords */}
          {analysis.foundKeywords.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border-2 border-green-200 p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiSearch className="w-4 h-4 text-green-600" />
                Kata Kunci Ditemukan ({analysis.foundKeywords.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.foundKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detected Intents */}
          {analysis.intents.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border-2 border-purple-200 p-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FiTrendingUp className="w-4 h-4 text-purple-600" />
                Intent yang Terdeteksi
              </h4>
              <div className="space-y-2">
                {analysis.intents.map((intent, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg"
                  >
                    <span className="text-sm font-medium text-purple-700 capitalize">
                      {intent}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.intents.length === 0 && analysis.foundKeywords.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center text-sm text-yellow-700">
              Tidak ada kata kunci atau intent yang terdeteksi
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default SplitTextAnalyzer;

