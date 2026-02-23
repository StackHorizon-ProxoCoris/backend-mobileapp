// ============================================================
// Konfigurasi Environment Variables
// ============================================================

import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

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
};
