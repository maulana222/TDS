import { useRef } from 'react';
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
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <button 
          className="px-6 py-3.5 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-dashed border-blue-400 text-blue-700 rounded-xl font-semibold hover:from-blue-100 hover:to-blue-200 hover:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={() => fileInputRef.current?.click()}
        >
          📁 Pilih File Excel
        </button>
      </div>
      
      <div>
        <button 
          className="w-full px-6 py-3.5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 text-green-700 rounded-xl font-semibold hover:from-green-100 hover:to-emerald-100 hover:border-green-400 transition-all duration-200 shadow-sm hover:shadow-md"
          onClick={handleDownloadTemplate}
        >
          📥 Download Template Excel
        </button>
      </div>
    </div>
  );
}

export default ExcelUpload;

