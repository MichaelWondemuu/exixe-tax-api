import { env } from '../../../config/env.js';

class PinRateLimiter {
  constructor() {
    // Map: deviceId -> { attempts: number, resetAt: timestamp }
    this.attempts = new Map();
    this.maxAttempts = env.pinRateLimit?.maxAttempts || 5; // Maximum attempts per window
    const windowMinutes = env.pinRateLimit?.windowMinutes || 15;
    this.windowMs = windowMinutes * 60 * 1000; // Convert minutes to milliseconds
  }

  isRateLimited(deviceId) {
    const record = this.attempts.get(deviceId);

    if (!record) {
      return false;
    }

    // Check if window has expired
    if (Date.now() > record.resetAt) {
      this.attempts.delete(deviceId);
      return false;
    }

    return record.attempts >= this.maxAttempts;
  }


  recordAttempt(deviceId) {
    const record = this.attempts.get(deviceId);

    if (!record || Date.now() > record.resetAt) {
      // New window or expired window
      this.attempts.set(deviceId, {
        attempts: 1,
        resetAt: Date.now() + this.windowMs,
      });
    } else {
      // Increment attempts in current window
      record.attempts++;
    }
  }

  /**
   * Reset attempts for a device (on successful PIN verification)
   * @param {string} deviceId - Device ID
   */
  resetAttempts(deviceId) {
    this.attempts.delete(deviceId);
  }


  getRemainingAttempts(deviceId) {
    const record = this.attempts.get(deviceId);

    if (!record) {
      return this.maxAttempts;
    }

    if (Date.now() > record.resetAt) {
      this.attempts.delete(deviceId);
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - record.attempts);
  }

  
  getResetTime(deviceId) {
    const record = this.attempts.get(deviceId);

    if (!record) {
      return null;
    }

    if (Date.now() > record.resetAt) {
      this.attempts.delete(deviceId);
      return null;
    }

    return new Date(record.resetAt);
  }
}

// Singleton instance
export const pinRateLimiter = new PinRateLimiter();

