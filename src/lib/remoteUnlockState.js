/**
 * Remote Unlock State Management
 * Simple in-memory flag for ESP8266 polling
 * 
 * Note: This implementation is designed for single-instance deployments
 * with one ESP8266 device polling every 3 seconds. For multi-instance
 * or high-availability deployments, consider using Redis or a database
 * with atomic operations.
 */

let remote_unlock_requested = false;

export function setUnlockRequested(value) {
  remote_unlock_requested = value;
}

export function isUnlockRequested() {
  return remote_unlock_requested;
}

export function resetUnlockRequest() {
  remote_unlock_requested = false;
}
