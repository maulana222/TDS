import pool from '../config/database.js';

/**
 * Get transaction statistics untuk dashboard
 */
export const getTransactionStats = async (userId, filters = {}) => {
  const {
    start_date = null,
    end_date = null
  } = filters;

  let query = `
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_count,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_count,
      AVG(response_time) as avg_response_time,
      COALESCE(SUM(CASE 
        WHEN success = 1 AND response_data IS NOT NULL 
          AND JSON_VALID(response_data) = 1
          AND JSON_EXTRACT(response_data, '$.price') IS NOT NULL
        THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(response_data, '$.price')) AS DECIMAL(10,2))
        ELSE 0 
      END), 0) as total_revenue,
      MIN(created_at) as first_transaction,
      MAX(created_at) as last_transaction
    FROM transactions
    WHERE user_id = ?
  `;

  const params = [userId];

  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }

  try {
    const [rows] = await pool.execute(query, params);
    const row = rows[0] || {};
    
    // Handle null values safely
    const stats = {
      total_transactions: row.total_transactions || 0,
      successful_count: row.successful_count || 0,
      failed_count: row.failed_count || 0,
      avg_response_time: row.avg_response_time || 0,
      total_revenue: row.total_revenue || 0,
      first_transaction: row.first_transaction || null,
      last_transaction: row.last_transaction || null
    };

    // Calculate success rate
    const successRate = stats.total_transactions > 0
      ? (stats.successful_count / stats.total_transactions) * 100
      : 0;

    // Safely parse revenue (handle null/undefined)
    let totalRevenue = 0;
    try {
      totalRevenue = parseFloat(stats.total_revenue || 0);
      if (isNaN(totalRevenue)) totalRevenue = 0;
    } catch (e) {
      totalRevenue = 0;
    }

    // Safely parse avg_response_time (handle null/undefined/string)
    let avgResponseTime = 0;
    try {
      avgResponseTime = parseFloat(stats.avg_response_time || 0);
      if (isNaN(avgResponseTime)) avgResponseTime = 0;
    } catch (e) {
      avgResponseTime = 0;
    }

    return {
      total_transactions: parseInt(stats.total_transactions) || 0,
      successful_count: parseInt(stats.successful_count) || 0,
      failed_count: parseInt(stats.failed_count) || 0,
      success_rate: parseFloat(successRate.toFixed(2)),
      avg_response_time: parseFloat(avgResponseTime.toFixed(2)),
      total_revenue: totalRevenue,
      first_transaction: stats.first_transaction,
      last_transaction: stats.last_transaction
    };
  } catch (error) {
    console.error('Error in getTransactionStats:', error);
    throw error;
  }
};

/**
 * Get daily transaction trend
 */
export const getDailyTrend = async (userId, days = 7) => {
  const query = `
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
      AVG(response_time) as avg_response_time
    FROM transactions
    WHERE user_id = ? 
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `;

  try {
    const [rows] = await pool.execute(query, [userId, days]);
    return rows.map(row => {
      // Handle date conversion safely
      let dateStr = null;
      try {
        if (row.date) {
          if (row.date instanceof Date) {
            dateStr = row.date.toISOString().split('T')[0];
          } else if (typeof row.date === 'string') {
            dateStr = row.date.split('T')[0];
          }
        }
      } catch (e) {
        console.error('Error parsing date:', e);
      }

      return {
        date: dateStr,
        total: parseInt(row.total) || 0,
        successful: parseInt(row.successful) || 0,
        failed: parseInt(row.failed) || 0,
        avg_response_time: parseFloat(parseFloat(row.avg_response_time || 0).toFixed(2))
      };
    });
  } catch (error) {
    console.error('Error in getDailyTrend:', error);
    console.error('Query:', query);
    console.error('Params:', [userId, days]);
    throw error;
  }
};

/**
 * Get top products
 */
export const getTopProducts = async (userId, limit = 10, filters = {}) => {
  const {
    start_date = null,
    end_date = null
  } = filters;

  let query = `
    SELECT 
      product_code,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_count,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed_count,
      AVG(response_time) as avg_response_time,
      COALESCE(SUM(CASE 
        WHEN success = 1 AND response_data IS NOT NULL 
          AND JSON_VALID(response_data) = 1
          AND JSON_EXTRACT(response_data, '$.price') IS NOT NULL
        THEN CAST(JSON_UNQUOTE(JSON_EXTRACT(response_data, '$.price')) AS DECIMAL(10,2))
        ELSE 0 
      END), 0) as total_revenue
    FROM transactions
    WHERE user_id = ?
  `;

  const params = [userId];

  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }

  // Pastikan limit adalah integer dan aman (sanitize untuk mencegah SQL injection)
  const limitNum = Math.max(1, Math.min(parseInt(limit, 10) || 10, 100)); // Min 1, Max 100
  
  query += `
    GROUP BY product_code
    ORDER BY transaction_count DESC
    LIMIT ${limitNum}
  `;

  try {
    // Debug logging
    console.log('[getTopProducts] Query params:', params);
    console.log('[getTopProducts] Limit:', limitNum);
    const [rows] = await pool.execute(query, params);
    return rows.map(row => {
      // Safely parse revenue
      let totalRevenue = 0;
      try {
        totalRevenue = parseFloat(row.total_revenue || 0);
        if (isNaN(totalRevenue)) totalRevenue = 0;
      } catch (e) {
        totalRevenue = 0;
      }

      return {
        product_code: row.product_code || '',
        transaction_count: parseInt(row.transaction_count) || 0,
        successful_count: parseInt(row.successful_count) || 0,
        failed_count: parseInt(row.failed_count) || 0,
        success_rate: row.transaction_count > 0
          ? parseFloat(((row.successful_count / row.transaction_count) * 100).toFixed(2))
          : 0,
        avg_response_time: parseFloat(parseFloat(row.avg_response_time || 0).toFixed(2)),
        total_revenue: totalRevenue
      };
    });
  } catch (error) {
    console.error('Error in getTopProducts:', error);
    console.error('Query:', query);
    console.error('Params:', params);
    throw error;
  }
};

/**
 * Get hourly transaction distribution
 */
export const getHourlyDistribution = async (userId, filters = {}) => {
  const {
    start_date = null,
    end_date = null
  } = filters;

  let query = `
    SELECT 
      HOUR(created_at) as hour,
      COUNT(*) as count
    FROM transactions
    WHERE user_id = ?
  `;

  const params = [userId];

  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }

  query += `
    GROUP BY HOUR(created_at)
    ORDER BY hour ASC
  `;

  try {
    const [rows] = await pool.execute(query, params);
    
    // Initialize all 24 hours with 0
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0
    }));

    // Fill in actual data
    rows.forEach(row => {
      if (row.hour !== null && row.hour >= 0 && row.hour < 24) {
        hourlyData[row.hour].count = parseInt(row.count) || 0;
      }
    });

    return hourlyData;
  } catch (error) {
    console.error('Error in getHourlyDistribution:', error);
    throw error;
  }
};

/**
 * Get today's statistics
 */
export const getTodayStats = async (userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await getTransactionStats(userId, {
    start_date: today.toISOString(),
    end_date: tomorrow.toISOString()
  });
};

