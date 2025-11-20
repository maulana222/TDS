import pool from '../config/database.js';

/**
 * Save transaction log
 */
export const saveLog = async (logData) => {
  const {
    user_id,
    transaction_id = null,
    ref_id = null,
    log_type,
    direction,
    method = null,
    endpoint = null,
    request_body = null,
    response_body = null,
    request_headers = null,
    response_headers = null,
    status_code = null,
    ip_address = null,
    user_agent = null,
    error_message = null,
    execution_time = null
  } = logData;

  const [result] = await pool.execute(
    `INSERT INTO transaction_logs (
      user_id, transaction_id, ref_id, log_type, direction,
      method, endpoint, request_body, response_body, request_headers,
      response_headers, status_code, ip_address, user_agent,
      error_message, execution_time
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user_id,
      transaction_id,
      ref_id,
      log_type,
      direction,
      method,
      endpoint,
      request_body ? JSON.stringify(request_body) : null,
      response_body ? JSON.stringify(response_body) : null,
      request_headers ? JSON.stringify(request_headers) : null,
      response_headers ? JSON.stringify(response_headers) : null,
      status_code,
      ip_address,
      user_agent,
      error_message,
      execution_time
    ]
  );

  return result.insertId;
};

/**
 * Get logs dengan filter dan pagination
 */
export const getLogs = async (userId, filters = {}, pagination = {}) => {
  const {
    log_type = null,
    direction = null,
    ref_id = null,
    start_date = null,
    end_date = null
  } = filters;

  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;

  let query = `
    SELECT 
      id, user_id, transaction_id, ref_id, log_type, direction,
      method, endpoint, request_body, response_body, request_headers,
      response_headers, status_code, ip_address, user_agent,
      error_message, execution_time, created_at
    FROM transaction_logs
    WHERE user_id = ?
  `;

  const params = [userId];

  if (log_type) {
    query += ' AND log_type = ?';
    params.push(log_type);
  }

  if (direction) {
    query += ' AND direction = ?';
    params.push(direction);
  }

  if (ref_id) {
    query += ' AND ref_id = ?';
    params.push(ref_id);
  }

  if (start_date) {
    query += ' AND created_at >= ?';
    params.push(start_date);
  }

  if (end_date) {
    query += ' AND created_at <= ?';
    params.push(end_date);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.execute(query, params);

  // Parse JSON fields
  return rows.map(row => ({
    ...row,
    request_body: row.request_body ? JSON.parse(row.request_body) : null,
    response_body: row.response_body ? JSON.parse(row.response_body) : null,
    request_headers: row.request_headers ? JSON.parse(row.request_headers) : null,
    response_headers: row.response_headers ? JSON.parse(row.response_headers) : null
  }));
};

/**
 * Get log statistics
 */
export const getLogStats = async (userId, filters = {}) => {
  const {
    start_date = null,
    end_date = null
  } = filters;

  let query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN log_type = 'callback_in' THEN 1 ELSE 0 END) as callback_in_count,
      SUM(CASE WHEN log_type = 'callback_out' THEN 1 ELSE 0 END) as callback_out_count,
      SUM(CASE WHEN log_type = 'transaction_request' THEN 1 ELSE 0 END) as transaction_request_count,
      SUM(CASE WHEN log_type = 'transaction_response' THEN 1 ELSE 0 END) as transaction_response_count,
      SUM(CASE WHEN log_type = 'error' THEN 1 ELSE 0 END) as error_count,
      SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as incoming_count,
      SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as outgoing_count
    FROM transaction_logs
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

  const [rows] = await pool.execute(query, params);
  return rows[0] || {
    total: 0,
    callback_in_count: 0,
    callback_out_count: 0,
    transaction_request_count: 0,
    transaction_response_count: 0,
    error_count: 0,
    incoming_count: 0,
    outgoing_count: 0
  };
};

/**
 * Get log by ID
 */
export const getLogById = async (logId, userId) => {
  const [rows] = await pool.execute(
    `SELECT 
      id, user_id, transaction_id, ref_id, log_type, direction,
      method, endpoint, request_body, response_body, request_headers,
      response_headers, status_code, ip_address, user_agent,
      error_message, execution_time, created_at
    FROM transaction_logs
    WHERE id = ? AND user_id = ?`,
    [logId, userId]
  );

  if (rows.length === 0) {
    return null;
  }

  const row = rows[0];
  return {
    ...row,
    request_body: row.request_body ? JSON.parse(row.request_body) : null,
    response_body: row.response_body ? JSON.parse(row.response_body) : null,
    request_headers: row.request_headers ? JSON.parse(row.request_headers) : null,
    response_headers: row.response_headers ? JSON.parse(row.response_headers) : null
  };
};

/**
 * Delete all logs for a user
 */
export const deleteAllLogs = async (userId) => {
  const [result] = await pool.execute(
    `DELETE FROM transaction_logs WHERE user_id = ?`,
    [userId]
  );
  return result.affectedRows;
};

/**
 * Delete all logs (admin only)
 */
export const deleteAllLogsAdmin = async () => {
  const [result] = await pool.execute(`DELETE FROM transaction_logs`);
  return result.affectedRows;
};

