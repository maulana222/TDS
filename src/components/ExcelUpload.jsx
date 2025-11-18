import { useRef } from 'react';
import { FiUpload, FiDownload } from 'react-icons/fi';
import { downloadTemplate } from '../services/excelService';

function ExcelUpload({ onFileUpload }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileUpload(file);
    }
    // Reset input agar bisa upload file yang sama lagi
    e.target.value = '';
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div className="relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <div 
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FiUpload className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Klik untuk upload file Excel</p>
              <p className="text-xs text-gray-500">Format: .xlsx atau .xls</p>
            </div>
            <button 
              type="button"
              className="mt-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Pilih File
            </button>
          </div>
        </div>
      </div>
      
      {/* Download Template */}
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
              <FiDownload className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Download Template</p>
              <p className="text-xs text-gray-500">Format Excel yang sudah disiapkan</p>
            </div>
          </div>
          <button 
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExcelUpload;


