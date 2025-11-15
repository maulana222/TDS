import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3737';

let socket = null;

/**
 * Initialize Socket.IO connection
 */
export const initSocket = (userId, batchId = null) => {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
    
    // Join room berdasarkan user_id
    if (userId) {
      socket.emit('join-room', `user:${userId}`);
    }
    
    // Join room berdasarkan batch_id
    if (batchId) {
      socket.emit('join-room', `batch:${batchId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

/**
 * Disconnect Socket.IO
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Get Socket instance
 */
export const getSocket = () => {
  return socket;
};

/**
 * Listen to transaction updates
 */
export const onTransactionUpdate = (callback) => {
  if (!socket) return () => {};
  
  socket.on('transaction-updated', callback);
  
  return () => {
    socket.off('transaction-updated', callback);
  };
};

/**
 * Listen to batch updates
 */
export const onBatchUpdate = (callback) => {
  if (!socket) return () => {};
  
  socket.on('batch-updated', callback);
  
  return () => {
    socket.off('batch-updated', callback);
  };
};

/**
 * Join batch room
 */
export const joinBatchRoom = (batchId) => {
  if (!socket) return;
  
  if (socket.connected) {
    socket.emit('join-room', `batch:${batchId}`);
  } else {
    // Jika belum connected, tunggu sampai connected
    socket.once('connect', () => {
      socket.emit('join-room', `batch:${batchId}`);
    });
  }
};

/**
 * Leave batch room
 */
export const leaveBatchRoom = (batchId) => {
  if (socket && socket.connected) {
    socket.emit('leave-room', `batch:${batchId}`);
  }
};

