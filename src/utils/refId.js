/**
 * Generate unique reference ID
 * @returns {string} Unique ref_id dengan format ref_timestamp_random
 */
export function generateRefId() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ref_${timestamp}_${random}`;
}

