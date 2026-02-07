import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rotas públicas do admin que NÃO precisam de autenticação
const PUBLIC_ADMIN_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Apenas interceptar rotas /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Ignorar rotas públicas
  if (PUBLIC_ADMIN_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Verificar presença do cookie de autenticação
  const token = request.cookies.get('digiurban_admin_token')?.value

  if (!token) {
    // Sem cookie → redirect para login com returnUrl
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('returnUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Cookie presente → permitir acesso (validação real é feita no backend)
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
