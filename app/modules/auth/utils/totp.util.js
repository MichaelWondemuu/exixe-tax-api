import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { env } from '../../../config/env.js';
import { logger } from '../../../shared/logger/logger.js';

/**
 * Generate a TOTP secret for a user
 * @param {string} userId - User ID
 * @param {string} userEmail - User email or phone for label
 * @returns {Object} Secret object with base32 secret
 */
export function generateTotpSecret(userId, userEmail = null) {
  const secret = speakeasy.generateSecret({
    name: `${env.mfa.totpIssuer}:${userEmail || userId}`,
    issuer: env.mfa.totpIssuer,
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  };
}

/**
 * Generate QR code data URL for TOTP setup
 * @param {string} otpauthUrl - OTP Auth URL
 * @returns {Promise<string>} QR code data URL
 */
export async function generateTotpQrCode(otpauthUrl) {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    logger.error('Failed to generate TOTP QR code', {
      error: error.message,
      stack: error.stack,
    });
    throw new Error('Failed to generate QR code for TOTP setup');
  }
}

/**
 * Verify a TOTP token
 * @param {string} token - TOTP token from user
 * @param {string} secret - Base32 encoded TOTP secret
 * @returns {boolean} True if token is valid
 */
export function verifyTotpToken(token, secret) {
  try {
    const window = env.mfa.totpWindow; // Allow tokens within ±window time steps
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: window, // Allow ±window time steps (default 2 = ±60 seconds)
    });

    return verified;
  } catch (error) {
    logger.error('TOTP verification error', {
      error: error.message,
      stack: error.stack,
    });
    return false;
  }
}

/**
 * Generate a TOTP token (for testing)
 * @param {string} secret - Base32 encoded TOTP secret
 * @returns {string} Current TOTP token
 */
export function generateTotpToken(secret) {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32',
  });
}
