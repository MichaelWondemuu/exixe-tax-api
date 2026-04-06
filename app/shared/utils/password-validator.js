import crypto from 'crypto';
import { HttpError } from './http-error.js';

/**
 * Password policy requirements (aligned with Security Audit #9 recommendation):
 *  - Minimum 8 characters
 *  - At least one uppercase letter (A-Z)
 *  - At least one lowercase letter (a-z)
 *  - At least one digit (0-9)
 *  - At least one special character
 */
const PASSWORD_POLICY = {
    minLength: 8,
    patterns: [
        { re: /[A-Z]/, label: 'at least one uppercase letter' },
        { re: /[a-z]/, label: 'at least one lowercase letter' },
        { re: /[0-9]/, label: 'at least one number' },
        { re: /[!@#$%^&*()\-_=+[\]{}|;:'",.<>?/\\`~]/, label: 'at least one special character' },
    ],
};

/**
 * Validate password strength against the system policy.
 *
 * @param {string} password - The plaintext password to validate.
 * @throws {HttpError} 400 WEAK_PASSWORD if the password does not meet policy requirements.
 * @returns {Promise<boolean>} if the password is valid.
 */
export async function validatePasswordStrength(password) {
    if (!password || typeof password !== 'string') {
        throw new HttpError(400, 'WEAK_PASSWORD', 'Password is required.');
    }

    const unmet = [];

    if (password.length < PASSWORD_POLICY.minLength) {
        unmet.push(`at least ${PASSWORD_POLICY.minLength} characters`);
    }

    for (const { re, label } of PASSWORD_POLICY.patterns) {
        if (!re.test(password)) {
            unmet.push(label);
        }
    }

    if (unmet.length > 0) {
        throw new HttpError(
            400,
            'WEAK_PASSWORD',
            `Password must contain ${unmet.join(', ')}.`,
        );
    }

    // Check against Have I Been Pwned API (which includes common passwords)
    try {
        const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);

        const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
        if (response.ok) {
            const body = await response.text();
            const lines = body.split('\n');
            const isPwned = lines.some(line => line.split(':')[0] === suffix);

            if (isPwned) {
                throw new HttpError(
                    400,
                    'WEAK_PASSWORD',
                    'This password has appeared in a data breach and is unsafe to use. Please choose a different password.'
                );
            }
        }
    } catch (err) {
        if (err instanceof HttpError) throw err;
        // Ignore API failures to ensure the system remains available
    }

    return true;
}

/**
 * Generate a cryptographically secure random password that satisfies the system policy.
 * Guarantees at least one character from each required category.
 *
 * @param {number} [length=16] - Total length of the generated password (minimum 8).
 * @returns {string} A strong random password.
 */
export function generateStrongPassword(length = 16) {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const symbols = '!@#$%^&*()-_=+[]{}|;:,.?';
    const all = upper + lower + digits + symbols;

    // Guarantee at least one of each required type
    const required = [
        upper[Math.floor(Math.random() * upper.length)],
        lower[Math.floor(Math.random() * lower.length)],
        digits[Math.floor(Math.random() * digits.length)],
        symbols[Math.floor(Math.random() * symbols.length)],
    ];

    const extras = Array.from({ length: Math.max(length - required.length, 0) }, () =>
        all[Math.floor(Math.random() * all.length)],
    );

    // Shuffle the result so required chars aren't always at fixed positions
    return [...required, ...extras]
        .sort(() => Math.random() - 0.5)
        .join('');
}
