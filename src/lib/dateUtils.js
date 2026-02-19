/**
 * Date and Time Formatting Utilities
 * Provides consistent date/time formatting across the application
 */

/**
 * Format timestamp for IST timezone in 12-hour format with AM/PM
 * @param {string|Date} timestamp - The timestamp to format
 * @param {boolean} includeDate - Whether to include date (default: false)
 * @returns {string} Formatted time string
 */
export function formatTimeIST(timestamp, includeDate = false) {
  if (!timestamp) {
    return 'Unknown';
  }

  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };

  if (includeDate) {
    options.day = '2-digit';
    options.month = '2-digit';
    options.year = 'numeric';
  }

  try {
    return new Date(timestamp).toLocaleString('en-IN', options);
  } catch (error) {
    return 'Invalid time';
  }
}

/**
 * Format timestamp for logs page display (includes date and time)
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted date and time string
 */
export function formatLogTimeIST(timestamp) {
  return formatTimeIST(timestamp, true);
}

/**
 * Format timestamp for dashboard display (time only)
 * @param {string|Date} timestamp - The timestamp to format
 * @returns {string} Formatted time string
 */
export function formatDashboardTimeIST(timestamp) {
  return formatTimeIST(timestamp, false);
}
