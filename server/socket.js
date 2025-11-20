import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.FRONTEND_URL 
          ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
          : ['http://localhost:8888', 'http://localhost:3000'];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // In production, allow if origin matches domain
        if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
          const domain = process.env.FRONTEND_URL.split(',')[0].trim().replace(/https?:\/\//, '').split('/')[0];
          if (origin.includes(domain)) {
            return callback(null, true);
          }
        }
        
        // Development: allow localhost
        if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
          return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    // Join room berdasarkan user_id atau batch_id
    socket.on('join-room', (room) => {
      socket.join(room);
    });

    socket.on('disconnect', () => {
      // Socket disconnected
    });
  });

  return io;
};

/**
 * Get Socket.IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket first.');
  }
  return io;
};

/**
 * Emit transaction update
 */
export const emitTransactionUpdate = (transaction) => {
  if (!io) {
    return;
  }
  
  // Emit ke room batch_id jika ada
  if (transaction.batch_id) {
    const batchRoom = `batch:${transaction.batch_id}`;
    io.to(batchRoom).emit('transaction-updated', transaction);
  }
  
  // Emit ke room user_id (selalu emit untuk memastikan user menerima update)
  if (transaction.user_id) {
    const userRoom = `user:${transaction.user_id}`;
    io.to(userRoom).emit('transaction-updated', transaction);
  }
  
  // Juga broadcast ke semua connected clients (untuk memastikan update terlihat)
  // Ini berguna jika ada masalah dengan room joining
  io.emit('transaction-updated', transaction);
};

/**
 * Emit batch update
 */
export const emitBatchUpdate = (batch) => {
  if (!io) return;
  
  // Emit ke room batch_id
  if (batch.batch_id) {
    io.to(`batch:${batch.batch_id}`).emit('batch-updated', batch);
  }
  
  // Emit ke room user_id
  if (batch.user_id) {
    io.to(`user:${batch.user_id}`).emit('batch-updated', batch);
  }
};

