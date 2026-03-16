// ============================================================
// SIAGA Backend — Main Server Entry Point
// Express.js + TypeScript + Supabase
// ============================================================

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { config } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import reportRoutes from './routes/report.routes';
import actionRoutes from './routes/action.routes';
import commentRoutes from './routes/comment.routes';
import uploadRoutes from './routes/upload.routes';
import activityRoutes from './routes/activity.routes';
import feedbackRoutes from './routes/feedback.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes from './routes/chat.routes';
import areaStatusRoutes from './routes/area-status.routes';
import infoRoutes from './routes/info.routes';
import bookmarkRoutes from './routes/bookmark.routes';
import deviceTokenRoutes from './routes/device-token.routes';
import adminRoutes from './routes/admin.routes';
import bmkgRoutes from './routes/bmkg.routes';

// ---- Inisialisasi Express ----
const app = express();
// Percayai reverse proxy agar req.ip / forwarded headers mengarah ke client asli.
app.set('trust proxy', true);
app.disable('etag');

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

const getClientRateLimitKey = (req: Request): string => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0]?.trim();
  const realIpHeader = req.headers['x-real-ip'];
  const realIp = Array.isArray(realIpHeader) ? realIpHeader[0] : realIpHeader;
  const rawIp = forwardedIp || realIp || req.ip || req.socket.remoteAddress || '127.0.0.1';
  return ipKeyGenerator(rawIp);
};

// Rate limiting: batasi request per 15 menit per client.
// Dev: longgar untuk navigasi cepat dan upload.
// Prod: cukup tinggi untuk burst normal mobile, tapi tetap membatasi abuse.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isDev ? 2000 : 1500,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: getClientRateLimitKey,
  skip: (req) => req.path === '/health' || req.method === 'OPTIONS',
  message: {
    success: false,
    message: 'Terlalu banyak request. Coba lagi dalam 15 menit.',
  },
});
app.use('/api/', limiter);

// Hindari cache untuk endpoint auth + reports agar mobile client selalu dapat data fresh
const disableApiCache = (_req: Request, res: Response, next: NextFunction): void => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};
app.use('/api/auth', disableApiCache);
app.use('/api/reports', disableApiCache);

// ---- Routes ----
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/actions', actionRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/area-status', areaStatusRoutes);
app.use('/api/info', infoRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/device-tokens', deviceTokenRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/bmkg', bmkgRoutes);

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
