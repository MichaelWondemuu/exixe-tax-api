import bcrypt from 'bcryptjs';
import { HttpError } from '../../../shared/utils/http-error.js';
import { env } from '../../../config/env.js';

export async function hashPin(pin) {
  if (!pin || typeof pin !== 'string') {
    throw new HttpError(400, 'VALIDATION_ERROR', 'PIN must be a string');
  }

  if (!/^\d{4,6}$/.test(pin)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'PIN must be 4-6 digits');
  }

  const saltRounds = env.pinHash?.saltRounds || 10;
  return await bcrypt.hash(pin, saltRounds);
}

export async function verifyPin(pin, hash) {
  if (!pin || !hash) {
    return false;
  }

  try {
    return await bcrypt.compare(pin, hash);
  } catch (error) {
    return false;
  }
}

