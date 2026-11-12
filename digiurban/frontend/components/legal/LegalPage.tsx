import Link from 'next/link'

/**
 * Moldura das páginas públicas exigidas pelas lojas (privacidade, termos,
 * excluir conta, suporte, documentos legais). Sem login, no visual do portal.
 */

export const SUPPORT_EMAIL = 'fuseagencia10@gmail.com'
export const LEGAL_UPDATED_AT = '11 de novembro de 2026'

// Empresa responsável pelo DigiUrban (dados do cartão CNPJ) — as lojas exigem o responsável identificado
export const COMPANY = {
  name: 'FUSE AGENCIA LTDA',
  cnpj: '42.761.086/0001-15',
  address: 'Rua Antonio Gregorio Ferreira, 298, Conradinho, Guarapuava/PR, CEP 85055-270',
}

export const LEGAL_LINKS = [
  { href: '/privacidade', label: 'Política de privacidade' },
  { href: '/privacidade#seus-direitos', label: 'Seus direitos' },
  { href: '/termos', label: 'Termos de uso' },
  { href: '/excluir-conta', label: 'Excluir a conta' },
  { href: '/suporte', label: 'Ajuda e suporte' },
]

export const NOT_GOVERNMENT = 'O DigiUrban é a plataforma digital usada pela sua prefeitura. Não é um órgão de governo.'

export function LegalPage({ title, intro, children, updated = true }: { title: string; intro?: string; children: React.ReactNode; updated?: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link href="/cidadao" className="flex items-center gap-2 font-semibold text-gray-900">
            <img src="/icon-192x192.png" alt="" className="h-8 w-8 rounded-lg" />
            DigiUrban
          </Link>
          <Link href="/legal" className="text-sm text-blue-700 hover:underline">
            Documentos
          </Link>
        </div>

        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8 [&_a]:text-blue-700 [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-8 [&_h2]:scroll-mt-6 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h3]:mb-1 [&_h3]:mt-4 [&_h3]:font-semibold [&_h3]:text-gray-900 [&_li]:mt-1 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 text-[15px] leading-relaxed text-gray-700">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
          {intro && <p className="text-gray-600">{intro}</p>}
          {updated && <p className="text-sm text-gray-500">Última atualização: {LEGAL_UPDATED_AT}</p>}
          {children}
        </article>

        <footer className="mt-6 space-y-2 text-center text-xs text-gray-500">
          <p>{NOT_GOVERNMENT}</p>
          <p className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:underline">
                {link.label}
              </Link>
            ))}
          </p>
          <p>
            DigiUrban é mantido por {COMPANY.name} — CNPJ {COMPANY.cnpj} — {COMPANY.address}
          </p>
          <p>
            Contato: <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">{SUPPORT_EMAIL}</a>
          </p>
        </footer>
      </div>
    </div>
  )
}
