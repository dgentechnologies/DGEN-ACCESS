import { NextResponse } from 'next/server';
import { db, realtimeDb } from '@/lib/firebaseAdmin';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    
    const snapshot = await db.collection('logs')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const logs = [];
    snapshot.forEach(doc => {
      logs.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    // Delete from Firestore
    const snapshot = await db.collection('logs').get();
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Clear Realtime Database
    if (realtimeDb) {
      await realtimeDb.ref('logs').remove();
    }

    return NextResponse.json({
      success: true,
      message: 'All logs cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing logs:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
