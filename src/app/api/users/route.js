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
    const { id, name, role, department, isAdmin } = body;

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
    const newUser = {
      name: name.trim(),
      role: role.trim(),
      status: 'Active',
      isAdmin: isAdmin || false,
      isSuperAdmin: false,
      createdAt: new Date().toISOString()
    };

    // Add department if provided
    if (department) {
      newUser.department = department;
    }

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
