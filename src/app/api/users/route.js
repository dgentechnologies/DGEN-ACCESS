import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

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
    const { id, name, role, department, isAdmin, email, mobile, dob, address, emergencyContact } = body;

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
    // Only DGEN-ADM-00000 can be admin, prevent creating new admins
    const newUser = {
      name: name.trim(),
      role: role.trim(),
      status: 'Active',
      isAdmin: false,
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

    await db.collection('users').doc(id).set(newUser);

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
