import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// POST /api/super-admin/login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Fazer requisição ao backend
    const response = await fetch(`${BACKEND_URL}/super-admin/login`, {
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

    // Fase 1 do plano multi-tenant 2026-07-13: o backend também emite o cookie
    // digiurban_platform_token (ponte SUPER_ADMIN → PlatformUser) — repassar
    // os demais Set-Cookie do backend, senão o painel perde o acesso a
    // /api/platform/* (tenants, billing, leads, schema, backups).
    const backendCookies =
      typeof (response.headers as any).getSetCookie === 'function'
        ? ((response.headers as any).getSetCookie() as string[])
        : response.headers.get('set-cookie')
          ? [response.headers.get('set-cookie') as string]
          : [];
    for (const cookie of backendCookies) {
      if (!cookie.startsWith('digiurban_admin_token=')) {
        nextResponse.headers.append('set-cookie', cookie);
      }
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
