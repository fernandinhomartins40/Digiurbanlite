# Relatório Final

## Resumo

Analisei o fluxo central do produto, o **protocolo**, pelos dois lados: a fila de trabalho do servidor (`/admin/protocolos`, a home `/admin` e o detalhe) e o acompanhamento pelo cidadão (`/cidadao/protocolos`). Encontrei dois bugs que impediam o uso: protocolos que sumiam da fila e um filtro do cidadão que dava erro 500. Também encontrei várias situações em que o servidor ou o cidadão faziam à mão algo que o sistema já sabia, como saber o que está atrasado ou o que depende do cidadão. Tudo que está no plano foi implementado e validado (`docs/IMPLEMENTATION_PLAN.md`).

## Melhorias realizadas

**Para o servidor:**
- **Fila com visões prontas e contadores:** Em aberto, Minha fila, Sem responsável (só para quem pode atribuir), Atrasados, Vencem em 48h e Todos. Em vez de combinar filtros, o servidor clica uma vez e vê o trabalho do dia.
- **Prazo em cada card:** "Atrasado há N dias", "Vence hoje/amanhã", "Prazo pausado". Protocolos atrasados ganham uma borda vermelha.
- **Ordenação padrão pelo prazo mais próximo**, com opção de mais recentes ou mais antigos.
- **Paginação real.** Antes só apareciam os 50 mais recentes e os mais antigos, que normalmente são os mais atrasados, ficavam invisíveis.
- **Filtros na URL:** o "voltar" do detalhe preserva a fila, os links da home abrem já filtrados e dá para compartilhar um link filtrado com um colega.
- **Busca com debounce** (uma requisição quando o usuário para de digitar), botão "Limpar filtros", estado de erro com "Tentar novamente" e o card inteiro clicável.
- **"Sua fila hoje" na home**, para qualquer servidor com acesso a protocolos (antes só o ADMIN via algo parecido): contadores clicáveis e os 5 protocolos em aberto com prazo mais próximo, com link direto para o detalhe. Os cards "Pendentes" e "Concluídos" agora abrem a fila já filtrada.
- **Detalhe do protocolo mais rápido e estável:** as 8 requisições rodam em paralelo (antes rodavam uma depois da outra). Depois de uma ação (upload, pendência, etapa), a tela atualiza em segundo plano, sem trocar tudo por um spinner nem perder a aba aberta.

**Para o cidadão:**
- Os filtros e rótulos agora usam os status que existem de verdade no sistema: Recebido, Em Andamento, Com Pendência, Concluído e Cancelado.
- **Aviso "N solicitações aguardam uma ação sua"** com o filtro **Aguardando você**. O cidadão não precisa mais abrir protocolo por protocolo para descobrir se falta algum documento.
- Os contadores do topo vêm do servidor e não mudam mais quando a lista é filtrada.

## Arquivos e áreas alteradas

- Backend: `services/protocol-access.service.ts` (novas funções `buildProtocolScopeWhere` e `buildQueueViewConditions`), `routes/protocols-simplified.routes.ts` (`GET /` e o novo `GET /queue-summary`), `routes/citizen-protocols.ts` (`GET /`).
- Frontend: `app/admin/protocolos/page.tsx`, `app/admin/page.tsx`, `app/admin/protocolos/[id]/page.tsx`, `app/cidadao/protocolos/page.tsx`, `app/cidadao/protocolos/[id]/page.tsx`, `components/citizen/CitizenProtocolHeader.tsx`, `hooks/useCitizenProtocols.ts`, `lib/protocol-helpers.ts`.
- Teste: `backend/__tests__/unit/protocol-access-scope.test.ts`.

## Problemas corrigidos

- **P1:** protocolos além dos 50 mais recentes ficavam invisíveis na fila.
- **P1:** o filtro "Em Andamento" do cidadão enviava `EM_ANDAMENTO`, que não existe no enum, e o backend respondia 500.
- **P1:** os status `PROGRESSO`, `ATUALIZACAO` e `PENDENCIA` apareciam crus para o cidadão, e o contador "Em andamento" ficava sempre em 0.
- **P1:** os contadores do cidadão mudavam conforme o filtro aplicado.
- **P1:** o link da home para um protocolo caía na fila sem filtro.
- **P2:** `limit` sem teto (agora no máximo 100, em ambas as listagens), `status` inválido gerava 500 (agora retorna 400), `CANCELADO` aparecia sem rótulo e o botão "Mais Filtros" não fazia nada (virou o seletor de ordenação).
- **P3:** removi código morto da fila: o diálogo legado de atribuição, o diálogo de detalhes que nunca abria e a função `updateStatus` sem uso.

## UX/UI

- A fila abre por padrão em **"Em aberto"**. Concluídos e cancelados ficam em "Todos". É uma mudança deliberada: a tela é uma fila de trabalho.
- As visões ficam num scroll horizontal no celular. A grade de filtros usa 1, 2 ou 4 colunas conforme a largura. A paginação e as ações continuam acessíveis no celular.
- Mensagens de lista vazia mudam conforme a visão (por exemplo, "Nenhum protocolo atrasado") e têm atalho para "Ver todos".

## Backend e banco

- Nenhuma migration. Só consultas novas sobre campos e índices que já existem (`status`, `departmentId`, `ProtocolSLA`).
- O atraso é calculado na hora pelo `ProtocolSLA` (`expectedEndDate < agora`, não pausado, não encerrado), sem depender do job diário das 06:00.
- Mudanças aditivas no contrato: `sla` em cada protocolo, `summary` na listagem do cidadão e os parâmetros `view`, `sort` e `awaiting`. Sem esses parâmetros, as rotas se comportam como antes, exceto pelo teto de `limit`. Conferi que nenhuma tela pede mais de 100 itens em `/protocols`.

## Segurança

- A regra de escopo da listagem estava duplicada dentro da rota. Agora ela vem de `buildProtocolScopeWhere`, no mesmo serviço de `canAccessProtocol`. Um teste garante que as duas regras sempre concordam para USER, COORDINATOR, MANAGER (com e sem departamento), ADMIN, SUPER_ADMIN e roles desconhecidos (que não veem nada).
- O `queue-summary` usa o mesmo escopo: um USER só conta os protocolos atribuídos a ele.
- O teto de `limit` impede consultas gigantes.

## Performance e infraestrutura

- Detalhe do protocolo: de 8 requisições em série para 1 rodada em paralelo.
- Fila: de uma requisição por tecla digitada para uma após 400 ms sem digitar.
- `queue-summary`: 6 `count` em paralelo, todos sobre índices existentes.
- Nenhuma dependência, container ou serviço novo.

## Testes executados

| Comando | Resultado |
|---|---|
| `npx tsc -p tsconfig.docker.json --noEmit` (backend) | ✅ sem erros |
| `npx jest --preset ts-jest __tests__/unit/protocol-access-scope.test.ts` | ✅ 9/9 |
| `npx tsc --noEmit` (frontend) | ✅ nenhum erro nos arquivos alterados. 1 erro **preexistente** em `components/common/DocumentScanner.tsx`, arquivo não tocado |
| Postgres 16 efêmero (`prisma db push`) com dados sintéticos, rodando as consultas reais das visões para ADMIN, MANAGER e USER e o resumo do cidadão | ✅ Atrasados excluem SLA pausado e protocolos encerrados, o escopo por role está correto, a ordenação por prazo deixa os protocolos sem SLA no fim, e o `groupBy` e a contagem "aguardando" estão corretos. O container foi removido depois |
| `npx next build` (frontend) | ✅ exit 0. `/admin/protocolos` e `/cidadao/protocolos` compilam. As mensagens "Dynamic server usage" das rotas `/api/super-admin/email-server/*` são preexistentes e não bloqueiam |

## Itens bloqueados

Nenhum.

## Riscos restantes

- Não testei no navegador com login real, porque não havia um ambiente completo (backend + banco com seed) rodando localmente. A validação foi feita com tipos, testes, consultas num banco real e o build.
- Protocolos sem `ProtocolSLA` não aparecem em "Atrasados" nem em "Vencem em 48h". É o comportamento correto (sem prazo definido), mas vale conferir se todos os serviços geram SLA.

## Próximas melhorias recomendadas

- Aplicar o mesmo padrão (visões, prazo, URL) às listas de protocolos dos módulos de secretaria (`useProtocols`, `useServiceProtocols` e as telas de TFD). As telas de TFD enviam um parâmetro `moduleType` que o backend ignora hoje, o que é um bug preexistente fora deste escopo.
- Adicionar `@types/jest` e um `jest.config` ao backend. Hoje não havia nenhum teste unitário configurado, então usei `@jest/globals` e `--preset ts-jest`.

---

# Rodada 2 — varredura da aplicação inteira

## Resumo

A primeira rodada cobriu só o fluxo de protocolos. Esta cobriu a aplicação toda com varreduras automáticas:
- contrato frontend × backend: 969 chamadas contra 1.630 rotas;
- alcance das 281 páginas pelo grafo de imports;
- autenticação de todas as rotas;
- rotas sombreadas pela ordem de declaração;
- tokens de cidadão aceitos em rotas administrativas.

Cada achado foi confirmado no **backend real**, rodando sobre Postgres e Redis efêmeros, antes de ser corrigido. As três decisões de negócio (acesso aos apps, busca de familiar, indicadores das secretarias) foram tomadas por você.

## Segurança (P0)

| Antes | Depois |
|---|---|
| Qualquer pessoa sem login lia dados clínicos em `/api/saude/*` | só a equipe da Saúde e ADMIN |
| Certificados digitais listados, emitidos, revogados e usados para assinar sem login | exigem login; emitir e revogar exige ADMIN |
| Cidadão logado lia solicitações de TFD de outros pacientes e o estoque da farmácia | só a equipe da Saúde |
| Cidadão lia os dados do formulário do protocolo de outro cidadão | só o próprio (servidor, pelo escopo do perfil) |
| Documento externo devolvia CPF e e-mail do cidadão e o arquivo sem login | exige login; cidadão só o próprio |
| Templates de e-mail da plataforma e fluxos do bot sem proteção adequada | SUPER_ADMIN / ADMIN |
| Erros do banco (consulta, tabelas, tenant) enviados ao navegador | mensagem genérica em produção; detalhe só no log |

## Permissões (decisão sua)

Os apps das secretarias passaram de "só ADMIN" para **equipe do próprio departamento + ADMIN**. Contam o departamento principal e os vínculos ativos em `UserDepartment`. O menu segue a mesma regra, mostrando ao servidor apenas as suas secretarias.

## Funcionalidades que não funcionavam

- **24 endpoints inalcançáveis** por ordem de rotas: sugestões de serviço do cidadão, exportação dos módulos das secretarias, agenda do gabinete, checagens de protocolo, filas e estatísticas do TFD, logs do sistema.
- **TFD**:
  - o painel e as filas de análise documental, regulação e gestão estavam ligados a rotas inexistentes;
  - agora a decisão é gravada, com responsável, parecer, prioridade e valor;
  - quando o analista devolve por documento faltante, o cidadão recebe a pendência no portal.
- **Painéis das 11 secretarias**:
  - antes mostravam zeros e indicadores sem fonte de dados;
  - agora mostram os indicadores reais do app de cada uma e os protocolos em aberto, com link para a fila já filtrada.
- **Links da fila**: 22 botões "Protocolos Pendentes" e os links vindos do gabinete e da ficha do cidadão usavam filtros que a fila não entendia. Agora são reconhecidos.
- **Vínculos de cidadão** no detalhe do protocolo apontavam para uma rota inexistente.
- **"Adicionar membro da família"**:
  - só aceita CPF completo;
  - o nome e o CPF aparecem mascarados;
  - há limite de 20 buscas por hora;
  - quando o CPF não é encontrado, a tela sugere o convite por e-mail.

## Testes executados (rodada 2)

| Verificação | Resultado |
|---|---|
| `tsc -p tsconfig.docker.json` (backend) | ✅ |
| `tsc --noEmit` (frontend) | ✅ exceto 1 erro preexistente (`DocumentScanner.tsx`) |
| `jest __tests__/unit` | ✅ 17/17 (escopo de protocolo, sanitização de erro, acesso por departamento) |
| Rotas sensíveis sem login | ✅ todas → 401; rotas públicas seguem abertas |
| Matriz de acesso: ADMIN, médico, secretário e servidor de Cultura, servidor com 2 secretarias, cidadão × 10 rotas | ✅ |
| Fluxo TFD ponta a ponta | ✅ |
| Busca de familiar (nome, CPF inválido, CPF de outro, o próprio CPF, limite de uso) | ✅ |
| Varredura de rotas sombreadas | ✅ 0 restantes |
| `next build` | ✅ exit 0 |

## Riscos restantes

- Os indicadores dos apps de secretaria dependem de cada app ter dados cadastrados. Se o carregamento falhar, o cartão mostra "—" em vez de 0.
- Criar uma pendência enfileira uma notificação no Redis; se o Redis cair, a requisição fica presa até ele voltar.
- A aprovação da gestão no TFD aceita qualquer servidor da Saúde. Definir quem é o "gestor" é decisão de negócio.

## Próximas melhorias

- Revisar, caso a caso, os ~300 arquivos do frontend sem uso aparente.
- Montar ou remover as rotas de `routes/index.ts`, que nunca é carregado (inclui categorias de cidadão).
- Continuar a varredura por fluxo em e-mail, bot, super-admin e portal do cidadão.
