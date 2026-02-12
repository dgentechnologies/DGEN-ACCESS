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
    const { name, role } = body;

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

    const updates = {
      updatedAt: new Date().toISOString()
    };

    if (name) updates.name = name.trim();
    if (role) updates.role = role.trim();

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
    if (userData.isSuperAdmin) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot delete super admin users'
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
