# PLANO DE EVOLUÇÃO MULTI-TENANT — DIGIURBAN

**Data:** 2026-07-10
**Base:** `AUDITORIA_MULTI_TENANT_DIGIURBAN.md` (mesma data)
**Relação com o plano anterior:** o `PLANO_IMPLEMENTACAO_MULTI_TENANT_DIGIURBAN.md` (Fases 0–10) guiou a implementação até aqui e suas Fases 0–4 estão essencialmente concluídas. Este documento **substitui o restante**: reordena o que sobrou pelas prioridades reveladas na auditoria (riscos R1–R11) e detalha apenas o caminho que falta até o go-live multi-tenant.

Convenção: cada fase termina com um **Gate de Revisão Técnica** — a fase seguinte só inicia após o gate aprovado.

---

## Visão Geral das Fases

| Fase | Nome | Fecha riscos | Depende de | Esforço |
|---|---|---|---|---|
| A | Jobs e filas tenant-aware | R1 | — | Baixo |
| B | Isolamento de arquivos (uploads) | R3 | — | Médio |
| C | Platform Admin (separação plataforma × tenant) | R2 | — | Médio |
| D | Fim da janela de transição (fail-closed total) | R4, R8 | A (jobs não podem depender do fail-soft) | Médio |
| E | RLS armado + onda 7 de colunas + NOT NULL geral | R5, R6, R7 | D | Alto |
| F | Infra por tenant: Redis, rate-limit, logs, e-mail/SMTP | R9, 5.4 | — (paralelo a D/E) | Médio/Alto |
| G | Billing, onboarding e white-label final | R10, R11 | C, D | Médio |
| H | Hardening, testes de isolamento em CI e go-live | todos | A–G | Médio |

Fases A, B, C e F podem começar em paralelo — não têm dependência entre si.

---

# FASE A — Jobs e Filas Tenant-Aware

### Objetivo
Todo processamento assíncrono (crons, workers BullMQ, seeds) executa com contexto de tenant explícito, iterando os tenants ativos.

### Justificativa técnica
`runAsTenant` existe desde a Fase 3 mas é usado apenas em middlewares HTTP. Os 7 jobs de `digiurban/backend/src/jobs/` e o `src/workers/notification.worker.ts` rodam sem contexto e caem no fail-soft para `DEFAULT_TENANT_ID` (`src/lib/prisma-tenant-extension.ts:45-50`). Resultado **já em produção com 2+ tenants**: verificação de SLA, protocolos vencidos, lembretes e notificações nunca executam para municípios além do default (risco R1 — o mais urgente da auditoria porque é falha silenciosa de funcionalidade contratada).

### Benefícios esperados
- SLA, notificações e limpezas funcionam para todos os municípios;
- padrão único e auditável para qualquer job futuro;
- pré-requisito para a Fase D (sem isto, tornar o fail-soft em fail-closed quebraria todos os crons de uma vez).

### Dependências
Nenhuma.

### Riscos
- Jobs que hoje processam "tudo" (ex.: `cleanup-orphan-files`) podem ser legitimamente de plataforma — classificá-los errado cria processamento duplicado ou ausente;
- iteração sequencial de N tenants alonga a janela do cron (aceitável para N pequeno; paralelizar com limite depois).

### Estratégia de implementação
1. Criar `forEachActiveTenant(fn)` em `src/lib/tenant-context.ts` (ou novo `src/lib/tenant-iterator.ts`): lista tenants `ACTIVE`/`TRIAL` via `runAsPlatform`, executa `runAsTenant(t.id, fn)` por tenant com try/catch individual (falha em um município não aborta os demais) e log carimbado.
2. Classificar cada job:
   - **Por tenant** (iterar): `notification.jobs.ts` (SLA, vencidos, lembretes), `check-expired-categories.job.ts`, `reconcile-documents.job.ts`, `revertExpiredDelegations.job.ts`;
   - **Plataforma** (envolver em `runAsPlatform` explícito, nunca implícito): `email-server-monitor.ts`, `email-counters-reset.ts`, `cleanup-orphan-files.job.ts` (até uploads serem particionados na Fase B).
3. Worker BullMQ: incluir `tenantId` no **payload de todo job enfileirado** (produtores em `src/services/notification.service.ts`) e envolver o processamento do `notification.worker.ts` em `runAsTenant(job.data.tenantId, ...)`. Jobs antigos sem tenantId no payload: processar como default e logar warning (drenagem da fila legada).
4. Seeds (`prisma/seeds/*`): envolver em `runAsTenant(DEFAULT_TENANT_ID)` ou no tenant alvo explícito.

### Impactos
- **Banco:** nenhum.
- **Backend:** `src/jobs/*` (7 arquivos), `src/workers/notification.worker.ts`, `src/services/notification.service.ts` (payload), novo helper em `src/lib/`.
- **Frontend:** nenhum.
- **Infraestrutura:** nenhuma.

### Estratégia de testes
- Teste de integração: 2 tenants com protocolos SLA-vencidos → disparar `checkSLAExpiring()` → notificação criada **em cada** tenant, carimbada corretamente;
- estender `scripts/smoke-tenant.ts` com asserções de jobs;
- inspecionar payloads na fila Redis (tenantId presente).

### Critérios de conclusão
- `grep -rL runAsTenant\|runAsPlatform src/jobs src/workers` vazio (todo job declara seu contexto);
- smoke de jobs verde com 2 tenants;
- nenhum log `fail-soft default` originado de jobs em staging por 1 semana.

### 🔒 Gate de Revisão Técnica
Rodar a matriz: provisionar município de teste → criar protocolo com SLA vencido nele → aguardar/forçar cron → notificação existe no tenant novo e **não** existe duplicada no default. Revisar a classificação por-tenant × plataforma de cada job em par.

---

# FASE B — Isolamento de Arquivos (Uploads)

### Objetivo
Nenhum arquivo de um município é legível por usuário de outro; layout físico particionado por tenant.

### Justificativa técnica
`src/middleware/uploads-access.ts` valida apenas autenticidade de JWT — qualquer usuário autenticado de qualquer tenant baixa qualquer arquivo pelo static serving se conhecer o path (risco R3). O particionamento `uploads/{tenantId}/` está declarado como pendência no próprio arquivo (linhas 14-17). As rotas de download dedicadas fazem ownership, mas o diretório estático é canal paralelo que as contorna.

### Benefícios esperados
- Fecha o vazamento de documentos entre municípios (o achado mais explorável da auditoria);
- viabiliza quota de storage, backup e purga **por tenant** (Fases G/H);
- `cleanup-orphan-files` passa a poder operar por tenant.

### Dependências
Nenhuma (paralelo à Fase A).

### Riscos
- Migração de arquivos existentes: paths gravados no banco (`ProtocolDocument`, `GeneratedDocument`, `bot_uploads`, avatares) precisam ser reescritos em sincronia com o `mv` físico — janela de manutenção ou compatibilidade dupla temporária;
- links já emitidos (e-mails, PDFs) com URL antiga quebram — manter rewrite 301 temporário por prefixo antigo **com validação de tenant**.

### Estratégia de implementação
1. **Novo layout:** `uploads/{tenantId}/{categoria}/...`. Alterar os pontos de gravação (Multer storage em `src/middleware/secure-upload.ts` e serviços que montam path) para prefixar com `tryGetTenantId()` — falha se ausente (não usar fail-soft aqui).
2. **Gate de leitura:** em `uploads-access.ts`, extrair o claim `tenantId` do JWT já verificado e comparar com o primeiro segmento do path; divergência → 404 (não 403, para não confirmar existência). Prefixos públicos (`/branding/`, `/avatars/`, `/public/`) também migram para `/{tenantId}/branding/...` com liberação por prefixo de tenant do host (branding precisa ser lido sem cookie).
3. **Migração:** script `scripts/migrate-uploads-tenant.ts` — varre tabelas com path de arquivo, move fisicamente para `uploads/{tenantId da linha}/`, atualiza a coluna na mesma transação; arquivos órfãos vão para `uploads/__orphan__/` para análise.
4. **Compat temporária:** middleware que, para path no layout antigo, resolve o dono via banco e redireciona — removido no gate da Fase H.

### Impactos
- **Banco:** update em massa de colunas de path (sem mudança de schema).
- **Backend:** `secure-upload.ts`, `uploads-access.ts`, serviços de documento/avatar/bot-upload, script de migração.
- **Frontend:** nenhum se as URLs vierem do banco; revisar paths montados na mão (busca por `/uploads/` literal em `app/` e `components/`).
- **Infraestrutura:** volume Docker inalterado; ajustar `nginx.conf` se houver regra de cache por prefixo; backup passa a poder ser seletivo por diretório.

### Estratégia de testes
- Teste HTTP: usuário do tenant A com URL de arquivo do tenant B → 404; própria URL → 200;
- migração em cópia de staging: contagem de arquivos antes/depois + amostragem de download;
- upload novo em 2 tenants → cada um cai no diretório certo.

### Critérios de conclusão
- Zero arquivos em `uploads/` fora de `{tenantId}/` (exceto `__orphan__` documentado);
- matriz de download cross-tenant 100% negada;
- rotas dedicadas de download continuam funcionando (regressão zero no smoke).

### 🔒 Gate de Revisão Técnica
Pentest manual do canal estático (paths adivinhados, traversal, IDs sequenciais); revisão do script de migração e do relatório de órfãos antes de rodar em produção.

---

# FASE C — Platform Admin (separação plataforma × tenant)

### Objetivo
Operações de plataforma (provisionar/suspender municípios, billing) deixam de ser autorizadas por um papel de usuário de tenant.

### Justificativa técnica
Não existe `PlatformUser` (0 ocorrências no schema). `/api/super-admin/tenants` é guardado por `adminAuthMiddleware + superAdminOnly` (`src/routes/super-admin.ts:2906-3020`) — papel `SUPER_ADMIN` do model `User`, que é **por tenant**. Qualquer tenant que obtenha um usuário SUPER_ADMIN controla a plataforma inteira (risco R2). Hoje a fronteira é convenção (provisionamento só cria ADMIN); precisa virar arquitetura.

### Benefícios esperados
- Elimina o vetor de takeover da plataforma por um tenant;
- separa auditoria de plataforma da auditoria municipal;
- habilita o painel `/super-admin` a evoluir para console SaaS (billing, suporte) sem misturar identidades.

### Dependências
Nenhuma técnica; coordenar com a Fase D (o novo token de plataforma já nasce sem claim de tenant — ele **é** o caso legítimo de `runAsPlatform`).

### Riscos
- Lockout: migrar o guard antes de criar o primeiro PlatformUser tranca a gestão — ordem de deploy importa (criar usuário → dupla aceitação → cortar);
- o papel `SUPER_ADMIN` municipal continua existindo (gestão do próprio município) — a nomenclatura parecida convida a confusão; documentar e renomear no painel.

### Estratégia de implementação
1. **Model `PlatformUser`** (email unique global, senha, MFA futuro, role `PLATFORM_ADMIN`/`PLATFORM_SUPPORT`) — fora do espaço de tenant, sem `tenantId`.
2. **Auth dedicada:** `POST /api/platform/auth/login` emitindo JWT com `type: 'platform'` (sem claim de tenant) em cookie próprio (`digiurban_platform_token`); middleware `platformAuthMiddleware` que estabelece `runAsPlatform`.
3. **Migrar endpoints:** mover `GET/POST/PATCH /tenants` de `super-admin.ts` para novo `src/routes/platform.ts` (aproveitar para extrair a lógica inline para `tenant-provisioning.service.ts`, seguindo o padrão Router → Service). Período de dupla aceitação: os endpoints antigos respondem 410 com mensagem de migração após o corte.
4. **Seed do primeiro PlatformUser** via script CLI (não via API).
5. **Frontend:** `/super-admin/tenants` → nova área `/platform/` com login próprio; o `/super-admin` municipal mantém somente a gestão do próprio município.
6. Revisar o bypass do `tenantStatusMiddleware`: `/api/platform` entra no lugar de `/api/super-admin` na lista (`src/middleware/tenant-status.ts:22-30`).

### Impactos
- **Banco:** 1 model novo + migration; nenhum backfill.
- **Backend:** `routes/platform.ts` (novo), `middleware/platform-auth.ts` (novo), `super-admin.ts` (remoção dos endpoints de tenants), `tenant-status.ts` (bypass), `tenant-provisioning.service.ts` (absorve lógica inline).
- **Frontend:** área `/platform` nova; ajuste de navegação do super-admin.
- **Infraestrutura:** considerar servir `/platform` apenas em host dedicado (`platform.{TENANT_BASE_DOMAIN}` — slug já reservado em `tenant.service.ts:210`).

### Estratégia de testes
- SUPER_ADMIN municipal chama `/api/platform/tenants` → 401/403;
- PlatformUser provisiona/suspende com auditoria própria;
- regressão: fluxo de provisionamento ponta-a-ponta (matriz 10 passos já usada na Fase 8 anterior).

### Critérios de conclusão
- Nenhum endpoint de gestão de tenants autorizado por role de tenant;
- primeiro PlatformUser em produção, endpoints antigos desativados;
- auditoria distingue ações de plataforma (`platformUserId`) de ações municipais.

### 🔒 Gate de Revisão Técnica
Revisão de segurança focada em escalada de privilégio (promoção de role municipal, reuse de token, bypass por rota antiga); simular lockout/recuperação do PlatformUser.

---

# FASE D — Fim da Janela de Transição (fail-closed total)

### Objetivo
Eliminar os três fallbacks para o tenant default: contexto ausente, host desconhecido e token sem claim.

### Justificativa técnica
Os fallbacks foram deliberados para migrar sem downtime (documentados em `prisma-tenant-extension.ts:22-23`, `tenant.service.ts:181-183`, middlewares de auth). Com 2+ municípios reais, cada um é um canal de corrupção silenciosa (risco R4) ou de aceitação indevida (R8). A auditoria confirmou que nenhum tem data de expiração definida.

### Benefícios esperados
- Perda de contexto vira **erro visível** em vez de gravação no município errado;
- host desconhecido → 404 (elimina enumeração e acesso acidental ao default);
- só circulam tokens com claim de tenant (chokepoint passa de "quando presente" para "sempre").

### Dependências
- **Fase A** (jobs precisam já declarar contexto — senão o fail-closed derruba todos os crons);
- inventário de raw queries (preparação da Fase E);
- expiração natural dos JWTs legados (verificar TTL de emissão; forçar re-login se > 30 dias).

### Riscos
- É a fase com maior risco de regressão em produção — qualquer caminho de código esquecido que dependia do fail-soft passa a lançar erro;
- mitigação: modo estrito primeiro em staging com telemetria, depois produção com kill-switch por env.

### Estratégia de implementação
1. **Telemetria primeiro:** logar (com stack) toda ativação de fail-soft — `resolveTenantId()` sem contexto, `getByHost` caindo no default para host ≠ localhost, token aceito sem claim. Rodar 1–2 semanas; zerar as ocorrências corrigindo os call sites.
2. **Flag `TENANT_STRICT=1`:** `resolveTenantId()` lança em vez de devolver default; ativar em dev/CI/staging permanentemente.
3. **Cortes em produção (na ordem):**
   a. token sem claim → 401 (mensagem pedindo novo login);
   b. `getByHost` sem match → `null` → `tenantStatusMiddleware` responde 503/404 (`TENANT_UNRESOLVED` já existe) — cadastrar antes os hosts legítimos do modo single-tenant como `customDomain` do tenant default;
   c. extension fail-closed (`TENANT_STRICT` default em produção).
4. Remover código morto: aceitação de legado nos 3 middlewares de auth e no chokepoint (`tenant-context.ts:79`, comentário "Token sem claim (legado) segue").

### Impactos
- **Banco:** cadastrar `customDomain`/hosts do tenant default.
- **Backend:** `lib/prisma-tenant-extension.ts`, `lib/tenant-context.ts`, `services/tenant.service.ts`, 3 middlewares de auth + chokepoint.
- **Frontend:** tratar 401 de token legado com redirect a login (provavelmente já coberto pelo interceptor).
- **Infraestrutura:** env `TENANT_STRICT`; garantir `trust proxy`/`X-Forwarded-Host` corretos no Nginx (já ajustado na Fase 7 anterior — revalidar).

### Estratégia de testes
- Suíte negativa: requisição sem host conhecido → 404/503; job sem contexto em `TENANT_STRICT` → exceção; token sem claim → 401;
- smoke completo (46 asserções) nos 2 modos;
- canário: 24h com telemetria zero antes de cada corte.

### Critérios de conclusão
- Zero ativações de fail-soft em 7 dias de produção;
- `DEFAULT_TENANT_ID` usado apenas como identidade do município migrado (nunca como fallback);
- documentação do CLAUDE.md atualizada (contrato: todo código novo declara contexto).

### 🔒 Gate de Revisão Técnica
Revisar diff de remoção dos fallbacks em par; executar a matriz cross-host (5 casos da Fase 4 anterior) + matriz de token legado; validar o kill-switch (rollback ensaiado).

---

# FASE E — RLS Armado + Onda 7 + NOT NULL Geral

### Objetivo
A segunda camada de defesa (RLS) fica permanentemente ativa; todo dado municipal tem `tenantId NOT NULL`; models sensíveis restantes entram no escopo.

### Justificativa técnica
Hoje o RLS só arma dentro de `withTenantTransaction` — adotado em 1 ponto (`protocol-number.service.ts`); os demais arquivos com `$queryRaw` (`super-admin.ts`, `auto-categorization.service.ts`, `citizen-category.service.ts` etc.) rodam com GUC vazio e a política permissiva deixa tudo passar (risco R5). Além disso, 111 models não têm `tenantId`, e parte é dado municipal sensível: Analytics/BI materializados (R6), biometria facial — dado sensível LGPD (R7), família, workflow, `FlowDefinition` (unique global `name` impede personalização por município). Por fim, `tenantId String?` em todo o schema deixa NULLs escaparem das uniques compostas e da política RLS.

### Benefícios esperados
- Defesa em profundidade real: bug na extension ou raw query esquecida → zero linhas, não vazamento;
- dashboards/KPIs corretos por município; espaço de busca biométrico segregado;
- bot personalizável por município (fluxos próprios);
- contrato de tipo: `tenantId` obrigatório visível no TypeScript.

### Dependências
Fase D concluída (fail-closed garante que não nascem mais linhas NULL; NOT NULL sem isso falharia no primeiro insert de job sem contexto).

### Riscos
- `SET LOCAL` por transação em toda query tem custo — medir; a alternativa (GUC por conexão) conflita com PgBouncer transaction mode (o comentário em `tenant-context.ts:85-88` já acerta nisso);
- backfill da onda 7 em tabelas grandes (bot_messages, analytics) precisa ser em lotes;
- endurecer a política RLS (remover a exceção `tenantId IS NULL`) antes do NOT NULL geral esconderia dados legítimos — ordem: backfill → NOT NULL → endurecer política.

### Estratégia de implementação
1. **Armar o RLS no caminho quente:** estender a Prisma extension para abrir transação com `SET LOCAL app.tenant_id` quando a operação é escopada **ou**, mais barato, migrar os 6 arquivos de raw query restantes para `withTenantTransaction` + regra ESLint que proíbe `$queryRaw` fora dele em código de tenant. Recomendação: começar pela via ESLint (custo zero em runtime), medir, e avaliar o GUC universal na Fase H.
2. **Onda 7 de colunas** (migration condicional por tabela, padrão das waves 5/6): `Analytics`, `ProtocolMetrics`, `ServiceMetrics`, `KPI`, `Report`, `ReportExecution`, `Dashboard`, `Alert`, `MetricCache`, `Prediction`; `FaceEnrollment`, `FaceEmbedding`, `FaceRecognitionEvent`, `FaceDevice`, `FaceZone`; `FamilyComposition`, `FamilyInvite`; `ServiceWorkflow`, `ModuleWorkflow`, `WorkflowDefinition/Instance/History`; `FlowDefinition` (unique `name` → `[tenantId, name]`; seeder `FlowDefinitionSeeder` do Messages Server passa a semear por tenant), `BotAnalytics`, `MessageTemplate`; `CitizenPrivacySettings`, `PushSubscription`, `NotificationPreference`, `UserSession`, `PasswordResetToken`. Backfill derivando do dono (userId/citizenId/protocolId da linha).
3. **NOT NULL geral:** após backfill validado (`SELECT count(*) WHERE tenantId IS NULL` = 0 por tabela), aplicar NOT NULL em lote (padrão condicional da migration `20260708160000`) e trocar `String?` → `String` no schema Prisma (os erros de tipo resultantes são o inventário de call sites a corrigir).
4. **Endurecer a política RLS:** nova migration substituindo a política — remover a cláusula `"tenantId" IS NULL` das tabelas que ficaram NOT NULL; adicionar as tabelas da onda 7 à lista.
5. Catálogos deliberadamente globais (EspecialidadeMedica, TipoDocumento, DestinoTFD...) documentados como tal no schema (comentário `/// global — catálogo de plataforma`).

### Impactos
- **Banco:** 3 migrations (onda 7, NOT NULL geral, política v2); backfill em lotes nas tabelas grandes; índices `[tenantId]` novos.
- **Backend:** schema.prisma (~30 models), call sites revelados pelo type-check, ESLint rule, 6 arquivos de raw query.
- **Frontend:** nenhum direto; dashboards passam a refletir só o município.
- **Messages Server:** `FlowDefinitionSeeder` por tenant; queries de FlowDefinition por `[tenantId, name]`.
- **Infraestrutura:** janela de manutenção para o backfill grande; monitorar latência pós `SET LOCAL` se adotado.

### Estratégia de testes
- Teste de penetração de camada: desligar a extension em teste e verificar que o RLS sozinho bloqueia leitura cross-tenant (prova de defesa em profundidade);
- smoke estendido com asserções de analytics e biometria;
- `migrate diff` para provar convergência schema ↔ banco;
- bot: fluxo custom no tenant A invisível no tenant B.

### Critérios de conclusão
- 100% dos models de dado municipal com `tenantId NOT NULL` (inventário de globais explícito e justificado);
- teste "extension desligada" bloqueado pelo RLS;
- zero `$queryRaw` fora de `withTenantTransaction` em código de tenant (lint verde).

### 🔒 Gate de Revisão Técnica
Revisão da classificação global × municipal model a model (assinada); execução da suíte de penetração de camada; simulação de restore de backup + migration em banco clone.

---

# FASE F — Infra por Tenant: Redis, Rate-Limit, Logs, E-mail/SMTP

### Objetivo
Camadas de infraestrutura compartilhada (cache, filas, limites, logs, e-mail) deixam de ser pontos de mistura ou de contenção entre municípios.

### Justificativa técnica
`src/lib/CacheService.ts` e `src/lib/redis.ts` não namespaceiam chaves por tenant; `src/middleware/rate-limit.ts` limita por IP globalmente (município sob abuso consome a cota de todos — risco R9); `request-logger.middleware.ts` não carimba tenantId (sem observabilidade por município); o módulo de e-mail (~13 models `Email*`) e o `ultrazend-smtp-server` têm **zero** consciência de tenant.

### Benefícios esperados
- Elimina cross-serving de cache e contenção de cota;
- logs e métricas filtráveis por município (pré-requisito de suporte SaaS e SLA contratual);
- e-mail por município com domínio/DKIM próprios (se for oferta do produto).

### Dependências
Nenhuma para cache/rate-limit/logs (paralelo a D/E). O bloco e-mail/SMTP depende de decisão de produto — **recomenda-se decidir antes de investir**: se e-mail é serviço de plataforma (envio transacional em nome da DigiUrban), basta carimbar logs; se é oferta por município, é subprojeto próprio.

### Riscos
- Renomear chaves de cache invalida tudo de uma vez (aceitável — é cache);
- multi-tenant de SMTP é grande: DNS/DKIM por domínio municipal, reputação de IP, filas separadas.

### Estratégia de implementação
1. **Cache:** prefixo obrigatório `t:{tenantId}:` no `CacheService` (assinatura passa a exigir tenant do contexto; `runAsPlatform` usa `t:__platform__:`); model `CacheEntry` do banco ganha coluna na onda 7 (Fase E) se persistente.
2. **Rate-limit:** chave composta `tenantId:ip` nos limiters de `rate-limit.ts`; limites configuráveis por plano (campo `features`/`limits` do Tenant — já existe o shape).
3. **Logs:** child logger Winston por request com `tenantId` (`request-logger.middleware.ts`); incluir tenantId no formato JSON para agregação.
4. **Filas:** já coberto na Fase A (payload com tenantId); avaliar fila BullMQ separada por tenant apenas se um município dominar o throughput (adiar — complexidade sem demanda).
5. **E-mail/SMTP (condicional à decisão de produto):** carimbar `tenantId` em `EmailLog`/`ReceivedEmail`; mapear `EmailDomain` → tenant; no SMTP server, resolver tenant pelo domínio do remetente para assinatura DKIM e contabilização.

### Impactos
- **Banco:** colunas de tenant no módulo e-mail (se decidido) — pode acoplar à onda 7.
- **Backend:** `CacheService.ts`, `redis.ts`, `rate-limit.ts`, `request-logger.middleware.ts`.
- **Frontend:** nenhum.
- **Infraestrutura:** dashboards de log por tenant (Loki/Grafana ou equivalente); DNS por município no cenário e-mail-por-tenant.

### Estratégia de testes
- Teste de cache: mesma chave lógica em 2 tenants → valores independentes;
- rate-limit: estourar cota no tenant A → tenant B continua 200;
- amostragem de logs: 100% das linhas de request com tenantId.

### Critérios de conclusão
- Nenhuma chave Redis sem prefixo de tenant/plataforma (auditoria por `SCAN`);
- rate-limit por tenant ativo com limites por plano;
- decisão de produto sobre e-mail registrada (ADR) e implementada no escopo decidido.

### 🔒 Gate de Revisão Técnica
Rodar `SCAN` no Redis de staging e revisar amostra de chaves; teste de contenção entre tenants; revisão do ADR de e-mail.

---

# FASE G — Billing, Onboarding e White-Label Final

### Objetivo
Municípios entram, pagam e se configuram sem deploy; resquícios single-tenant eliminados.

### Justificativa técnica
O provisionamento interno existe e funciona (`tenant-provisioning.service.ts`, `/api/super-admin/tenants` → `/api/platform/tenants` após a Fase C), mas: billing é embrionário (`Invoice`/`Lead` sem motor de cobrança), `municipio_config` ainda é escrito por rotas legadas com sync lazy (risco R10, `tenant.service.ts:240-269`), o frontend carrega um header hardcoded (`lib/services/api.ts:22`, risco R11) e pendências declaradas da Fase 7 anterior seguem abertas (manifest PWA por tenant, `ignoreBuildErrors`).

### Benefícios esperados
- Receita recorrente operacionalizada (planos, limites, suspensão automática por inadimplência — o enforcement já existe no `tenantStatusMiddleware`);
- onboarding self-service reduz custo de venda;
- base de código sem dupla fonte de verdade.

### Dependências
Fases C (Platform Admin opera billing) e D (domínios cadastrados fail-closed no onboarding).

### Riscos
- Integração de pagamento (gateway) tem compliance próprio — tratar como integração isolada;
- aposentar `municipio_config` exige migrar as telas de configuração municipal que ainda o usam.

### Estratégia de implementação
1. **Aposentar `municipio_config`:** apontar as rotas de configuração municipal (`super-admin.ts` de config, `municipality-config`) para escrever direto em `Tenant` via `TenantService`; remover `syncFromLegacyIfNewer`; manter a tabela somente-leitura por 1 release e dropar.
2. **Limpar o frontend:** remover `X-Tenant-ID` hardcoded de `lib/services/api.ts` (o contexto vem de host/cookie); revisar `localStorage digiurban_tenant_id`.
3. **Onboarding:** fluxo público (lead → contrato → provisionamento via `tenant-provisioning.service.ts` já transacional) com cadastro de `customDomain`/subdomínio no ato (fecha a pendência do `getByHost` fail-closed).
4. **Billing:** ciclo Invoice por tenant (plano do `Tenant.plan`), webhook de pagamento → `paymentStatus` (o middleware de status já reage a `overdue`/`suspended`); relatórios de uso a partir de `getTenantUsage`.
5. **White-label final:** manifest PWA gerado por tenant (rota dinâmica `app/manifest.ts` lendo o TenantProvider); reverter `ignoreBuildErrors`/`ignoreDuringBuilds` no `next.config` (dívida que mascara erros de tipo cross-tenant).

### Impactos
- **Banco:** drop de `municipio_config` (ao final); campos de billing em `Invoice`.
- **Backend:** rotas de config municipal, `tenant.service.ts` (remoção do sync), rotas de billing novas.
- **Frontend:** `lib/services/api.ts`, onboarding público, manifest dinâmico, correções de tipo reveladas pelo build estrito.
- **Infraestrutura:** automação de DNS/TLS para subdomínios novos (wildcard `*.TENANT_BASE_DOMAIN` já cobre; domínio custom exige emissão de certificado — automatizar com ACME).

### Estratégia de testes
- E2E de onboarding: lead → pagamento sandbox → município no ar em subdomínio próprio → login do admin;
- inadimplência simulada → suspensão automática → regularização → reativação;
- build Next sem `ignoreBuildErrors` verde.

### Critérios de conclusão
- Município novo no ar sem intervenção de engenharia;
- `municipio_config` removida; `grep X-Tenant-ID` no frontend vazio;
- ciclo de cobrança rodando em produção para ≥1 tenant real.

### 🔒 Gate de Revisão Técnica
Walkthrough do onboarding com persona não-técnica; revisão de segurança do fluxo público (anti-abuso de provisionamento); conferência de faturamento × uso real.

---

# FASE H — Hardening, Testes de Isolamento em CI e Go-Live

### Objetivo
Prova contínua e automatizada de isolamento; operação (backup, observabilidade, incident response) por tenant; go-live formal do N-ésimo município.

### Justificativa técnica
`scripts/smoke-tenant.ts` é a única suíte de isolamento e roda manualmente. Não há gate de merge que impeça regressão de isolamento, nem backup/restore seletivo por município, nem runbook de incidente cross-tenant. Para um SaaS governamental (dados de saúde, assistência social e biometria — LGPD), isolamento precisa ser **provado continuamente**, não afirmado.

### Benefícios esperados
- Regressões de isolamento barradas no PR, não em produção;
- capacidade de restaurar/exportar um único município (requisito contratual comum no setor público — portabilidade de dados na troca de fornecedor);
- postura demonstrável em auditorias externas.

### Dependências
Todas as anteriores.

### Riscos
- Testes de isolamento em CI exigem banco real com 2 tenants — pipeline mais lento (mitigar com job paralelo e banco efêmero via Docker).

### Estratégia de implementação
1. **CI:** job dedicado que sobe PostgreSQL efêmero, aplica migrations, provisiona 2 tenants e roda `smoke-tenant.ts` + a suíte de penetração de camada (Fase E) + matriz HTTP cross-host — obrigatório para merge em `main`.
2. **Testes de contrato por rota:** gerador que percorre os ~94 prefixos de `src/index.ts` e afirma que toda rota autenticada nega recurso de outro tenant (403/404) — cobre rotas futuras por construção.
3. **Backup/export por tenant:** script `scripts/export-tenant.ts` (dump lógico filtrado por `tenantId` + diretório `uploads/{tenantId}/`) e o inverso para restore/portabilidade.
4. **Observabilidade:** dashboards por tenant (requests, erros, uso, fila) sobre os logs carimbados da Fase F; alertas de anomalia (ex.: tenant lendo volume atípico).
5. **Runbook de incidente cross-tenant:** detecção (auditoria `tenant_claim_mismatch` + alertas), contenção (suspensão do tenant/kill-switch), comunicação (obrigações LGPD art. 48).
6. **Pentest externo** focado em isolamento antes do go-live formal.

### Impactos
- **Banco:** nenhum.
- **Backend:** scripts de export/restore; possíveis correções do pentest.
- **Frontend:** nenhum.
- **Infraestrutura:** pipeline CI (self-hosted runner já existe — commit `6dba8061`), stack de observabilidade, agenda de backup.

### Estratégia de testes
Esta fase **é** a estratégia de testes. Meta: nenhuma release sem a suíte de isolamento verde.

### Critérios de conclusão
- Suíte de isolamento obrigatória em CI, verde por 30 dias;
- export/restore de um município ensaiado com sucesso em staging;
- pentest externo sem achados críticos/altos abertos;
- ≥2 municípios reais operando em produção sem incidente de isolamento.

### 🔒 Gate de Revisão Técnica (Go-Live)
Revisão executiva: checklist das Fases A–G (todos os gates assinados), relatório do pentest, ensaio de restore, runbook aprovado. Só então o fallback/compat remanescente (rewrite de uploads da Fase B, kill-switches da Fase D) é removido definitivamente.

---

## Ordem Recomendada e Paralelismo

```
Semana 0        ┌────────────┐
  A (jobs) ─────┤            │
  B (uploads) ──┤  paralelo  │
  C (platform) ─┤            │
  F1 (cache/    │            │
     logs/rate) └────────────┘
        ↓
  D (fail-closed)  ← exige A; recomenda B/C prontos
        ↓
  E (RLS + onda 7 + NOT NULL)
        ↓
  G (billing/onboarding)  ← exige C, D
        ↓
  H (hardening + go-live)
```

**Primeiro incremento de valor:** Fases A + B fecham os dois riscos exploráveis/já-ocorrentes (R1, R3) com esforço baixo/médio — recomenda-se executá-las imediatamente, antes de qualquer novo município entrar em produção.
