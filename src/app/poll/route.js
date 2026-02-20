import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

const REMOTE_UNLOCK_PATH = { collection: 'settings', doc: 'remoteUnlock' };

/**
 * ESP8266 Polling Endpoint
 * GET /poll
 *
 * ESP8266 polls this endpoint every 3 seconds.
 * Returns plain text: "OPEN" or "WAIT"
 *
 * The unlock state is stored in Firestore so it is visible across
 * all serverless function instances (e.g. on Vercel).
 */
export async function GET() {
  try {
    if (!db) {
      return new NextResponse('WAIT', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    let shouldOpen = false;
    const unlockRef = db.collection(REMOTE_UNLOCK_PATH.collection).doc(REMOTE_UNLOCK_PATH.doc);

    // Atomically read-and-reset the flag to prevent duplicate triggers
    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(unlockRef);
      if (doc.exists && doc.data()?.requested === true) {
        shouldOpen = true;
        transaction.update(unlockRef, { requested: false });
      }
    });

    if (shouldOpen) {
      return new NextResponse('OPEN', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new NextResponse('WAIT', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error) {
    console.error('Error in poll endpoint:', error);
    // Return WAIT on error to prevent accidental unlocks
    return new NextResponse('WAIT', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
