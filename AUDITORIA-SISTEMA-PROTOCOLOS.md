# Auditoria Completa — Sistema de Protocolos

**Data:** 2026-07-18
**Escopo:** Núcleo de protocolos do backend (~20.170 linhas): rotas (`protocols-simplified.routes.ts`, `citizen-protocols.ts`, `protocol-documents.ts`, `protocol-sla.ts`, etc.), serviços (`protocol-status.engine.ts`, `protocol-module.service.ts`, `protocol-number.service.ts`, `protocol-sla.service.ts`, `protocolAssignmentService.ts`, `protocol-analytics.service.ts`, `protocol-uniqueness.service.ts`), configuração (`protocol-status.config.ts`) e schema Prisma.
**Método:** Leitura integral dos arquivos críticos + verificação cruzada de chamadores (grep) para confirmar cada achado. Nenhuma alteração de código foi feita.

---

## Resumo Executivo

| Severidade | Qtde | Tema dominante |
|---|---|---|
| 🔴 Crítico | 8 | Exposição de dados sem auth, injeção de HTML em PDF, race/colisão de numeração, inconsistência transacional na aprovação |
| 🟠 Alto | 12 | Matriz de permissões furada (roles hardcoded), rotas sem escopo (LGPD), SLA sem automação, rota morta, delegação invisível |
| 🟡 Médio | 14 | Autoria perdida no histórico, e-mail de pagamento "fake", browser leak no PDF, fail-open na unicidade |
| ⚪ Baixo | 6 | Logs com PII, código morto, ações de histórico inconsistentes |

O sistema tem uma boa fundação (motor centralizado de status, lock de numeração, extension multi-tenant, pendências bem modeladas), mas **o motor de status é rotineiramente contornado** — por rotas que atualizam status direto no Prisma e por serviços que "hardcodam" roles para passar na validação — e **várias rotas de leitura não têm escopo de permissão**, expondo dados de cidadãos a qualquer servidor autenticado.

---

## 🔴 Achados Críticos

### C1. Download de documentos de protocolo SEM autenticação
`GET /api/protocols/:protocolId/documents/:documentId/download` ([protocol-documents.ts:345](digiurban/backend/src/routes/protocol-documents.ts#L345)) não tem `adminAuthMiddleware` nem `citizenAuthMiddleware` — o comentário admite: *"Rota pública para permitir visualização em `<img>` e `<iframe>`"*. Ainda seta `Access-Control-Allow-Origin: *`.
**Impacto:** qualquer pessoa com a URL (que vaza em logs, histórico de navegador, Referer) baixa documentos pessoais de cidadãos (RG, comprovantes, laudos). Os IDs são cuids (difíceis de adivinhar), mas isso é segurança por obscuridade sobre dado sensível — violação direta da LGPD.
**Correção:** autenticar a rota (cookie funciona em `<img>`/`<iframe>` same-origin) ou emitir URLs assinadas com expiração.

### C2. Injeção de HTML nos PDFs de relatório e timeline
`GET /:id/report` e `GET /:id/timeline/export` ([protocols-simplified.routes.ts:2037](digiurban/backend/src/routes/protocols-simplified.routes.ts#L2037) e [:2312](digiurban/backend/src/routes/protocols-simplified.routes.ts#L2312)) interpolam `protocol.title`, nome do cidadão, mensagens de interação (`interaction.message` — texto livre digitado pelo cidadão), `stage.notes`, nomes de arquivo etc. **direto no HTML** renderizado pelo Playwright, sem escape.
**Impacto:** um cidadão que digite `<script>`/`<img src=...>` numa mensagem executa conteúdo no Chromium headless do servidor (possível SSRF/exfiltração via requests do browser) e corrompe o PDF oficial.
**Correção:** escapar todo conteúdo dinâmico (`escapeHtml`) e rodar o Chromium com bloqueio de rede externa.

### C3. Colisão de número de protocolo entre tenants
`ProtocolSimplified.number` é `@unique` **global** ([schema.prisma:1006](digiurban/backend/prisma/schema.prisma#L1006)), mas a numeração é sequencial **por tenant** ([protocol-number.service.ts:74-81](digiurban/backend/src/services/protocol-number.service.ts#L74-L81)).
**Impacto:** quando o município B chegar a um número que o município A já usou (ex.: `2026-000042`), toda criação de protocolo do B falha com violação de unique — travamento progressivo e inevitável do segundo tenant.
**Correção:** migrar para `@@unique([tenantId, number])` (e ajustar `findUnique({ where: { number } })` para `findFirst`).

### C4. Race condition real na geração de número fora de transação
O lock `FOR UPDATE` só vale dentro da transação em que foi adquirido. Quatro chamadores geram o número **fora** da transação de criação: [citizen-protocols.ts:564](digiurban/backend/src/routes/citizen-protocols.ts#L564), [departments-tickets.ts:227](digiurban/backend/src/routes/departments-tickets.ts#L227), [tab-modules.ts:1435](digiurban/backend/src/routes/tab-modules.ts#L1435), [protocol-simplified.service.ts:196](digiurban/backend/src/services/protocol-simplified.service.ts#L196). O lock é liberado no commit interno de `generateProtocolNumberSafe()`, **antes** do insert — duas requisições simultâneas calculam o mesmo número e a segunda quebra com erro de unique (500 para o cidadão). Além disso, com a tabela vazia não há linha para lockar (os dois primeiros protocolos do tenant podem colidir), e o `ORDER BY "createdAt" DESC` pega o último **criado**, não o maior número.
**Correção:** passar `tx` em todos os chamadores (como o `protocol-module.service` já faz) ou trocar por sequence/contador atômico por tenant; ordenar por `number DESC`.

### C5. Criação de protocolo do cidadão não é transacional
`POST /api/citizen/protocols` ([citizen-protocols.ts:435-689](digiurban/backend/src/routes/citizen-protocols.ts#L435-L689)) cria protocolo → move arquivos → histórico → interação → documentos → **workflow (lança erro se não existir)** → **SLA (lança erro se falhar)** — tudo fora de transação. Se o workflow não existe, a rota responde 500 mas o protocolo **já existe** no banco, sem workflow nem SLA.
**Impacto:** protocolo órfão invisível para o fluxo de atendimento; pior: como a validação de unicidade conta protocolos ativos, **o cidadão fica bloqueado de tentar de novo** ("já existe protocolo ativo").
**Agravante:** esse mesmo caminho difere do `protocolModuleService.createProtocolWithModule` (usado pelo admin, citizen-services e bot), que **auto-gera** workflow em vez de falhar — dois canais, duas regras.

### C6. Aprovação de protocolo COM_DADOS pode ativar a entidade sem concluir o protocolo
`approveProtocol` ([protocol-module.service.ts:435-512](digiurban/backend/src/services/protocol-module.service.ts#L435-L512)) executa em **duas transações separadas**: (1ª) marca `customData._meta.status='ACTIVE'` + materializa no Registry; (2ª) chama o engine com `VINCULADO/PROGRESSO → CONCLUIDO`. Mas o engine **bloqueia** `VINCULADO → CONCLUIDO` para COM_DADOS ([protocol-status.engine.ts:200](digiurban/backend/src/services/protocol-status.engine.ts#L200)).
**Impacto:** aprovar um COM_DADOS ainda em VINCULADO ativa e materializa a entidade, depois estoura exceção — entidade ATIVA no Registry com protocolo não concluído. Estado inconsistente permanente (a materialização é idempotente, mas a ativação do `_meta` não é revertida).
**Correção:** validar a transição ANTES de tocar no customData, ou englobar tudo numa única transação.

### C7. Falta de checagem de posse + spoofing de ator na mudança de status
`PATCH /:id/status` ([protocols-simplified.routes.ts:860-905](digiurban/backend/src/routes/protocols-simplified.routes.ts#L860-L905)):
- Aceita `userId` do **body** e usa como `actorId` (`actorId: userId || authReq.user.id`) — o histórico registra outro usuário como autor (spoofing de auditoria).
- Não verifica se o protocolo pertence ao departamento/atribuição do usuário — um USER de qualquer secretaria altera status de qualquer protocolo do município (o engine valida transição por role, não posse).
`POST /:id/comments` ([:1003](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1003)) tem o mesmo problema (`userId` do body, sem posse).

### C8. `POST /:id/complete` bypassa completamente o motor de status
[protocols-simplified.routes.ts:1451-1536](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1451-L1536) faz `prisma.protocolSimplified.update({ status: CONCLUIDO })` direto: sem validação de transição (conclui COM_DADOS em VINCULADO, conclui CANCELADO), **sem registrar `ProtocolHistorySimplified`** (só interaction), sem notificações do engine, sem completar SLA, sem materialização no Registry. Qualquer USER, sobre qualquer protocolo.

---

## 🟠 Achados Altos

### A1. Matriz de transições não tem COORDINATOR nem MANAGER — e o código contorna com roles falsos
`TRANSITION_MATRIX` ([protocol-status.config.ts:20-75](digiurban/backend/src/config/protocol-status.config.ts#L20-L75)) define apenas CITIZEN, USER, ADMIN e SUPER_ADMIN. `isTransitionAllowed` retorna `false` para MANAGER/COORDINATOR (matrix undefined). Consequência: as rotas exigem `requireMinRole(MANAGER)` para aprovar, mas o engine negaria MANAGER — então os serviços **hardcodam o role**: `approveProtocol`/`rejectProtocol` passam `actorRole: UserRole.USER` ([protocol-module.service.ts:494](digiurban/backend/src/services/protocol-module.service.ts#L494)) e o orquestrador passa `UserRole.ADMIN` ([protocol-workflow-orchestrator.service.ts:296,344](digiurban/backend/src/services/protocol-workflow-orchestrator.service.ts#L344)).
**Impacto:** a matriz de permissões é fictícia — auditoria registra role errado, e a real permissão vem de quem chamou com qual constante. Um ADMIN que aprova é registrado como USER; um USER que completa a última etapa conclui com força de ADMIN.

### A2. Rotas de leitura sem escopo de permissão (LGPD)
Todas exigem apenas login admin (qualquer role, até GUEST na hierarquia), sem restrição por departamento/atribuição:
- `GET /department/:departmentId` ([:78](digiurban/backend/src/routes/protocols-simplified.routes.ts#L78)) — protocolos de qualquer secretaria, com CPF/email
- `GET /citizen/:citizenId` ([:166](digiurban/backend/src/routes/protocols-simplified.routes.ts#L166)) — todos os protocolos de qualquer cidadão
- `GET /workload-stats` ([:43](digiurban/backend/src/routes/protocols-simplified.routes.ts#L43)), `GET /stats/:departmentId` ([:1384](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1384))
- `GET /by-number/:number` ([:1417](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1417)) — inclui histórico e avaliações
- `GET /:id/history` ([:1316](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1316)), `GET /:id/assignments` ([:1247](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1247))
- `GET /:id/report` ([:1882](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1882)) — dossiê completo (CPF, endereço, documentos, dados de saúde em customData) para qualquer USER
Isso contradiz o próprio `GET /:id`, que valida posse para USER e departamento para MANAGER ([:751-763](digiurban/backend/src/routes/protocols-simplified.routes.ts#L751-L763)).

### A3. Escopo por role furado na listagem principal
`GET /` ([:526-535](digiurban/backend/src/routes/protocols-simplified.routes.ts#L526-L535)): USER vê só os seus, MANAGER vê o departamento — mas **COORDINATOR não cai em nenhum branch e vê o município inteiro** (mais que MANAGER, invertendo a hierarquia). MANAGER sem `departmentId` também vê tudo. Em `GET /secretaria/:departmentId` ([:2563](digiurban/backend/src/routes/protocols-simplified.routes.ts#L2563)), um MANAGER de outra secretaria pede `scope=department` de qualquer `departmentId` — não há verificação `user.departmentId === departmentId`.

### A4. Protocolos delegados/encaminhados ficam invisíveis para o destinatário
Delegação, encaminhamento e atribuição a equipe atualizam **apenas** `currentAssignedUserId` ([protocolAssignmentService.ts:986,1103,1165](digiurban/backend/src/services/protocolAssignmentService.ts#L986)), mas a listagem de USER filtra **apenas** `assignedUserId` ([protocols-simplified.routes.ts:528](digiurban/backend/src/routes/protocols-simplified.routes.ts#L528)) — o delegado não vê o protocolo na sua fila (só a rota `/secretaria/` checa os dois campos). O filtro de query `assignedUserId` do `GET /` também ignora `currentAssignedUserId`.

### A5. SLA sem automação: atrasos nunca são marcados e conclusões não finalizam SLA
- Não existe **nenhum job** que rode `updateSLAStatus` (só endpoint manual por protocolo, [protocol-sla.ts:194](digiurban/backend/src/routes/protocol-sla.ts#L194)). `getOverdueSLAs` filtra `isOverdue: true` — que nada seta periodicamente → dashboards de atraso mostram zero/desatualizado.
- `completeSLA` só é chamado quando o **workflow** conclui ([protocol-workflow-orchestrator.service.ts:351](digiurban/backend/src/services/protocol-workflow-orchestrator.service.ts#L351)). Conclusões via `PATCH /:id/status`, `POST /:id/complete` ou aprovação não finalizam o SLA (fica "ativo" para sempre).
- `getOverdueSLAs`/`calculateSLAStats` recebem `tenantId` e o **ignoram** (`where.protocol = {}` é no-op, [protocol-sla.service.ts:233-234,298-303](digiurban/backend/src/services/protocol-sla.service.ts#L233)); `calculateSLAStats` carrega TODOS os SLAs em memória.
- `processPendingReminders`/`expireStalePendings` existem no pending service mas não há job que os invoque.

### A6. Rota morta: `GET /module/:moduleType/pending` nunca é alcançada
Registrada ([:133](digiurban/backend/src/routes/protocols-simplified.routes.ts#L133)) **depois** de `GET /module/:departmentId/:moduleType` ([:106](digiurban/backend/src/routes/protocols-simplified.routes.ts#L106)). Qualquer `/module/X/pending` casa com a primeira (departmentId=X, moduleType="pending") e retorna lista vazia — a fila de pendentes por módulo está quebrada silenciosamente.

### A7. Injeção de filtros Prisma via query string
`GET /department/:departmentId` passa `req.query as any` direto para `listByDepartment`, que faz `where: { departmentId, ...filters }` ([protocol-simplified.service.ts:334-339](digiurban/backend/src/services/protocol-simplified.service.ts#L334-L339)). Com o parser estendido do Express (`?citizen[cpf][contains]=...`), o cliente injeta filtros Prisma arbitrários (inclusive sobrescrever `departmentId`) ou derruba a query com 500.

### A8. `DELETE /:protocolId/documents/:documentId` está inoperante
[protocol-documents.ts:425](digiurban/backend/src/routes/protocol-documents.ts#L425) usa `requireRole(ADMIN)` **sem** `adminAuthMiddleware` antes — `req.user` nunca é populado, a rota sempre responde 401/403. (Neste router cada rota adiciona o middleware individualmente; esta esqueceu.)

### A9. Cinco caminhos de criação de protocolo com regras divergentes
1. `protocolModuleService.createProtocolWithModule` (admin, citizen-services, bot/internal) — número em transação, geolocalização, workflow auto-gerado, data fields, hooks TFD/apps.
2. `POST /api/citizen/protocols` — número fora de transação, sem geolocalização inteligente, workflow obrigatório (falha), sem data fields, sem hooks.
3. `protocolServiceSimplified.createProtocol` — geocoding próprio, sem workflow/SLA.
4. `departments-tickets.ts` e 5. `tab-modules.ts` — caminhos próprios.
Protocolos "iguais" nascem com comportamentos diferentes conforme o canal — fonte permanente de bugs (C4/C5 são sintomas).

### A10. Segundo caminho de atualização de status fora do engine
`protocolServiceSimplified.updateStatus` ([protocol-simplified.service.ts:251-286](digiurban/backend/src/services/protocol-simplified.service.ts#L251-L286)) atualiza status sem validação/notificação/hooks e continua exportado — junto com C8, contradiz o "ÚNICO PONTO DE ENTRADA" prometido pelo engine.

### A11. Avaliações: duplicáveis, sem autoria e abertas a servidores
`ProtocolEvaluationSimplified.protocolId` não é unique ([schema.prisma:1110-1125](digiurban/backend/prisma/schema.prisma#L1110)) e `evaluateProtocol` não deduplica → o mesmo protocolo pode receber N avaliações (distorce satisfação nos analytics). A rota admin `POST /:id/evaluate` ([protocols-simplified.routes.ts:1343](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1343)) permite que **servidores** avaliem (deveria ser do cidadão), sem registro de quem avaliou.

### A12. Reabertura: sequência não transacional, histórico duplicado e `concludedAt` residual
`POST /:id/reopen` ([:1547-1873](digiurban/backend/src/routes/protocols-simplified.routes.ts#L1547-L1873)) encadeia ~7 escritas fora de transação (falha no meio = estado misto), grava a reabertura **duas vezes** no histórico (engine + entrada manual `REABERTURA`) e é o único lugar que limpa `concludedAt` — um ADMIN que reabre via `PATCH /:id/status` (override permitido) deixa o protocolo ativo **com `concludedAt` preenchido**, poluindo analytics de tempo de conclusão.

---

## 🟡 Achados Médios

- **M1. Numeração não reinicia por ano** — `2025-000042` → em janeiro vira `2026-000043` (formato promete `{ANO}-{SEQ}` mas a sequência é contínua). Decidir e documentar o comportamento.
- **M2. Autoria do cidadão perdida no histórico** — o engine grava `userId: undefined` quando `actorRole === 'CITIZEN'` ([protocol-status.engine.ts:115](digiurban/backend/src/services/protocol-status.engine.ts#L115)); o cancelamento pelo cidadão fica sem autor identificável no histórico (só no metadata).
- **M3. `concludedAt` também é setado em CANCELADO** ([protocol-status.engine.ts:96-98](digiurban/backend/src/services/protocol-status.engine.ts#L96)) — o relatório PDF exibe "Data de Conclusão" para protocolos cancelados.
- **M4. Playwright por requisição, sem fila e com leak** — `/report` e `/timeline/export` lançam um Chromium por request; se `page.pdf()` lançar, `browser.close()` nunca roda (sem `try/finally`). Vetor fácil de esgotamento de memória.
- **M5. `send-payment-info` mente para o usuário** — responde "Informações de pagamento enviadas com sucesso" mas o envio de e-mail é um TODO ([:2487-2494](digiurban/backend/src/routes/protocols-simplified.routes.ts#L2487)); ainda loga a chave PIX no console.
- **M6. `serviceId` ausente vincula o primeiro serviço do banco** — `findFirst({ where: { id: undefined } })` ignora o filtro ([citizen-protocols.ts:528](digiurban/backend/src/routes/citizen-protocols.ts#L528)); POST sem serviceId cria protocolo para um serviço arbitrário.
- **M7. `JSON.parse(formDataString)` sem try/catch** ([citizen-protocols.ts:454](digiurban/backend/src/routes/citizen-protocols.ts#L454)) → 500 bruto com body malformado.
- **M8. Regras de cancelamento do cidadão bloqueiam demais** — qualquer interação SERVER/SYSTEM (inclusive mensagens automáticas do sistema) ou qualquer pendência **mesmo resolvida** impedem o cancelamento ([citizen-protocols.ts:993-1024](digiurban/backend/src/routes/citizen-protocols.ts#L993-L1024)); além de TOCTOU entre check e update.
- **M9. Unicidade fail-open + TOCTOU** — em erro, `validateProtocolUniqueness` **libera** a criação ([protocol-uniqueness.service.ts:108-115](digiurban/backend/src/services/protocol-uniqueness.service.ts#L108)); e o padrão check-then-act permite duplicados sob concorrência (nenhuma constraint de banco por trás).
- **M10. `incoming-calls` promete "criados por ADMIN/MANAGER" mas filtra `createdById != null`** ([:337-339](digiurban/backend/src/routes/protocols-simplified.routes.ts#L337)) — inclui criados por USER; e faz 2 counts extras sequenciais por request.
- **M11. Rating validado como 1–5 na rota, modelo documenta 0–5** e o service não valida nada — fontes divergentes.
- **M12. `Access-Control-Allow-Origin: *`** também nos downloads autenticados do cidadão ([citizen-protocols.ts:1670,1852](digiurban/backend/src/routes/citizen-protocols.ts#L1670)).
- **M13. Ações de histórico inconsistentes entre caminhos** — `'CRIADO'`, `'CREATED'`, `'Protocolo criado'`, `'CRIACAO'` convivem; qualquer analytics por action quebra.
- **M14. Hooks de módulo do engine são código morto** — `activateModuleEntity`/`completeModuleEntity`/etc. só fazem `console.log` ([protocol-status.engine.ts:275-328](digiurban/backend/src/services/protocol-status.engine.ts#L275)); a ativação real acontece no module service, fora do engine.

---

## ⚪ Achados Baixos

- Logs de debug massivos com PII (CPF, nomes, paths de arquivo) em todos os fluxos — impróprio para produção (LGPD) e ruído operacional.
- `fs.renameSync` para mover uploads — falha entre volumes/discos diferentes (EXDEV) e é síncrono no event loop.
- Engine retorna `historyId: ''` no no-op de status igual — chamadores não distinguem sucesso real.
- `getWorkloadStats` e afins logam query params e user id a cada request.
- `parsePendingUploadMetadata`/mapeamentos de documento com muitos fallbacks silenciosos (`documento-${index}`) — erros de mapeamento não são reportados ao cidadão (arquivo "não mapeado" é descartado com só um `console.warn`, [citizen-protocols.ts:116-123](digiurban/backend/src/routes/citizen-protocols.ts#L116)).
- Vários routers montados no mesmo prefixo `/api/protocols` (sla, interactions, documents, pendings, stages, citizen-links, simplified) — ordem de registro define quem ganha; frágil a colisões futuras.

---

## Pontos Positivos

- O `ProtocolStatusEngine` com matriz declarativa é a arquitetura certa — o problema é adesão, não design.
- `generateProtocolNumberSafe` com `FOR UPDATE` + GUC de tenant funciona **quando usado com `tx`** (como no module service).
- Extension multi-tenant via DMMF cobre a maioria das queries automaticamente.
- Sistema de pendências (tipos, status, respostas do cidadão, serialização dedicada) é completo e bem separado.
- Analytics usa `concludedAt` (correto) e exclui cancelados do tempo médio.

---

## Verificações Sugeridas (não conclusivas nesta auditoria)

- Frontend: tratamento dos erros 403/410 das rotas acima; duplicação de chamadas entre `protocol-*.service.ts`.
- `unified-protocols.routes.ts` / `unified-protocol.service.ts` (não lidos na íntegra) — provável sexto caminho de leitura/escrita.
- Comportamento do `citizen-services.ts` na criação (usa module service, mas monta documentos por conta própria).
