import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const dynamic = 'force-dynamic';

// POST /api/super-admin/logout
export async function POST(request: NextRequest) {
  try {
    // Obter token dos cookies
    const token = request.cookies.get('digiurban_admin_token')?.value;

    // Tentar fazer logout no backend (mesmo sem token)
    if (token) {
      await fetch(`${BACKEND_URL}/super-admin/logout`, {
        method: 'POST',
        headers: {
          'Cookie': `digiurban_admin_token=${token}`
        }
      }).catch(() => {
        // Ignorar erro
      });
    }

    // Criar resposta removendo o cookie
    const response = NextResponse.json({ success: true });
    
    // Remover cookie
    response.cookies.set('digiurban_admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Erro no logout:', error);
    
    // Mesmo com erro, remover o cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('digiurban_admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
}
