import { Server } from 'socket.io';

let io = null;

/**
 * Initialize Socket.IO
 */
export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:8888',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room berdasarkan user_id atau batch_id
    socket.on('join-room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
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
  if (!io) return;
  
  // Emit ke room batch_id jika ada
  if (transaction.batch_id) {
    io.to(`batch:${transaction.batch_id}`).emit('transaction-updated', transaction);
  }
  
  // Emit ke room user_id (jika berbeda dari batch room, untuk avoid duplicate)
  if (transaction.user_id) {
    // Hanya emit ke user room jika tidak ada batch_id atau untuk broadcast ke semua user
    io.to(`user:${transaction.user_id}`).emit('transaction-updated', transaction);
  }
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

