import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { verifyUserPassword } from '@/lib/auth';

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

    // Verify password: custom hash takes priority, then role-based fallback
    const isPasswordValid = await verifyUserPassword(password, employeeId, userData);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid employee ID or password'
        },
        { status: 401 }
      );
    }

    // Successful login – return full profile so the portal can display all info
    const user = {
      id: employeeId,
      name: userData.name,
      role: userData.role,
      department: userData.department || '',
      status: userData.status,
      isAdmin: userData.isAdmin || false,
      isSuperAdmin: userData.isSuperAdmin || false,
      email: userData.email || '',
      mobile: userData.mobile || '',
      dob: userData.dob || '',
      address: userData.address || '',
      emergencyContact: userData.emergencyContact || '',
      requireLocationCheck: userData.requireLocationCheck || false,
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
