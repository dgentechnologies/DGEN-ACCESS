/**
 * Remote Unlock State Management
 * Simple in-memory flag for ESP8266 polling
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
