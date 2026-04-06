import { logger } from '../../../shared/logger/logger.js';
import { env } from '../../../config/env.js';
import { createCentralAuthService } from '../usecases/auths/central-auth.service.js';

/**
 * Send SMS OTP to user's phone using central auth API
 *
 * @param {string} phone - Phone number to send OTP to
 * @param {string} otp - OTP code (not used, central auth generates it)
 * @returns {Promise<boolean>} True if SMS was sent successfully
 */
export async function sendSmsOtp(phone, otp) {
  try {
    // const smsProvider = env.mfa.smsProvider;

    // If SMS provider is set to 'none', use development mode
    // if (smsProvider === 'none' || !smsProvider) {
    //   logger.info(`[DEV MODE] SMS OTP for ${phone}: ${otp || '(would be sent via central auth)'}`);
    //   return true;
    // }

    // Use central auth API to send OTP
    const centralAuth = createCentralAuthService();
    await centralAuth.sendOtp(phone);

    logger.info(`SMS OTP sent via central auth API for ${phone}`);
    return true;
  } catch (error) {
    logger.error('Failed to send SMS OTP', {
      error: error.message,
      phone,
      stack: error.stack,
    });
    throw error;
  }
}
