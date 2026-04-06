/**
 * Central Auth Service
 * Handles communication with the central authentication service
 */

import axios from 'axios';
import https from 'https';
import { env } from '../../../../config/env.js';
import { logger } from '../../../../shared/logger/logger.js';

const CENTRAL_AUTH_BASE_URL =
  env.centralAuth?.baseURL || 'https://auth.cheche.et/api/v1';

/**
 * CentralAuthUser represents a user from the central auth service
 */
export class CentralAuthUser {
  constructor(data) {
    this.id = data.id;
    this.firstname = data.firstname || '';
    this.middlename = data.middlename || null;
    this.lastname = data.lastname || '';
    this.mobile = data.mobile || '';
    this.email = data.email || null;
    this.pin = data.pin || null;
    this.status = data.status || '';
    this.address = data.address || null;
    this.avatarUrl = data.avatar_url || null;
    this.failedLoginAttempts = data.failed_login_attempts || null;
    this.lastFailedAttempt = data.last_failed_attempt || null;
    this.lockedOutUntil = data.locked_out_until || null;
    this.createdAt = data.created_at || '';
    this.updatedAt = data.updated_at || '';
  }
}

/**
 * CentralAuthTokenClaims represents the JWT token claims from central auth
 */
export class CentralAuthTokenClaims {
  constructor(data) {
    this.userId = data.user_id || data.userId;
    this.firstname = data.firstname || '';
    this.middlename = data.middlename || null;
    this.lastname = data.lastname || '';
    this.mobile = data.mobile || '';
    this.tokenType = data.token_type || '';
    this.iss = data.iss || '';
    this.sub = data.sub || '';
    // JWT standard claims
    this.exp = data.exp;
    this.iat = data.iat;
    this.nbf = data.nbf;
  }
}

/**
 * SignInResponse represents the login response from central auth
 */
class SignInResponse {
  constructor(data) {
    this.accessToken = data.access_token || data.accessToken;
    this.refreshToken = data.refresh_token || data.refreshToken;
    this.message = data.message || '';
  }
}

/**
 * CentralAuthService handles communication with the central authentication service
 */
export class CentralAuthService {
  constructor(baseURL = CENTRAL_AUTH_BASE_URL) {
    this.baseURL = baseURL || CENTRAL_AUTH_BASE_URL;

    if (!this.baseURL) {
      logger.warn(
        'Central auth base URL is not configured. Using default: https://auth.cheche.et/api/v1'
      );
      this.baseURL = 'https://auth.cheche.et/api/v1';
    }

    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Allow self-signed certificates
      }),
    });
  }

  /**
   * Decode JWT token without validation
   * Note: This only decodes the token, it doesn't validate the signature
   */
  decodeToken(tokenString) {
    try {
      // JWT format: header.payload.signature
      const parts = tokenString.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }

      // Decode base64url encoded payload
      const payload = parts[1];
      // Replace URL-safe base64 characters
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const decoded = Buffer.from(padded, 'base64').toString('utf-8');
      const claims = JSON.parse(decoded);

      return new CentralAuthTokenClaims(claims);
    } catch (error) {
      throw new Error(`Failed to decode token: ${error.message}`);
    }
  }

  /**
   * Get user by mobile number from central auth
   */
  async getUserByMobile(mobile) {
    const encodedMobile = encodeURIComponent(mobile);
    const path = `/users/check-status?mobile=${encodedMobile}`;
    const headers = {
      'X-API-KEY': env.centralAuth?.apiKey ?? 'Y2hlY2hlLWNlbnRyYWwtYXV0aAo=',
    };

    try {
      const response = await this.client.get(path, { headers });

      if (response.status === 404) {
        throw new Error(
          `User not found: ${response.data?.error || 'User not found'}`
        );
      }

      if (response.status !== 200) {
        throw new Error(
          `Central auth error: ${
            response.data?.error || `Status ${response.status}`
          }`
        );
      }

      return response.data?.user;
    } catch (error) {
      if (error.response) {
        logger.error('Central auth getUserByMobile failed', {
          statusCode: error.response.status,
          data: error.response.data,
        });
        throw new Error(
          `Failed to get user by mobile: ${
            error.response.data?.error || error.message
          }`
        );
      }
      throw new Error(`Failed to get user by mobile: ${error.message}`);
    }
  }

  /**
   * Sign up a new user with password in central auth
   * POST /users/signup/password
   * @param {Object} payload - { firstname, lastname, middlename?, mobile, password }
   * @returns {Promise<Object>} Response from central auth
   */
  async signupWithPassword(payload) {
    const path = '/users/create-verified';
    const body = {
      firstname: payload.firstname ?? '',
      lastname: payload.lastname ?? '',
      middlename: payload.middlename ?? null,
      mobile: payload.mobile,
      password: payload.password,
    };
    const headers = {
      'X-API-KEY': env.centralAuth?.apiKey ?? 'Y2hlY2hlLWNlbnRyYWwtYXV0aAo=',
    };

    try {
      const response = await this.client.post(path, body, { headers });

      if (response.status === 200 || response.status === 201) {
        logger.info(`User signed up via central auth for mobile: ${payload.mobile}`);
        return {
          success: true,
          message: response.data?.message || 'Signup successful',
          data: response.data,
        };
      }

      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      if (error.response) {
        logger.error('Central auth signup with password failed', {
          statusCode: error.response.status,
          data: error.response.data,
          mobile: payload.mobile,
        });
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`;
        throw new Error(`Failed to sign up: ${errorMsg}`);
      }
      throw new Error(`Failed to sign up: ${error.message}`);
    }
  }

  /**
   * Send OTP to user's mobile via SMS
   * @param {string} mobile - Mobile phone number
   * @returns {Promise<Object>} Response from central auth
   */
  async sendOtp(mobile) {
    const path = '/users/send-otp';
    const body = {
      mobile: mobile,
    };

    try {
      const response = await this.client.post(path, body);

      if (response.status === 200 || response.status === 201) {
        logger.info(`OTP sent via central auth for mobile: ${mobile}`);
        return {
          success: true,
          message: response.data?.message || 'OTP sent successfully',
        };
      }

      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      if (error.response) {
        logger.error('Central auth send OTP failed', {
          statusCode: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          mobile: mobile,
        });
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`;
        throw new Error(`Failed to send OTP: ${errorMsg}`);
      } else if (error.request) {
        logger.error('Central auth request timeout or no response', {
          url: `${this.baseURL}${path}`,
          error: error.message,
        });
        throw new Error(`Request failed: ${error.message}`);
      } else {
        logger.error('Central auth send OTP error', {
          error: error.message,
          stack: error.stack,
          mobile: mobile,
        });
        throw new Error(`Failed to send OTP: ${error.message}`);
      }
    }
  }

  /**
   * Verify OTP code for user's mobile
   * @param {string} mobile - Mobile phone number
   * @param {string} otp - OTP code to verify
   * @returns {Promise<Object>} Verification result
   */
  async verifyOtp(mobile, otp) {
    const path = '/users/verify-otp';
    const body = {
      mobile: mobile,
      otp: otp,
    };
    try {
      const response = await this.client.post(path, body);

      if (response.status === 200) {
        logger.info(`OTP verified via central auth for mobile: ${mobile}`);
        return {
          success: true,
          message: response.data?.message || 'OTP verified successfully',
          data: response.data,
        };
      }

      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      if (error.response) {
        logger.error('Central auth verify OTP failed', {
          statusCode: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          mobile: mobile,
        });
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`;
        throw new Error(`Failed to verify OTP: ${errorMsg}`);
      } else if (error.request) {
        logger.error('Central auth request timeout or no response', {
          url: `${this.baseURL}${path}`,
          error: error.message,
        });
        throw new Error(`Request failed: ${error.message}`);
      } else {
        logger.error('Central auth verify OTP error', {
          error: error.message,
          stack: error.stack,
          mobile: mobile,
        });
        throw new Error(`Failed to verify OTP: ${error.message}`);
      }
    }
  }

  /**
   * Sign in (authenticate) with central auth
   * Returns decoded token claims
   */
  async signIn(mobile, pin) {
    const path = '/users/signin';
    const body = {
      mobile: mobile,
      pin: pin,
    };

    try {
      const response = await this.client.post(path, body);

      // Check if response is HTML (error page)
      const contentType = response.headers['content-type'] || '';
      const isJson = contentType.includes('application/json');

      if (
        !isJson &&
        typeof response.data === 'string' &&
        response.data.trim().startsWith('<')
      ) {
        throw new Error(
          `Central auth returned HTML (status ${response.status}). The service may be unavailable or the endpoint is incorrect.`,
        );
      }

      if (response.status !== 200) {
        const errorMsg =
          response.data?.error ||
          response.data?.message ||
          `HTTP ${response.status}`;
        logger.warn('Central auth returned non-200 status', {
          statusCode: response.status,
          error: errorMsg,
          response: response.data,
        });
        throw new Error(`Authentication failed. Please try again.`);
      }

      const signInResp = new SignInResponse(response.data);

      if (!signInResp.accessToken) {
        logger.error('No access token in central auth response', {
          response: response.data,
        });
        throw new Error('No access token in response');
      }

      // Decode the access token to get claims
      const claims = this.decodeToken(signInResp.accessToken);

      return claims;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        logger.error('Central auth sign in failed', {
          statusCode: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          mobile: mobile,
        });
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`;
        throw new Error(`Authentication failed. Please try again.`);
      } else if (error.request) {
        // The request was made but no response was received
        logger.error('Central auth request timeout or no response', {
          url: `${this.baseURL}${path}`,
          error: error.message,
        });
        throw new Error(`Request failed: ${error.message}`);
      } else {
        // Something happened in setting up the request
        logger.error('Central auth sign in error', {
          error: error.message,
          stack: error.stack,
          mobile: mobile,
        });
        throw new Error(`Failed to sign in: ${error.message}`);
      }
    }
  }

  /**
   * Sign in with password (for password length >= 8)
   * POST /users/signin/password
   * Returns decoded token claims
   */
  async signInWithPassword(mobile, password) {
    const path = '/users/signin/password';
    const body = {
      mobile,
      password,
    };

    try {
      const response = await this.client.post(path, body);

      const contentType = response.headers['content-type'] || '';
      const isJson = contentType.includes('application/json');

      if (
        !isJson &&
        typeof response.data === 'string' &&
        response.data.trim().startsWith('<')
      ) {
        logger.error('Central auth returned HTML instead of JSON', {
          statusCode: response.status,
          contentType,
          url: `${this.baseURL}${path}`,
          responsePreview: response.data.substring(0, 500),
        });
        throw new Error(
          `Central auth returned HTML (status ${response.status}). The service may be unavailable or the endpoint is incorrect.`
        );
      }

      if (response.status !== 200) {
        const errorMsg =
          response.data?.error ||
          response.data?.message ||
          `HTTP ${response.status}`;
        logger.warn('Central auth sign in with password returned non-200', {
          statusCode: response.status,
          error: errorMsg,
          response: response.data,
        });
        throw new Error(`Authentication failed. Please try again.`);
      }

      const signInResp = new SignInResponse(response.data);

      if (!signInResp.accessToken) {
        logger.error('No access token in central auth response', {
          response: response.data,
        });
        throw new Error('No access token in response');
      }

      return this.decodeToken(signInResp.accessToken);
    } catch (error) {
      if (error.response) {
        logger.error('Central auth sign in with password failed', {
          statusCode: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          mobile,
        });
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`;
        throw new Error(`Authentication failed. Please try again.`);
      }
      if (error.request) {
        logger.error('Central auth request timeout or no response', {
          url: `${this.baseURL}${path}`,
          error: error.message,
        });
        throw new Error(`Request failed: ${error.message}`);
      }
      logger.error('Central auth sign in with password error', {
        error: error.message,
        stack: error.stack,
        mobile,
      });
      throw new Error(`Failed to sign in: ${error.message}`);
    }
  }

  /**
   * Update user password in central auth
   * PUT /auth/password/update/:id
   * @param {string} userId - Central auth user id (accountId)
   * @param {string} password - New password
   */
  async updatePassword(userId, password) {
    const path = `/auth/password/update/${encodeURIComponent(userId)}`;
    const body = { password };
    const headers = {
      'X-API-KEY': env.centralAuth?.apiKey ?? 'Y2hlY2hlLWNlbnRyYWwtYXV0aAo=',
    };

    try {
      const response = await this.client.put(path, body, { headers });

      if (response.status === 200 || response.status === 204) {
        logger.info(`Password updated via central auth for user: ${userId}`);
        return {
          success: true,
          message: response.data?.message || 'Password updated successfully',
        };
      }

      throw new Error(
        response.data?.error ||
          response.data?.message ||
          `Unexpected status ${response.status}`
      );
    } catch (error) {
      if (error.response) {
        logger.error('Central auth update password failed', {
          statusCode: error.response.status,
          data: error.response.data,
          userId,
        });
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`;
        throw new Error(`Failed to update password: ${errorMsg}`);
      }
      throw new Error(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Update user PIN in central auth
   * PUT /users/:id/pin
   * @param {string} userId - Central auth user id (accountId)
   * @param {string} pin - New PIN
   */
  async updatePin(userId, pin) {
    const path = `/users/${encodeURIComponent(userId)}/pin`;
    const body = { pin };
    const headers = {
      'X-API-KEY': env.centralAuth?.apiKey ?? 'Y2hlY2hlLWNlbnRyYWwtYXV0aAo=',
    };

    try {
      const response = await this.client.put(path, body, { headers });

      if (response.status === 200 || response.status === 204) {
        logger.info(`PIN updated via central auth for user: ${userId}`);
        return {
          success: true,
          message: response.data?.message || 'PIN updated successfully',
        };
      }

      throw new Error(
        response.data?.error ||
          response.data?.message ||
          `Unexpected status ${response.status}`
      );
    } catch (error) {
      if (error.response) {
        logger.error('Central auth update PIN failed', {
          statusCode: error.response.status,
          data: error.response.data,
          userId,
        });
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`;
        throw new Error(`Failed to update PIN: ${errorMsg}`);
      }
      throw new Error(`Failed to update PIN: ${error.message}`);
    }
  }

  /**
   * Reset password using mobile + OTP (first-time / forgot-password flow)
   * POST /users/reset-password
   * @param {Object} payload - { mobile, new_password, otp }
   */
  async resetPassword(payload) {
    const path = '/users/reset-password';
    const body = {
      mobile: payload.mobile,
      new_password: payload.new_password,
      otp: payload.otp,
    };
    const headers = {
      'X-API-KEY': env.centralAuth?.apiKey ?? 'Y2hlY2hlLWNlbnRyYWwtYXV0aAo=',
    };

    try {
      const response = await this.client.post(path, body, { headers });

      if (response.status === 200 || response.status === 201) {
        logger.info(`Password reset via central auth for mobile: ${payload.mobile}`);
        return {
          success: true,
          message: response.data?.message || 'Password reset successful',
          data: response.data,
        };
      }

      throw new Error(
        response.data?.error ||
          response.data?.message ||
          `Unexpected status ${response.status}`,
      );
    } catch (error) {
      if (error.response) {
        logger.error('Central auth reset password failed', {
          statusCode: error.response.status,
          data: error.response.data,
          mobile: payload.mobile,
        });
        const errorMsg =
          error.response.data?.error ||
          error.response.data?.message ||
          error.response.statusText ||
          `HTTP ${error.response.status}`;
        throw new Error(`Failed to reset password: ${errorMsg}`);
      }
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  }
}

/**
 * Create a new central auth service instance
 */
export function createCentralAuthService(baseURL) {
  return new CentralAuthService(baseURL);
}

