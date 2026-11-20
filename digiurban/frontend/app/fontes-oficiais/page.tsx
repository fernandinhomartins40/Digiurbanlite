import type { Metadata } from 'next'
import { LegalPage, NOT_GOVERNMENT } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Fontes oficiais - Digiurban',
  description: 'De onde vêm as informações de governo mostradas no Digiurban e os links para as fontes oficiais (.gov.br).',
  alternates: { canonical: '/fontes-oficiais' },
  robots: { index: true, follow: true },
}

// Política de declarações enganosas do Google Play: app com informação de governo cita a fonte original (.gov.br).
// Os mesmos links estão na descrição da loja (docs/apps-nativos/FICHAS-LOJAS.md).
const OFFICIAL_SOURCES: Array<{ label: string; href: string; about: string }> = [
  {
    label: 'Portal de serviços do Governo Federal (gov.br)',
    href: 'https://www.gov.br/pt-br/servicos',
    about: 'Serviços públicos federais e as regras gerais do atendimento ao cidadão.',
  },
  {
    label: 'Código de Defesa do Usuário do Serviço Público — Lei nº 13.460/2017',
    href: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2017/lei/l13460.htm',
    about: 'Direitos de quem pede serviço à prefeitura: protocolo, prazo, resposta e avaliação.',
  },
  {
    label: 'Lei do Governo Digital — Lei nº 14.129/2021',
    href: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14129.htm',
    about: 'Atendimento público pela internet.',
  },
  {
    label: 'Assinaturas eletrônicas — Lei nº 14.063/2020',
    href: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm',
    about: 'Base da assinatura eletrônica avançada usada nos documentos.',
  },
  {
    label: 'Lei Geral de Proteção de Dados (LGPD) — Lei nº 13.709/2018',
    href: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
    about: 'Regras para os seus dados pessoais.',
  },
  {
    label: 'Autoridade Nacional de Proteção de Dados (ANPD)',
    href: 'https://www.gov.br/anpd/pt-br',
    about: 'Órgão que fiscaliza a LGPD e recebe reclamações.',
  },
  {
    label: 'Lei de Acesso à Informação — Lei nº 12.527/2011',
    href: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm',
    about: 'Como pedir informações públicas aos órgãos de governo.',
  },
]

export default function OfficialSourcesPage() {
  return (
    <LegalPage
      title="Fontes oficiais"
      intro="De onde vêm as informações de governo que aparecem no Digiurban."
    >
      <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">{NOT_GOVERNMENT}</p>

      <h2>Serviços da sua prefeitura</h2>
      <p>
        Os serviços, documentos pedidos, prazos e respostas que você vê no app são definidos pela prefeitura do município que você escolheu na tela
        de entrada. Quem recebe e decide os pedidos é a prefeitura. Em caso de dúvida, confira no site oficial da sua prefeitura (o endereço
        oficial termina em <strong>.gov.br</strong>) ou no atendimento presencial dela.
      </p>

      <h2>Leis e órgãos oficiais</h2>
      <ul>
        {OFFICIAL_SOURCES.map((source) => (
          <li key={source.href}>
            <a href={source.href} target="_blank" rel="noopener noreferrer">
              {source.label}
            </a>
            <br />
            <span className="text-sm text-gray-500">{source.about}</span>
          </li>
        ))}
      </ul>
    </LegalPage>
  )
}
