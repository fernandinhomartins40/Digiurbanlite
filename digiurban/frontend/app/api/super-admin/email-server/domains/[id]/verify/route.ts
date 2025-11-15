import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Force dynamic rendering for API routes with dynamic params
export const dynamic = 'force-dynamic';

// POST /api/super-admin/email-server/domains/[id]/verify
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.cookies.get('digiurban_admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/super-admin/email-server/domains/${params.id}/verify`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_admin_token=${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao verificar domínio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
