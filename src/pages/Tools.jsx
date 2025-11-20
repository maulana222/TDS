import { 
  FiActivity, 
  FiMessageSquare,
  FiRefreshCw,
  FiTrash2,
  FiCopy,
  FiSearch,
  FiTrendingUp
} from 'react-icons/fi';
import { isAdmin } from '../services/authService';

function Tools({ setCurrentPage }) {
  const admin = isAdmin();
  
  const tools = [
    {
      id: 'transaction-request',
      title: 'Transaction Request Tool',
      description: 'Upload Excel atau input manual untuk melakukan request transaksi ke Digiswitch secara batch',
      icon: FiActivity,
      color: 'from-blue-500 to-blue-600',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      page: 'transaction-request'
    },
    {
      id: 'bulk-retry',
      title: 'Bulk Retry Tool',
      description: 'Retry transaksi yang gagal secara batch dengan konfigurasi yang sama',
      icon: FiRefreshCw,
      color: 'from-green-500 to-green-600',
      iconColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      page: 'bulk-retry'
    },
    {
      id: 'bulk-delete',
      title: 'Bulk Delete Tool',
      description: 'Hapus transaksi dalam jumlah besar berdasarkan filter tanggal, status, atau kriteria lainnya',
      icon: FiTrash2,
      color: 'from-red-500 to-red-600',
      iconColor: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      page: 'bulk-delete'
    },
    {
      id: 'duplicate-checker',
      title: 'Duplicate Checker Tool',
      description: 'Cek dan hapus transaksi duplikat berdasarkan customer number, product code, atau ref_id',
      icon: FiCopy,
      color: 'from-orange-500 to-orange-600',
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      page: 'duplicate-checker'
    },
    {
      id: 'transaction-finder',
      title: 'Transaction Finder Tool',
      description: 'Cari transaksi berdasarkan berbagai kriteria dengan filter advanced dan export hasil',
      icon: FiSearch,
      color: 'from-purple-500 to-purple-600',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      page: 'transaction-finder'
    },
    // Only show Telegram Tools for admin
    ...(admin ? [{
      id: 'telegram',
      title: 'Telegram Tools',
      description: 'Kirim pesan notifikasi ke Telegram menggunakan Bot API untuk update transaksi',
      icon: FiMessageSquare,
      color: 'from-cyan-500 to-cyan-600',
      iconColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
      page: 'telegram'
    }] : [])
  ];

  const handleToolClick = (page) => {
    if (setCurrentPage) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Tools</h1>
        <p className="text-gray-600">Pilih tool yang ingin Anda gunakan</p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.page)}
              className="group relative bg-white rounded-xl shadow-sm border-2 border-gray-200 hover:border-gray-300 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              <div className="p-6 relative z-10">
                {/* Icon */}
                <div className={`w-14 h-14 ${tool.bgColor} rounded-xl flex items-center justify-center mb-4 border-2 ${tool.borderColor} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-7 h-7 ${tool.iconColor}`} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
                  {tool.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {tool.description}
                </p>

                {/* Arrow indicator */}
                <div className="mt-4 flex items-center text-sm font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
                  <span>Buka tool</span>
                  <svg 
                    className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className={`h-1 bg-gradient-to-r ${tool.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`}></div>
            </button>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FiTrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Quick Access</h2>
        </div>
        <p className="text-gray-600 text-sm">
          Gunakan menu sidebar atau klik card di atas untuk mengakses tool yang diinginkan. 
          Setiap tool memiliki fungsi spesifik untuk membantu workflow transaksi Anda.
        </p>
      </div>
    </div>
  );
}

export default Tools;

