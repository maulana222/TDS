import { io } from 'socket.io-client';

// Gunakan environment variable atau subdomain backend
const SOCKET_URL = import.meta.env.VITE_API_URL || 'https://api-tds.pix-ly.app';

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
    // Join room berdasarkan user_id (selalu join untuk menerima semua update)
    if (userId) {
      const userRoom = `user:${userId}`;
      socket.emit('join-room', userRoom);
    }
    
    // Join room berdasarkan batch_id
    if (batchId) {
      const batchRoom = `batch:${batchId}`;
      socket.emit('join-room', batchRoom);
    }
  });
  
  // Jika sudah connected, langsung join room
  if (socket.connected) {
    if (userId) {
      const userRoom = `user:${userId}`;
      socket.emit('join-room', userRoom);
    }
    if (batchId) {
      const batchRoom = `batch:${batchId}`;
      socket.emit('join-room', batchRoom);
    }
  }

  socket.on('disconnect', () => {
    // Socket disconnected
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
  if (!socket) {
    return () => {};
  }
  
  const handler = (updatedTransaction) => {
    callback(updatedTransaction);
  };
  
  socket.on('transaction-updated', handler);
  
  return () => {
    socket.off('transaction-updated', handler);
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

