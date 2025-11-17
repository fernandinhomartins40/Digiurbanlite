import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Marcar como rota dinâmica (usa cookies)
export const dynamic = 'force-dynamic';

// GET /api/super-admin/auth/me
export async function GET(request: NextRequest) {
  try {
    // Obter token dos cookies
    const token = request.cookies.get('digiurban_admin_token')?.value;

    console.log('[/api/super-admin/auth/me] ====== INÍCIO DEBUG ======');
    console.log('[/api/super-admin/auth/me] URL completa:', request.url);
    console.log('[/api/super-admin/auth/me] Token encontrado:', token ? `SIM (${token.substring(0, 20)}...)` : 'NÃO');
    console.log('[/api/super-admin/auth/me] Cookies disponíveis:', request.cookies.getAll().map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })));

    if (!token) {
      console.log('[/api/super-admin/auth/me] ❌ Retornando 401 - sem token');
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    console.log('[/api/super-admin/auth/me] 🔄 Fazendo requisição para backend:', `${BACKEND_URL}/super-admin/auth/me`);

    // Fazer requisição ao backend passando o cookie no formato correto
    const response = await fetch(`${BACKEND_URL}/super-admin/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': `digiurban_admin_token=${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Importante para enviar cookies
    });

    console.log('[/api/super-admin/auth/me] 📡 Resposta do backend:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.log('[/api/super-admin/auth/me] ❌ Erro do backend:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log('[/api/super-admin/auth/me] ✅ Sucesso! Usuário:', data.user?.email);
    console.log('[/api/super-admin/auth/me] ====== FIM DEBUG ======');
    return NextResponse.json(data);
  } catch (error) {
    console.error('[/api/super-admin/auth/me] 💥 Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
