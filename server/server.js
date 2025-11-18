import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import callbackRoutes from './routes/callbackRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import logRoutes from './routes/logRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import deleteRoutes from './routes/deleteRoutes.js';
import telegramRoutes from './routes/telegramRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import pool from './config/database.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { initSocket } from './socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3737;

// Initialize Socket.IO
initSocket(server);

// Security headers dengan Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8888',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser dengan size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Test database connection
app.get('/health', async (req, res) => {
  try {
    await pool.getConnection();
    res.json({ 
      success: true, 
      message: 'Server and database are running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Callback route - TIDAK ada rate limiting (dipanggil dari external API)
app.use('/api/callback', callbackRoutes);

// General rate limiting untuk semua route API lainnya
app.use('/api', apiRateLimiter);

// Routes lainnya (dengan rate limiting)
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/delete', deleteRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/roles', roleRoutes);

// Log registered routes
console.log('📋 Registered routes:');
console.log('  - /api/auth');
console.log('  - /api/transactions');
console.log('  - /api/callback');
console.log('  - /api/settings');

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO ready`);
  console.log(`✅ All routes loaded successfully`);
  console.log(`📋 Available routes:`);
  console.log(`   - GET/PUT /api/settings`);
  console.log(`   - POST /api/settings/reset`);
  console.log(`   - GET/POST /api/logs`);
  console.log(`   - GET /api/logs/stats`);
  console.log(`   - GET /api/logs/:id`);
});

