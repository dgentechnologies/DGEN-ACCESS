import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { setUnlockRequested } from '@/lib/remoteUnlockState';

/**
 * Remote Unlock Trigger Endpoint
 * POST /api/remote-open
 * 
 * Triggered by admin dashboard to signal ESP8266 to unlock door
 */
export async function POST(request) {
  try {
    // Get employee info from request body
    const body = await request.json().catch(() => ({}));
    const employeeId = body.employeeId || 'DASHBOARD';
    const employeeName = body.employeeName || 'Web Admin';
    
    // Set the flag to true
    setUnlockRequested(true);
    
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
