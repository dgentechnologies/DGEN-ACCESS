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
    
    // Verify password based on user type:
    // - Admin users: password is employee ID
    // - Regular employees: password is date of birth in DDMMYYYY format
    let isPasswordValid = false;
    
    if (userData.isAdmin || userData.isSuperAdmin) {
      // Admin: password is employee ID
      isPasswordValid = password === employeeId;
    } else {
      // Regular employee: password is DOB in DDMMYYYY format
      if (userData.dob) {
        // Parse date string directly to avoid timezone issues
        // Expected format: YYYY-MM-DD or ISO date string
        const dobString = String(userData.dob);
        const dateParts = dobString.split('T')[0].split('-'); // Get YYYY-MM-DD part
        
        if (dateParts.length === 3) {
          const year = dateParts[0];
          const month = dateParts[1].padStart(2, '0');
          const day = dateParts[2].padStart(2, '0');
          const expectedPassword = `${day}${month}${year}`;
          isPasswordValid = password === expectedPassword;
        } else {
          // Fallback: if date format is unexpected, use employee ID
          isPasswordValid = password === employeeId;
        }
      } else {
        // Fallback: if no DOB set, use employee ID (for backward compatibility)
        isPasswordValid = password === employeeId;
      }
    }
    
    if (!isPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid employee ID or password'
        },
        { status: 401 }
      );
    }

    // Successful login
    // Use isAdmin flag from database
    const user = {
      id: employeeId,
      name: userData.name,
      role: userData.role,
      department: userData.department,
      status: userData.status,
      isAdmin: userData.isAdmin || false,
      isSuperAdmin: userData.isSuperAdmin || false,
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
