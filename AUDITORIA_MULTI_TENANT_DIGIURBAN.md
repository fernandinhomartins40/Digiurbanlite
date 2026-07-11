# AUDITORIA TÉCNICA — IMPLEMENTAÇÃO MULTI-TENANT DIGIURBAN

**Data:** 2026-07-10
**Branch auditada:** `feat/multi-tenant-foundation` (HEAD `c3f90be6`)
**Método:** engenharia reversa da implementação (código-fonte, schema, migrations, middlewares, serviços satélites). O documento `PLANO_IMPLEMENTACAO_MULTI_TENANT_DIGIURBAN.md` foi usado apenas como referência complementar — toda afirmação abaixo foi validada contra o código.

---

## 1. Visão Geral da Implementação

A DigiUrban adotou a estratégia **banco compartilhado + coluna discriminadora `tenantId` + Row-Level Security (RLS) do PostgreSQL como defesa em profundidade**, com filtro automático via Prisma Client Extension (ADR-001 do plano existente). A decisão é adequada para o perfil do produto (SaaS de prefeituras, 230 models Prisma, migração gradual a partir de uma base single-tenant em produção).

A arquitetura de isolamento implementada tem **quatro camadas**:

```
Requisição HTTP
  ↓
[1] tenantContextMiddleware (middleware/tenant-context.ts)
    resolve tenant por host → header/cookie de seleção → default
    valida claim tenantId do JWT (chokepoint único, antes de qualquer auth)
    popula AsyncLocalStorage (lib/tenant-context.ts)
  ↓
[2] tenantStatusMiddleware (middleware/tenant-status.ts)
    fail-closed: bloqueia tenant suspenso/inativo/cancelado
  ↓
[3] Middlewares de auth (admin/citizen/super-admin)
    re-validam o claim de tenant (defesa em profundidade)
  ↓
[4] Prisma Tenant Extension (lib/prisma-tenant-extension.ts)
    injeta tenantId em escritas, filtra leituras, preflight de ownership
  ↓
[5] RLS PostgreSQL (migration 20260708150000)
    política permissiva por GUC app.tenant_id — cobre resíduo de $queryRaw
    (ativa apenas dentro de withTenantTransaction)
```

Serviços satélites: o **Messages Server** propaga o tenant via AsyncLocalStorage próprio + header `X-Tenant-Id` em todas as chamadas ao backend; o **SMTP Server** ainda não tem nenhuma consciência de tenant.

---

## 2. Nível de Maturidade

**Classificação: Nível 3 de 5 — "Isolamento lógico operante, operação de plataforma imatura".**

| Nível | Descrição | Status |
|---|---|---|
| 1 — Single-tenant | Uma instância = um município | ✅ Superado |
| 2 — Colunas + backfill | Dados carimbados, sem enforcement | ✅ Superado |
| 3 — Enforcement automático | Filtro/injeção automáticos + auth escopada + provisionamento | ✅ **Estágio atual** (com ressalvas) |
| 4 — Operação SaaS | Jobs/filas/arquivos/e-mail por tenant, Platform Admin separado, billing, fail-closed total | 🔶 Parcial |
| 5 — Escala e hardening | Testes de isolamento em CI, backup/observabilidade por tenant, pentest, N municípios em produção | ❌ Pendente |

O caminho crítico HTTP (login → CRUD → resposta) está **efetivamente isolado por tenant e verificado por smoke tests** (`digiurban/backend/scripts/smoke-tenant.ts`, 342 linhas). O que impede a classificação como "pronto para produção multi-tenant" está concentrado em: processamento assíncrono (jobs/filas sem contexto), papel de plataforma (SUPER_ADMIN por tenant), arquivos (sem particionamento), módulo de e-mail, e a janela de transição fail-soft (fallbacks para o tenant default que precisam virar fail-closed).

---

## 3. Pontos Já Implementados (com evidências)

### 3.1 Banco de Dados

| Item | Evidência |
|---|---|
| Model `Tenant` (status, plan, features, branding, customDomain unique, maxUsers/maxCitizens) | `prisma/schema.prisma`; migration `20260707120000_add_tenants_table` |
| `tenantId` em **119 de 230 models** (ondas 1–6) | migrations `20260707140000` → `20260708140000`; contagem verificada no schema |
| **120 índices** `@@index([tenantId...])` | `prisma/schema.prisma` |
| **15 uniques compostas** `@@unique([tenantId, ...])` — users.email/cpf/matricula, citizens.cpf, departments.name/code, services.moduleType, turnos, turmas, matrículas, professores.cpf, programas sociais, citizen_categories.code, admin_tickets.number | migration `20260708120000_composite_tenant_uniques` |
| `Citizen.personId` de unique global → composta `[tenantId, personId]` (mesma pessoa física cidadã de N municípios; `Person` permanece identidade global por CPF — decisão deliberada e correta) | migration `20260709120000_citizen_person_composite` |
| NOT NULL em `tenantId` nas 5 tabelas núcleo (users, citizens, departments, protocols_simplified, services_simplified), condicional a backfill completo | migration `20260708160000_tenant_id_not_null_core` |
| RLS habilitado em ~120 tabelas com política `tenant_isolation` idempotente | migration `20260708150000_row_level_security` |
| Cadeia de migrations reparada e auto-suficiente (baseline drift repair, waves condicionais por tabela) | `20260707130000_baseline_drift_repair`; commit `f6cdd6ff` |

### 3.2 Backend — contexto e enforcement

| Item | Evidência |
|---|---|
| AsyncLocalStorage com `runAsTenant` / `runAsPlatform` / `getTenantId` fail-closed / `tryGetTenantId` | `src/lib/tenant-context.ts` |
| `withTenantTransaction`: `SET LOCAL app.tenant_id` por transação (correto com PgBouncer transaction mode) | `src/lib/tenant-context.ts:90-101` |
| Prisma Extension com detecção por **DMMF** (ondas novas cobertas automaticamente): injeção em create/createMany/upsert; filtro em findMany/findFirst(/OrThrow)/count/aggregate/groupBy/updateMany/deleteMany; reescrita findUnique→findFirst escopado; **preflight de ownership** em update/delete/upsert com semântica P2025 (não vaza existência) e tolerância a registros da própria transação | `src/lib/prisma-tenant-extension.ts` |
| Resolução de tenant por host: customDomain (unique) → subdomínio `{slug}.TENANT_BASE_DOMAIN` (slugs reservados bloqueados) → fallback default; cache em memória TTL 60s | `src/services/tenant.service.ts:186-225` |
| Seleção de município por `X-Tenant-Slug`/cookie `digiurban_tenant_slug` **apenas quando o host cai no default** — subdomínio próprio tem precedência absoluta | `src/middleware/tenant-context.ts:42-61` |
| **Chokepoint de claim JWT**: token com `tenantId` de outro tenant → 401 + AuditLog `tenant_claim_mismatch`, antes de qualquer caminho de auth (cobre verificações JWT inline espalhadas) | `src/middleware/tenant-context.ts:75-114` |
| Claim `tenantId` emitido nos 4 pontos de login (admin, cidadão ×2, super-admin) e re-validado nos 3 middlewares de auth | `src/routes/admin-auth.ts:178`, `src/routes/citizen-auth.ts:160,356`, `src/middleware/{admin,citizen,super-admin}-auth.ts` |
| Status do tenant fail-closed: SUSPENDED/CANCELLED/EXPIRED/INACTIVE → 403; sem tenant resolvido → 503; bypass para /public, /super-admin e login/logout; `overdue` só avisa (header `X-Payment-Warning`) | `src/middleware/tenant-status.ts` |
| Feature-gating server-side `requireFeature()` lendo `req.tenant.features` (mesmo contrato do hook do frontend: só `false` explícito desabilita) aplicado a 7 rotas de módulo | `src/middleware/require-feature.ts`; registro em `src/index.ts` |
| Geração de número de protocolo com advisory lock + GUC RLS + filtro explícito por tenant | `src/services/protocol-number.service.ts:70-77` |
| Auditoria carimbada por tenant (audit_logs na onda 3) + evento `tenant_claim_mismatch` | migration `20260707160000`; `src/utils/audit-logger.ts` |

### 3.3 Provisionamento e gestão de plataforma

| Item | Evidência |
|---|---|
| `GET/POST/PATCH /api/super-admin/tenants`: lista com contadores, provisiona município completo em transação atômica (tenant + ADMIN inicial com senha temporária e `mustChangePassword`, slugs reservados bloqueados, 409 em conflito), suspende/reativa | `src/routes/super-admin.ts:2905-3020` |
| Seeds de provisionamento: 8 secretarias padrão + 7 serviços iniciais (portal nasce utilizável); limites `maxUsers`/`maxCitizens` reutilizáveis | `src/services/tenant-provisioning.service.ts` |
| Página `/super-admin/tenants` (lista, provisiona exibindo senha uma única vez, suspende/reativa) | `digiurban/frontend/app/super-admin/tenants/` |
| Sync unidirecional lazy `municipio_config` → `tenants` durante a transição (rotas legadas ainda escrevem no singleton) | `src/services/tenant.service.ts:240-269` |

### 3.4 Frontend

| Item | Evidência |
|---|---|
| `TenantProvider` SSR: resolve município pelo Host no servidor, injeta CSS vars de branding antes do primeiro paint (mesma imagem Docker serve qualquer tenant); workaround correto para undici descartar `Host` (envia `x-forwarded-host`, Nginx repassa) | `components/providers/TenantProvider.tsx`, `lib/tenant.ts`, `app/layout.tsx` |
| Hooks `useTenant` / `useTenantFeature`; menu de secretarias filtrado por feature ("UI esconde, API nega") | `components/providers/TenantProvider.tsx` |
| Seletor de município no portal do cidadão (domínio raiz → dropdown grava cookie `digiurban_tenant_slug`; subdomínio próprio → município fixo) | `app/cidadao/login/page.tsx`; commit `c3f90be6` |
| Endpoints públicos `GET /api/public/tenant-config` (`Cache-Control` + `Vary: Host`) e `GET /api/public/municipios` (só tenants ACTIVE) | `src/routes/public.ts` |

### 3.5 Messages Server (bot/chat)

| Item | Evidência |
|---|---|
| AsyncLocalStorage próprio de tenant; origem: claim do JWT no handshake WebSocket, ou derivação pelo citizenId no início do processamento HTTP | `ultrazend-messages-server/src/bot/tenant-context.ts` |
| Interceptor axios injeta `X-Tenant-Id` em **toda** chamada ao backend (fecha o gap de endpoints sem citizenId, ex. listServices) | `src/bot/DigiUrbanIntegration.ts:37`, `src/bot/ai/CitizenAiClient.ts:68` |
| Salas Socket.IO com prefixo de tenant `t:{tenantId}:user:{userId}` (defesa em profundidade) | `src/server/WebSocketServer.ts:205-209` |
| Lado backend: `internal-tenant-context.ts` em `/api/internal` — header `X-Tenant-Id` → derivação por citizenId (lookup de plataforma) → fallback default | `digiurban/backend/src/middleware/internal-tenant-context.ts` |
| Tabelas do bot escopadas (bot_conversations, bot_messages, bot_uploads, flow_executions) na onda 6 | migration `20260708140000` |

### 3.6 Testes

| Item | Evidência |
|---|---|
| Suíte de isolamento `smoke-tenant.ts` (27–46 asserções em banco real com 2 tenants: leitura, findUnique, count, mutações cross-tenant bloqueadas, updateMany 0 linhas, visão de plataforma) | `digiurban/backend/scripts/smoke-tenant.ts` |
| Verificações ponta-a-ponta por HTTP documentadas por fase (matriz cross-host 5/5, login mesmo e-mail em 2 tenants, provisionamento 10/10, seletor de município com mesmo CPF em 2 municípios) | changelog do `PLANO_IMPLEMENTACAO_MULTI_TENANT_DIGIURBAN.md` (corroborado pelo código correspondente) |

---

## 4. Funcionalidades Parcialmente Implementadas

### 4.1 `tenantId` opcional em todo o schema (NOT NULL só no banco, e só em 5 tabelas)

Os 119 models escopados declaram `tenantId String?` no schema Prisma. A migration `20260708160000` aplica NOT NULL **apenas** em 5 tabelas núcleo, **no banco**, condicionalmente — o schema Prisma continua nullable até para essas. Consequências:

- Linhas com `tenantId NULL` **escapam das uniques compostas** (NULL ≠ NULL no PostgreSQL) — um cadastro que entre sem carimbo não colide com nada;
- A política RLS **deixa passar `tenantId IS NULL`** por design (`migration 20260708150000`, linha 142) — dado órfão fica visível para todos os tenants;
- O TypeScript não força o campo em `create` manual fora da extension.

### 4.2 RLS majoritariamente dormente em runtime

A política RLS só é ativada quando o GUC `app.tenant_id` é setado — e isso só acontece dentro de `withTenantTransaction` (adotado em **1 ponto**: `protocol-number.service.ts`). Dos 7 arquivos com `$queryRaw`/`$executeRaw` (`super-admin.ts`, `auto-categorization.service.ts`, `citizen-category.service.ts`, etc.), os demais rodam com GUC vazio → **a política permissiva deixa tudo passar**. Hoje o RLS protege contra ferramentas externas com o GUC setado, mas não cobre o resíduo de raw queries da própria aplicação, que era seu propósito declarado (`prisma-tenant-extension.ts:25-26`).

### 4.3 Fail-soft para o tenant default (janela de transição)

Três fallbacks deliberados que precisam expirar antes do go-live multi-tenant:

1. **Sem contexto ALS** → `resolveTenantId()` devolve `DEFAULT_TENANT_ID` (`prisma-tenant-extension.ts:45-50`). Qualquer código assíncrono que perca o contexto opera silenciosamente no tenant default;
2. **Host desconhecido** → `TenantService.getByHost` cai no default (`tenant.service.ts:216-219`) em vez de 404;
3. **Token legado sem claim `tenantId`** → aceito por todos os middlewares (`if (decoded.tenantId && ...)`).

### 4.4 Fonte de verdade dupla do tenant default

Rotas legadas (`super-admin.ts` de configuração municipal, `municipality-config`) ainda escrevem em `municipio_config`; `TenantService.syncFromLegacyIfNewer` copia para `tenants` na leitura seguinte (`tenant.service.ts:240-269`). Funciona, mas é escrita dual com janela de inconsistência de até 60s (TTL do cache) e só cobre o tenant default.

### 4.5 Uploads: autenticação sim, isolamento não

`uploads-access.ts` fecha o acesso anônimo (achado S1), mas valida apenas **autenticidade do JWT, de qualquer tenant** — não há verificação de ownership nem particionamento `uploads/{tenantId}/` (pendência reconhecida no próprio arquivo, linhas 14-17). Um usuário autenticado do município A que conheça/adivinhe o path de um arquivo do município B consegue baixá-lo pelo static serving. As rotas de download dedicadas fazem ownership, mas o diretório estático é um canal paralelo.

### 4.6 Isolamento no Messages Server depende do claim

O isolamento do bot/chat funciona quando o JWT tem claim (`WebSocketServer.ts:98`); conexões com token legado sem claim caem em salas sem prefixo de tenant e chamadas sem `X-Tenant-Id` derivam pelo citizenId ou caem no default. Coerente com a janela de transição — expira junto com ela.

---

## 5. Funcionalidades Ainda Pendentes

### 5.1 Jobs, crons e filas SEM contexto de tenant (maior gap funcional)

`runAsTenant` é usado **somente em middlewares** — nenhum dos 7 jobs de `src/jobs/` (notification.jobs, cleanup-orphan-files, reconcile-documents, email-counters-reset, email-server-monitor, revertExpiredDelegations, check-expired-categories) nem o worker BullMQ (`src/workers/notification.worker.ts`) estabelece contexto. Pelo fail-soft, **todos os crons operam exclusivamente sobre o tenant default**: verificação de SLA, protocolos vencidos, lembretes de pendência e notificações **nunca acontecem para o 2º município em diante**. Não é vazamento — é ausência silenciosa de funcionalidade para tenants novos, difícil de detectar.

### 5.2 Papel de plataforma inexistente (SUPER_ADMIN é por tenant)

Não existe model `PlatformUser` (0 ocorrências no schema). Os endpoints de plataforma (`/api/super-admin/tenants`) são guardados por `adminAuthMiddleware + superAdminOnly` (`super-admin.ts:2906-3020`) — ou seja, por um **papel de usuário do próprio tenant**. Qualquer tenant que venha a ter um usuário SUPER_ADMIN (por promoção de role, seed ou erro operacional) pode **listar, provisionar e suspender todos os municípios da plataforma** a partir do próprio host. Hoje o risco é mitigado porque o provisionamento cria apenas ADMIN, mas a fronteira é convenção, não arquitetura. Adicionalmente, `/api/super-admin` tem bypass no `tenantStatusMiddleware`.

### 5.3 111 models sem `tenantId` — parte deles é dado de tenant

Legitimamente globais: `Tenant`, `Person`, `Invoice`, `Lead`, catálogos de referência (EspecialidadeMedica, TipoDocumento, DestinoTFD...), infra de e-mail de plataforma. Porém há dados claramente municipais sem carimbo:

| Grupo | Models | Risco |
|---|---|---|
| Sessão/credencial | `UserSession`, `PasswordResetToken`, `PushSubscription`, `NotificationPreference` | baixo (chaveados por userId), mas fora do RLS |
| Família | `FamilyComposition`, `FamilyInvite` | médio — dados pessoais vinculados a cidadãos |
| Analytics/BI | `Analytics`, `ProtocolMetrics`, `ServiceMetrics`, `KPI`, `Report`, `ReportExecution`, `Dashboard`, `Alert`, `MetricCache`, `Prediction` | **alto** — métricas materializadas de todos os municípios se misturam |
| Workflow | `ServiceWorkflow`, `ModuleWorkflow`, `WorkflowDefinition/Instance/History` | médio — instâncias referenciam protocolos escopados, mas a tabela em si é global |
| Bot | `FlowDefinition` (`name` unique **global**), `BotAnalytics`, `MessageTemplate` | médio — todos os municípios compartilham os mesmos fluxos; personalização por município impossível |
| Biometria facial | `FaceEnrollment`, `FaceEmbedding`, `FaceRecognitionEvent`, `FaceDevice`, `FaceZone` | **alto** — dado biométrico (LGPD art. 5º II, dado sensível) sem discriminador de tenant |
| Módulo e-mail | `EmailServer`, `EmailDomain`, `EmailUser`, `EmailLog`, `ReceivedEmail`... (~13 models) | alto se e-mail for oferecido por município |
| Privacidade | `CitizenPrivacySettings` | médio |

### 5.4 SMTP Server sem nenhuma consciência de tenant

Zero ocorrências de "tenant" em `ultrazend-smtp-server/src`. Domínios de envio, DKIM, contas e caixas não são segregados por município.

### 5.5 Redis / cache / rate-limit sem namespace de tenant

- `src/lib/CacheService.ts` e `src/lib/redis.ts`: nenhuma chave namespaced por tenant — cache de um município pode servir resposta a outro se a chave não embutir um id já único;
- `src/middleware/rate-limit.ts`: limites globais por IP, não por tenant — um município sob ataque/abuso consome a cota de todos.

### 5.6 Resquício legado no frontend

`digiurban/frontend/lib/services/api.ts:21-26` envia `X-Tenant-ID` **hardcoded** (`cmhav73z00000cblg3uhyri24`, lido de localStorage com fallback fixo). O backend público ignora esse header (o middleware lê `X-Tenant-Slug`), mas: (a) é o mesmo nome de header que o `/api/internal` honra; (b) conflita com o mecanismo novo de cookie/slug; (c) é um id de banco vazado no bundle. Deve ser removido.

### 5.7 Demais pendências mapeadas

- **Billing/planos**: models `Invoice`/`Lead` existem sem motor de cobrança por tenant; onboarding é interno (não self-service) — Fase 8 do plano;
- **Observabilidade por tenant**: `request-logger.middleware.ts` não carimba tenantId nos logs de request; sem métricas/dashboards por tenant;
- **Backup/restore por tenant**: inexistente (restaurar um município = restaurar o banco todo);
- **PWA manifest por tenant** e reversão de `ignoreBuildErrors` no Next (pendências declaradas da Fase 7);
- **Cookies por domínio**: mesmo nome de cookie no domínio raiz compartilhado — troca de município no seletor depende do chokepoint de claim (funciona, mas sessão simultânea em 2 municípios no mesmo browser não é suportada de forma limpa);
- **Testes de isolamento em CI**: `smoke-tenant.ts` é execução manual; não há gate automático em pipeline.

---

## 6. Riscos Técnicos (classificados por prioridade)

| # | Risco | Prob. | Impacto | Prioridade |
|---|---|---|---|---|
| R1 | **Crons/filas cegos a tenant**: SLA, vencidos e notificações não rodam para municípios ≠ default (`src/jobs/*`, `notification.worker.ts`) | Certa (já ocorre) | Alto — funcionalidade contratada silenciosamente ausente | **P0** |
| R2 | **SUPER_ADMIN por tenant controla a plataforma** (`super-admin.ts:2906`; ausência de PlatformUser) | Baixa hoje / alta com escala | Crítico — takeover da plataforma por um tenant | **P0** |
| R3 | **Static `/uploads` sem ownership/partição**: usuário autenticado de A baixa arquivo de B conhecendo o path (`uploads-access.ts`) | Média | Alto — vazamento de documentos entre municípios | **P0** |
| R4 | **Fail-soft para default**: código assíncrono que perde ALS grava/lê no município errado sem erro (`prisma-tenant-extension.ts:45-50`; gotcha do PrismaPromise lazy documentado em `tenant-context.ts:40-44`) | Média | Alto — corrupção silenciosa de dados entre tenants | **P1** |
| R5 | **RLS dormente + `tenantId NULL` passa na política**: a 2ª camada de defesa não cobre as raw queries da própria app | Média | Médio/Alto — a defesa em profundidade prometida não está armada | **P1** |
| R6 | **Analytics/BI globais**: métricas materializadas misturam municípios (`ProtocolMetrics`, `Dashboard`, `KPI`...) | Alta quando 2º tenant ativo | Médio — dashboards de A exibem números de A+B | **P1** |
| R7 | **Biometria facial sem tenant** (`FaceEmbedding` et al.) — dado sensível LGPD compartilhando espaço de busca entre municípios | Média | Alto (regulatório) | **P1** |
| R8 | **Token legado sem claim aceito** — janela de dupla aceitação sem data de expiração definida | Média | Médio | **P2** |
| R9 | **Cache/rate-limit sem namespace** — cross-serving de cache e esgotamento de cota entre tenants | Baixa/Média | Médio | **P2** |
| R10 | **Escrita dual `municipio_config`↔`tenants`** — inconsistência de até 60s e código de sync que só cobre o default | Baixa | Baixo | **P3** |
| R11 | **Header hardcoded no frontend** (`lib/services/api.ts:22`) — confusão de contrato e id vazado | Baixa | Baixo | **P3** |

---

## 7. Fluxos Principais (mapeamento tenant-aware)

### 7.1 Login do cidadão (domínio raiz com seletor)

```
Origem: POST /api/citizen/auth/login + cookie/header X-Tenant-Slug
  ↓ tenantContextMiddleware: host=default → seleção do dropdown resolve o tenant (ACTIVE only)
  ↓ tenantStatusMiddleware: bypass (login permitido em tenant suspenso, para regularização)
  ↓ Processamento: citizen.findFirst({cpf}) — extension injeta AND tenantId → acha SÓ o cidadão do município selecionado
  ↓ Persistência: —
  ↓ Resposta: JWT com claim tenantId no cookie httpOnly
✅ Verificado: mesmo CPF em 2 municípios autentica o cidadão correto de cada um (commit c3f90be6)
⚠️ Oportunidade: cookie único no domínio raiz impede sessão simultânea em 2 municípios
```

### 7.2 Requisição admin autenticada (CRUD de protocolo)

```
Origem: POST /api/protocols + cookie digiurban_admin_token (claim tenantId)
  ↓ tenantContextMiddleware: resolve por host; claim ≠ tenant da request → 401 + AuditLog (chokepoint)
  ↓ tenantStatusMiddleware: tenant suspenso → 403 fail-closed
  ↓ adminAuthMiddleware: re-valida claim (defesa em profundidade); user lookup já escopado pela extension
  ↓ Processamento: service → prisma.protocolSimplified.create — extension injeta tenantId
  ↓ Persistência: número de protocolo via advisory lock + GUC RLS + filtro explícito (protocol-number.service.ts)
  ↓ Resposta: JSON do protocolo
✅ Ponto forte: nenhuma rota precisa lembrar de filtrar
⚠️ Buraco: se um service usar $queryRaw fora de withTenantTransaction, nem extension nem RLS filtram
```

### 7.3 Bot (Messages Server → backend)

```
Origem: WebSocket handshake (JWT com claim) OU POST /api/bot-flow/*
  ↓ Messages Server: runWithTenant(claim ou derivado do citizenId) [bot/tenant-context.ts]
  ↓ Interceptor axios: X-Tenant-Id em TODA chamada [DigiUrbanIntegration.ts:37]
  ↓ Backend /api/internal: internalAuthMiddleware (token de serviço) → internalTenantContextMiddleware
      header → citizenId lookup (runAsPlatform) → fallback default
  ↓ Processamento/Persistência: extension escopa tudo (bot_* na onda 6)
  ↓ Resposta: volta ao fluxo; salas Socket.IO prefixadas t:{tenantId}:
✅ Cadeia completa implementada
⚠️ Fallback default no passo 3 quando não há header nem citizenId (expira com a janela de transição)
```

### 7.4 Job agendado (SLA) — FLUXO QUEBRADO para tenants ≠ default

```
Origem: cron 8h (src/jobs/notification.jobs.ts)
  ↓ NotificationTriggers.checkSLAExpiring() — SEM runAsTenant
  ↓ Extension: resolveTenantId() → fail-soft DEFAULT_TENANT_ID
  ↓ Persistência/notificação: APENAS protocolos do tenant default
❌ Municípios provisionados depois não têm verificação de SLA, vencidos nem lembretes
Correção: iterar tenants ativos → runAsTenant(t.id, () => trigger()) por tenant
```

### 7.5 Provisionamento de município

```
Origem: POST /api/super-admin/tenants (SUPER_ADMIN)
  ↓ runAsPlatform + transação atômica: Tenant + ADMIN inicial (senha temporária, mustChangePassword)
  ↓ seedDefaultDepartments (8) + seedDefaultServices (7) carimbados com o tenantId novo
  ↓ Resposta: senha temporária exibida UMA vez
✅ Verificado ponta-a-ponta por HTTP (login do admin novo no host do município, rejeitado no host default)
⚠️ Guardião é role de tenant (R2); sem cadastro de domínio próprio no onboarding (aponta p/ Fase 8)
```

### 7.6 Download de arquivo de upload

```
Origem: GET /uploads/documents/... + qualquer JWT válido
  ↓ uploadsAccessMiddleware: anti-traversal + jwt.verify (autenticidade APENAS — sem tenant, sem ownership)
  ↓ express.static serve o arquivo
❌ Usuário do município A baixa arquivo do município B se souber o path
Rotas dedicadas (/api/protocols/:id/documents/:docId/download) fazem ownership — o canal estático é o problema
```

---

## 8. Oportunidades de Melhoria (arquitetura)

1. **Organização**: o padrão Router → Service é seguido de forma irregular — `super-admin.ts` tem 3.000+ linhas com lógica inline. A extração para services (como feito em `tenant-provisioning.service.ts`) deve continuar.
2. **`schema.prisma` como fonte de verdade**: o drift entre schema (`String?`) e banco (NOT NULL em 5 tabelas) é aceitável na transição, mas deve convergir — `tenantId String` obrigatório nos models núcleo tornaria o contrato visível ao TypeScript.
3. **Helper de iteração de tenants** (`forEachActiveTenant(fn)`) para jobs/crons — resolve o R1 com um padrão único auditável em vez de N correções ad hoc.
4. **Adotar `withTenantTransaction` como regra de lint** para qualquer `$queryRaw` em código de tenant (a regra ESLint da Fase 0 pode ser estendida).
5. **Sentinela anti-fail-soft**: em ambiente de teste/staging, fazer `resolveTenantId()` lançar em vez de cair no default (flag `TENANT_STRICT=1`) — transforma perda de contexto em erro visível antes de produção.
6. **Carimbar `tenantId` no `request-logger`** e nos logs Winston (child logger por request) — pré-requisito barato de observabilidade por tenant.
7. **Consolidar o TenantService como único leitor/escritor** de dados de tenant e aposentar `municipio_config` (fecha R10).

---

## 9. Recomendações Priorizadas

| Ordem | Ação | Fecha | Esforço |
|---|---|---|---|
| 1 | `runAsTenant` em todos os jobs/crons/workers via helper `forEachActiveTenant` | R1 | Baixo |
| 2 | Particionar uploads em `uploads/{tenantId}/` + ownership no static gate (ou mover para rota autenticada com lookup) | R3 | Médio |
| 3 | Criar `PlatformUser` (ou claim `platformRole` fora do espaço de tenant) e migrar os endpoints `/api/super-admin/tenants` | R2 | Médio |
| 4 | Definir e executar a expiração da janela de transição: claim obrigatório no JWT, `getByHost` fail-closed (404 em host desconhecido), `resolveTenantId` fail-closed | R4, R8 | Médio |
| 5 | Armar o RLS: GUC por request (SET LOCAL no início de cada transação da extension) ou `withTenantTransaction` nos 6 arquivos de raw query restantes; endurecer política para não aceitar `tenantId NULL` após NOT NULL geral | R5 | Médio |
| 6 | Onda 7 de `tenantId`: Analytics/BI, biometria facial, família, workflow, FlowDefinition (unique composto), CitizenPrivacySettings | R6, R7 | Alto |
| 7 | NOT NULL + schema Prisma obrigatório nos 119 models (após backfill validado) | R5 (parcial) | Médio |
| 8 | Namespace de tenant em Redis/cache + rate-limit por tenant | R9 | Baixo/Médio |
| 9 | Remover `X-Tenant-ID` hardcoded do frontend; aposentar `municipio_config` | R10, R11 | Baixo |
| 10 | Multi-tenant no módulo de e-mail e SMTP (domínios/DKIM por município) — somente se o produto for vender e-mail por tenant | 5.4 | Alto |
| 11 | Suíte de isolamento no CI como gate de merge + observabilidade/backup por tenant | Fase 9/10 | Médio |

O detalhamento em fases, com estratégia de implementação, impactos e critérios de conclusão, está em **`PLANO_MULTI_TENANT_DIGIURBAN.md`**.
