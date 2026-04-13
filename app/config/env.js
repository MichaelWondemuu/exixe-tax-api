import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const toInt = (value, fallback) => {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const toString = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  // Trim whitespace, remove trailing commas, and remove surrounding quotes
  let result = String(value).trim().replace(/,$/, '');
  // Remove surrounding quotes (both single and double)
  if ((result.startsWith('"') && result.endsWith('"')) ||
    (result.startsWith("'") && result.endsWith("'"))) {
    result = result.slice(1, -1);
  }
  return result;
};

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: toInt(process.env.PORT, 5000),
  db: Object.freeze({
    host: toString(process.env.DB_HOST, 'nana.postgres.database.azure.com'),
    port: toInt(toString(process.env.DB_PORT, '5432'), 5432), // Handle "5432," user typo
    username: toString(
      process.env.DB_USER || process.env.DB_USERNAME,
      'cheche_invoice_test',
    ),
    password: toString(process.env.DB_PASSWORD, 'mNedW31dBqqC'),
    database: toString(process.env.DB_DATABASE, 'cheche_invoice_test'),
    ssl: toBool(process.env.DB_SSL, true),
    logging: toBool(process.env.DB_LOGGING, true),
  }),
  jwt: Object.freeze({
    secret: toString(process.env.JWT_SECRET, 'secret'),
    salt: toString(process.env.JWT_SALT, 'salt'),
    refreshSecret: toString(process.env.JWT_REFRESH_SECRET, 'secret'),
    accessTokenDuration: toInt(process.env.JWT_ACCESS_TOKEN_DURATION, 900),
    refreshTokenDuration: toInt(
      process.env.JWT_REFRESH_TOKEN_DURATION,
      3600 * 5,
    ),
  }),
  centralAuth: Object.freeze({
    baseURL: toString(
      process.env.CENTRAL_AUTH_BASE_URL,
      'https://auth.cheche.et/api/v1',
    ),
    apiKey: toString(
      process.env.CENTRAL_AUTH_API_KEY,
      'Y2hlY2hlLWNlbnRyYWwtYXV0aAo=',
    ),
  }),
  api: Object.freeze({
    baseURL: toString(
      process.env.BASE_API_URL,
      'https://invoice-test.cheche.et/api/v1',
    ),
    host: toString(process.env.HOST_PROD, 'https://invoice-test.cheche.et'),
  }),
  pinEncryption: Object.freeze({
    privateKey: toString(process.env.PIN_ENCRYPTION_PRIVATE_KEY, null),
    publicKey: toString(process.env.PIN_ENCRYPTION_PUBLIC_KEY, null),
    timeoutMinutes: toInt(process.env.PIN_ENCRYPTION_TIMEOUT_MINUTES, 5),
  }),
  pinRateLimit: Object.freeze({
    maxAttempts: toInt(process.env.PIN_RATE_LIMIT_MAX_ATTEMPTS, 5),
    windowMinutes: toInt(process.env.PIN_RATE_LIMIT_WINDOW_MINUTES, 15),
  }),
  pinHash: Object.freeze({
    saltRounds: toInt(process.env.PIN_HASH_SALT_ROUNDS, 10),
  }),
  auth: Object.freeze({
    maxInvalidLoginAttempts: toInt(
      process.env.AUTH_MAX_INVALID_LOGIN_ATTEMPTS,
      3,
    ),
    temporaryBanMinutes: toInt(process.env.AUTH_TEMPORARY_BAN_MINUTES, 15),
  }),
  /** Sequelize sync on startup when true (see DBSYNC). */
  dbSync:
    process.env.DBSYNC === undefined || String(process.env.DBSYNC).trim() === ''
      ? toBool(process.env.DBSYNC, false)
      : true,
  filesDir: path.resolve(process.env.FILES_DIR || '../../files'),
  keyEncryption: Object.freeze({
    secret: toString(process.env.KEY_ENCRYPTION_SECRET, null),
  }),
  selfRegistration: Object.freeze({
    licenseExpiryWarningDays: toInt(
      process.env.SELF_REG_LICENSE_EXPIRY_WARNING_DAYS,
      30,
    ),
  }),
  mfa: Object.freeze({
    otpLength: toInt(process.env.MFA_OTP_LENGTH, 6),
    otpExpirationMinutes: toInt(process.env.MFA_OTP_EXPIRATION_MINUTES, 10),
    totpIssuer: toString(process.env.MFA_TOTP_ISSUER, 'Cheche Invoice'),
    totpWindow: toInt(process.env.MFA_TOTP_WINDOW, 2),
    backupCodesCount: toInt(process.env.MFA_BACKUP_CODES_COUNT, 10),
    // SMS provider configuration
    smsProvider: toString(process.env.SMS_PROVIDER, 'none'),
    smsApiKey: toString(process.env.SMS_API_KEY, null),
    smsApiSecret: toString(process.env.SMS_API_SECRET, null),
    smsFromNumber: toString(process.env.SMS_FROM_NUMBER, null),
  }),
});
