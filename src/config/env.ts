// ============================================================
// Konfigurasi Environment Variables
// ============================================================

import dotenv from 'dotenv';

dotenv.config();

const parseNumberEnv = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseBooleanEnv = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

type TrustProxyConfig = boolean | number | string;

const parseTrustProxyEnv = (value: string | undefined, nodeEnvironment: string): TrustProxyConfig => {
  if (value === undefined || value.trim() === '') {
    return nodeEnvironment === 'production' ? 1 : false;
  }

  const normalized = value.trim().toLowerCase();

  const parsedNumber = Number.parseInt(normalized, 10);

  if (!Number.isNaN(parsedNumber) && String(parsedNumber) === normalized && parsedNumber >= 0) {
    return parsedNumber;
  }

  if (['true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return value.trim();
};

const nodeEnv = process.env.NODE_ENV || 'development';
const isDev = nodeEnv !== 'production';

export const config = {
  // Server
  port: parseNumberEnv(process.env.PORT, 3000),
  nodeEnv,
  isDev,
  trustProxy: parseTrustProxyEnv(process.env.TRUST_PROXY, nodeEnv),

  // Supabase
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'default-dev-secret',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8081',

  // Rate Limiter
  rateLimitDebug: parseBooleanEnv(process.env.RATE_LIMIT_DEBUG, false),
  rateLimitBuckets: {
    publicRead: {
      diagnosticsName: 'publicRead',
      windowMs: parseNumberEnv(process.env.RATE_LIMIT_PUBLIC_READ_WINDOW_MS, 15 * 60 * 1000),
      maxDev: parseNumberEnv(process.env.RATE_LIMIT_PUBLIC_READ_MAX_DEV, 2000),
      maxProd: parseNumberEnv(process.env.RATE_LIMIT_PUBLIC_READ_MAX_PROD, 1500),
    },
    publicAuth: {
      diagnosticsName: 'publicAuth',
      windowMs: parseNumberEnv(process.env.RATE_LIMIT_PUBLIC_AUTH_WINDOW_MS, 15 * 60 * 1000),
      maxDev: parseNumberEnv(process.env.RATE_LIMIT_PUBLIC_AUTH_MAX_DEV, 150),
      maxProd: parseNumberEnv(process.env.RATE_LIMIT_PUBLIC_AUTH_MAX_PROD, 80),
    },
    authRefresh: {
      diagnosticsName: 'authRefresh',
      windowMs: parseNumberEnv(process.env.RATE_LIMIT_AUTH_REFRESH_WINDOW_MS, 15 * 60 * 1000),
      maxDev: parseNumberEnv(process.env.RATE_LIMIT_AUTH_REFRESH_MAX_DEV, 300),
      maxProd: parseNumberEnv(process.env.RATE_LIMIT_AUTH_REFRESH_MAX_PROD, 150),
    },
    upload: {
      diagnosticsName: 'upload',
      windowMs: parseNumberEnv(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS, 15 * 60 * 1000),
      maxDev: parseNumberEnv(process.env.RATE_LIMIT_UPLOAD_MAX_DEV, 200),
      maxProd: parseNumberEnv(process.env.RATE_LIMIT_UPLOAD_MAX_PROD, 120),
    },
    bmkg: {
      diagnosticsName: 'bmkg',
      windowMs: parseNumberEnv(process.env.RATE_LIMIT_BMKG_WINDOW_MS, 15 * 60 * 1000),
      maxDev: parseNumberEnv(process.env.RATE_LIMIT_BMKG_MAX_DEV, 600),
      maxProd: parseNumberEnv(process.env.RATE_LIMIT_BMKG_MAX_PROD, 300),
    },
    authenticatedGeneral: {
      diagnosticsName: 'authenticatedGeneral',
      windowMs: parseNumberEnv(process.env.RATE_LIMIT_AUTHENTICATED_GENERAL_WINDOW_MS, 15 * 60 * 1000),
      maxDev: parseNumberEnv(process.env.RATE_LIMIT_AUTHENTICATED_GENERAL_MAX_DEV, 1600),
      maxProd: parseNumberEnv(process.env.RATE_LIMIT_AUTHENTICATED_GENERAL_MAX_PROD, 1200),
    },
  },
};
