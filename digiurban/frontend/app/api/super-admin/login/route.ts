import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// POST /api/super-admin/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Fazer requisição ao backend
    const response = await fetch(`${BACKEND_URL}/api/super-admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Extrair token dos dados retornados pelo backend
    const { token, user } = data;

    // Criar resposta sem incluir o token (httpOnly)
    const responseData = {
      message: data.message,
      user: user
    };

    const nextResponse = NextResponse.json(responseData);

    // Definir cookie httpOnly com o token
    if (token) {
      nextResponse.cookies.set('digiurban_admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 8 * 60 * 60 * 1000, // 8 horas em milissegundos
        path: '/'
      });
    }

    return nextResponse;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
