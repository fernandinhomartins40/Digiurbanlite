import type { Metadata } from 'next'
import Link from 'next/link'
import { LEGAL_LINKS, LegalPage } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Documentos legais - DigiUrban',
  description: 'Política de privacidade, termos de uso, direitos do titular, exclusão da conta e suporte do DigiUrban.',
  alternates: { canonical: '/legal' },
  robots: { index: true, follow: true },
}

export default function LegalIndexPage() {
  return (
    <LegalPage title="Documentos legais" intro="Tudo sobre privacidade, regras de uso e ajuda, num lugar só." updated={false}>
      <ul className="!list-none !pl-0">
        {LEGAL_LINKS.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-xl border border-gray-200 px-4 py-3 !no-underline hover:bg-gray-50">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </LegalPage>
  )
}
