import express from 'express';
import { handleCallback } from '../controllers/callbackController.js';
import { processCallbackWithQueue } from '../utils/callbackQueue.js';

const router = express.Router();

// GET endpoint untuk mendapatkan callback URL
router.get('/info', (req, res) => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || `localhost:${process.env.PORT || 3737}`;
  const callbackUrl = `${protocol}://${host}/api/callback`;
  
  res.json({
    success: true,
    callback_url: callbackUrl,
    method: 'POST',
    formats: {
      digipro: {
        description: 'Digipro format (recommended)',
        example: {
          data: {
            ref_id: 'ref_123456',
            status: 'Sukses',
            rc: '00',
            message: 'Transaksi berhasil',
            sn: 'SN123456'
          }
        }
      },
      direct: {
        description: 'Direct format',
        example: {
          ref_id: 'ref_123456',
          success: true,
          status_code: 200,
          response_data: {
            rc: '00',
            message: 'Transaksi berhasil'
          }
        }
      }
    }
  });
});

// Handler untuk callback dengan queue dan logging di route level
router.post('/', async (req, res) => {
  const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  // Log semua callback request di route level
  console.log(`\n[ROUTE] === CALLBACK REQUEST RECEIVED [${requestId}] ===`);
  console.log(`[ROUTE] Timestamp: ${new Date().toISOString()}`);
  console.log(`[ROUTE] Method: ${req.method}`);
  console.log(`[ROUTE] Path: ${req.path}`);
  console.log(`[ROUTE] IP: ${req.ip || req.connection.remoteAddress || req.socket.remoteAddress}`);
  console.log(`[ROUTE] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[ROUTE] Body:`, JSON.stringify(req.body, null, 2));
  
  // Attach requestId dan startTime ke request untuk digunakan di controller
  req.callbackRequestId = requestId;
  req.callbackStartTime = startTime;
  
  try {
    // Extract ref_id dari body untuk queue
    const body = req.body;
    let refId = null;
    
    // Parse ref_id dari berbagai format
    if (body.data && body.data.ref_id) {
      refId = body.data.ref_id;
    } else if (body.ref_id) {
      refId = body.ref_id;
    }
    
    if (!refId) {
      console.log(`[ROUTE] Callback rejected: ref_id not found in request body`);
      return res.status(400).json({
        success: false,
        message: 'ref_id is required'
      });
    }
    
    console.log(`[ROUTE] Processing callback for ref_id: ${refId} [${requestId}]`);
    console.log(`[ROUTE] About to enter queue for ref_id: ${refId} [${requestId}]`);
    
    // Process callback dengan queue untuk menghindari race condition
    // Queue memastikan callback untuk ref_id yang sama diproses secara sequential
    // Tapi callback dengan ref_id berbeda bisa diproses parallel
    try {
      await processCallbackWithQueue(refId, async () => {
        console.log(`[ROUTE] Inside queue callback function for ref_id: ${refId} [${requestId}]`);
        const result = await handleCallback(req, res);
        console.log(`[ROUTE] Queue callback function completed for ref_id: ${refId} [${requestId}]`);
        return result;
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`[ROUTE] === CALLBACK REQUEST COMPLETED [${requestId}] ===`);
      console.log(`[ROUTE] ref_id: ${refId}, Processing time: ${processingTime}ms`);
      console.log(`[ROUTE] Response headers sent: ${res.headersSent}`);
      console.log(`[ROUTE] ============================================\n`);
    } catch (queueError) {
      const processingTime = Date.now() - startTime;
      console.error(`[ROUTE] Queue processing error for ref_id: ${refId} [${requestId}]`);
      console.error(`[ROUTE] Error:`, queueError);
      console.error(`[ROUTE] Processing time: ${processingTime}ms`);
      console.error(`[ROUTE] Response headers sent: ${res.headersSent}`);
      throw queueError; // Re-throw untuk di-handle oleh outer catch
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[ROUTE] === CALLBACK REQUEST ERROR [${requestId}] ===`);
    console.error(`[ROUTE] Error:`, error);
    console.error(`[ROUTE] Stack:`, error.stack);
    console.error(`[ROUTE] Processing time before error: ${processingTime}ms`);
    console.error(`[ROUTE] ============================================\n`);
    
    // Pastikan response dikirim jika belum dikirim
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

export default router;

