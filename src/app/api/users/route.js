import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { syncUserToRtdb } from '@/lib/realtimeDb';

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

    const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();
    const { id, name, role, department, isAdmin, email, mobile, dob, address, emergencyContact, rfidCardId } = body;

    // Validation
    if (!id || !name || !role) {
      return NextResponse.json(
        {
          success: false,
          message: 'All fields (id, name, role) are required'
        },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid email format'
        },
        { status: 400 }
      );
    }

    // Validate mobile format if provided (basic check for 10+ digits)
    if (mobile && !/^\+?[\d\s\-()]{10,}$/.test(mobile.replace(/[\s\-()]/g, ''))) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid mobile number format - must contain at least 10 digits'
        },
        { status: 400 }
      );
    }

    // Check if user ID already exists
    const existingUser = await db.collection('users').doc(id).get();
    if (existingUser.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User ID already exists'
        },
        { status: 400 }
      );
    }

    // Create new user
    // Allow admin creation based on checkbox
    // NOTE: No authorization check - assumes API caller is authenticated admin
    // Consider adding server-side session validation for production
    const newUser = {
      name: name.trim(),
      role: role.trim(),
      status: 'Active',
      isAdmin: isAdmin === true,
      isSuperAdmin: false,
      createdAt: new Date().toISOString()
    };

    // Add optional fields if provided
    if (department) newUser.department = department;
    if (email) newUser.email = email.trim();
    if (mobile) newUser.mobile = mobile.trim();
    if (dob) newUser.dob = dob;
    if (address) newUser.address = address.trim();
    if (emergencyContact) newUser.emergencyContact = emergencyContact.trim();
    if (rfidCardId) newUser.rfidCardId = rfidCardId.trim();

    await db.collection('users').doc(id).set(newUser);

    // Mirror the new user to Realtime Database for instant ESP32 verification.
    // A failure here is non-fatal — the back-fill on next server start will catch it.
    try {
      await syncUserToRtdb(id, newUser);
    } catch (rtdbErr) {
      console.error(`⚠️  RTDB sync failed for new user ${id}:`, rtdbErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'User added successfully',
      data: {
        id,
        ...newUser
      }
    });
  } catch (error) {
    console.error('Error adding user:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
