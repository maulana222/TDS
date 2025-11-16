import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Card, CardBody, Typography } from '@material-tailwind/react';
import Chart from 'react-apexcharts';
import { getDashboardStats } from '../services/analyticsApi';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [daysFilter, setDaysFilter] = useState(7);

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
      // Jika error karena unauthorized, akan di-handle oleh App.jsx
      if (error.message && error.message.includes('Failed to get dashboard stats')) {
        toast.error('Gagal memuat data dashboard. Pastikan Anda sudah login.');
      } else {
        toast.error('Gagal memuat data dashboard');
      }
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
        <p className="text-gray-500">Tidak ada data untuk ditampilkan</p>
      </div>
    );
  }

  const { overall, today, dailyTrend, topProducts, hourlyDistribution } = stats;

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

  // Chart options untuk Top Products
  const topProductsChartOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      height: 350
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4
      }
    },
    xaxis: {
      categories: topProducts.map(p => p.product_code)
    },
    colors: ['#3b82f6'],
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#e5e7eb'
    }
  };

  const topProductsSeries = [
    {
      name: 'Transactions',
      data: topProducts.map(p => p.transaction_count)
    }
  ];

  // Chart options untuk Hourly Distribution
  const hourlyChartOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      height: 350
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    xaxis: {
      categories: hourlyDistribution.map(h => `${h.hour}:00`)
    },
    colors: ['#8b5cf6'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3
      }
    },
    dataLabels: {
      enabled: false
    },
    grid: {
      borderColor: '#e5e7eb'
    }
  };

  const hourlySeries = [
    {
      name: 'Transactions',
      data: hourlyDistribution.map(h => h.count)
    }
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Statistik dan analisis transaksi</p>
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

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <Typography variant="h6" className="mb-4 text-gray-800">
              Top Products
            </Typography>
            <Chart
              options={topProductsChartOptions}
              series={topProductsSeries}
              type="bar"
              height={350}
            />
          </CardBody>
        </Card>

        {/* Hourly Distribution */}
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <Typography variant="h6" className="mb-4 text-gray-800">
              Distribusi Per Jam
            </Typography>
            <Chart
              options={hourlyChartOptions}
              series={hourlySeries}
              type="area"
              height={350}
            />
          </CardBody>
        </Card>
      </div>

      {/* Top Products Table */}
      {topProducts.length > 0 && (
        <Card className="shadow-lg border border-gray-200">
          <CardBody>
            <Typography variant="h6" className="mb-4 text-gray-800">
              Detail Top Products
            </Typography>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product Code</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Success</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Failed</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Success Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Avg Response</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topProducts.map((product, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.product_code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.transaction_count}</td>
                      <td className="px-4 py-3 text-sm text-green-600">{product.successful_count}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{product.failed_count}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.success_rate}%</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.avg_response_time}ms</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Rp {product.total_revenue.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default Dashboard;

