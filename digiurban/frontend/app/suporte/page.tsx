import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, SUPPORT_EMAIL } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Ajuda e suporte - DigiUrban',
  description: 'Como pedir ajuda no Portal do Cidadão e no app DigiUrban, e respostas para as dúvidas mais comuns.',
  alternates: { canonical: '/suporte' },
  robots: { index: true, follow: true },
}

const FAQ: Array<{ q: string; a: React.ReactNode }> = [
  {
    q: 'Esqueci a minha senha',
    a: (
      <>
        Na tela de entrada toque em <Link href="/cidadao/forgot-password">Esqueci minha senha</Link> e informe o seu CPF ou e-mail. Você recebe um
        link por e-mail para criar uma senha nova. Sem e-mail no cadastro? Peça a troca no atendimento da prefeitura.
      </>
    ),
  },
  {
    q: 'Não acho o meu município',
    a: (
      <>
        Na tela de entrada aparecem só as prefeituras que usam o DigiUrban. Se a sua não está na lista, ela ainda não usa a plataforma — procure o
        atendimento da prefeitura pelos canais dela.
      </>
    ),
  },
  {
    q: 'Como acompanho o meu pedido?',
    a: (
      <>
        Entre na conta e abra <em>Protocolos</em>. Cada pedido mostra a situação, as mensagens da prefeitura e o que falta você fazer. Os avisos
        chegam no celular, no e-mail e na conversa “Avisos da Prefeitura”.
      </>
    ),
  },
  {
    q: 'A prefeitura pediu um documento. Como envio?',
    a: <>Abra o pedido e toque em enviar documento. A câmera guia a foto (frente e verso quando precisa).</>,
  },
  {
    q: 'Como excluo a minha conta?',
    a: (
      <>
        Pelo app: <em>Menu › Excluir minha conta</em>. Pela web: <Link href="/excluir-conta">página de exclusão da conta</Link>, que explica o que é
        apagado e o que fica guardado por lei.
      </>
    ),
  },
]

export default function SuportePage() {
  return (
    <LegalPage title="Ajuda e suporte" intro="Como pedir ajuda e respostas para as dúvidas mais comuns." updated={false}>
      <h2>Como pedir ajuda</h2>
      <ul>
        <li>
          <strong>Pelo app:</strong> abra o <em>Assistente</em> e escreva o que precisa. Se ele não resolver, peça “falar com atendente” e um servidor
          da prefeitura continua a conversa.
        </li>
        <li>
          <strong>Sobre um pedido, um serviço ou um prazo:</strong> quem responde é a sua prefeitura (o atendimento é do município que você escolheu
          ao entrar). Use as mensagens do próprio pedido ou o atendimento presencial.
        </li>
        <li>
          <strong>Problema no app ou no site:</strong> escreva para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> contando o município, o que
          aconteceu e, se puder, uma foto da tela. Nunca mandamos pedido de senha por e-mail.
        </li>
      </ul>

      <h2>Perguntas frequentes</h2>
      {FAQ.map((item) => (
        <div key={item.q}>
          <h3>{item.q}</h3>
          <p>{item.a}</p>
        </div>
      ))}

      <h2>Privacidade</h2>
      <p>
        Veja a <Link href="/privacidade">Política de privacidade</Link>, os <Link href="/privacidade#seus-direitos">seus direitos</Link> e os{' '}
        <Link href="/termos">Termos de uso</Link>.
      </p>
    </LegalPage>
  )
}
