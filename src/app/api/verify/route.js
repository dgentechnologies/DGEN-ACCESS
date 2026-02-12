import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

/**
 * ESP32 Verification Endpoint
 * POST /api/verify
 * 
 * Accepts both Form Data (primary) and JSON (fallback)
 * Input: Form data with 'data' field OR {"data": "DGEN-EX-01"}
 * Output: "YES" or "NO"
 */
export async function POST(request) {
  try {
    // Primary: Try to get form data (for ESP32 HTTPClient)
    let data = '';
    
    try {
      const formData = await request.formData();
      data = formData.get('data') || '';
      data = data.trim();
    } catch (formError) {
      // Formdata parsing failed, will try JSON fallback
      data = '';
    }
    
    // Fallback: Try JSON if form data is empty (backward compatibility)
    if (!data) {
      try {
        const body = await request.json();
        data = body.data || '';
        data = data.trim();
      } catch (jsonError) {
        // Both form data and JSON parsing failed
        data = '';
      }
    }
    
    console.log(`Received data: ${data}`);
    
    if (!data) {
      return new NextResponse('NO', { status: 200 });
    }
    
    // Search for user
    const user = await findUserByData(data);
    
    if (user && user.status === 'Active') {
      // User exists and is active - grant access
      await logAccess(user, 'Granted');
      return new NextResponse('YES', { status: 200 });
    } else if (user) {
      // User exists but is banned
      await logAccess(user, 'Denied');
      return new NextResponse('NO', { status: 200 });
    } else {
      // Unknown user
      await logAccess(null, 'Denied');
      return new NextResponse('NO', { status: 200 });
    }
  } catch (error) {
    console.error(`Error in verify endpoint: ${error}`);
    return new NextResponse('NO', { status: 200 });
  }
}

/**
 * Find user by ID or Name
 * Handles formatted strings like "Name: X | ID: Y | Role: Z"
 */
async function findUserByData(data) {
  if (!db) return null;

  try {
    let userId = null;
    let userName = null;

    // Parse formatted data if it contains pipe separators
    if (data.includes('|')) {
      const parts = data.split('|');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes(':')) {
          const [key, value] = trimmed.split(':').map(s => s.trim());
          if (key.toLowerCase() === 'id') {
            userId = value;
          } else if (key.toLowerCase() === 'name') {
            userName = value;
          }
        }
      }
    } else {
      // Plain data - could be ID or name
      userId = data;
      userName = data;
    }

    // First try exact ID match (fastest)
    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      if (userDoc.exists) {
        return { id: userDoc.id, ...userDoc.data() };
      }
    }

    // Fall back to name search (slower)
    if (userName) {
      const snapshot = await db.collection('users')
        .where('name', '==', userName)
        .limit(1)
        .get();
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding user:', error);
    return null;
  }
}

/**
 * Log access attempt to Firestore
 */
async function logAccess(user, status) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    time: timestamp,
    name: user ? user.name || 'Unknown' : 'Unknown',
    id: user ? user.id || 'Unknown' : 'Unknown',
    status: status,
    timestamp: Date.now()
  };

  try {
    // Store in Firestore for queries and persistence
    if (db) {
      await db.collection('logs').add(logEntry);
    }
  } catch (error) {
    console.error('Error logging access:', error);
  }
}
