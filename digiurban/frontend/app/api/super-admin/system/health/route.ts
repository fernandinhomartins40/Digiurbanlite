import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const dynamic = 'force-dynamic';

// GET /api/super-admin/system/health - Status de saúde do sistema
export async function GET(request: NextRequest) {
  try {
    // Obter token dos cookies
    const token = request.cookies.get('digiurban_admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Fazer requisição ao backend
    const response = await fetch(`${BACKEND_URL}/api/super-admin/system/health`, {
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
    console.error('Erro ao verificar saúde do sistema:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
