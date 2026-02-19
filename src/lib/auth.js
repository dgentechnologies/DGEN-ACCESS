/**
 * Authentication and Authorization Utilities
 * Server-side helpers for validating user access
 */

import crypto from 'crypto';
import { promisify } from 'util';

const pbkdf2 = promisify(crypto.pbkdf2);

/**
 * Hashes a password with PBKDF2-SHA512 and a random salt.
 * Returns a string in the format `pbkdf2:<salt>:<hash>`.
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await pbkdf2(password, salt, 10000, 64, 'sha512')).toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored `pbkdf2:<salt>:<hash>` string.
 */
export async function verifyStoredHash(inputPassword, storedHash) {
  if (!storedHash || !storedHash.startsWith('pbkdf2:')) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;
  const [, salt, hash] = parts;
  try {
    const inputHash = (await pbkdf2(inputPassword, salt, 10000, 64, 'sha512')).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(inputHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Verifies a plain-text password against a Firestore user record using the same
 * logic as the login endpoint (custom hash → admin fallback → DOB fallback).
 */
export async function verifyUserPassword(inputPassword, employeeId, userData) {
  if (userData.passwordHash) {
    return verifyStoredHash(inputPassword, userData.passwordHash);
  }
  if (userData.isAdmin || userData.isSuperAdmin) {
    return inputPassword === employeeId;
  }
  if (userData.dob) {
    const dobString = String(userData.dob);
    const dateParts = dobString.split('T')[0].split('-');
    if (dateParts.length === 3) {
      const [year, rawMonth, rawDay] = dateParts;
      const month = rawMonth.padStart(2, '0');
      const day = rawDay.padStart(2, '0');
      return inputPassword === `${day}${month}${year}`;
    }
  }
  return inputPassword === employeeId;
}


export function isAdminUser(employeeId) {
  return employeeId === 'DGEN-ADM-00000';
}

/**
 * Validate that the request is from an admin user
 * Returns an error response if not authorized
 */
export function requireAdmin(employeeId) {
  if (!employeeId || !isAdminUser(employeeId)) {
    return {
      authorized: false,
      response: {
        success: false,
        message: 'Unauthorized: Admin access required'
      },
      status: 403
    };
  }
  
  return {
    authorized: true
  };
}
