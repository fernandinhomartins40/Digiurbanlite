/**
 * ============================================================================
 * TENANT (Fase 7 Multi-Tenant — white-label runtime)
 * ============================================================================
 * Tipos e fetch server-side da configuração pública do tenant, resolvida pelo
 * HOST da requisição. Consumido pelo layout raiz (Server Component) para
 * hidratar o TenantProvider antes do primeiro paint.
 *
 * Elimina a dependência de NEXT_PUBLIC_* em build-time para branding (achado
 * F5 da auditoria): a mesma imagem Docker serve qualquer município.
 */

export interface TenantBranding {
  corPrimaria?: string | null
  corSecundaria?: string | null
  logoUrl?: string | null
}

export interface TenantConfig {
  slug: string
  nome: string
  nomeMunicipio: string
  ufMunicipio: string
  codigoIbge?: string | null
  status: string
  branding: TenantBranding | null
  features: Record<string, unknown> | null
}

/** Fallback usado quando o backend não resolve o tenant (dev, erro de rede). */
export const DEFAULT_TENANT_CONFIG: TenantConfig = {
  slug: 'default',
  nome: 'DigiUrban',
  nomeMunicipio: 'DigiUrban',
  ufMunicipio: '',
  status: 'ACTIVE',
  branding: null,
  features: null,
}

/**
 * Busca a config do tenant no backend, encaminhando o Host da request atual
 * para que a resolução por host aconteça no backend (getByHost).
 * Server-only: usa next/headers.
 */
export async function fetchTenantConfig(): Promise<TenantConfig> {
  try {
    // import dinâmico: next/headers só existe no server
    const { headers } = await import('next/headers')
    const h = headers()
    const host = h.get('host') || ''

    // Base interna: em produção o backend é acessível via localhost dentro do
    // container; SSR não passa pelo Nginx. Configurável por env.
    const base =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3001/api'

    // ⚠️ undici (fetch do Node/Next) DESCARTA o header `Host` por segurança.
    // O backend Express (trust proxy=1) resolve o tenant por `X-Forwarded-Host`,
    // que passa livremente — é assim que o host original chega ao getByHost.
    //
    // ⚠️ CACHE: NÃO usar next.revalidate aqui. O cache de fetch do Next chaveia
    // pela URL e IGNORA headers — a URL é a mesma para todos os municípios, só
    // o header x-forwarded-host muda. Com cache, o PRIMEIRO host renderizado
    // populava o cache e TODOS os outros recebiam aquele tenant (bug: subdomínio
    // de município caía na config do default → landing comercial).
    // 'no-store' força resolução por-request pelo host correto.
    const res = await fetch(`${base}/public/tenant-config`, {
      headers: { 'x-forwarded-host': host },
      cache: 'no-store',
    })

    if (!res.ok) return DEFAULT_TENANT_CONFIG
    const data = await res.json()
    return (data?.tenant as TenantConfig) || DEFAULT_TENANT_CONFIG
  } catch {
    return DEFAULT_TENANT_CONFIG
  }
}

/** Converte o branding do tenant em CSS custom properties para o :root. */
export function brandingToCssVars(config: TenantConfig): Record<string, string> {
  const vars: Record<string, string> = {}
  const b = config.branding
  if (b?.corPrimaria) vars['--tenant-primary'] = b.corPrimaria
  if (b?.corSecundaria) vars['--tenant-secondary'] = b.corSecundaria
  return vars
}
