# Plano de Produto — "A prefeitura que vem até você"

Data: 2026-11-11 · Situação: aprovado para implementar · Como executar: [AGENTES-PLANO-PRODUTO.md](AGENTES-PLANO-PRODUTO.md)

## 1. Objetivo

O DigiUrban já é completo. O que falta é a camada de produto: hoje a pessoa navega até a função; passa a ser o sistema que traz a próxima coisa a fazer, com todo o resto a uma busca de distância.

Regras do plano:

- **Nada é removido.** Toda tela e função atual continua existindo e alcançável. Muda a porta de entrada.
- **Aproveitar o que existe.** Quase tudo é juntar dados que o backend já tem. Não criar módulo novo, não mexer no motor de status do protocolo, não reescrever app por dentro.
- **Usuário leigo.** Texto simples em português com acentos, sem jargão técnico, sem tela de código.
- Ainda não há produção: não é preciso manter compatibilidade com dados antigos nem criar chave liga/desliga para cada mudança.

Este plano continua o [ARQUITETURA-DE-PRODUTO.md](../../ARQUITETURA-DE-PRODUTO.md) (menu por tarefa, portal do cidadão, balcão — já feitos). Não refazer o que está lá.

## 2. Os sete movimentos

### M1 — Minha mesa (Início do servidor)

**Problema:** o que depende do servidor está em 7 lugares com contadores separados. O Início ([app/admin/page.tsx](../../digiurban/frontend/app/admin/page.tsx)) mostra números e atalhos, não o trabalho.

**Entrega:**
- Backend: `GET /api/admin/workbench` devolve uma lista única de itens "esperando por você", cada um com `tipo`, `título`, `subtítulo`, `prazo`, `atrasado`, `link` e a contagem por tipo. Fontes (todas já existem; chamar os serviços, não duplicar consultas):
  - pedidos do servidor e sem responsável no seu escopo (mesma regra de `/protocols?view=active&sort=due` e `/protocols/queue-summary`);
  - processos internos na caixa da pessoa/unidade e pedidos de assinatura (`GET /api/internal-processes/dashboard`);
  - fila de assinaturas (`/api/signatures/queue`);
  - cidadãos aguardando conferência (só quem tem `citizens:verify`);
  - conversas com mensagem não lida e atendimentos aguardando atendente;
  - filas dos apps a que o servidor tem acesso (`portal-queues.service.ts`), só a contagem por app;
  - compromissos de hoje (`central-calendar.service`).
- Regra pura de ordenação (atrasado → vence hoje → com prazo → sem prazo) em arquivo próprio, com teste unitário.
- Uma fonte que falhar não derruba a resposta: volta vazia e a lista segue.
- Frontend: o Início passa a ser "Bom dia, Fulano — N coisas esperam por você", a lista agrupada por urgência, filtros por tipo em abas `lg-tab`, e os 4 números atuais reduzidos a uma linha discreta. Os atalhos mais usados ficam (já existem), abaixo da lista. Mesa vazia = mensagem positiva + sugestão do que fazer.

**Pronto quando:** um servidor comum vê só o que é do seu escopo; admin vê o município; cada item abre a tela certa; a lista bate com os contadores do menu.

### M2 — Buscar e fazer (Ctrl+K)

**Problema:** a busca do Início é uma lista fixa de 23 telas (`getSearchItems`), que não acha cidadão, pedido nem ação e não segue o menu.

**Entrega:**
- Paleta de comandos global no painel (`components/ui/command.tsx`, `cmdk` já instalado), aberta por Ctrl+K / ⌘K e por um botão de lupa visível no topo e no Dock (celular).
- Três grupos de resultado:
  1. **Telas** — geradas de `getAdminMainNavigation()` + secretarias + gabinete, filtradas por `shouldShowNavItem`/`canSeeSecretaria` (mesma regra do menu, nunca lista própria);
  2. **Pessoas e pedidos** — `GET /api/admin/search?q=`: cidadão por nome/CPF (exige `citizens:read`, CPF mascarado na lista), pedido por número (escopo de `buildProtocolScopeWhere`), processo interno por número (escopo do módulo). Mínimo 3 caracteres, no máx. 5 por grupo, espera de 250 ms ao digitar;
  3. **Ações** — lista curta fixa: Novo atendimento no balcão, Novo processo interno, Nova pesquisa de preços, Novo compromisso (cada uma só se a pessoa tem permissão).
- Remover `getSearchItems` e o `SearchBar` do Início. O `SearchBar` do Painel do Prefeito é outra coisa (busca de cidadão na faixa azul) — não mexer.

**Pronto quando:** digitar um CPF, um número de pedido ou "organograma" leva ao lugar certo em até duas teclas; servidor sem permissão não vê o resultado.

### M3 — Para você (cidadão)

**Problema:** o cidadão precisa saber o nome do serviço. Nada é sugerido, embora o backend saiba etiquetas, família e idade.

**Entrega:**
- **Situações de vida:** catálogo em código `backend/src/catalog/life-situations.ts` (ex.: Tive um filho, Meu filho vai para a escola, Preciso de atendimento de saúde, Estou sem trabalho, Vou abrir um negócio, Vou construir ou reformar, Problema na minha rua, Perdi um familiar, Sou produtor rural, Cheguei na cidade). Cada situação aponta para serviços por `catalogKey` e palavras do nome. `GET /api/citizen/services/situations` devolve só situações com pelo menos um serviço ativo no município. Teste: toda `catalogKey` citada existe no catálogo de serviços.
- **Início do cidadão** ([app/cidadao/page.tsx](../../digiurban/frontend/app/cidadao/page.tsx)): abaixo da busca, faixa "O que está acontecendo?" com as situações; bloco "Para você" com os serviços sugeridos de `GET /citizen/auth/my-tags` (já existe) — some se não houver sugestão.
- **Catálogo** ([app/cidadao/servicos/page.tsx](../../digiurban/frontend/app/cidadao/servicos/page.tsx)): filtro por situação além do filtro por secretaria (`?situacao=`).
- A busca do Início passa a usar a busca tolerante do backend (a mesma do bot, `services/digibot/text-match.ts`) no lugar do `includes` local, se já houver rota que a exponha; se não houver, expor em `citizen-services`.

**Pronto quando:** "Tive um filho" lista os serviços certos de mais de uma secretaria; município sem aqueles serviços não mostra a situação.

### M4 — Pedido como entrega (cidadão)

**Já existe:** etapas (`CitizenWorkflowProgress`, `CitizenStageFocusCard`) e preenchimento automático do formulário (`useFormPrefill`). Este movimento é **conferir e completar**, não refazer.

**Entrega:**
- No topo da tela do pedido ([app/cidadao/protocolos/[id]/page.tsx](../../digiurban/frontend/app/cidadao/protocolos/%5Bid%5D/page.tsx)), uma frase única que responde "onde está e quando sai": etapa atual, secretaria que está com o pedido e data prevista (`ProtocolSLA.expectedEndDate`). Pedido atrasado diz isso com franqueza e oferece "Falar com a prefeitura". Nunca mostrar nome de servidor.
- Na lista de pedidos e no Início, a mesma data prevista ao lado da situação.
- **Pedir uma vez só:** conferir que `useFormPrefill` cobre nome, CPF, nascimento, telefone, e-mail e endereço; no envio de documentos do pedido, oferecer "Usar o que já enviei" quando o cidadão tem documento aprovado do mesmo código em Meus documentos. Completar só o que faltar.

**Pronto quando:** abrir qualquer pedido responde, sem rolar a tela, em que etapa está e para quando é.

### M5 — Prefeitura no ar em um dia

**Problema:** não existe primeira experiência. Município novo cai em 198 telas.

**Entrega:**
- Backend: `GET /api/admin/activation` calcula a lista de ativação **a partir dos dados que já existem** (sem tabela nova): brasão e dados do município, secretarias conferidas, servidores cadastrados (além do primeiro), lotações no organograma, serviços revisados/ativos, DigiBot publicado, remetente de e-mail, papéis do processo interno ligados, primeiro pedido de teste. Cada passo: `feito`, texto de uma linha, link direto para a tela que resolve.
- Frontend: página `/admin/primeiros-passos` (só ADMIN) com os passos e a barra de progresso; cartão `ActivationCard` para o Início enquanto não estiver 100% (pode ser dispensado; a escolha fica nas preferências do usuário que já existem).
- Primeiro acesso do servidor comum: um cartão de boas-vindas no Início com 3 frases (o que é a mesa, a busca e o Dock), dispensável. Sem tour passo a passo.

**Pronto quando:** um município recém-criado mostra o que falta e cada passo leva à tela certa; ao completar, o cartão some sozinho.

### M6 — Uma só cara

**Entrega:**
- **Moldura dos apps:** `components/apps/AppShell.tsx` (título, voltar para Apps, descrição de uma linha, área de abas, estado vazio e estado de erro padronizados), partindo de `components/apps/apps-gerais/shared.tsx` e `portal-requests/shared.tsx`. Aplicar como invólucro nas páginas de `/admin/apps/*` — **só cabeçalho, abas e estados vazio/erro/carregando; não mexer na lógica interna nem nas tabelas**.
- **Textos:** acentuação e português correto em todo o painel (começar por `app/admin/page.tsx`, que está sem acentos); `ADMIN` aparece como "Administrador" (Prefeito é o perfil Gabinete, não um papel); trocar "Carregando painel administrativo..." e similares por esqueletos (`Skeleton`).
- **Vocabulário:** para o cidadão é sempre "pedido"; para o servidor "protocolo" continua no menu e no número, sem misturar na mesma tela.

**Pronto quando:** todos os apps abrem com o mesmo cabeçalho e os mesmos estados; não há texto sem acento nas telas principais.

### M7 — Prova de valor

**Entrega:**
- **Página pública "Prefeitura em números"** (`/prefeitura-em-numeros`, por município): pedidos recebidos e resolvidos no mês, tempo médio de resposta, nota média das avaliações, serviços mais pedidos. Só números agregados, nenhum nome. `GET /api/public/city-numbers`. Liga/desliga pelo painel da prefeitura (desligada por padrão); guardar a opção em configuração do município que já exista — coluna nova só se não houver onde.
- **Resumo da semana** para quem tem `gabineteAccess`: toda segunda 8h (Brasília), um aviso no app (Notification) com os números da semana vindos de `mayor-panel.service.ts`, com link para o Painel do Prefeito. **Não por e-mail** (limite de 100/dia do VeloMail).

**Pronto quando:** a página abre sem login só com a opção ligada; o resumo chega uma vez por semana e não duplica se o servidor reiniciar.

## 3. Ondas de execução

| Onda | Agentes (em paralelo) | Depende de |
|---|---|---|
| 1 | A1 Mesa (backend) · A2 Busca Ctrl+K · A3 Para você · A4 Pedido como entrega · A5 Primeiros passos | — |
| 2 | B1 Início do servidor (tela) · B2 Moldura dos apps · B3 Prova de valor | A1 e A5 (B1) |
| 3 | C1 e C2 Aplicar a moldura nos apps restantes · depois C3 Textos (sozinho) | B2 |
| Fim | Conferência geral, atualização do CLAUDE.md | tudo |

Cada agente tem arquivos próprios; arquivos compartilhados (registro de rotas, schema do banco, menu) são do orquestrador. Detalhes em [AGENTES-PLANO-PRODUTO.md](AGENTES-PLANO-PRODUTO.md).

## 4. Fora do plano (de propósito)

- Reescrever apps por dentro ou dividir as páginas grandes.
- Novos módulos, novas integrações, WhatsApp.
- Mudar o motor de status, o fluxo de etapas ou as permissões.
- Tour guiado passo a passo, gamificação, pontos.
- Resumo por e-mail.

## 5. Riscos conhecidos

- **Escopo/privacidade na Mesa e na busca:** é onde um erro mostra dado de outra secretaria. Usar sempre as funções de escopo que já existem; teste obrigatório.
- **Desempenho da Mesa:** são 7 consultas; rodar em paralelo e limitar itens por fonte (20).
- **Moldura dos apps:** risco de quebrar tela grande ao envolver; por isso só o invólucro e conferência de tipos em cada app.
- Nada disto foi medido com usuário real: depois de pronto, vale observar 2 ou 3 servidores usando a Mesa antes de seguir refinando.
