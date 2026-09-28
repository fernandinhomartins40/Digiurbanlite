# Plano de Implementação

## Resumo da aplicação

DigiUrban é uma plataforma de governo digital municipal multi-tenant (monorepo): backend Express 5 + Prisma/PostgreSQL (`digiurban/backend`), frontend Next.js 14 App Router (`digiurban/frontend`), Messages Server (Socket.IO + bot), SMTP. O fluxo central do produto é o **protocolo**: o cidadão solicita um serviço (portal `/cidadao` ou bot), o protocolo cai na fila da secretaria, servidores (`USER`/`COORDINATOR`/`MANAGER`/`ADMIN`) tratam etapas, pendências, documentos e concluem. SLA por protocolo (`ProtocolSLA`) é mantido por serviço e por um job diário.

Esta rodada concentrou-se nos dois lados desse fluxo principal: a **fila de trabalho do servidor** e o **acompanhamento pelo cidadão**. Os 220+ outros módulos (apps de secretaria, saúde, e-mail, bot etc.) não foram alterados.

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
