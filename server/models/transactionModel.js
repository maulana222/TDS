import pool from '../config/database.js';

/**
 * Save single transaction ke database
 */
export const saveTransaction = async (transactionData, userId, batchId = null) => {
  const {
    customer_no,
    customer_no_used,
    product_code,
    ref_id,
    signature,
    status,
    success,
    responseTime,
    data,
    error,
    rawResponse,
    row_number
  } = transactionData;

  // Extract sn from response data if available
  const sn = data?.sn || null;

  const [result] = await pool.execute(
    `INSERT INTO transactions (
      user_id, customer_no, customer_no_used, product_code, ref_id, signature,
      status_code, success, status, response_time, response_data, error_message, raw_response,
      \`row_number\`, batch_id, sn
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      customer_no,
      customer_no_used || customer_no,
      product_code,
      ref_id,
      signature || '',
      status || null, // status_code (HTTP status)
      success ? 1 : 0,
      transactionData.status || null, // status string (Pending, Sukses, Gagal)
      responseTime || null,
      data ? JSON.stringify(data) : null,
      error || null,
      rawResponse || null,
      row_number || null,
      batchId,
      sn
    ]
  );

  return result.insertId;
};

/**
 * Save multiple transactions (bulk insert)
 */
export const saveTransactions = async (transactions, userId, batchId = null) => {
  if (transactions.length === 0) return [];

  const values = [];
  const placeholders = [];

  for (const tx of transactions) {
    const {
      customer_no,
      customer_no_used,
      product_code,
      ref_id,
      signature,
      status,
      success,
      responseTime,
      data,
      error,
      rawResponse,
      row_number
    } = tx;

    // Extract sn from response data if available
    const sn = data?.sn || null;

    values.push(
      userId,
      customer_no,
      customer_no_used || customer_no,
      product_code,
      ref_id,
      signature || '',
      status || null, // status_code (HTTP status)
      success ? 1 : 0,
      tx.status || null, // status string (Pending, Sukses, Gagal)
      responseTime || null,
      data ? JSON.stringify(data) : null,
      error || null,
      rawResponse || null,
      row_number || null,
      batchId,
      sn
    );

    placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  }

  const query = `
    INSERT INTO transactions (
      user_id, customer_no, customer_no_used, product_code, ref_id, signature,
      status_code, success, status, response_time, response_data, error_message, raw_response,
      \`row_number\`, batch_id, sn
    ) VALUES ${placeholders.join(', ')}
  `;

  const [result] = await pool.execute(query, values);
  return result.insertId;
};

/**
 * Get transactions by user dengan filter dan pagination
 */
export const getTransactions = async (userId, filters = {}, pagination = {}) => {
  const {
    batchId = null,
    success = null,
    customerNo = null,
    productCode = null,
    refId = null,
    startDate = null,
    endDate = null
  } = filters;

  const { page = 1, limit = 50 } = pagination;
  // Pastikan page dan limit adalah integer
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const offset = (pageNum - 1) * limitNum;

  let query = `
    SELECT 
      id, customer_no, customer_no_used, product_code, ref_id,
      status_code, success, status, response_time, response_data, error_message,
      \`row_number\`, batch_id, created_at, sn
    FROM transactions
    WHERE user_id = ?
  `;

  const params = [userId];

  if (batchId) {
    query += ' AND batch_id = ?';
    params.push(batchId);
  }

  if (success !== null) {
    query += ' AND success = ?';
    params.push(success ? 1 : 0);
  }

  if (customerNo) {
    query += ' AND (customer_no LIKE ? OR customer_no_used LIKE ?)';
    const searchTerm = `%${customerNo}%`;
    params.push(searchTerm, searchTerm);
  }

  if (productCode) {
    query += ' AND product_code = ?';
    params.push(productCode);
  }

  if (refId) {
    query += ' AND ref_id = ?';
    params.push(refId);
  }

  if (startDate) {
    query += ' AND created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND created_at <= ?';
    params.push(endDate);
  }

  // Gunakan template literal untuk LIMIT dan OFFSET (beberapa versi MySQL tidak support prepared statement untuk LIMIT)
  // Sanitize untuk mencegah SQL injection
  const safeLimit = Math.max(1, Math.min(limitNum, 1000)); // Min 1, Max 1000
  const safeOffset = Math.max(0, offset); // Min 0
  
  query += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  // Debug logging
  console.log('[getTransactions] Query params:', params);
  console.log('[getTransactions] Limit:', safeLimit, 'Offset:', safeOffset);
  const [rows] = await pool.execute(query, params);

  // Parse JSON response_data
  return rows.map(row => ({
    ...row,
    success: Boolean(row.success),
    response_data: row.response_data ? JSON.parse(row.response_data) : null
  }));
};

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (userId, filters = {}) => {
  const {
    batchId = null,
    startDate = null,
    endDate = null
  } = filters;

  let query = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed,
      AVG(response_time) as avg_response_time,
      MIN(response_time) as min_response_time,
      MAX(response_time) as max_response_time
    FROM transactions
    WHERE user_id = ?
  `;

  const params = [userId];

  if (batchId) {
    query += ' AND batch_id = ?';
    params.push(batchId);
  }

  if (startDate) {
    query += ' AND created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND created_at <= ?';
    params.push(endDate);
  }

  const [rows] = await pool.execute(query, params);
  return rows[0] || {
    total: 0,
    successful: 0,
    failed: 0,
    avg_response_time: 0,
    min_response_time: 0,
    max_response_time: 0
  };
};

/**
 * Create transaction batch
 */
export const createBatch = async (userId, batchId, totalTransactions, config = null) => {
  const [result] = await pool.execute(
    `INSERT INTO transaction_batches (
      user_id, batch_id, total_transactions, config, status
    ) VALUES (?, ?, ?, ?, 'processing')`,
    [
      userId,
      batchId,
      totalTransactions,
      config ? JSON.stringify(config) : null
    ]
  );

  return result.insertId;
};

/**
 * Update batch status
 */
export const updateBatch = async (batchId, updates) => {
  const { status, successfulCount, failedCount, completedAt } = updates;

  const updatesList = [];
  const params = [];

  if (status) {
    updatesList.push('status = ?');
    params.push(status);
  }

  if (successfulCount !== undefined) {
    updatesList.push('successful_count = ?');
    params.push(successfulCount);
  }

  if (failedCount !== undefined) {
    updatesList.push('failed_count = ?');
    params.push(failedCount);
  }

  if (completedAt) {
    updatesList.push('completed_at = ?');
    params.push(completedAt);
  }

  if (updatesList.length === 0) return null;

  params.push(batchId);

  const [result] = await pool.execute(
    `UPDATE transaction_batches 
     SET ${updatesList.join(', ')}
     WHERE batch_id = ?`,
    params
  );

  return result.affectedRows;
};

/**
 * Get batches by user
 */
export const getBatches = async (userId, limit = 20) => {
  const [rows] = await pool.execute(
    `SELECT 
      id, batch_id, total_transactions, successful_count, failed_count,
      config, status, started_at, completed_at
    FROM transaction_batches
    WHERE user_id = ?
    ORDER BY started_at DESC
    LIMIT ?`,
    [userId, limit]
  );

  return rows.map(row => ({
    ...row,
    config: row.config ? JSON.parse(row.config) : null
  }));
};

/**
 * Get transaction by ref_id
 */
/**
 * Delete all transactions for a user
 */
export const deleteAllTransactions = async (userId) => {
  const [result] = await pool.execute(
    'DELETE FROM transactions WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows;
};

/**
 * Delete transactions by date range
 */
export const deleteTransactionsByDateRange = async (userId, startDate, endDate) => {
  let query = 'DELETE FROM transactions WHERE user_id = ?';
  const params = [userId];
  
  if (startDate) {
    query += ' AND created_at >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND created_at <= ?';
    params.push(endDate);
  }
  
  const [result] = await pool.execute(query, params);
  return result.affectedRows;
};

/**
 * Delete all batches for a user
 */
export const deleteAllBatches = async (userId) => {
  const [result] = await pool.execute(
    'DELETE FROM transaction_batches WHERE user_id = ?',
    [userId]
  );
  return result.affectedRows;
};

/**
 * Delete single transaction by ID
 */
export const deleteTransactionById = async (transactionId, userId) => {
  const [result] = await pool.execute(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [transactionId, userId]
  );
  return result.affectedRows;
};

export const getTransactionByRefId = async (refId) => {
  const [rows] = await pool.execute(
    `SELECT 
      id, user_id, customer_no, customer_no_used, product_code, ref_id,
      status_code, success, status, response_time, response_data, error_message,
      raw_response, batch_id, created_at, sn
    FROM transactions
    WHERE ref_id = ?
    LIMIT 1`,
    [refId]
  );

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    ...row,
    success: Boolean(row.success),
    response_data: row.response_data ? JSON.parse(row.response_data) : null
  };
};

/**
 * Update transaction by ref_id (untuk callback)
 */
export const updateTransactionByRefId = async (refId, updateData) => {
  const {
    status_code,
    success,
    status,
    response_time,
    response_data,
    error_message,
    raw_response,
    sn
  } = updateData;

  const updates = [];
  const params = [];

  if (status_code !== undefined) {
    updates.push('status_code = ?');
    params.push(status_code);
  }

  if (success !== undefined) {
    updates.push('success = ?');
    params.push(success ? 1 : 0);
  }

  if (status !== undefined) {
    updates.push('status = ?');
    params.push(status);
  }

  if (response_time !== undefined) {
    updates.push('response_time = ?');
    params.push(response_time);
  }

  if (response_data !== undefined) {
    updates.push('response_data = ?');
    params.push(JSON.stringify(response_data));
  }

  if (error_message !== undefined) {
    updates.push('error_message = ?');
    params.push(error_message);
  }

  if (raw_response !== undefined) {
    updates.push('raw_response = ?');
    params.push(raw_response);
  }

  if (sn !== undefined) {
    updates.push('sn = ?');
    params.push(sn);
  }

  if (updates.length === 0) {
    return { updated: false, message: 'No updates provided' };
  }

  params.push(refId);

  // Gunakan SELECT ... FOR UPDATE untuk lock row dan prevent race condition
  // Ini memastikan hanya satu callback yang bisa update transaction pada waktu yang sama
  const dbStartTime = Date.now();
  const connection = await pool.getConnection();
  console.log(`[DB UPDATE] Got connection for ref_id: ${refId}, time: ${Date.now() - dbStartTime}ms`);
  
  try {
    const txStartTime = Date.now();
    await connection.beginTransaction();
    console.log(`[DB UPDATE] Transaction started for ref_id: ${refId}, time: ${Date.now() - txStartTime}ms`);
    
    // Lock row dengan SELECT FOR UPDATE
    const lockStartTime = Date.now();
    const [existingRows] = await connection.execute(
      `SELECT id, ref_id, status, success, status_code 
       FROM transactions 
       WHERE ref_id = ? 
       FOR UPDATE`,
      [refId]
    );
    const lockTime = Date.now() - lockStartTime;
    console.log(`[DB UPDATE] Locked transaction ${refId}, current status: ${existingRows[0]?.status || 'N/A'}, success: ${existingRows[0]?.success || 'N/A'}, lock time: ${lockTime}ms`);
    
    if (existingRows.length === 0) {
      await connection.rollback();
      console.log(`[DB UPDATE] Transaction ${refId} not found, rolled back`);
      return { updated: false, message: 'Transaction not found' };
    }
    
    const existing = existingRows[0];
    
    // Update transaction
    const updateStartTime = Date.now();
    const [result] = await connection.execute(
      `UPDATE transactions 
       SET ${updates.join(', ')}
       WHERE ref_id = ?`,
      params
    );
    const updateTime = Date.now() - updateStartTime;
    console.log(`[DB UPDATE] Updated transaction ${refId}, affectedRows: ${result.affectedRows}, update time: ${updateTime}ms`);
    
    const commitStartTime = Date.now();
    await connection.commit();
    const commitTime = Date.now() - commitStartTime;
    console.log(`[DB UPDATE] Committed transaction ${refId}, commit time: ${commitTime}ms, total DB time: ${Date.now() - dbStartTime}ms`);
    
    return {
      updated: result.affectedRows > 0,
      affectedRows: result.affectedRows
    };
  } catch (error) {
    console.error(`[DB UPDATE] Error updating transaction ${refId}:`, error);
    await connection.rollback();
    console.log(`[DB UPDATE] Rolled back transaction ${refId} due to error`);
    throw error;
  } finally {
    connection.release();
    console.log(`[DB UPDATE] Released connection for ref_id: ${refId}`);
  }
};

/**
 * Update batch statistics setelah transaction diupdate
 */
export const updateBatchStats = async (batchId) => {
  const [stats] = await pool.execute(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
    FROM transactions
    WHERE batch_id = ?`,
    [batchId]
  );

  if (stats.length > 0) {
    const { total, successful, failed } = stats[0];
    
    await pool.execute(
      `UPDATE transaction_batches 
       SET successful_count = ?, failed_count = ?
       WHERE batch_id = ?`,
      [successful || 0, failed || 0, batchId]
    );
  }
};











