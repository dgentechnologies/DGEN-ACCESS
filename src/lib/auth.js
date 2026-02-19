/**
 * Authentication and Authorization Utilities
 * Server-side helpers for validating user access
 */

/**
 * Check if an employee ID is an admin
 * Only DGEN-ADM-00000 is the admin
 */
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
