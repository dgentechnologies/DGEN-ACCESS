import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { syncUserToRtdb, syncRtdbLogsToFirestore } from '@/lib/realtimeDb';

/**
 * POST /api/sync-rtdb
 *
 * Bulk-syncs every user in the Firestore `users` collection to the
 * Realtime Database `rfid_cards` node, and flushes any pending RTDB
 * access logs back into Firestore.
 *
 * Call this once after initial setup, or any time the two databases
 * may have drifted out of sync (e.g. after bulk imports).
 */
export async function POST() {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Firebase not configured' },
        { status: 503 }
      );
    }

    if (!process.env.FIREBASE_ACCESS_DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          message:
            'FIREBASE_ACCESS_DATABASE_URL is not configured. ' +
            'Add it to your .env.local file and redeploy.'
        },
        { status: 503 }
      );
    }

    // Sync all Firestore users → Realtime Database rfid_cards
    const snapshot = await db.collection('users').get();
    let usersSynced = 0;

    for (const doc of snapshot.docs) {
      await syncUserToRtdb(doc.id, doc.data());
      usersSynced++;
    }

    // Flush any ESP32-written access logs from RTDB → Firestore
    const logsSynced = await syncRtdbLogsToFirestore(db);

    return NextResponse.json({
      success: true,
      message: `Synced ${usersSynced} user(s) to Realtime Database and ${logsSynced} pending log(s) to Firestore`
    });
  } catch (error) {
    console.error('Error in sync-rtdb:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
