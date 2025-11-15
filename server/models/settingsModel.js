import pool from '../config/database.js';

/**
 * Get user settings
 */
export const getUserSettings = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT 
      id, user_id, default_delay, default_limit, auto_refresh, refresh_interval,
      show_notifications, export_format, digiprosb_username, digiprosb_api_key,
      digiprosb_endpoint, created_at, updated_at
    FROM user_settings
    WHERE user_id = ?`,
    [userId]
  );

  if (rows.length === 0) {
    // Return default settings jika belum ada
    return {
      user_id: userId,
      default_delay: 0,
      default_limit: 50,
      auto_refresh: false,
      refresh_interval: 30,
      show_notifications: true,
      export_format: 'excel',
      digiprosb_username: null,
      digiprosb_api_key: null,
      digiprosb_endpoint: 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
    };
  }

  const row = rows[0];
  return {
    ...row,
    auto_refresh: Boolean(row.auto_refresh),
    show_notifications: Boolean(row.show_notifications)
  };
};

/**
 * Create or update user settings
 */
export const saveUserSettings = async (userId, settings) => {
  const {
    default_delay = 0,
    default_limit = 50,
    auto_refresh = false,
    refresh_interval = 30,
    show_notifications = true,
    export_format = 'excel',
    digiprosb_username = null,
    digiprosb_api_key = null,
    digiprosb_endpoint = 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction'
  } = settings;

  // Check if settings exist
  const [existing] = await pool.execute(
    'SELECT id FROM user_settings WHERE user_id = ?',
    [userId]
  );

  if (existing.length > 0) {
    // Update existing
    await pool.execute(
      `UPDATE user_settings SET
        default_delay = ?,
        default_limit = ?,
        auto_refresh = ?,
        refresh_interval = ?,
        show_notifications = ?,
        export_format = ?,
        digiprosb_username = ?,
        digiprosb_api_key = ?,
        digiprosb_endpoint = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?`,
      [
        default_delay,
        default_limit,
        auto_refresh ? 1 : 0,
        refresh_interval,
        show_notifications ? 1 : 0,
        export_format,
        digiprosb_username,
        digiprosb_api_key,
        digiprosb_endpoint,
        userId
      ]
    );
    return existing[0].id;
  } else {
    // Create new
    const [result] = await pool.execute(
      `INSERT INTO user_settings (
        user_id, default_delay, default_limit, auto_refresh, refresh_interval,
        show_notifications, export_format, digiprosb_username, digiprosb_api_key,
        digiprosb_endpoint
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        default_delay,
        default_limit,
        auto_refresh ? 1 : 0,
        refresh_interval,
        show_notifications ? 1 : 0,
        export_format,
        digiprosb_username,
        digiprosb_api_key,
        digiprosb_endpoint
      ]
    );
    return result.insertId;
  }
};

/**
 * Reset user settings to default
 */
export const resetUserSettings = async (userId) => {
  await pool.execute(
    `UPDATE user_settings SET
      default_delay = 0,
      default_limit = 50,
      auto_refresh = 0,
      refresh_interval = 30,
      show_notifications = 1,
      export_format = 'excel',
      digiprosb_username = NULL,
      digiprosb_api_key = NULL,
      digiprosb_endpoint = 'https://digiprosb.api.digiswitch.id/v1/user/api/transaction',
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?`,
    [userId]
  );
};

