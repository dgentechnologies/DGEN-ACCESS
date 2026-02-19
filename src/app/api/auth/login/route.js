import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

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
    const { employeeId, password } = body;

    // Validation
    if (!employeeId || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Employee ID and password are required'
        },
        { status: 400 }
      );
    }

    // Get user from database
    const userDoc = await db.collection('users').doc(employeeId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid employee ID or password'
        },
        { status: 401 }
      );
    }

    const userData = userDoc.data();
    
    // Check if user is banned
    if (userData.status === 'Banned') {
      return NextResponse.json(
        {
          success: false,
          message: 'Your account has been disabled. Please contact administrator.'
        },
        { status: 403 }
      );
    }

    // SECURITY WARNING: This is a simplified authentication for demonstration
    // In production, implement proper password hashing with bcrypt/argon2
    // and store hashed passwords in the database
    // Verify password (currently password is the employee ID)
    if (password !== employeeId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid employee ID or password'
        },
        { status: 401 }
      );
    }

    // Successful login
    // Only DGEN-ADM-00000 is the admin
    const isAdminUser = employeeId === 'DGEN-ADM-00000';
    
    const user = {
      id: employeeId,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      status: userData.status,
      isAdmin: isAdminUser,
      isSuperAdmin: isAdminUser,
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user
    });
  } catch (error) {
    console.error('Error in login endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'An error occurred during login'
      },
      { status: 500 }
    );
  }
}
