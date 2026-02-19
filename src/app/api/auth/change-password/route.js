import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { hashPassword, verifyUserPassword } from '@/lib/auth';

/**
 * POST /api/auth/change-password
 * Body: { employeeId, currentPassword, newPassword }
 */
export async function POST(request) {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Firebase not configured' },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { employeeId, currentPassword, newPassword } = body;

    if (!employeeId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, message: 'New password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const userDoc = await db.collection('users').doc(employeeId).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();

    // Verify current password using shared utility (same logic as login)
    const isCurrentPasswordValid = await verifyUserPassword(currentPassword, employeeId, userData);

    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    const newPasswordHash = await hashPassword(newPassword);
    await db.collection('users').doc(employeeId).update({
      passwordHash: newPasswordHash,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
