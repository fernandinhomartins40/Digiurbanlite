import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, NOT_GOVERNMENT, SUPPORT_EMAIL } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Termos de uso - DigiUrban',
  description: 'Regras de uso do Portal do Cidadão e do app DigiUrban.',
  alternates: { canonical: '/termos' },
  robots: { index: true, follow: true },
}

export default function TermosPage() {
  return (
    <LegalPage title="Termos de uso" intro="As regras para usar o Portal do Cidadão e o app DigiUrban.">
      <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">{NOT_GOVERNMENT}</p>

      <h2>1. O que é o DigiUrban</h2>
      <p>
        O DigiUrban é uma plataforma digital contratada por prefeituras para atender a população: pedir serviços, acompanhar pedidos, enviar
        documentos, conversar com a prefeitura e receber avisos. <strong>Os serviços, prazos, regras e decisões são da sua prefeitura</strong>; o
        DigiUrban fornece a tecnologia.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>A conta é pessoal. Não compartilhe a sua senha. Se desconfiar que alguém a usou, troque a senha em Meu perfil.</li>
        <li>As informações do cadastro e dos pedidos devem ser verdadeiras. Informação falsa a órgão público pode ser crime.</li>
        <li>
          Você pode cadastrar dependentes menores de idade de quem é responsável. Pedidos em nome de outra pessoa da família só valem com o vínculo
          confirmado.
        </li>
        <li>A conta pode ser suspensa em caso de fraude, uso indevido ou a pedido da prefeitura, conforme a lei.</li>
      </ul>

      <h2>3. Pedidos e documentos</h2>
      <ul>
        <li>O número do pedido (protocolo) comprova que ele foi feito. Os prazos de resposta são os informados pela prefeitura em cada serviço.</li>
        <li>
          Documentos emitidos pela plataforma têm assinatura eletrônica avançada (Lei 14.063/2020, art. 4º, II) e podem ser conferidos em{' '}
          <Link href="/validar-documento">digiurban.com.br/validar-documento</Link>. Não é certificado ICP-Brasil.
        </li>
        <li>Cancelar um pedido ou excluir a conta não apaga o registro do atendimento que a prefeitura é obrigada a guardar.</li>
      </ul>

      <h2>4. Assistente com inteligência artificial</h2>
      <p>
        O assistente pode usar inteligência artificial se você permitir. Ele ajuda a encontrar serviços e preencher pedidos, mas{' '}
        <strong>pode errar</strong>: confira o que ele sugere antes de enviar. Respostas do assistente não são decisões da prefeitura. Use o botão
        “Denunciar” para avisar uma resposta errada ou ofensiva. Veja a <Link href="/privacidade#ia">Política de privacidade</Link>.
      </p>

      <h2>5. O que não é permitido</h2>
      <ul>
        <li>Usar a conta de outra pessoa ou se passar por alguém.</li>
        <li>Enviar conteúdo ofensivo, ilegal, com vírus ou que não tenha relação com o pedido.</li>
        <li>Tentar acessar dados de outras pessoas ou atrapalhar o funcionamento da plataforma.</li>
      </ul>

      <h2>6. Disponibilidade</h2>
      <p>
        Trabalhamos para a plataforma funcionar sempre, mas pode haver pausas para manutenção ou falhas de internet. Em situação de emergência, ligue
        para os telefones de emergência (190, 192, 193) — o app não substitui esses serviços.
      </p>

      <h2>7. Privacidade</h2>
      <p>
        O uso dos seus dados está explicado na <Link href="/privacidade">Política de privacidade</Link>. Você pode baixar os seus dados ou{' '}
        <Link href="/excluir-conta">excluir a conta</Link> quando quiser.
      </p>

      <h2>8. Mudanças e lei aplicável</h2>
      <p>
        Estes termos podem mudar; a data no topo mostra a versão atual. Valem as leis do Brasil. Dúvidas:{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> ou o atendimento da sua prefeitura.
      </p>
    </LegalPage>
  )
}
