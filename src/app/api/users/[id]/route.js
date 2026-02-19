import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function PUT(request, context) {
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

    // In Next.js 15+, params is a Promise
    const params = await context.params;
    const userId = params.id;
    const body = await request.json();
    const { name, role, email, mobile, dob, address, emergencyContact, isAdmin } = body;

    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
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

    // Validate mobile format if provided
    if (mobile && !/^\+?[\d\s\-()]{10,}$/.test(mobile.replace(/[\s\-()]/g, ''))) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid mobile number format - must contain at least 10 digits'
        },
        { status: 400 }
      );
    }

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (name) updates.name = name.trim();
    if (role) updates.role = role.trim();
    if (email !== undefined) updates.email = email ? email.trim() : '';
    if (mobile !== undefined) updates.mobile = mobile ? mobile.trim() : '';
    if (dob !== undefined) updates.dob = dob || '';
    if (address !== undefined) updates.address = address ? address.trim() : '';
    if (emergencyContact !== undefined) updates.emergencyContact = emergencyContact ? emergencyContact.trim() : '';
    // NOTE: No authorization check - assumes API caller is authenticated admin
    // Consider adding server-side session validation for production
    if (isAdmin !== undefined) updates.isAdmin = isAdmin === true;

    await userRef.update(updates);

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: userId,
        ...updates
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
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

    // In Next.js 15+, params is a Promise
    const params = await context.params;
    const userId = params.id;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          message: 'User not found'
        },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    // Protect the admin user from deletion
    if (userData.isSuperAdmin || userId === 'DGEN-ADM-00000') {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete admin users'
        },
        { status: 403 }
      );
    }

    await userRef.delete();

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message
      },
      { status: 500 }
    );
  }
}
