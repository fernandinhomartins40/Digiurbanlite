# Plano de Implementação

## Resumo da aplicação

DigiUrban é uma plataforma de governo digital municipal multi-tenant (monorepo): backend Express 5 + Prisma/PostgreSQL (`digiurban/backend`), frontend Next.js 14 App Router (`digiurban/frontend`), Messages Server (Socket.IO + bot), SMTP. O fluxo central do produto é o **protocolo**: o cidadão solicita um serviço (portal `/cidadao` ou bot), o protocolo cai na fila da secretaria, servidores (`USER`/`COORDINATOR`/`MANAGER`/`ADMIN`) tratam etapas, pendências, documentos e concluem. SLA por protocolo (`ProtocolSLA`) é mantido por serviço e por um job diário.

**Rodada 1** concentrou-se nos dois lados do fluxo principal: a fila de trabalho do servidor e o acompanhamento pelo cidadão.

**Rodada 2** (seção "Varredura da aplicação inteira" no fim deste documento) cobriu a aplicação toda com varreduras automáticas:
- rotas do backend × chamadas do frontend (1.455 rotas, 969 chamadas);
- alcance das 281 páginas pelo grafo de imports;
- rotas sem autenticação;
- rotas sombreadas por ordem de declaração;
- tokens de cidadão aceitos em rotas administrativas;
- vazamento de erro interno.

## Principais problemas encontrados

| Prioridade | Problema | Evidência |
|---|---|---|
| P1 | Fila de protocolos mostra só os 50 mais recentes; não há paginação na tela — protocolos antigos (justamente os mais atrasados) ficam **invisíveis** | `GET /api/protocols` pagina com `limit=50`; `app/admin/protocolos/page.tsx` ignora `pagination` |
| P1 | Filtro "Em Andamento" do cidadão envia `status=EM_ANDAMENTO`, que não existe no enum `ProtocolStatus` → erro 500 e toast de erro | `app/cidadao/protocolos/page.tsx`, `routes/citizen-protocols.ts` repassa `status` sem validar |
| P1 | Status reais `PROGRESSO`, `ATUALIZACAO`, `PENDENCIA` aparecem crus ("PROGRESSO") no portal do cidadão; contador "Em andamento" sempre 0 | `useCitizenProtocols.ts` conta `EM_ANDAMENTO`/`AGUARDANDO_DOCUMENTOS` |
| P1 | Contadores do cidadão são calculados sobre a lista já filtrada — ao filtrar "Concluído", o total muda para o nº de concluídos | `useCitizenProtocols.ts` |
| P1 | Link "Protocolos que pedem atenção" da home vai para `/admin/protocolos?search=NUM`, mas a fila não lê a URL → cai na lista sem filtro | `app/admin/page.tsx` |
| P2 | Fila não mostra prazo/atraso (SLA existe no banco); servidor precisa abrir protocolo por protocolo para saber o que está vencendo | `ProtocolSLA` não incluído na listagem |
| P2 | Busca dispara uma requisição por tecla e refiltra no cliente | `app/admin/protocolos/page.tsx` |
| P2 | Botão "Mais Filtros" não faz nada; status `CANCELADO` sem rótulo/cor | idem |
| P2 | Detalhe do protocolo carrega 8 requisições em série; qualquer ação (upload, pendência) troca a tela inteira por spinner e perde a aba/rolagem | `app/admin/protocolos/[id]/page.tsx` |
| P2 | `limit` da listagem sem teto (pode pedir 1.000.000 linhas) e `status` sem validação (500 em valor inválido) | `routes/protocols-simplified.routes.ts` |
| P3 | Código morto na fila: diálogo de atribuição legado, diálogo de detalhes inalcançável, `updateStatus` não usado | `app/admin/protocolos/page.tsx` |

## Oportunidades de melhoria

| ID | TIPO | SITUAÇÃO ATUAL | OPORTUNIDADE | ESFORÇO ELIMINADO | BENEFÍCIO | SOLUÇÃO | PRIORIDADE | RISCO | TESTE | STATUS |
|---|---|---|---|---|---|---|---|---|---|---|
| OP-01 | ANTECIPAR | Servidor abre a fila e vê lista cronológica sem prazo; precisa caçar o que está atrasado | Visões prontas da fila com contagem: **Em aberto · Minha fila · Sem responsável · Atrasados · Vencem em 48h · Todos** | Abrir protocolo a protocolo para ver prazo; combinar filtros manualmente | Trabalho do dia fica óbvio em 1 clique | `view=` + `GET /api/protocols/queue-summary` escopado pela mesma regra de acesso | P1 | Baixo (só leitura) | type-check + teste de escopo | DONE |
| OP-02 | ANTECIPAR | Card do protocolo não indica prazo | Selo "Atrasado há N dias" / "Vence em N dias" / "SLA pausado" | Abrir o detalhe para ver SLA | Prioriza visualmente | `sla` incluído na listagem | P2 | Baixo | visual | DONE |
| OP-03 | ELIMINAR | Ordem fixa por mais recentes | Ordenar por **prazo mais próximo** / mais antigos | Rolar/paginar procurando o mais urgente | Fila de trabalho real | `sort=due|oldest|recent` | P2 | Baixo | type-check | DONE |
| OP-04 | JUNTAR | Filtros vivem só em memória; links da home não filtram | Filtros na URL (compartilhável, sobrevive ao "voltar") | Refazer filtros ao voltar do detalhe | Links diretos da home e entre colegas funcionam | `useSearchParams` + `router.replace` | P1 | Baixo | navegação | DONE |
| OP-05 | ANTECIPAR | Home só mostra "protocolos que pedem atenção" para ADMIN, e a lista é "os 5 mais recentes" | Painel "Sua fila hoje" para qualquer servidor com os contadores (atrasados, vencendo, sem responsável) e os 5 com prazo mais próximo, com link direto ao detalhe | Ir à fila e filtrar | Servidor começa o dia sabendo o que fazer | reutiliza OP-01 | P1 | Baixo | visual | DONE |
| OP-06 | ANTECIPAR | Cidadão não sabe que um protocolo depende dele, a não ser que abra cada um | Aviso "N solicitações aguardam uma ação sua" + filtro **Aguardando você** | Abrir protocolo por protocolo | Menos protocolos parados por pendência não vista | `awaiting=true` + `summary` no `GET /api/citizen/protocols` | P1 | Baixo | type-check | DONE |
| OP-07 | ELIMINAR | Detalhe recarrega a tela inteira após cada ação | Recarregamento silencioso (mantém aba/rolagem) e carregamento paralelo | Esperar spinner e reencontrar a aba | Tela mais rápida e estável | `Promise.allSettled` + spinner só no 1º carregamento | P2 | Baixo | type-check | DONE |

## Plano de execução

| ID | PRIORIDADE | PROBLEMA | SOLUÇÃO | ARQUIVOS/ÁREAS | RISCO | TESTE | STATUS |
|---|---|---|---|---|---|---|---|
| B-01 | P1 | Regra de escopo da listagem duplicada inline | `buildProtocolScopeWhere()` em `protocol-access.service.ts` (mesma semântica de `canAccessProtocol`) | backend services | Baixo | teste unitário | DONE |
| B-02 | P1 | Listagem sem visões/ordenação/SLA, `limit` sem teto, `status` sem validação | `view`, `sort`, `status` validado (aceita lista), `limit ≤ 100`, `sla` no include | `routes/protocols-simplified.routes.ts` | Baixo | type-check | DONE |
| B-03 | P1 | Sem contadores da fila | `GET /api/protocols/queue-summary` | idem | Baixo | type-check | DONE |
| B-04 | P1 | Cidadão: status inválido → 500; sem resumo nem "aguardando você" | validação/lista de status, `awaiting`, `summary`, teto de `limit` | `routes/citizen-protocols.ts` | Baixo | type-check | DONE |
| F-01 | P1 | Fila sem paginação, filtros fora da URL, busca por tecla, CTA morto | Reescrita da página com visões, SLA, ordenação, paginação, debounce, estado de erro | `app/admin/protocolos/page.tsx` | Médio (tela principal) | type-check + build | DONE |
| F-02 | P1 | Home do servidor | "Sua fila hoje" + métricas com links filtrados | `app/admin/page.tsx` | Baixo | type-check | DONE |
| F-03 | P1 | Portal do cidadão com status inexistentes | Chips e rótulos pelos status reais, resumo do servidor, "Aguardando você" | `app/cidadao/protocolos/page.tsx`, `hooks/useCitizenProtocols.ts`, `CitizenProtocolHeader.tsx`, detalhe do cidadão | Baixo | type-check | DONE |
| F-04 | P2 | Detalhe com carregamento em série e spinner em toda ação | carregamento paralelo + refresh silencioso | `app/admin/protocolos/[id]/page.tsx` | Baixo | type-check | DONE |

## Ordem de implementação

1. B-01 → B-02 → B-03 (contrato do backend; retrocompatível — sem `view`/`sort` o comportamento é o anterior, exceto teto de `limit`).
2. F-01 → F-02 (consomem o novo contrato).
3. B-04 → F-03 (cidadão).
4. F-04 (detalhe).
5. Type-check backend (`tsc -p tsconfig.docker.json`) e frontend, testes unitários do backend, build do frontend.

## Itens que não serão alterados

- Regras de transição de status (`protocol-status.engine`/`protocol-status.config.ts`) — mudança seria de regra de negócio.
- Regra de cancelamento pelo cidadão no backend (sem interação do servidor e sem pendência aberta) — preservada; o frontend só deixa de esconder o botão em `PROGRESSO`, e o backend continua decidindo.
- Home do cidadão (chat/bot), apps de secretaria, e-mail, bot, SMTP — fora do fluxo analisado nesta rodada.
- Endpoints existentes mantêm o formato de resposta (`protocols` + `pagination`); campos novos são aditivos.

## Bloqueios reais

Nenhum.

---

# Varredura da aplicação inteira (rodada 2)

## Método

| Varredura | Cobertura | Ferramenta |
|---|---|---|
| Contrato frontend → backend | 969 chamadas × 1.630 rotas (backend + rotas Next + Messages Server) | script sobre `index.ts`, sub-roteadores e chamadas `fetch`/`apiRequest`/`axios` |
| Alcance de código | 983 arquivos do frontend, a partir das 281 páginas | grafo de imports |
| Autenticação | todas as rotas montadas | middleware no arquivo, no pai e em cada rota |
| Rotas sombreadas | 115 arquivos de rota | `/:param` declarado antes de rota literal equivalente |
| Token de cidadão em rota administrativa | rotas com `authenticateToken` | teste real com token de cidadão |
| Validação | backend real + Postgres 16 + Redis 7 efêmeros | `curl` com JWT de cada perfil |

## Problemas encontrados e tratados

| ID | PRIORIDADE | PROBLEMA | SOLUÇÃO | ARQUIVOS/ÁREAS | TESTE | STATUS |
|---|---|---|---|---|---|---|
| S-01 | P0 | `/api/saude/*` (consulta, prescrições, vacinas, fila, triagem) respondia **sem login** | exige login; depois restrito à equipe da Saúde (S-08) | `routes/saude/index.ts` | anônimo → 401 | DONE |
| S-02 | P0 | `/api/certificates` listava, emitia, revogava e assinava **sem login** | login obrigatório; emitir/revogar/aprovar exige ADMIN | `certificates.routes.ts` | USER → 403 ao emitir | DONE |
| S-03 | P0 | `/api/email-templates` sem autenticação | `superAdminAuth` | `email-templates.ts` | 401 | DONE |
| S-04 | P0 | documento externo devolvia CPF/e-mail e o arquivo sem login | login; cidadão só o próprio documento | `external-documents.routes.ts` | outro cidadão → 404 | DONE |
| S-05 | P0 | **token de cidadão** lia TFD de outros pacientes e o estoque da farmácia | `requireDepartmentAccess('SAUDE')` | `saude-tfd`, `saude-farmacia` | cidadão → 401 | DONE |
| S-06 | P0 | cidadão lia os campos do formulário do protocolo de outro | verificação de acesso (servidor por escopo, cidadão só o próprio) | `protocol-data-fields.ts` | outro cidadão → 404 | DONE |
| S-07 | P1 | cidadão listava e editava os fluxos do bot | ADMIN | `admin-flows.routes.ts` | 401/403 | DONE |
| S-08 | P1 | apps das secretarias só aceitavam ADMIN (a equipe da secretaria recebia 403); menu mostrava todas as secretarias | **decisão:** equipe do próprio departamento (principal + `UserDepartment`) + ADMIN; menu filtrado igual | `middleware/department-access.ts`, 19 roteadores, `AdminNavigationMenu` | matriz 5 perfis × 10 rotas; 5 testes unitários | DONE |
| S-09 | P1 | erros do Prisma (consulta, tabelas, tenantId) iam ao cliente em cerca de 490 pontos | middleware que oculta o detalhe em produção e registra no log; `errorFormat: minimal` | `sanitize-error-response.ts`, `lib/prisma.ts` | produção → mensagem genérica; 3 testes | DONE |
| S-10 | P2 | `analytics/realtime`, `signatures/document/:id` e `department-stats` sem login ou aceitando cidadão | login de servidor | rotas citadas | 401 | DONE |
| F-10 | P1 | 24 endpoints nunca alcançados (rota com `:param` declarada antes) | reordenação via AST do TypeScript (só movimentação) | 11 roteadores | varredura → 0; endpoints respondem | DONE |
| F-11 | P1 | TFD: painel e 3 filas ligados a rota inexistente/filtro ignorado; nenhuma decisão gravada | religadas ao fluxo `SolicitacaoTFD`; devolução cria pendência para o cidadão | TFD (backend + 6 telas) | fluxo ponta a ponta | DONE |
| F-12 | P1 | estatísticas de TFD sem período → "Invalid Date" | padrão de 30 dias | `saude-tfd.routes.ts` | 200 | DONE |
| F-13 | P1 | vínculos de cidadão no detalhe do protocolo → rota inexistente | `/api/protocols/:id/citizen-links` | `useCitizenLinks.ts` | — | DONE |
| F-14 | P1 | 11 painéis de secretaria mostravam 0 (endpoints inexistentes) e cartões sem fonte de dados | **decisão:** indicadores reais do app de cada secretaria + protocolos em aberto (`SecretariaKpiCards`) | 11 páginas, 7 hooks, `department-stats.ts` (busca pelo `code`) | endpoints reais | DONE |
| F-15 | P1 | 22 links "Protocolos Pendentes" das secretarias usavam `status=pending` (inexistente) | fila entende filtros de contexto (`departamento`, `department`, `citizenId`) e traduz convenções antigas (`overdue`, `unassigned`, `priority=high`) | `admin/protocolos/page.tsx`, filtros `departmentCode`/`citizenId` no backend | escopo não vaza entre secretarias | DONE |
| F-16 | P1 | "Adicionar membro da família" nunca funcionou (busca inexistente) | **decisão:** só CPF completo e válido; devolve nome e CPF mascarados; 20 buscas/hora por cidadão; nunca por nome | `citizen-family.ts`, `AddFamilyMemberDialog.tsx` | nome → 400; CPF → mascarado; 21ª → 429 | DONE |
| F-17 | P3 | `syncTFDStatusToProtocol` (dormente) gravava status inexistentes e apagava `customData` | mapeia para `ProtocolStatus` e preserva os dados | `protocol-to-tfd.service.ts` | type-check | DONE |

## Itens registrados e não alterados

- **~300 arquivos do frontend sem import a partir das páginas.** A lista inclui falsos positivos (`robots.ts`, `sitemap.ts`, arquivos carregados dinamicamente), então nada foi apagado. Remover exige revisão caso a caso.
- **`routes/index.ts` nunca é carregado.** Por isso as rotas de categorias de cidadão (`/api/admin/categories`) não existem. A tela que as usa também não é alcançável; fica registrado.
- **Criar pendência depende do Redis (notificação via BullMQ).** Sem Redis a requisição fica pendurada. Em produção o Redis existe, mas vale colocar um timeout na fila.
- **Aprovação da gestão no TFD** aceita qualquer servidor da Saúde. Definir quem é "gestor" é decisão de negócio.
