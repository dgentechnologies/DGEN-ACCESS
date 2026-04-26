import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { setRtdbRemoteUnlock } from '@/lib/realtimeDb';

const REMOTE_UNLOCK_PATH = { collection: 'settings', doc: 'remoteUnlock' };

/**
 * Calculates the distance in metres between two lat/lon coordinates
 * using the Haversine formula.
 */
function getDistanceMetres(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in metres
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Remote Unlock Trigger Endpoint
 * POST /api/remote-open
 * 
 * Triggered by admin dashboard or employee portal to signal ESP8266 to unlock door.
 * For employees with requireLocationCheck enabled, the request must include the
 * employee's current coordinates which are validated against the configured office location.
 */
export async function POST(request) {
  try {
    // Get employee info from request body
    const body = await request.json().catch(() => ({}));
    const employeeId = body.employeeId || 'DASHBOARD';
    const employeeName = body.employeeName || 'Web Admin';

    // Location-based access control for employees (not admins)
    if (body.employeeId && db) {
      // Fetch employee record to check if location verification is required
      const userDoc = await db.collection('users').doc(body.employeeId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const isAdmin = userData.isAdmin === true || userData.isSuperAdmin === true;

        if (!isAdmin && userData.requireLocationCheck === true) {
          // Employee must provide their current coordinates
          const { lat, lon } = body;
          if (lat === undefined || lat === null || lon === undefined || lon === null) {
            return NextResponse.json(
              { success: false, message: 'Location is required to unlock the door from your account' },
              { status: 403 }
            );
          }

          // Fetch configured office location
          const settingsDoc = await db.collection('settings').doc('officeLocation').get();
          if (!settingsDoc.exists) {
            return NextResponse.json(
              { success: false, message: 'Office location not configured. Please contact admin.' },
              { status: 403 }
            );
          }

          const { lat: officeLat, lon: officeLon, radius } = settingsDoc.data();
          const distance = getDistanceMetres(parseFloat(lat), parseFloat(lon), parseFloat(officeLat), parseFloat(officeLon));

          if (distance > (radius || 100)) {
            return NextResponse.json(
              {
                success: false,
                message: `You must be at the office location to unlock the door (${Math.round(distance)} m away, allowed radius: ${radius || 100} m)`,
              },
              { status: 403 }
            );
          }
        }
      }
    }

    // Set the unlock flag in Firestore so the NodeMCU poll endpoint can see it
    if (db) {
      await db.collection(REMOTE_UNLOCK_PATH.collection).doc(REMOTE_UNLOCK_PATH.doc).set(
        { requested: true },
        { merge: true }
      );
    }

    // Set the unlock flag in RTDB so the ESP32 picks it up on its next poll
    await setRtdbRemoteUnlock(employeeId);
    
    // Log the manual unlock action with employee ID
    const timestamp = new Date().toISOString();
    const logEntry = {
      time: timestamp,
      name: employeeName,
      id: employeeId,
      status: 'Manual Unlock',
      timestamp: Date.now()
    };

    try {
      if (db) {
        await db.collection('logs').add(logEntry);
      }
    } catch (error) {
      console.error('Error logging manual unlock:', error);
      // Continue even if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Remote unlock command sent'
    });
  } catch (error) {
    console.error('Error in remote-open endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
