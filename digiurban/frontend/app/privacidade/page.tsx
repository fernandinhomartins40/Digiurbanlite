import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, NOT_GOVERNMENT, SUPPORT_EMAIL } from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Política de privacidade - DigiUrban',
  description: 'Como o DigiUrban e a sua prefeitura tratam os seus dados pessoais (LGPD).',
  alternates: { canonical: '/privacidade' },
  robots: { index: true, follow: true },
}

/**
 * Política de privacidade (LGPD). Escrita a partir do que o sistema guarda de
 * fato (schema + serviços, 2026-11-10). Mudou o que o sistema coleta? Atualize
 * aqui e a data em LEGAL_UPDATED_AT.
 */
export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de privacidade" intro="Como os seus dados são usados no Portal do Cidadão e no app DigiUrban, explicado de forma simples.">
      <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">{NOT_GOVERNMENT}</p>

      <h2 id="quem">1. Quem cuida dos seus dados</h2>
      <ul>
        <li>
          <strong>A sua prefeitura é a controladora</strong> (Lei Geral de Proteção de Dados – LGPD, art. 5º, VI): é ela que decide para que os dados
          servem, atende os seus pedidos e presta os serviços públicos.
        </li>
        <li>
          <strong>O DigiUrban é o operador</strong> (art. 5º, VII): fornece a plataforma e guarda os dados seguindo as instruções da prefeitura. Cada
          prefeitura só vê os dados do próprio município.
        </li>
      </ul>

      <h2 id="dados">2. Quais dados guardamos</h2>
      <ul>
        <li>
          <strong>Cadastro:</strong> nome, CPF, e-mail, telefone, data de nascimento, RG, nome da mãe, estado civil, profissão, renda familiar,
          endereço e foto de perfil (o que você ou a prefeitura preencher).
        </li>
        <li>
          <strong>Pedidos (protocolos):</strong> o que você pede, as respostas do formulário de cada serviço, mensagens trocadas com a prefeitura,
          avaliações e os documentos que você envia (fotos ou PDF).
        </li>
        <li>
          <strong>Leitura automática de documentos:</strong> as fotos de documentos são lidas no nosso servidor para ajudar a conferir nome, CPF e
          data de nascimento com o cadastro. Guardamos só o resultado da conferência, não o texto lido. Quem aprova é sempre um servidor.
        </li>
        <li>
          <strong>Localização:</strong> o local do pedido (quando você usa o GPS do celular ou marca no mapa) e, se você quiser, o ponto da sua casa.
          Não acompanhamos a sua localização em segundo plano.
        </li>
        <li>
          <strong>Biometria facial (dado sensível):</strong> só com o seu consentimento, separado por finalidade — confirmar a sua identidade ou,
          nas escolas, a segurança de entrada e saída de alunos. O rosto é analisado no nosso servidor; as medidas do rosto nunca saem dele e as
          fotos ficam cifradas. Revogar o consentimento apaga a biometria.
        </li>
        <li>
          <strong>Família:</strong> pessoas da casa que você adiciona e os dependentes menores de idade cadastrados por você.
        </li>
        <li>
          <strong>Conversas:</strong> mensagens com o assistente (DigiBot) e com os atendentes da prefeitura.
        </li>
        <li>
          <strong>Avisos:</strong> suas preferências de aviso e, no app ou no navegador, o código do aparelho para receber notificações.
        </li>
        <li>
          <strong>Registros de acesso:</strong> data, hora, endereço IP e navegador de entradas e ações importantes, para segurança e como exige o
          Marco Civil da Internet.
        </li>
      </ul>

      <h2 id="uso">3. Para que usamos e com que base legal</h2>
      <ul>
        <li>
          Prestar os serviços da prefeitura, acompanhar e responder os seus pedidos e emitir documentos — execução de políticas públicas e
          cumprimento de obrigação legal (LGPD, arts. 7º, II e III, e 23).
        </li>
        <li>Conferir a sua identidade e evitar fraudes (níveis Bronze, Prata e Ouro da conta).</li>
        <li>Enviar avisos sobre os seus pedidos por notificação, e-mail ou no chat do app.</li>
        <li>Biometria facial e assistente com inteligência artificial — somente com o seu consentimento (arts. 7º, I, e 11, I).</li>
      </ul>
      <p>Não vendemos dados e não usamos os seus dados para publicidade.</p>

      <h2 id="ia">4. Assistente com inteligência artificial</h2>
      <p>
        Antes do primeiro uso, o assistente pergunta se você aceita o uso de inteligência artificial. Se aceitar, o texto das suas mensagens pode
        ser enviado a provedores de IA de outras empresas para entender o que você precisa. <strong>Antes de sair do nosso servidor</strong>, CPF,
        CNPJ, e-mail, telefone, CEP e números de cartão são trocados por marcadores; o dado verdadeiro fica com a gente. Evite escrever outros
        dados pessoais que não sejam necessários para o pedido.
      </p>
      <p>
        Se não aceitar, você é atendido do mesmo jeito, pelos menus e pela busca de serviços. Dá para mudar a escolha em <em>Meu perfil › Meus dados
        e privacidade</em>. A IA pode errar: confira as respostas e use o botão “Denunciar” se uma resposta estiver errada ou for ofensiva.
      </p>

      <h2 id="compartilhamento">5. Com quem os dados são compartilhados</h2>
      <ul>
        <li>
          <strong>A prefeitura</strong> e os servidores que atendem o seu pedido (cada um vê só o necessário para o próprio trabalho).
        </li>
        <li>
          <strong>Provedores de inteligência artificial</strong>, só se você aceitar e com os dados pessoais mascarados (item 4).
        </li>
        <li>
          <strong>VeloMail</strong>, para entregar os e-mails do sistema (avisos, troca de senha, documentos).
        </li>
        <li>
          <strong>Google Maps e OpenStreetMap</strong>, para mostrar mapas e achar o endereço do pedido (vai o endereço, sem o seu nome).
        </li>
        <li>
          <strong>Google (Firebase) e Apple</strong>, para entregar as notificações no celular (vão o título e o texto do aviso).
        </li>
        <li>Órgãos públicos e a Justiça, quando a lei exigir.</li>
      </ul>

      <h2 id="internacional">6. Transferência para outros países</h2>
      <p>
        Alguns desses fornecedores (inteligência artificial, mapas e notificações) podem processar dados fora do Brasil. Nesses casos enviamos o
        mínimo necessário, com os dados pessoais mascarados quando possível, e só usamos empresas que oferecem proteção adequada (LGPD, art. 33).
      </p>

      <h2 id="cookies">7. Cookies e dados guardados no aparelho</h2>
      <ul>
        <li>
          <strong>Cookie de sessão</strong> (protegido, não pode ser lido por outros sites nem por scripts): mantém você conectado. Sai quando você
          sai da conta ou a sessão vence.
        </li>
        <li>
          <strong>Município escolhido</strong> e <strong>preferências</strong> (tema claro/escuro, avisos) ficam guardados no próprio aparelho.
        </li>
        <li>
          <strong>Funcionamento sem internet</strong>: o portal guarda uma cópia de telas e imagens no aparelho para abrir mais rápido.
        </li>
      </ul>
      <p>Não usamos cookies de publicidade nem de rastreamento, nem ferramentas de análise de terceiros.</p>

      <h2 id="menores">8. Crianças e adolescentes</h2>
      <p>
        Dependentes menores de idade são cadastrados pelo pai, mãe ou responsável, no melhor interesse da criança (LGPD, art. 14). A biometria facial
        de menores só é feita com o consentimento do responsável. O responsável pode ver, corrigir e remover os dados do dependente pelo app.
      </p>

      <h2 id="guarda">9. Por quanto tempo guardamos</h2>
      <ul>
        <li>
          <strong>Pedidos e documentos emitidos:</strong> pelo tempo exigido pelas regras de arquivo público, porque são registro do atendimento da
          prefeitura.
        </li>
        <li>
          <strong>Conversas que não viraram pedido:</strong> podem ser apagadas automaticamente depois do prazo definido pela plataforma (padrão de
          1 ano para o assistente e 2 anos para conversas com atendentes).
        </li>
        <li>
          <strong>Biometria:</strong> fotos de quem a câmera não reconheceu, até 7 dias; fotos de entrada e saída, até 90 dias; o registro da
          passagem, até 1 ano. A biometria é apagada quando você revoga o consentimento ou exclui a conta.
        </li>
        <li>
          <strong>Registros de acesso:</strong> pelo menos 6 meses (Marco Civil da Internet, art. 15).
        </li>
        <li>
          <strong>Conta excluída:</strong> ficam só o nome, o CPF e os pedidos já feitos (obrigação legal, LGPD art. 16, I). Todo o resto é apagado.
        </li>
      </ul>

      <h2 id="seguranca">10. Segurança</h2>
      <ul>
        <li>Conexão sempre protegida (HTTPS) e senhas guardadas de forma irreversível (criptografia).</li>
        <li>Fotos da biometria cifradas; chaves e senhas do sistema guardadas cifradas.</li>
        <li>Cada prefeitura só acessa os dados do seu município; cada servidor, só o que o seu cargo permite.</li>
        <li>Registro de quem acessou e alterou dados importantes.</li>
      </ul>
      <p>Se acontecer um incidente de segurança que possa trazer risco a você, a prefeitura e a ANPD serão avisadas, como manda a lei.</p>

      <h2 id="seus-direitos">11. Seus direitos e como usar cada um</h2>
      <p>A LGPD (art. 18) garante os direitos abaixo. A maioria você resolve sozinho, pelo app ou pelo portal:</p>
      <ul>
        <li>
          <strong>Saber o que temos e receber uma cópia:</strong> <em>Meu perfil › Meus dados e privacidade › Baixar os meus dados</em> (arquivo com o
          seu cadastro, pedidos, documentos, família, etiquetas, biometria e preferências).
        </li>
        <li>
          <strong>Corrigir:</strong> <em>Meu perfil</em> › Editar. Documentos podem ser reenviados em <em>Meus documentos</em>.
        </li>
        <li>
          <strong>Excluir a conta:</strong> <em>Meu perfil › Excluir a minha conta</em> ou pela página <Link href="/excluir-conta">Excluir a conta</Link>.
        </li>
        <li>
          <strong>Revogar consentimentos:</strong> biometria facial em <em>Menu › Biometria facial</em> (apaga a biometria); inteligência artificial em{' '}
          <em>Meu perfil › Meus dados e privacidade</em>.
        </li>
        <li>
          <strong>Saber com quem compartilhamos, pedir informações, se opor a um uso ou pedir revisão de decisão automática:</strong> fale com a
          prefeitura (pelo chat do app ou no atendimento) ou com a gente.
        </li>
      </ul>
      <h3>Encarregado de dados (DPO)</h3>
      <p>
        Como a controladora é a prefeitura, o encarregado de dados é o indicado por ela (veja no site da sua prefeitura). Você também pode mandar o
        pedido para <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>: nós encaminhamos à prefeitura e acompanhamos a resposta. Se não ficar
        satisfeito, pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD), em <a href="https://www.gov.br/anpd">gov.br/anpd</a>.
      </p>

      <h2 id="mudancas">12. Mudanças nesta política</h2>
      <p>
        Quando esta política mudar, a data no topo é atualizada. Mudanças importantes são avisadas no app.
      </p>
    </LegalPage>
  )
}
