import { NextResponse } from 'next/server';
import { isUnlockRequested, resetUnlockRequest } from '@/lib/remoteUnlockState';

/**
 * ESP8266 Polling Endpoint
 * GET /poll
 * 
 * ESP8266 polls this endpoint every 3 seconds
 * Returns plain text: "OPEN" or "WAIT"
 */
export async function GET(request) {
  try {
    // Check if unlock was requested
    if (isUnlockRequested()) {
      // Immediately reset the flag to prevent multiple triggers
      resetUnlockRequest();
      
      // Return plain text "OPEN"
      return new NextResponse('OPEN', {
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
    
    // Return plain text "WAIT"
    return new NextResponse('WAIT', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error in poll endpoint:', error);
    // Return WAIT on error to prevent accidental unlocks
    return new NextResponse('WAIT', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
