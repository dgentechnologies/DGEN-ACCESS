import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

/**
 * ESP32 Verification Endpoint
 * POST /api/verify
 * 
 * Maintains backward compatibility with existing ESP32 code
 * Accepts both form data and JSON
 * Returns "YES" or "NO" as plain text
 */
export async function POST(request) {
  try {
    // Support both form data (ESP32 primary) and JSON (fallback)
    let data = '';
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      data = formData.get('data') || '';
    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      data = body.data || '';
    } else {
      // Try to parse as JSON anyway
      try {
        const body = await request.json();
        data = body.data || '';
      } catch {
        data = '';
      }
    }
    
    data = data.trim();
    console.log('ESP32 Verification request:', data);

    if (!data) {
      console.log('Empty data received');
      return new NextResponse('NO', { status: 200 });
    }

    // Search for user in Firebase
    const user = await findUserByData(data);

    if (user && user.status === 'Active') {
      // User exists and is active - grant access
      await logAccess(user, 'Granted');
      console.log(`✓ Access granted: ${user.name} (${user.id})`);
      return new NextResponse('YES', { status: 200 });
    } else if (user) {
      // User exists but is banned
      await logAccess(user, 'Denied');
      console.log(`✗ Access denied: ${user.name} (${user.id}) - Banned`);
      return new NextResponse('NO', { status: 200 });
    } else {
      // Unknown user
      await logAccess({ name: 'Unknown', id: data }, 'Denied');
      console.log(`✗ Access denied: Unknown user - ${data}`);
      return new NextResponse('NO', { status: 200 });
    }
  } catch (error) {
    console.error('Error in verify endpoint:', error);
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
    name: user.name || 'Unknown',
    id: user.id || 'Unknown',
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
