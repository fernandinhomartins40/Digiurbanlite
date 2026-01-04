import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('digiurban_admin_token');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || '';
    const limit = searchParams.get('limit') || '100';
    const offset = searchParams.get('offset') || '0';

    const queryString = new URLSearchParams();
    if (level) queryString.set('level', level);
    queryString.set('limit', limit);
    queryString.set('offset', offset);

    const response = await fetch(
      `${BACKEND_URL}/super-admin/email-server/logs?${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `digiurban_admin_token=${token.value}`
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching email server logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email server logs' },
      { status: 500 }
    );
  }
}
