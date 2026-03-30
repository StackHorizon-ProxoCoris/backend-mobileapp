// ============================================================
// Konfigurasi Rate Limiter
// ============================================================

import type { Request } from 'express';
import { createHash } from 'node:crypto';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

import { config } from './env';
import { logger } from './logger';

type LimiterBucketName = keyof typeof config.rateLimitBuckets;

type KeySource =
  | 'req.user.id'
  | 'req.ip'
  | 'req.ips'
  | 'fallback'
  | 'req.ip+req.body.email'
  | 'req.ips+req.body.email'
  | 'fallback+req.body.email'
  | 'req.ip+req.body.refreshToken'
  | 'req.ips+req.body.refreshToken'
  | 'fallback+req.body.refreshToken';

type IdentifierType = 'ip' | 'user';

interface ResolvedLimiterIdentity {
  key: string;
  keySource: KeySource;
  resolvedIp: string;
  identifierType: IdentifierType;
}

interface RateLimitRequestMeta {
  bucket: string;
  keySource: KeySource;
  resolvedIp: string;
  identifierType: IdentifierType;
}

interface RequestWithRateLimitMeta extends Request {
  _rateLimitMeta?: RateLimitRequestMeta;
}

const RATE_LIMIT_EXCEEDED_MESSAGE = {
  success: false,
  message: 'Terlalu banyak request. Coba lagi dalam 15 menit.',
};

const resolveIpLimiterIdentity = (req: Request): ResolvedLimiterIdentity => {
  const trustedProxyChain = req.ips
    .map((ipAddress) => ipAddress.trim())
    .filter((ipAddress) => ipAddress.length > 0);

  const trustedIp = req.ip?.trim();

  if (trustedIp) {
    return {
      key: ipKeyGenerator(trustedIp),
      keySource: 'req.ip',
      resolvedIp: trustedIp,
      identifierType: 'ip',
    };
  }

  const firstTrustedForwardedIp = trustedProxyChain[0];

  if (firstTrustedForwardedIp) {
    return {
      key: ipKeyGenerator(firstTrustedForwardedIp),
      keySource: 'req.ips',
      resolvedIp: firstTrustedForwardedIp,
      identifierType: 'ip',
    };
  }

  return {
    key: ipKeyGenerator('127.0.0.1'),
    keySource: 'fallback',
    resolvedIp: '127.0.0.1',
    identifierType: 'ip',
  };
};

const resolveAuthenticatedLimiterIdentity = (req: Request): ResolvedLimiterIdentity => {
  const ipIdentity = resolveIpLimiterIdentity(req);
  const authenticatedUserId = req.user?.id?.trim();

  if (authenticatedUserId) {
    return {
      key: `user:${authenticatedUserId}`,
      keySource: 'req.user.id',
      resolvedIp: ipIdentity.resolvedIp,
      identifierType: 'user',
    };
  }

  return ipIdentity;
};

const normalizeEmailForRateLimit = (email: string): string => email.trim().toLowerCase();

const hashRefreshTokenForRateLimit = (refreshToken: string): string => {
  return createHash('sha256').update(refreshToken.trim()).digest('hex');
};

const resolvePublicAuthLimiterIdentity = (req: Request): ResolvedLimiterIdentity => {
  const ipIdentity = resolveIpLimiterIdentity(req);
  const emailValue = req.body && typeof req.body === 'object' ? (req.body as { email?: unknown }).email : undefined;

  if (typeof emailValue !== 'string') {
    return ipIdentity;
  }

  const normalizedEmail = normalizeEmailForRateLimit(emailValue);

  if (!normalizedEmail) {
    return ipIdentity;
  }

  const keySource = ipIdentity.keySource === 'req.ips'
    ? 'req.ips+req.body.email'
    : ipIdentity.keySource === 'fallback'
      ? 'fallback+req.body.email'
      : 'req.ip+req.body.email';

  return {
    key: `${ipIdentity.key}:email:${normalizedEmail}`,
    keySource,
    resolvedIp: ipIdentity.resolvedIp,
    identifierType: 'ip',
  };
};

const resolveAuthRefreshLimiterIdentity = (req: Request): ResolvedLimiterIdentity => {
  const ipIdentity = resolveIpLimiterIdentity(req);
  const refreshTokenValue = req.body && typeof req.body === 'object'
    ? (req.body as { refreshToken?: unknown }).refreshToken
    : undefined;

  if (typeof refreshTokenValue !== 'string') {
    return ipIdentity;
  }

  const normalizedRefreshToken = refreshTokenValue.trim();

  if (!normalizedRefreshToken) {
    return ipIdentity;
  }

  const keySource = ipIdentity.keySource === 'req.ips'
    ? 'req.ips+req.body.refreshToken'
    : ipIdentity.keySource === 'fallback'
      ? 'fallback+req.body.refreshToken'
      : 'req.ip+req.body.refreshToken';

  return {
    key: `${ipIdentity.key}:refresh:${hashRefreshTokenForRateLimit(normalizedRefreshToken)}`,
    keySource,
    resolvedIp: ipIdentity.resolvedIp,
    identifierType: 'ip',
  };
};

const setRateLimitMeta = (req: Request, meta: RateLimitRequestMeta): void => {
  (req as RequestWithRateLimitMeta)._rateLimitMeta = meta;
};

const getRateLimitMeta = (req: Request): RateLimitRequestMeta | undefined => {
  return (req as RequestWithRateLimitMeta)._rateLimitMeta;
};

const createRateLimiter = (
  bucket: LimiterBucketName,
  resolveIdentity: (req: Request) => ResolvedLimiterIdentity = resolveIpLimiterIdentity
) => {
  const bucketConfig = config.rateLimitBuckets[bucket];
  const diagnosticsBucket = bucketConfig.diagnosticsName;

  return rateLimit({
    windowMs: bucketConfig.windowMs,
    max: config.isDev ? bucketConfig.maxDev : bucketConfig.maxProd,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    keyGenerator: (req) => {
      const identity = resolveIdentity(req);

      setRateLimitMeta(req, {
        bucket: diagnosticsBucket,
        keySource: identity.keySource,
        resolvedIp: identity.resolvedIp,
        identifierType: identity.identifierType,
      });

      if (config.rateLimitDebug) {
        logger.debug('rate-limit:key', {
          bucket: diagnosticsBucket,
          route: `${req.baseUrl}${req.path}`,
          method: req.method,
          keySource: identity.keySource,
          resolvedIp: identity.resolvedIp,
          identifierType: identity.identifierType,
          hasUser: Boolean(req.user),
        });
      }

      return identity.key;
    },
    skip: (req) => req.path === '/health' || req.method === 'OPTIONS',
    message: RATE_LIMIT_EXCEEDED_MESSAGE,
    handler: (req, res, _next, options) => {
      const fallbackIdentity = resolveIdentity(req);
      const meta = getRateLimitMeta(req);

      logger.warn('rate-limit:429', {
        bucket: meta?.bucket ?? diagnosticsBucket,
        route: `${req.baseUrl}${req.path}`,
        method: req.method,
        keySource: meta?.keySource ?? fallbackIdentity.keySource,
        resolvedIp: meta?.resolvedIp ?? fallbackIdentity.resolvedIp,
        identifierType: meta?.identifierType ?? fallbackIdentity.identifierType,
        hasUser: Boolean(req.user),
      });

      res.status(options.statusCode).send(options.message);
    },
  });
};

export const createPublicReadRateLimiter = () => createRateLimiter('publicRead');

export const createPublicAuthRateLimiter = () => createRateLimiter('publicAuth', resolvePublicAuthLimiterIdentity);

export const createAuthRefreshRateLimiter = () => createRateLimiter('authRefresh', resolveAuthRefreshLimiterIdentity);

export const createUploadRateLimiter = () => createRateLimiter('upload', resolveAuthenticatedLimiterIdentity);

export const createBmkgRateLimiter = () => createRateLimiter('bmkg');

export const createAuthenticatedGeneralRateLimiter = () => createRateLimiter('authenticatedGeneral', resolveAuthenticatedLimiterIdentity);

export const authenticatedGeneralRateLimiter = createAuthenticatedGeneralRateLimiter();
