/**
 * Phone Number Utility
 * Provides phone number validation, formatting, and masking using libphonenumber-js
 */

import { parsePhoneNumberFromString } from 'libphonenumber-js';

export class PhoneUtil {
  /**
   * Format phone number to international format
   * @param {string} phone - Phone number to format
   * @param {string} countryCode - Country code (default: 'ET')
   * @returns {string} Formatted phone number in international format
   */
  static formatInternationalPhone(phone, countryCode = 'ET') {
    const phoneNumber = parsePhoneNumberFromString(phone, countryCode);
    if (phoneNumber && phoneNumber.isValid()) {
      phone = phoneNumber.formatInternational().replace(/\s+/g, '');
    }
    return phone;
  }

  /**
   * Check if phone number is valid and return formatted international phone
   * @param {string} phone - Phone number to validate
   * @param {string} countryCode - Country code (default: 'ET')
   * @returns {string} Formatted phone number in international format
   * @throws {Error} If phone number is invalid
   */
  static checkValidPhone(phone, countryCode = 'ET') {
    const phoneNumber = parsePhoneNumberFromString(phone, countryCode);
    if (!phoneNumber || !phoneNumber.isValid()) {
      throw new Error('Invalid phone number');
    }
    phone = phoneNumber.formatInternational().replace(/\s+/g, '');
    return phone;
  }

  /**
   * Format phone number to national format
   * @param {string} phone - Phone number to format
   * @param {string} countryCode - Country code (default: 'ET')
   * @returns {string} Formatted phone number in national format
   */
  static formatNationalPhone(phone, countryCode = 'ET') {
    const phoneNumber = parsePhoneNumberFromString(phone, countryCode);
    if (phoneNumber && phoneNumber.isValid()) {
      phone = phoneNumber.formatNational().replace(/\s+/g, '');
    }
    return phone;
  }

  /**
   * Check if phone number is valid
   * @param {string} phone - Phone number to validate
   * @param {string} countryCode - Country code (default: 'ET')
   * @returns {boolean} True if phone number is valid
   */
  static isPhone(phone, countryCode = 'ET') {
    const phoneNumber = parsePhoneNumberFromString(phone, countryCode);
    return Boolean(phoneNumber?.isValid());
  }

  /**
   * Mask phone number for privacy
   * Shows first 6 digits and last 2 digits, masks the rest
   * @param {string} phoneNumber - Phone number to mask
   * @returns {string} Masked phone number
   */
  static maskPhoneNumber(phoneNumber) {
    phoneNumber = this.formatInternationalPhone(phoneNumber);
    const length = phoneNumber.length;
    const visibleStartDigits = 6;
    const visibleEndDigits = 2;
    const start = phoneNumber.slice(0, visibleStartDigits);
    const end = phoneNumber.slice(-visibleEndDigits);
    const masked = '*'.repeat(length - (visibleStartDigits + visibleEndDigits));

    return `${start}${masked}${end}`;
  }
}

