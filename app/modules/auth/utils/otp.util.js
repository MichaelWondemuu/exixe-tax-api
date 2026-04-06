import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { env } from '../../../config/env.js';

/**
 * Generate a random OTP code
 * @param {number} length - Length of OTP (default from env)
 * @returns {string} OTP code
 */
export function generateOtp(length = null) {
  const otpLength = length || env.mfa.otpLength;
  const min = Math.pow(10, otpLength - 1);
  const max = Math.pow(10, otpLength) - 1;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  return otp.toString().padStart(otpLength, '0');
}

/**
 * Hash an OTP code for storage
 * @param {string} otp - Plain OTP code
 * @returns {Promise<string>} Hashed OTP
 */
export async function hashOtp(otp) {
  const saltRounds = env.pinHash.saltRounds;
  return await bcrypt.hash(otp, saltRounds);
}

/**
 * Verify an OTP code against its hash
 * @param {string} otp - Plain OTP code
 * @param {string} hash - Hashed OTP
 * @returns {Promise<boolean>} True if OTP matches
 */
export async function verifyOtp(otp, hash) {
  return await bcrypt.compare(otp, hash);
}

/**
 * Generate backup codes for TOTP
 * @param {number} count - Number of backup codes to generate
 * @returns {string[]} Array of backup codes
 */
export function generateBackupCodes(count = null) {
  const codesCount = count || env.mfa.backupCodesCount;
  const codes = [];
  for (let i = 0; i < codesCount; i++) {
    // Generate 8-character alphanumeric codes
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Hash backup codes for storage
 * @param {string[]} codes - Array of backup codes
 * @returns {Promise<string[]>} Array of hashed backup codes
 */
export async function hashBackupCodes(codes) {
  const hashedCodes = [];
  for (const code of codes) {
    const hashed = await hashOtp(code);
    hashedCodes.push(hashed);
  }
  return hashedCodes;
}

/**
 * Verify a backup code against hashed backup codes
 * @param {string} code - Plain backup code
 * @param {string[]} hashedCodes - Array of hashed backup codes
 * @returns {Promise<{valid: boolean, index: number|null}>} Result with index if valid
 */
export async function verifyBackupCode(code, hashedCodes) {
  if (!Array.isArray(hashedCodes)) {
    return { valid: false, index: null };
  }

  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await verifyOtp(code, hashedCodes[i]);
    if (isValid) {
      return { valid: true, index: i };
    }
  }

  return { valid: false, index: null };
}

export function showPartial(input, showLength = 5, position = 'start') {
  if (!input || typeof input !== 'string') {
    return '';
  }

  if (input.length <= showLength) {
    return input;
  }

  if (position === 'start') {
    return input.substring(0, showLength) + '********';
  } else if (position === 'end') {
    return '********' + input.substring(input.length - showLength);
  } else if (position === 'middle') {
    return (
      input.substring(0, showLength) +
      '********' +
      input.substring(input.length - showLength)
    );
  }

  return input;
}