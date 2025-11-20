/**
 * Callback Queue untuk handle concurrent callbacks
 * Memastikan callback diproses secara sequential per ref_id
 */

const processingQueues = new Map(); // Map<ref_id, Promise>

/**
 * Process callback dengan queue per ref_id
 * Memastikan callback untuk ref_id yang sama diproses secara sequential
 */
export const processCallbackWithQueue = async (refId, callbackFn) => {
  const queueStartTime = Date.now();
  
  // Jika sudah ada queue untuk ref_id ini, tunggu sampai selesai
  if (processingQueues.has(refId)) {
    console.log(`[CALLBACK QUEUE] Waiting for existing callback to finish for ref_id: ${refId}`);
    const waitStartTime = Date.now();
    try {
      await processingQueues.get(refId);
      const waitTime = Date.now() - waitStartTime;
      console.log(`[CALLBACK QUEUE] Finished waiting for ref_id: ${refId}, wait time: ${waitTime}ms`);
    } catch (error) {
      // Ignore error dari callback sebelumnya
      console.warn(`[CALLBACK QUEUE] Error from previous callback for ref_id: ${refId}, continuing...`);
    }
  }

  // Buat promise baru untuk callback ini
  const callbackPromise = (async () => {
    try {
      console.log(`[CALLBACK QUEUE] Starting callback processing for ref_id: ${refId}`);
      const result = await callbackFn();
      const queueTime = Date.now() - queueStartTime;
      console.log(`[CALLBACK QUEUE] Completed callback processing for ref_id: ${refId}, total queue time: ${queueTime}ms`);
      return result;
    } catch (error) {
      const queueTime = Date.now() - queueStartTime;
      console.error(`[CALLBACK QUEUE] Error processing callback for ref_id: ${refId}, queue time: ${queueTime}ms`, error);
      throw error;
    } finally {
      // Hapus dari queue setelah selesai
      processingQueues.delete(refId);
      console.log(`[CALLBACK QUEUE] Removed ref_id: ${refId} from queue. Active queues: ${processingQueues.size}`);
    }
  })();

  // Simpan promise ke queue
  processingQueues.set(refId, callbackPromise);
  console.log(`[CALLBACK QUEUE] Added ref_id: ${refId} to queue. Active queues: ${processingQueues.size}`);

  return callbackPromise;
};

/**
 * Get queue status (untuk debugging)
 */
export const getQueueStatus = () => {
  return {
    activeQueues: processingQueues.size,
    queuedRefIds: Array.from(processingQueues.keys())
  };
};

