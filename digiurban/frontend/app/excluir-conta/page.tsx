import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, SUPPORT_EMAIL } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Excluir a conta - DigiUrban',
  description: 'Como excluir a sua conta do Portal do Cidadão e do app DigiUrban, e o que é apagado.',
  alternates: { canonical: '/excluir-conta' },
  robots: { index: true, follow: true },
}

/**
 * Exigida pelas lojas (Apple 5.1.1(v) e Google Play): excluir pelo app e pedir
 * pela web. A exclusão é a mesma do perfil (POST /citizen/auth/delete-account):
 * o botão entra na conta e abre o perfil já na exclusão.
 */
export default function ExcluirContaPage() {
  return (
    <LegalPage title="Excluir a conta" intro="Você pode excluir a sua conta a qualquer momento, pelo app ou por aqui.">
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/cidadao/login?redirect=%2Fcidadao%2Fperfil%3Fexcluir%3D1"
          className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-3 font-medium text-white !text-white !no-underline hover:bg-red-700"
        >
          Entrar e excluir a minha conta
        </Link>
      </div>
      <p className="text-sm text-gray-500">Você entra com o seu CPF e a sua senha e confirma a exclusão com a senha.</p>

      <h2>Pelo app ou pelo portal</h2>
      <ul>
        <li>Abra <em>Menu › Excluir minha conta</em> (ou <em>Meu perfil › Meus dados e privacidade › Excluir a minha conta</em>).</li>
        <li>Digite a sua senha para confirmar.</li>
        <li>
          Se houver pedidos em andamento, o sistema avisa quantos são: ao confirmar, eles são cancelados e a prefeitura é avisada.
        </li>
      </ul>

      <h2>O que é apagado</h2>
      <ul>
        <li>Contato (e-mail e telefones), data de nascimento, endereço e ponto da casa no mapa.</li>
        <li>RG, nome da mãe, estado civil, profissão, renda e foto de perfil.</li>
        <li>Documentos pessoais enviados e o resultado da leitura deles.</li>
        <li>Biometria facial e os consentimentos.</li>
        <li>Família e convites, etiquetas, avisos, preferências e os celulares cadastrados para notificações.</li>
        <li>Conversas com o assistente e com atendentes que não viraram pedido, e a sua escolha sobre a inteligência artificial.</li>
        <li>Os dependentes que você cadastrou e que não têm conta própria (com os pedidos em andamento deles, que são cancelados).</li>
        <li>O acesso: a senha é trocada e a conta fica desativada.</li>
      </ul>

      <h2>O que fica guardado e por quê</h2>
      <p>
        Ficam só o <strong>nome</strong>, o <strong>CPF</strong> e os <strong>pedidos já feitos</strong> (com os documentos emitidos neles), porque a
        prefeitura é obrigada a manter o registro do atendimento público (LGPD, art. 16, I, e regras de arquivo público). Os registros de acesso
        ficam pelo menos 6 meses (Marco Civil da Internet, art. 15).
      </p>

      <h2>Sem acesso à conta?</h2>
      <p>
        Use <Link href="/cidadao/forgot-password">Esqueci minha senha</Link> ou peça a exclusão no atendimento da sua prefeitura. Você também pode
        escrever para <a href={`mailto:${SUPPORT_EMAIL}?subject=Excluir%20minha%20conta`}>{SUPPORT_EMAIL}</a> informando o município: confirmamos que
        é você e encaminhamos à prefeitura.
      </p>
      <p>Para voltar a usar depois, é preciso pedir à prefeitura que reative o cadastro.</p>
    </LegalPage>
  )
}
