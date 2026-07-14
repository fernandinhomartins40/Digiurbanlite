import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const dynamic = 'force-dynamic';

// GET /api/platform/system/backup/[fileName] - Download de backup
export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const token = request.cookies.get('digiurban_platform_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/platform/system/backup/${params.fileName}`,
      {
        method: 'GET',
        headers: {
          'Cookie': `digiurban_platform_token=${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    // Para downloads, retornar o blob
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${params.fileName}"`
      }
    });
  } catch (error) {
    console.error('Erro ao fazer download do backup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE /api/platform/system/backup/[fileName] - Deletar backup
export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const token = request.cookies.get('digiurban_platform_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/platform/system/backup/${params.fileName}`,
      {
        method: 'DELETE',
        headers: {
          'Cookie': `digiurban_platform_token=${token}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao deletar backup:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
