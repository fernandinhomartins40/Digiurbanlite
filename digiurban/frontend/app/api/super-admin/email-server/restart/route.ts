import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('digiurban_admin_token');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/super-admin/email-server/restart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `digiurban_admin_token=${token.value}`
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error restarting email server:', error);
    return NextResponse.json(
      { error: 'Failed to restart email server' },
      { status: 500 }
    );
  }
}
