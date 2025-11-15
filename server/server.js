import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import callbackRoutes from './routes/callbackRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import logRoutes from './routes/logRoutes.js';
import pool from './config/database.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { initSocket } from './socket.js';

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

// General rate limiting
app.use('/api', apiRateLimiter);

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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/callback', callbackRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', logRoutes);

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

