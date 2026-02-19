import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

const SETTINGS_DOC = 'officeLocation';
const SETTINGS_COLLECTION = 'settings';

/**
 * GET /api/settings/office-location
 * Returns the saved office location settings
 */
export async function GET() {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Firebase not configured' },
        { status: 503 }
      );
    }

    const doc = await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC).get();
    if (!doc.exists) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: doc.data() });
  } catch (error) {
    console.error('Error fetching office location:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/office-location
 * Saves the office location settings (admin only)
 * Body: { lat, lon, radius }
 */
export async function POST(request) {
  try {
    if (!db) {
      return NextResponse.json(
        { success: false, message: 'Firebase not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { lat, lon, radius } = body;

    // Validate lat/lon
    if (lat === undefined || lat === null || lon === undefined || lon === null) {
      return NextResponse.json(
        { success: false, message: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const radiusNum = radius !== undefined ? parseFloat(radius) : 100;

    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return NextResponse.json(
        { success: false, message: 'Invalid latitude (must be between -90 and 90)' },
        { status: 400 }
      );
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      return NextResponse.json(
        { success: false, message: 'Invalid longitude (must be between -180 and 180)' },
        { status: 400 }
      );
    }
    if (isNaN(radiusNum) || radiusNum <= 0) {
      return NextResponse.json(
        { success: false, message: 'Radius must be a positive number (in meters)' },
        { status: 400 }
      );
    }

    const locationData = {
      lat: latNum,
      lon: lonNum,
      radius: radiusNum,
      updatedAt: new Date().toISOString(),
    };

    await db.collection(SETTINGS_COLLECTION).doc(SETTINGS_DOC).set(locationData);

    return NextResponse.json({
      success: true,
      message: 'Office location saved successfully',
      data: locationData,
    });
  } catch (error) {
    console.error('Error saving office location:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
