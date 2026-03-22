import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { updateRtdbCardStatus } from '@/lib/realtimeDb';

export async function PUT(request, context) {
  try {
    if (!db) {
      return NextResponse.json(
        {
          success: false,
          message: 'Firebase not configured'
        },
        { status: 503 }
      );
    }

    // In Next.js 15+, params is a Promise
    const params = await context.params;
    const userId = params.id;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const newStatus = userData.status === 'Active' ? 'Banned' : 'Active';

    await userRef.update({
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    // Mirror the status change to Realtime Database immediately so the ESP32
    // picks up the ban/unban without waiting for a full user sync
    await updateRtdbCardStatus(userId, userData.rfidCardId, newStatus);

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully',
      data: {
        id: userId,
        status: newStatus
      }
    });
  } catch (error) {
    console.error('Error toggling status:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
