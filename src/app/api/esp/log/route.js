import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { syncRtdbLogsToFirestore } from '@/lib/realtimeDb';

/**
 * POST /api/esp/log
 *
 * Called by the ESP32 immediately after it writes an access event to the
 * Realtime Database.  This endpoint wakes Vercel (if asleep) and flushes
 * all unsynced RTDB access log entries into Firestore so the frontend
 * dashboard updates in real-time.
 *
 * The ESP32 should fire this request in the background while it controls
 * the door lock – timing is not critical here.
 *
 * Response: plain-text  "OK:<count>"  or  "ERROR"
 */
export async function POST() {
  try {
    const synced = await syncRtdbLogsToFirestore(db);
    return new NextResponse(`OK:${synced}`, { status: 200 });
  } catch (error) {
    console.error('Error in /api/esp/log:', error);
    return new NextResponse('ERROR', { status: 200 });
  }
}
