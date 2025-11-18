import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardBody, Typography } from '@material-tailwind/react';
import Chart from 'react-apexcharts';
import { getDashboardStats } from '../services/analyticsApi';
import { getCurrentUser, getUserRoles } from '../services/authService';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [daysFilter, setDaysFilter] = useState(7);
  const [showWelcome, setShowWelcome] = useState(false);
  const user = getCurrentUser();
  const userRoles = getUserRoles();
  const isAdmin = userRoles.includes('admin');
  const isMember = userRoles.includes('member') && !isAdmin; // Member tapi bukan admin

  // Check if first login (check session storage)
  useEffect(() => {
    const welcomeKey = `welcome_${user?.id}`;
    const hasSeenWelcome = sessionStorage.getItem(welcomeKey);
    
    if (!hasSeenWelcome) {
      setShowWelcome(true);
      sessionStorage.setItem(welcomeKey, 'true');
      
      // Auto hide setelah 5 detik
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [daysFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats({ days: daysFilter });
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Tampilkan pesan error yang lebih informatif
      const errorMessage = error.message || 'Gagal memuat data dashboard';
      toast.error(errorMessage);
      
      // Set stats ke null untuk menampilkan empty state
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Memuat data dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">📊</span>
        </div>
        <p className="text-gray-700 font-semibold mb-1">Tidak ada data untuk ditampilkan</p>
        <p className="text-sm text-gray-500 mb-4">Belum ada transaksi atau terjadi error saat memuat data</p>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { overall, today, dailyTrend } = stats;

  // Chart options untuk Daily Trend
  const dailyTrendChartOptions = {
    chart: {
      type: 'line',
      toolbar: { show: false },
      height: 350
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: dailyTrend.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      })
    },
    colors: ['#3b82f6', '#10b981', '#ef4444'],
    legend: {
      position: 'top'
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#e5e7eb'
    }
  };

  const dailyTrendSeries = [
    {
      name: 'Total',
      data: dailyTrend.map(d => d.total)
    },
    {
      name: 'Success',
      data: dailyTrend.map(d => d.successful)
    },
    {
      name: 'Failed',
      data: dailyTrend.map(d => d.failed)
    }
  ];

  // Chart options untuk Success vs Failed
  const successFailedChartOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Success', 'Failed'],
    colors: ['#10b981', '#ef4444'],
    legend: {
      position: 'bottom'
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val.toFixed(1)}%`
    }
  };

  const successFailedSeries = [
    overall.successful_count || 0,
    overall.failed_count || 0
  ];


  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            {showWelcome && isMember && (
              <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-blue-700">
                      👋 Selamat datang, {user?.username || 'Member'}!
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      Anda login sebagai Member. Nikmati fitur-fitur yang tersedia.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            {showWelcome && isAdmin && (
              <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-purple-700">
                      👋 Halo admin, {user?.username || 'Admin'}!
                    </p>
                    <p className="text-sm text-purple-600 mt-1">
                      Selamat datang di Dashboard Administrator.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="text-purple-400 hover:text-purple-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
            {!showWelcome && (
              <p className="text-gray-600">Statistik dan analisis transaksi</p>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={daysFilter}
              onChange={(e) => setDaysFilter(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 Hari Terakhir</option>
              <option value={14}>14 Hari Terakhir</option>
              <option value={30}>30 Hari Terakhir</option>
              <option value={90}>90 Hari Terakhir</option>
            </select>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Transactions */}
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Total Transaksi
                </Typography>
                <Typography variant="h4" className="mt-2 text-gray-900">
                  {overall.total_transactions?.toLocaleString('id-ID') || 0}
                </Typography>
                <Typography variant="small" color="gray" className="mt-1">
                  Hari ini: {today.total_transactions || 0}
                </Typography>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">📊</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Success Rate */}
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Success Rate
                </Typography>
                <Typography variant="h4" className="mt-2 text-green-600">
                  {overall.success_rate?.toFixed(2) || 0}%
                </Typography>
                <Typography variant="small" color="gray" className="mt-1">
                  {overall.successful_count || 0} berhasil
                </Typography>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">✅</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Total Revenue */}
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Total Revenue
                </Typography>
                <Typography variant="h4" className="mt-2 text-purple-600">
                  Rp {overall.total_revenue?.toLocaleString('id-ID') || 0}
                </Typography>
                <Typography variant="small" color="gray" className="mt-1">
                  Hari ini: Rp {today.total_revenue?.toLocaleString('id-ID') || 0}
                </Typography>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Average Response Time */}
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Avg Response Time
                </Typography>
                <Typography variant="h4" className="mt-2 text-orange-600">
                  {overall.avg_response_time || 0}ms
                </Typography>
                <Typography variant="small" color="gray" className="mt-1">
                  Hari ini: {today.avg_response_time || 0}ms
                </Typography>
              </div>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚡</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Chart */}
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <Typography variant="h6" className="mb-4 text-gray-800">
              Trend Transaksi Harian
            </Typography>
            <Chart
              options={dailyTrendChartOptions}
              series={dailyTrendSeries}
              type="line"
              height={350}
            />
          </CardBody>
        </Card>

        {/* Success vs Failed */}
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <Typography variant="h6" className="mb-4 text-gray-800">
              Success vs Failed
            </Typography>
            <Chart
              options={successFailedChartOptions}
              series={successFailedSeries}
              type="donut"
              height={350}
            />
          </CardBody>
        </Card>
      </div>

    </div>
  );
}

export default Dashboard;

