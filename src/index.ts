// ============================================================
// SIAGA Backend — Main Server Entry Point
// Express.js + TypeScript + Supabase
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';

// ---- Inisialisasi Express ----
const app = express();

// ---- Middleware Global ----

// Keamanan: set berbagai HTTP headers
app.use(helmet());

// CORS: izinkan request dari frontend
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging: tampilkan request log di console
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting: batasi 100 request per 15 menit per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Terlalu banyak request. Coba lagi dalam 15 menit.',
  },
});
app.use('/api/', limiter);

// ---- Routes ----
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// ---- Root Route ----
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'SIAGA Backend API v1.0.0',
    docs: '/api/health',
  });
});

// ---- Error Handling ----
app.use(notFoundHandler);
app.use(errorHandler);

// ---- Start Server ----
app.listen(config.port, () => {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('    SIAGA Backend Server');
  console.log('═══════════════════════════════════════════');
  console.log(`   Port     : ${config.port}`);
  console.log(`   Env      : ${config.nodeEnv}`);
  console.log(`   URL      : http://localhost:${config.port}`);
  console.log(`   Health   : http://localhost:${config.port}/api/health`);
  console.log('═══════════════════════════════════════════');
  console.log('');
});

export default app;
