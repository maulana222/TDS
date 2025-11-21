import { getLogs, getLogStats, getLogById, saveLog, deleteAllLogs, deleteAllLogsAdmin } from '../models/logModel.js';

/**
 * Get logs dengan filter dan pagination
 */
export const getLogsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      log_type,
      direction,
      ref_id,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {
      log_type: log_type || null,
      direction: direction || null,
      ref_id: ref_id || null,
      start_date: start_date || null,
      end_date: end_date || null
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit)
    };

    const logs = await getLogs(userId, filters, pagination);
    const stats = await getLogStats(userId, filters);

    res.json({
      success: true,
      data: logs,
      stats,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: stats.total
      }
    });
  } catch (error) {
    console.error('Error getting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get logs',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get log by ID
 */
export const getLogByIdHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const log = await getLogById(parseInt(id), userId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('Error getting log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get log statistics
 */
export const getLogStatsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    const filters = {
      startDate: start_date || null,
      endDate: end_date || null
    };

    const stats = await getLogStats(userId, filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting log stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get log stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create log (untuk dipanggil dari frontend atau controller lain)
 */
export const createLogHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const logData = req.body;

    const logId = await saveLog({
      ...logData,
      user_id: userId
    });

    res.json({
      success: true,
      message: 'Log saved successfully',
      log_id: logId
    });
  } catch (error) {
    console.error('Error creating log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Helper function untuk save log (dipanggil dari controller lain)
 */
export const createLog = async (logData) => {
  try {
    return await saveLog(logData);
  } catch (error) {
    console.error('Error saving log:', error);
    // Don't throw error, just log it
    return null;
  }
};

/**
 * Delete all logs (user's own logs, or all logs if admin)
 */
export const deleteAllLogsHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.roles && req.user.roles.some(role => role.name === 'admin');
    
    let deletedCount;
    if (isAdmin) {
      // Admin bisa hapus semua log
      deletedCount = await deleteAllLogsAdmin();
    } else {
      // User biasa hanya bisa hapus log miliknya sendiri
      deletedCount = await deleteAllLogs(userId);
    }

    res.json({
      success: true,
      message: `Berhasil menghapus ${deletedCount} log`,
      deleted_count: deletedCount
    });
  } catch (error) {
    console.error('Error deleting logs:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal menghapus log',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

