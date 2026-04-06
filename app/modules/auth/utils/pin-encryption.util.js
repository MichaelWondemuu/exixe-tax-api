import crypto from 'crypto';
import { env } from '../../../config/env.js';
import { logger } from '../../../shared/logger/logger.js';

/**
 * PIN Encryption Utilities
 * Uses RSA asymmetric encryption for one-way encryption
 * Frontend encrypts with public key, backend decrypts with private key
 */

let privateKey = null;
let publicKey = null;
let encryptionInitialized = false;

/**
 * Initialize encryption keys
 * Reads from environment variables or generates new keys
 */
export function initPinEncryption(throwIfMissing = false) {
  if (encryptionInitialized) {
    return { publicKey, privateKey };
  }

  // Try to get keys from environment
  const envPrivateKey =
    env.pinEncryption?.privateKey || process.env.PIN_ENCRYPTION_PRIVATE_KEY;
  const envPublicKey =
    env.pinEncryption?.publicKey || process.env.PIN_ENCRYPTION_PUBLIC_KEY;

  if (envPrivateKey && envPublicKey) {
    // Validate that keys are not placeholders or invalid format
    const isPlaceholder =
      envPublicKey.includes('pin_') ||
      envPublicKey.includes('placeholder') ||
      envPublicKey.includes('public_access') ||
      !envPublicKey.includes('-----BEGIN PUBLIC KEY-----') ||
      !envPublicKey.includes('-----END PUBLIC KEY-----');

    if (isPlaceholder) {
      logger.warn(
        'Invalid public key format in environment variables. Keys appear to be placeholders. Generating new keys...'
      );
      // Fall through to key generation below
    } else {
      try {
        // Validate keys can be used by trying to create key objects
        crypto.createPublicKey(envPublicKey);
        crypto.createPrivateKey(envPrivateKey);

        privateKey = envPrivateKey;
        publicKey = envPublicKey;
        encryptionInitialized = true;
        // logger.info('PIN encryption initialized from environment variables');
        return { publicKey, privateKey };
      } catch (error) {
        logger.error('Failed to initialize PIN encryption from environment', {
          error: error.message,
        });
        if (throwIfMissing) {
          throw new Error(
            'Failed to initialize PIN encryption: Invalid key format'
          );
        }
        // Fall through to key generation
      }
    }
  }

  // Generate new key pair if not provided
  if (!envPrivateKey || !envPublicKey) {
    try {
      const { publicKey: pubKey, privateKey: privKey } =
        crypto.generateKeyPairSync('rsa', {
          modulusLength: 2048,
          publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
          },
        });

      privateKey = privKey;
      publicKey = pubKey;
      encryptionInitialized = true;

      // logger.warn(
      //   'PIN encryption keys generated automatically. For production, set PIN_ENCRYPTION_PRIVATE_KEY and PIN_ENCRYPTION_PUBLIC_KEY environment variables.'
      // );
      // logger.info('Generated public key (share with frontend):', { publicKey });

      return { publicKey, privateKey };
    } catch (error) {
      logger.error('Failed to generate PIN encryption keys', {
        error: error.message,
      });
      if (throwIfMissing) {
        throw new Error('Failed to generate PIN encryption keys');
      }
    }
  }

  return { publicKey, privateKey };
}

/**
 * Get public key for frontend
 * @returns {string} PEM formatted public key
 */
export function getPublicKey() {
  if (!encryptionInitialized) {
    initPinEncryption();
  }
  if (!publicKey) {
    throw new Error(
      'PIN encryption not initialized. Public key not available.'
    );
  }

  // Validate that publicKey is a valid PEM format (not a placeholder)
  const isPlaceholder =
    publicKey.includes('pin_') ||
    publicKey.includes('placeholder') ||
    publicKey.includes('public_access') ||
    !publicKey.includes('-----BEGIN PUBLIC KEY-----') ||
    !publicKey.includes('-----END PUBLIC KEY-----');

  if (isPlaceholder) {
    // logger.error(
    //   'Invalid public key format detected (placeholder found). Regenerating keys...'
    // );
    // Reset and regenerate keys
    encryptionInitialized = false;
    privateKey = null;
    publicKey = null;

    try {
      const result = initPinEncryption(true);
      if (
        !result.publicKey ||
        !result.publicKey.includes('-----BEGIN PUBLIC KEY-----')
      ) {
        throw new Error('Failed to generate valid public key');
      }
      return result.publicKey;
    } catch (error) {
      logger.error('Failed to regenerate keys', { error: error.message });
      throw new Error(
        'Invalid public key configuration. Please set valid PIN_ENCRYPTION_PUBLIC_KEY and PIN_ENCRYPTION_PRIVATE_KEY environment variables, or remove them to auto-generate keys.'
      );
    }
  }

  return publicKey;
}

/**
 * Decrypt PIN using private key
 * Validates timestamp to ensure PIN is not older than configured timeout
 * @param {string} encryptedPin - Base64 encoded encrypted PIN
 * @param {number} timeoutMinutes - Timeout in minutes (default: from env config)
 * @returns {string} Decrypted PIN
 */
export function decryptPin(encryptedPin, timeoutMinutes = null) {
  // Get timeout from env config if not provided
  if (timeoutMinutes === null) {
    timeoutMinutes = env.pinEncryption?.timeoutMinutes || 5;
  }
  if (!encryptionInitialized) {
    initPinEncryption(true);
  }

  if (!privateKey) {
    throw new Error('PIN encryption private key not available');
  }

  try {
    // Decode from base64
    const encryptedBuffer = Buffer.from(encryptedPin, 'base64');

    // Decrypt using private key
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      encryptedBuffer
    );

    const decryptedString = decrypted.toString('utf8');

    // Try to parse as JSON (new format with timestamp)
    try {
      const payload = JSON.parse(decryptedString);
      
      // Validate timestamp if present
      if (payload.timestamp) {
        const timestamp = payload.timestamp;
        const now = Date.now();
        const ageMinutes = (now - timestamp) / (1000 * 60);
        
        if (ageMinutes > timeoutMinutes) {
          logger.warn(`Encrypted PIN expired. Age: ${ageMinutes.toFixed(2)} minutes, timeout: ${timeoutMinutes} minutes`);
          throw new Error(`Encrypted PIN has expired. PIN must be used within ${timeoutMinutes} minutes.`);
        }
        
        // Return the PIN from payload
        return payload.pin;
      }
      
      // If no timestamp, assume old format (backward compatibility)
      return payload.pin || decryptedString;
    } catch (parseError) {
      // If not JSON, assume old format (backward compatibility)
      return decryptedString;
    }
  } catch (error) {
    logger.error('Failed to decrypt PIN', { error: error.message });
    if (error.message.includes('expired')) {
      throw error; // Re-throw expiration errors as-is
    }
    throw new Error('Invalid encrypted PIN format');
  }
}

/**
 * Check if a string is encrypted (base64 format check)
 * @param {string} value - Value to check
 * @returns {boolean}
 */
export function isEncrypted(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // Check if it's base64 encoded and has reasonable length for encrypted data
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(value) && value.length > 100; // Encrypted PINs are typically > 100 chars
}

/**
 * Encrypt PIN with timestamp for frontend use
 * This is a helper function that shows the expected format
 * Frontend should encrypt: JSON.stringify({ pin: "1234", timestamp: Date.now() })
 * 
 * @param {string} pin - PIN to encrypt
 * @param {string} publicKeyPem - Public key in PEM format
 * @returns {Promise<string>} Base64 encoded encrypted PIN
 * 
 * Note: This is primarily for documentation/testing. Frontend should implement
 * encryption using Web Crypto API or similar library.
 */
export async function encryptPinWithTimestamp(pin, publicKeyPem) {
  if (!pin || typeof pin !== 'string') {
    throw new Error('PIN must be a string');
  }

  // Create payload with PIN and current timestamp
  const payload = {
    pin: pin,
    timestamp: Date.now(),
  };

  const payloadString = JSON.stringify(payload);

  try {
    // Import public key
    const publicKey = crypto.createPublicKey(publicKeyPem);

    // Encrypt using public key
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(payloadString, 'utf8')
    );

    // Return base64 encoded
    return encrypted.toString('base64');
  } catch (error) {
    logger.error('Failed to encrypt PIN', { error: error.message });
    throw new Error('Failed to encrypt PIN');
  }
}

