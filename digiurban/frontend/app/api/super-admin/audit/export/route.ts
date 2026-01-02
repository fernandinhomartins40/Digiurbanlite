import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const dynamic = 'force-dynamic';

// POST /api/super-admin/audit/export - Exportar logs de auditoria
export async function POST(request: NextRequest) {
  try {
    // Obter token dos cookies
    const token = request.cookies.get('digiurban_admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Obter body da requisição
    const body = await request.json();

    // Fazer requisição ao backend
    const response = await fetch(`${BACKEND_URL}/super-admin/audit/export`, {
      method: 'POST',
      headers: {
        'Cookie': `digiurban_admin_token=${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    // Se for CSV ou JSON para download, retornar o blob
    const contentType = response.headers.get('content-type');
    const contentDisposition = response.headers.get('content-disposition');

    if (contentType?.includes('text/csv')) {
      const csv = await response.text();
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': contentDisposition || 'attachment; filename=audit-logs.csv'
        }
      });
    } else if (contentType?.includes('application/json') && contentDisposition) {
      const json = await response.text();
      return new NextResponse(json, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': contentDisposition
        }
      });
    }

    // Resposta normal JSON
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao exportar logs de auditoria:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
