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
 * Extract employee ID from request headers or body
 * Returns null if not found
 */
export async function getEmployeeIdFromRequest(request) {
  try {
    // Try to get from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // If using bearer token, parse it
      // For now, we'll just check the body
    }
    
    // Try to get from request body
    const body = await request.json().catch(() => ({}));
    return body.employeeId || body.userId || null;
  } catch (error) {
    return null;
  }
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
