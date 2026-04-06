import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../config/env.js';

let jwtSecret = null;
let jwtRefreshSecret = null;
let jwtInitialized = false;

export function initJWT(throwIfMissing = false) {
  if (jwtInitialized) {
    return;
  }

  const secret =
    env.jwt?.secret || process.env.JWT_SECRET || process.env.APP_AUTH_TOKEN;
  const salt = env.jwt?.salt || process.env.JWT_SALT;
  const refreshSecret =
    env.jwt?.refreshSecret || process.env.JWT_REFRESH_SECRET||'secret';

  if (!secret) {
    const message =
      'JWT secret is not configured. Please set JWT_SECRET or APP_AUTH_TOKEN environment variable.';
    if (throwIfMissing) {
      throw new Error(message);
    } else {
      console.warn(
        `[JWT] ${message} JWT operations will fail until configured.`
      );
    }
  }

  // Combine secret and salt for enhanced security
  // If salt is provided, create a hash of secret + salt
  // Otherwise, use the secret as-is for backward compatibility
  if (salt) {
    jwtSecret = crypto
      .createHash('sha256')
      .update(secret + salt)
      .digest('hex');
  } else {
    jwtSecret = secret;
  }

  // Initialize refresh token secret
  // If refresh secret is provided, use it (with the same salt as access tokens)
  // Otherwise, fall back to access token secret for backward compatibility
  if (refreshSecret) {
    if (salt) {
      jwtRefreshSecret = crypto
        .createHash('sha256')
        .update(refreshSecret + salt)
        .digest('hex');
    } else {
      jwtRefreshSecret = refreshSecret;
    }
  } else {
    // Fall back to access token secret if refresh secret is not configured
    jwtRefreshSecret = jwtSecret;
  }

  jwtInitialized = true;
}

function getJWTSecret() {
  if (!jwtInitialized) {
    initJWT();
  }
  return jwtSecret;
}

function getJWTRefreshSecret() {
  if (!jwtInitialized) {
    initJWT();
  }
  return jwtRefreshSecret;
}

export class JWTClaims {
  constructor() {
    this.userId = null;
    this.organizationId = null;
    this.organizationName = null;
    this.isSystemOrganization = false;
    this.roles = [];
    this.permissions = [];
    this.phone = null;
    this.isSystem = false;
    this.accountId = null;
    this.firstname = null;
    this.lastname = null;
    this.middlename = null;
    this.allowPinLogin = false;
    this.scopeLevel = null;
    this.scopeId = null;
    this.scopeSectorIds = null;
    this.jti = null;
    this.exp = null;
  }
}

export function generateToken(userData, expirationSeconds = 3600) {
  const secret = getJWTSecret();
  if (!secret) {
    throw new Error('JWT secret is not configured. Cannot generate token.');
  }

  const jti = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expirationSeconds;

  const claims = {
    userId: userData.userId,
    organizationId: userData.organizationId || null,
    organizationName: userData.organizationName || null,
    isSystemOrganization: userData.isSystemOrganization || false,
    roles: userData.roles || [],
    permissions: userData.permissions || [],
    phone: userData.phone || null,
    isSystem: userData.isSystem || false,
    accountId: userData.accountId || null,
    firstname: userData.firstname || null,
    lastname: userData.lastname || null,
    middlename: userData.middlename || null,
    allowPinLogin:
      userData.allowPinLogin !== undefined ? userData.allowPinLogin : true,
    scopeLevel: userData.scopeLevel || null,
    scopeId: userData.scopeId || null,
    scopeSectorIds: Array.isArray(userData.scopeSectorIds)
      ? userData.scopeSectorIds
      : null,
    jti,
    exp,
    iat,
  };

  return jwt.sign(claims, secret, { algorithm: 'HS256' });
}

export function validateToken(tokenString) {
  const secret = getJWTSecret();
  if (!secret) {
    throw new Error('JWT secret is not configured. Cannot validate token.');
  }

  try {
    const decoded = jwt.verify(tokenString, secret, { algorithms: ['HS256'] });

    const claims = new JWTClaims();
    claims.userId = decoded.userId;
    claims.organizationId = decoded.organizationId || null;
    claims.organizationName = decoded.organizationName || null;
    claims.isSystemOrganization = decoded.isSystemOrganization || false;
    claims.roles = decoded.roles || [];
    claims.permissions = decoded.permissions || [];
    claims.phone = decoded.phone || null;
    claims.isSystem = decoded.isSystem || false;
    claims.accountId = decoded.accountId || null;
    claims.firstname = decoded.firstname || null;
    claims.lastname = decoded.lastname || null;
    claims.middlename = decoded.middlename || null;
    claims.allowPinLogin =
      decoded.allowPinLogin !== undefined ? decoded.allowPinLogin : true;
    claims.scopeLevel = decoded.scopeLevel || null;
    claims.scopeId = decoded.scopeId || null;
    claims.scopeSectorIds = Array.isArray(decoded.scopeSectorIds)
      ? decoded.scopeSectorIds
      : null;
    claims.jti = decoded.jti || null;
    claims.exp = decoded.exp || null;

    return claims;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

export function extractTokenFromHeader(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  if (!authHeader) {
    throw new Error('Authorization header missing');
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    throw new Error('Invalid authorization header format');
  }

  return parts[1];
}

export class RefreshTokenClaims {
  constructor() {
    this.userId = null;
    this.jti = null;
    this.exp = null;
  }
}

export function generateRefreshToken(userId, expirationSeconds = 86400 * 7) {
  const secret = getJWTRefreshSecret();
  if (!secret) {
    throw new Error(
      'JWT refresh secret is not configured. Cannot generate refresh token.'
    );
  }

  const jti = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expirationSeconds;

  const claims = {
    userId,
    jti,
    exp,
    iat,
  };

  return jwt.sign(claims, secret, { algorithm: 'HS256' });
}

/**
 * Validate refresh token
 * @param {string} tokenString - Refresh token string
 * @returns {RefreshTokenClaims} Decoded claims
 * @throws {Error} If token is invalid
 */
export function validateRefreshToken(tokenString) {
  const secret = getJWTRefreshSecret();
  if (!secret) {
    throw new Error(
      'JWT refresh secret is not configured. Cannot validate refresh token.'
    );
  }

  try {
    const decoded = jwt.verify(tokenString, secret, { algorithms: ['HS256'] });

    const claims = new RefreshTokenClaims();
    claims.userId = decoded.userId;
    claims.jti = decoded.jti || null;
    claims.exp = decoded.exp || null;

    return claims;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    throw error;
  }
}
