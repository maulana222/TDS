import {
  getTransactionStats,
  getDailyTrend,
  getTopProducts,
  getHourlyDistribution,
  getTodayStats
} from '../models/analyticsModel.js';

/**
 * Get dashboard statistics
 */
export const getDashboardStatsHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: User ID not found'
      });
    }

    const { start_date, end_date, days = 7 } = req.query;

    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    // Get overall stats
    const stats = await getTransactionStats(userId, filters);
    
    // Get today's stats
    const todayStats = await getTodayStats(userId);

    // Get daily trend
    const dailyTrend = await getDailyTrend(userId, parseInt(days));

    // Get top products (return empty array if error)
    let topProducts = [];
    try {
      topProducts = await getTopProducts(userId, 10, filters);
    } catch (error) {
      console.error('Error getting top products:', error);
      // Continue with empty array
    }

    // Get hourly distribution (return empty array if error)
    let hourlyDistribution = [];
    try {
      hourlyDistribution = await getHourlyDistribution(userId, filters);
    } catch (error) {
      console.error('Error getting hourly distribution:', error);
      // Continue with empty array
    }

    res.json({
      success: true,
      data: {
        overall: stats,
        today: todayStats,
        dailyTrend: dailyTrend || [],
        topProducts: topProducts || [],
        hourlyDistribution: hourlyDistribution || []
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    console.error('Stack:', error.stack);
    console.error('User ID:', req.user?.id);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

/**
 * Get transaction statistics only
 */
export const getStatsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    const filters = {};
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;

    const stats = await getTransactionStats(userId, filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

