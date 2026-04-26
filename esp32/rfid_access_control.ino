/**
 * DGEN Access Control — ESP32 RFID Firmware
 *
 * Hardware:
 *   - ESP32 dev board
 *   - MFRC522 RFID reader (SPI)  [or any reader that yields a text string from the card]
 *   - Relay / door strike on RELAY_PIN
 *   - Green LED on LED_GREEN_PIN, Red LED on LED_RED_PIN (optional)
 *
 * Card text format (exactly as written on / programmed into each card):
 *   "Name: Tirthankar Dasgupta | ID: DGEN-EX-01001 | Role: CEO & CTO"
 *
 * Verification flow:
 *   1. Read card → extract full text string + hardware UID
 *   2. Parse employee ID from "ID: <value> |" segment
 *   3. GET access/rfid_cards/<id>.json from Firebase Realtime Database
 *   4. Compare returned cardText  →  reject if mismatch (tampered card)
 *   5. Check status == "Active"   →  deny if "Banned"
 *   6. Actuate relay / LEDs
 *   7. POST to access/access_logs via RTDB REST push endpoint
 *
 * Remote unlock flow (polled in loop):
 *   - GET access/remote_unlock.json every REMOTE_CHECK_INTERVAL ms
 *   - If requested == true: unlock door, write RTDB log, PATCH flag back to false
 *
 * Device heartbeat:
 *   - PUT access/devices/<DEVICE_ID>.json every HEARTBEAT_INTERVAL ms
 *
 * Libraries required (install via Arduino Library Manager):
 *   - WiFi (built-in ESP32 core)
 *   - HTTPClient (built-in ESP32 core)
 *   - ArduinoJson  by Benoit Blanchon  (v6 or v7)
 *   - MFRC522  by GithubCommunity
 *   - NTPClient  by Fabrice Weinberg  (for real-time timestamps)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <SPI.h>
#include <MFRC522.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

// ─── WiFi ────────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ─── Firebase Realtime Database ──────────────────────────────────────────────
// Replace with your project's RTDB URL (no trailing slash)
const char* RTDB_BASE_URL = "https://YOUR_PROJECT-default-rtdb.firebaseio.com";

// ─── Device identity ─────────────────────────────────────────────────────────
const char* DEVICE_ID       = "DGEN-ENTRY-01";   // unique device identifier
const char* DEVICE_NAME     = "Main Entrance";    // human-readable name
const char* FIRMWARE_VERSION = "5.3";

// ─── Polling / heartbeat intervals (ms) ──────────────────────────────────────
const unsigned long REMOTE_CHECK_INTERVAL = 5000;   // poll remote_unlock every 5 s
const unsigned long HEARTBEAT_INTERVAL    = 30000;  // update device online status every 30 s

// ─── Pin definitions ─────────────────────────────────────────────────────────
#define SS_PIN        5    // MFRC522 SDA/SS
#define RST_PIN       22   // MFRC522 RST
#define RELAY_PIN     26   // Door relay (HIGH = unlock)
#define LED_GREEN_PIN 32
#define LED_RED_PIN   33

MFRC522 rfid(SS_PIN, RST_PIN);

// ─── NTP (real epoch timestamps for access logs) ──────────────────────────────
WiFiUDP   ntpUdp;
NTPClient ntpClient(ntpUdp, "pool.ntp.org", 0, 60000);  // UTC, sync every 60 s

// ─── Timing state ─────────────────────────────────────────────────────────────
unsigned long lastRemoteCheckMs = 0;
unsigned long lastHeartbeatMs   = 0;

/** Returns current Unix epoch in seconds. */
unsigned long epochSeconds() {
  ntpClient.update();
  return ntpClient.getEpochTime();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Extract the value between "ID: " and the next " |" in the card text.
 * Input:  "Name: Tirthankar Dasgupta | ID: DGEN-EX-01001 | Role: CEO & CTO"
 * Output: "DGEN-EX-01001"
 */
String extractId(const String& cardText) {
  int start = cardText.indexOf("ID: ");
  if (start == -1) return "";
  start += 4;
  int end = cardText.indexOf(" |", start);
  if (end == -1) end = cardText.length();
  return cardText.substring(start, end);
}

/** Make the employee ID safe to use in a URL path (replace spaces, etc.). */
String urlEncode(const String& s) {
  String out;
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if (isAlphaNumeric(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      out += c;
    } else {
      char buf[4];
      snprintf(buf, sizeof(buf), "%%%02X", (unsigned char)c);
      out += buf;
    }
  }
  return out;
}

/**
 * Convert the MFRC522 hardware UID bytes to an uppercase hex string.
 * e.g. UID bytes {0xA1, 0xB2, 0xC3, 0xD4} → "A1B2C3D4"
 */
String getCardUid() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void grantAccess(const String& name) {
  Serial.println("✓ ACCESS GRANTED: " + name);
  digitalWrite(LED_GREEN_PIN, HIGH);
  digitalWrite(LED_RED_PIN,   LOW);
  digitalWrite(RELAY_PIN,     HIGH);  // unlock
  delay(3000);
  digitalWrite(RELAY_PIN,     LOW);   // re-lock
  digitalWrite(LED_GREEN_PIN, LOW);
}

void denyAccess(const String& reason) {
  Serial.println("✗ ACCESS DENIED: " + reason);
  digitalWrite(LED_RED_PIN,   HIGH);
  digitalWrite(LED_GREEN_PIN, LOW);
  delay(2000);
  digitalWrite(LED_RED_PIN,   LOW);
}

// ─── Step 3 – 5: Look up card in RTDB and verify ─────────────────────────────
/**
 * Fetch access/rfid_cards/<cardId> from RTDB, compare cardText, and check status.
 *
 * @param cardId    Employee/card ID parsed from the card text
 * @param cardText  Full text string read from the physical card
 * @param outName   Filled with the employee name on success
 * @param outUserId Filled with the userId on success
 * @returns  1 = granted, 0 = denied (banned), -1 = error / not found
 */
int verifyCardInRtdb(const String& cardId,
                     const String& cardText,
                     String&       outName,
                     String&       outUserId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected");
    return -1;
  }

  String url = String(RTDB_BASE_URL) + "/access/rfid_cards/" + urlEncode(cardId) + ".json";
  Serial.println("GET " + url);

  HTTPClient http;
  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.GET();

  if (httpCode != 200) {
    Serial.println("RTDB GET failed, HTTP " + String(httpCode));
    http.end();
    return -1;
  }

  String body = http.getString();
  http.end();

  if (body == "null" || body.isEmpty()) {
    Serial.println("Card not found in RTDB");
    return -1;
  }

  // Parse JSON: { userId, name, role, department, status, cardText }
  StaticJsonDocument<512> doc;
  DeserializationError err = deserializeJson(doc, body);
  if (err) {
    Serial.println("JSON parse error: " + String(err.c_str()));
    return -1;
  }

  // ── Step 4: Exact cardText match (tamper check) ───────────────────────────
  const char* storedCardText = doc["cardText"] | "";
  if (String(storedCardText) != cardText) {
    Serial.println("cardText mismatch — possible cloned/tampered card");
    return -1;
  }

  // ── Step 5: Active / Banned check ────────────────────────────────────────
  const char* status = doc["status"] | "Unknown";
  outName   = doc["name"]   | "Unknown";
  outUserId = doc["userId"] | cardId;

  if (String(status) != "Active") {
    Serial.println("Status is '" + String(status) + "' — access denied");
    return 0;  // banned (or other non-active status)
  }

  return 1;  // granted
}

// ─── Step 7: Write access log to RTDB ────────────────────────────────────────
/**
 * Push a new entry to access/access_logs/{pushId} in RTDB.
 *
 * Fields written match the canonical schema:
 *   cardId, userId, name, status, deviceId, method, timestamp, cardUid
 */
void writeAccessLog(const String& cardId,
                    const String& userId,
                    const String& name,
                    const String& status,    // "Granted" or "Denied (Banned)" etc.
                    const String& method,    // "RFID" or "Remote"
                    const String& cardUid) { // hardware UID hex string (empty for remote)
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String(RTDB_BASE_URL) + "/access/access_logs.json";

  StaticJsonDocument<256> doc;
  doc["cardId"]   = cardId;
  doc["userId"]   = userId;
  doc["name"]     = name;
  doc["status"]   = status;
  doc["deviceId"] = DEVICE_ID;
  doc["method"]   = method;
  doc["timestamp"] = epochSeconds();
  if (cardUid.length() > 0) doc["cardUid"] = cardUid;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);

  // RTDB REST uses POST to generate a push ID
  int code = http.POST(body);
  if (code == 200) {
    Serial.println("Access log written to RTDB");
  } else {
    Serial.println("RTDB log write failed, HTTP " + String(code));
  }
  http.end();
}

// ─── Remote unlock: poll RTDB and reset flag ──────────────────────────────────

/**
 * PATCH access/remote_unlock to clear the requested flag after acting on it.
 */
void resetRemoteUnlock() {
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String(RTDB_BASE_URL) + "/access/remote_unlock.json";

  StaticJsonDocument<128> doc;
  doc["requested"]   = false;
  doc["triggeredBy"] = "";
  doc["requestedAt"] = 0;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  http.sendRequest("PATCH", body);
  http.end();
}

/**
 * Poll access/remote_unlock from RTDB.
 * If requested == true, unlock the door, write an access log, then reset the flag.
 */
void checkRemoteUnlock() {
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String(RTDB_BASE_URL) + "/access/remote_unlock.json";

  HTTPClient http;
  http.begin(url);
  http.setTimeout(5000);
  int code = http.GET();

  if (code != 200) {
    http.end();
    return;
  }

  String body = http.getString();
  http.end();

  if (body == "null" || body.isEmpty()) return;

  StaticJsonDocument<256> doc;
  if (deserializeJson(doc, body)) return;

  bool requested = doc["requested"] | false;
  if (!requested) return;

  // Unlock door for remote trigger
  const char* triggeredBy = doc["triggeredBy"] | "Remote";
  Serial.println("Remote unlock triggered by: " + String(triggeredBy));
  grantAccess("Remote Trigger");

  // Log the remote unlock event
  writeAccessLog("REMOTE", "REMOTE", "Remote Trigger", "Granted", "Remote", "");

  // Reset the flag so it is not re-triggered
  resetRemoteUnlock();
}

// ─── Device heartbeat ─────────────────────────────────────────────────────────
/**
 * Write this device's status to access/devices/<DEVICE_ID> in RTDB so the
 * dashboard knows the device is online.
 */
void updateDeviceHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String(RTDB_BASE_URL) + "/access/devices/" + String(DEVICE_ID) + ".json";

  StaticJsonDocument<256> doc;
  doc["name"]        = DEVICE_NAME;
  doc["online"]      = true;
  doc["lastSeen"]    = epochSeconds();
  doc["batteryMode"] = false;
  doc["firmware"]    = FIRMWARE_VERSION;

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(5000);
  http.PUT(body);
  http.end();
  Serial.println("Device heartbeat sent");
}

// ─── Arduino lifecycle ────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  SPI.begin();
  rfid.PCD_Init();

  pinMode(RELAY_PIN,     OUTPUT);
  pinMode(LED_GREEN_PIN, OUTPUT);
  pinMode(LED_RED_PIN,   OUTPUT);
  digitalWrite(RELAY_PIN,     LOW);
  digitalWrite(LED_GREEN_PIN, LOW);
  digitalWrite(LED_RED_PIN,   LOW);

  Serial.println("Connecting to WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());
  ntpClient.begin();
  ntpClient.update();
  Serial.println("NTP time: " + String(ntpClient.getFormattedTime()));

  // Initial device heartbeat so dashboard shows online immediately
  updateDeviceHeartbeat();
  lastHeartbeatMs = millis();

  Serial.println("RFID reader ready — waiting for card...");
}

void loop() {
  unsigned long now = millis();

  // ── Periodic remote-unlock check ─────────────────────────────────────────
  if (now - lastRemoteCheckMs >= REMOTE_CHECK_INTERVAL) {
    lastRemoteCheckMs = now;
    checkRemoteUnlock();
  }

  // ── Periodic device heartbeat ─────────────────────────────────────────────
  if (now - lastHeartbeatMs >= HEARTBEAT_INTERVAL) {
    lastHeartbeatMs = now;
    updateDeviceHeartbeat();
  }

  // ── Wait for an RFID card ─────────────────────────────────────────────────
  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) {
    return;
  }

  // ── Step 1: Read card text + hardware UID ────────────────────────────────
  // The card stores the text in its NDEF data block.
  // Replace the line below with your actual block-read + text assembly code.
  String cardText = readNdefText();   // see readNdefText() below
  String cardUid  = getCardUid();     // hardware UID bytes → hex string

  if (cardText.isEmpty()) {
    Serial.println("Could not read card text");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  Serial.println("Card UID: " + cardUid);
  Serial.println("Card text: " + cardText);

  // ── Step 2: Parse employee ID from card text ──────────────────────────────
  String cardId = extractId(cardText);
  if (cardId.isEmpty()) {
    Serial.println("Could not parse ID from card text");
    denyAccess("invalid card format");
    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
    return;
  }

  Serial.println("Parsed ID: " + cardId);

  // ── Steps 3-5: RTDB lookup + verify ──────────────────────────────────────
  String name, userId;
  int result = verifyCardInRtdb(cardId, cardText, name, userId);

  String logStatus;
  if (result == 1) {
    grantAccess(name);
    logStatus = "Granted";
  } else if (result == 0) {
    denyAccess("account banned");
    logStatus = "Denied (Banned)";
  } else {
    denyAccess("not found or tampered");
    logStatus = "Denied (Unknown)";
  }

  // ── Step 7: Write log entry to RTDB ──────────────────────────────────────
  writeAccessLog(cardId, userId, name, logStatus, "RFID", cardUid);

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  delay(1500);  // debounce — ignore same card held on reader
}

// ─── Card text reader ─────────────────────────────────────────────────────────
/**
 * Read the NDEF text record from an MFRC522-compatible NFC card (MIFARE Ultralight
 * or NTAG2xx).  Adapt this function if you are using a different card type or
 * reader library.
 *
 * Expected NDEF layout (written with a phone or card programmer):
 *   Text record = "Name: X | ID: Y | Role: Z"
 *
 * This is a simplified reader that scans pages 4-39 for the text payload.
 * For production use, consider the Adafruit PN532 or an NDEF library.
 */
String readNdefText() {
  String result = "";
  byte pageData[18];    // 4 bytes data + 14 bytes CRC buffer (MFRC522 needs ≥ 18)
  byte bufferSize = sizeof(pageData);
  bool done = false;

  // NTAG213/215/216: user data starts at page 4
  for (byte page = 4; page < 40 && !done; page++) {
    bufferSize = sizeof(pageData);
    MFRC522::StatusCode status = rfid.MIFARE_Read(page, pageData, &bufferSize);
    if (status != MFRC522::STATUS_OK) break;

    for (int i = 0; i < 4; i++) {
      byte b = pageData[i];
      if (b == 0x00) { done = true; break; }   // null terminator / end of data
      if (b >= 0x20 && b < 0x7F) result += (char)b;
    }
  }

  // Strip leading NDEF header bytes if present (0x03 len 0xD1 … 0x54 0x02 'en')
  int textStart = result.indexOf("Name: ");
  if (textStart > 0) result = result.substring(textStart);
  return result;
}
