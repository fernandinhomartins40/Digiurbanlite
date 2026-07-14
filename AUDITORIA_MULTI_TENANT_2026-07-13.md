# RE-AUDITORIA MULTI-TENANT DIGIURBAN — 2026-07-13

**Data:** 2026-07-13
**Branch auditada:** `main` (HEAD `ebebc49f`)
**Escopo:** aplicação completa — backend, frontend, Messages Server, SMTP Server, Docker/deploy.
**Método:** engenharia reversa do código-fonte (schema, migrations, middlewares, extensions, rotas, serviços, jobs). Toda afirmação foi validada contra o código nesta data.
**Auditoria anterior:** `AUDITORIA_MULTI_TENANT_DIGIURBAN.md` (2026-07-10). Este documento é a re-verificação após as fases implementadas desde então.

---

## 1. Veredito

**O núcleo do SaaS multi-tenant está sólido e bem arquitetado, mas a aplicação ainda NÃO é 100% multi-tenant.**

| Severidade | Achado | Status |
|---|---|---|
| 🔴 CRÍTICO | A1 — Endpoints legados de plataforma ativos no `/super-admin` | Aberto (janela de "dupla aceitação" documentada no código, corte não executado) |
| 🔴 CRÍTICO (deploy) | A2 — RLS não armado em produção + flags de modo estrito ausentes | Aberto (checklist de deploy) |
| 🟠 ALTO | A3 — `FlowDefinition` global com CRUD por admin de tenant | Aberto |
| 🟠 ALTO | A4 — Cadastros municipais sem `tenantId` com CRUD/leitura em rotas | Aberto |
| 🟡 MÉDIO | A5 — Messages Server grava `Conversation`/`Message` com `tenantId` NULL | Aberto |
| 🟡 MÉDIO | A6 — Operações de infraestrutura de plataforma no `/super-admin` | Aberto |
| 🟢 BAIXO | A7 — SMTP/email sem noção de tenant (plataforma por domínio) | Observação |
| 🟢 BAIXO | A8 — Frontend não usa o seletor de tenant por header (`X-Tenant-Slug`) | Observação |

---

## 2. O que está CORRETO (núcleo verificado)

### 2.1 Contexto de tenant por requisição
- `digiurban/backend/src/middleware/tenant-context.ts`, registrado em `src/index.ts:121` **antes de todas as rotas**.
- Resolução por **host** (subdomínio de `TENANT_BASE_DOMAIN` + domínio custom via `Tenant.customDomain`), com cache. Nginx encaminha `Host`/`X-Forwarded-Host` (`docker/nginx.conf`) e o Express tem `trust proxy` (`index.ts:27`).
- No host default (domínio raiz), aceita seleção via header `X-Tenant-Slug` ou cookie `digiurban_tenant_slug` — **num host de tenant específico, o host tem precedência absoluta** (ninguém troca de município via header).
- **Chokepoint fail-closed de claim:** JWT assinado com `tenantId` de OUTRO tenant recebe 401 ali mesmo, antes de qualquer caminho de auth (cobre também as verificações JWT inline espalhadas nas rotas). Auditoria em `audit_logs` (`tenant_claim_mismatch`).
- Token válido **sem** claim (sessão antiga) gera telemetria sempre; com `TENANT_REQUIRE_TOKEN_CLAIM=1` exige novo login. Tokens `type='platform'` são isentos por design.

### 2.2 Enforcement automático no Prisma
- `digiurban/backend/src/lib/prisma-tenant-extension.ts`, aplicada globalmente em `src/lib/prisma.ts`.
- Cobertura via **DMMF**: todo model com campo escalar `tenantId` entra automaticamente — hoje **150 dos 231 models**.
- Escrita: injeta `tenantId` do contexto (AsyncLocalStorage) em `create`/`createMany`/`upsert.create`.
- Leitura: filtra `findMany`/`findFirst(OrThrow)`/`count`/`aggregate`/`groupBy`/`updateMany`/`deleteMany`; `findUnique(OrThrow)` é reescrito como `findFirst` escopado.
- Mutação por chave única: `update`/`delete`/`upsert` fazem **preflight de ownership** — alvo em outro tenant recebe erro com semântica P2025 (não vaza existência). Semântica fail-safe para registros criados na mesma transação.
- Contexto de plataforma (`runAsPlatform`) não filtra nem injeta; sem contexto: fail-soft para o tenant default com telemetria (`reportTenantFailSoft`), ou erro com `TENANT_STRICT=1`.

### 2.3 RLS no PostgreSQL (defesa em profundidade)
- Migrations `20260708150000_row_level_security` + `20260710160000_force_row_level_security` (política `tenant_isolation` + `FORCE` — sem FORCE o dono da tabela ignorava RLS).
- Política permissiva com GUC vazio (migrations/seeds intactos); filtra quando a app seta `app.tenant_id`.
- `withTenantTransaction` (`lib/tenant-context.ts`) usa `set_config(..., is_local=true)` — correto com pooling/PgBouncer transaction mode.
- Os `$queryRaw` sensíveis usam `withTenantTransaction`: `auto-categorization.service.ts`, `citizen-category.service.ts`, `protocol-number.service.ts`. Os raw do `super-admin.ts` são metadados de banco (ver A6).

### 2.4 Unicidade por tenant
- Migration `20260708120000_composite_tenant_uniques`: `[tenantId, email]`, `[tenantId, cpf]`, `[tenantId, matricula]` em `users`; `[tenantId, cpf]` em `citizens`; `[tenantId, name/code]` em `departments`; `[tenantId, moduleType]` em `services_simplified`.

### 2.5 Identidade, ciclo de vida e billing SaaS
- **JWTs com claim de tenant:** admin (`admin-auth.ts:178`) e cidadão (`citizen-auth.ts` — `issueCitizenSession`) emitem `tenantId` no login.
- **Console de plataforma separado:** model `PlatformUser` + `/api/platform` (`routes/platform.ts` + `middleware/platform-auth.ts`) — cookie próprio (`digiurban_platform_token`), `type: 'platform'`, `requirePlatformRole('PLATFORM_ADMIN')` para escrita. Fecha o achado R2 da auditoria anterior *no caminho novo* (mas ver A1).
- **Ciclo de vida:** `tenant-status.ts` bloqueia `SUSPENDED`/`CANCELLED`/`EXPIRED`/`INACTIVE` e `paymentStatus === 'suspended'` (403 com código `TENANT_SUSPENDED`), registrado em `/api` (`index.ts:126`).
- **Features por plano:** `middleware/require-feature.ts` lê `tenant.features`.
- **Billing por tenant:** migration `20260711120000_invoice_tenant_billing` + `platform-billing.service.ts`.

### 2.6 Uploads particionados
- Layout `/uploads/t/{tenantId}/...` com `uploads-access.ts` validando o claim `tenantId` do JWT contra o segmento do path. Prefixos públicos explícitos (`/avatars/`, `/public/`, `/branding/`).

### 2.7 Jobs e crons
- `lib/tenant-iterator.ts` (`forEachActiveTenant`) — executa cada job dentro de `runAsTenant` por tenant ACTIVE/TRIAL, falha isolada por tenant.
- **Todos os jobs verificados usam o iterador:** `notification.jobs.ts`, `check-expired-categories.job.ts`, `revertExpiredDelegations.job.ts`, `cleanup-orphan-files.job.ts`, `email-counters-reset.ts`, `email-server-monitor.ts`, `reconcile-documents.job.ts`, `workers/notification.worker.ts`. Manutenção de fila BullMQ corretamente tratada como plataforma.

### 2.8 Messages Server — propagação de tenant
- Claim `tenantId` no JWT do cidadão chega ao WebSocket (`WebSocketServer.ts:98`) → rooms `t:{tenantId}:user:{userId}` (`:208-209`).
- `bot/tenant-context.ts` (AsyncLocalStorage próprio) + interceptor axios do `DigiUrbanIntegration` injeta `X-Tenant-Id` em toda chamada interna.
- Backend: `middleware/internal-tenant-context.ts` restabelece o contexto por requisição em `/api/internal` (header → derivação por `citizenId` → default), após o `internalAuthMiddleware`.

---

## 3. ACHADOS (problemas abertos)

### A1 — 🔴 CRÍTICO: endpoints legados de plataforma ativos no `/super-admin`
**Arquivo:** `digiurban/backend/src/routes/super-admin.ts:2939-3260` (aprox.)

Um **SUPER_ADMIN de tenant** (role de usuário DO município, não operador de plataforma) ainda pode:

| Endpoint | Capacidade |
|---|---|
| `GET /api/super-admin/tenants` | listar TODOS os municípios com uso |
| `POST /api/super-admin/tenants` | **provisionar novos municípios** |
| `PATCH /api/super-admin/tenants/:id` | atualizar/suspender/reativar qualquer tenant |
| `POST /api/super-admin/tenants/:id/admins` | **criar admins em OUTROS municípios** |
| `POST /api/super-admin/tenants/:id/users/:userId/reset-password` | **resetar senha de usuários de outros tenants** |
| `PATCH /api/super-admin/tenants/:id/users/:userId` | alterar usuários de outros tenants |
| `POST /api/super-admin/tenants/:id/invoices` | criar faturas para qualquer tenant |

O código registra warn `[DEPRECATED] ... use /api/platform/tenants ... Corte previsto na Fase D/H`, mas o corte não foi executado. **Hoje, qualquer município com um SUPER_ADMIN controla a plataforma inteira.** O substituto (`/api/platform`, PlatformUser) já existe e cobre tudo via `tenant-provisioning.service.ts` compartilhado.

**Correção:** remover os endpoints legados (ver plano, Fase 1).

### A2 — 🔴 CRÍTICO (deploy): RLS não armado + modo estrito desligado
1. **Role do banco:** o RLS com `FORCE` ainda é ignorado por SUPERUSER. O usuário bootstrap da imagem Postgres é superuser. `scripts/setup-app-role.sql` cria o role `digiurban_app` (não-superuser), mas o `DATABASE_URL` vem do `.env` do VPS — **não há evidência no repositório de que a app conecta como `digiurban_app`**. Enquanto conectar como superuser, a camada RLS inteira é inerte.
2. **Flags de hardening ausentes no `docker-compose.vps.yml`:**
   - `TENANT_STRICT` — sem ela, operação Prisma sem contexto cai silenciosamente no tenant default (fail-soft).
   - `TENANT_STRICT_HOST` — host desconhecido resolve para o tenant default em vez de falhar.
   - `TENANT_REQUIRE_TOKEN_CLAIM` — sessões antigas sem claim de tenant continuam aceitas.
   A telemetria (`tenant-telemetry.ts`) existe justamente para permitir a virada; precisa ser consultada e as flags ativadas.

### A3 — 🟠 ALTO: fluxos do bot são globais com CRUD por admin de tenant
`FlowDefinition` **não tem `tenantId`**, e `routes/admin-flows.routes.ts` (auth: `authenticateToken`, admin comum) expõe `create`/`update`/`delete`/`findMany` diretos no model. Um admin municipal que edita o `menu-principal` **altera o chatbot de todos os municípios**. O seeder (`FlowDefinitionSeeder` no Messages Server) também é global.

### A4 — 🟠 ALTO: cadastros municipais sem `tenantId`
Dos ~81 models sem `tenantId`, a maioria é legítima (junction tables de pais escopados — `TeamMember`, `FieldApproval`, `ProfissionalEquipe`, `ProtocolServerAssignment`, `HealthProfessionalData` etc. — e models de plataforma — `Tenant`, `PlatformUser`, `Lead`, `Email*`). Mas os seguintes são **dado municipal real** e estão expostos em rotas:

| Model | Onde é usado | Impacto |
|---|---|---|
| `EspecialidadeMedica` | CRUD completo em `saude-cadastros.routes.ts:737-844` | escrita cross-tenant por admin municipal |
| `DestinoTFD`, `EspecialidadeTFD` | `saude-tfd.routes.ts`, `services/tfd/*` | catálogo compartilhado entre municípios |
| `ConjuntoHabitacional` | dropdown em `enums.routes.ts:206` | leitura cross-tenant |
| `AlunoRota` | `transporte-escolar.service.ts` — `count()` e `groupBy` globais (linhas 310-312); `desvincularAluno` faz `update` por id **sem checagem de dono** (linha 269) | estatísticas somam todos os municípios + mutação cross-tenant por id |
| `ConfiguracaoESUS` | `municipioId @unique` — modelagem assume 1 município | quebra estrutural com o 2º tenant |
| `TransmissaoESUS` | vinculado ao anterior | idem |
| `EspacoPublico`, `ViaturaSeguranca`, `GuiaTuristico`, `ParquePraca`, `EstabelecimentoTuristico`, `TipoDocumento`, `ProcedimentoOdonto`, `ModalidadeEsportiva`, `TipoOcorrencia`, `CursoProfissionalizante`, `ProgramaHabitacional`, `ProgramaAmbiental`, `TipoProducaoAgricola`, `MaquinaAgricola`, `EspecieArvore`, `TipoAtividadeCultural`, `TipoObraServico`, `TipoEstabelecimentoTuristico` | pouco/não usados em rotas hoje | risco latente — qualquer rota futura nasce vazando |
| `SchoolSecurityConfiguration` | 1:1 com `UnidadeEducacao` (pai escopado) | baixo — acesso via pai |
| `IndisponibilidadeAgenda`, `IndisponibilidadeProfissional`, `ProfissionalAtividade` | filhos de pais escopados (`AgendaMedica`/`User`) | baixo se sempre acessados via pai |

**Nota:** como a extension detecta cobertura via DMMF, **basta adicionar `tenantId` ao schema + migration** — nenhuma rota precisa mudar.

### A5 — 🟡 MÉDIO: Messages Server grava conversas com `tenantId` NULL
- O `ultrazend-messages-server/prisma/schema.prisma` é uma **cópia desatualizada do schema do backend, sem NENHUM campo `tenantId`** (0 ocorrências).
- `delivery/ConversationService.ts` cria `Conversation` (linha 115) e mensagens direto no banco compartilhado → linhas nascem com `tenantId = NULL`.
- No backend, `Conversation.tenantId`/`Message.tenantId` são `String?` (nullable, fora das migrations NOT NULL) e as leituras escopadas (`AND tenantId = X`) **não enxergam linhas NULL** → conversas criadas pelo Messages Server ficam invisíveis para rotas do backend e sem isolamento at-rest.
- O isolamento efetivo hoje é só por ownership (`citizenId`/`userId` do JWT nas queries) — funciona, mas é uma camada única e frágil.
- O contexto (`runWithTenant`) já existe no Messages Server; só não chega ao Prisma local.

### A6 — 🟡 MÉDIO: operações de infraestrutura de plataforma no `/super-admin`
`super-admin.ts` expõe a SUPER_ADMIN de tenant:
- `GET /system/metrics`, `GET /schema` — metadados do banco INTEIRO (todas as tabelas, contagens globais de todos os tenants).
- `POST /schema/run-migrations` — executar migrations.
- `POST /system/backup` + restore — o backup em si sai **escopado por acidente/design** (usa `findMany` que passa pela tenant extension), mas backup/restore/migrations são operações de plataforma e devem viver em `/api/platform`.

### A7 — 🟢 BAIXO: SMTP/email sem noção de tenant
O SMTP Server (`ultrazend-smtp-server`) não referencia tenant — é serviço de plataforma organizado por domínio de email (`EmailServer`/`EmailDomain`/`EmailUser` globais, aparentemente por design Ultrazend). **Não foi verificado a fundo** se as rotas `admin-email*` escopam caixas/domínios por tenant — recomenda-se checagem dedicada antes do 2º município usar email.

### A8 — 🟢 BAIXO: frontend não usa o seletor de tenant por header
Nenhuma ocorrência de `X-Tenant-Slug`/`digiurban_tenant_slug` no frontend. A resolução funciona exclusivamente por subdomínio (modelo atual, ok). Consequência: cadastro/login de cidadão feito no **domínio raiz** cai no tenant default. Se o produto quiser "um domínio, dropdown de municípios", falta a integração no frontend (o backend já suporta).

---

## 4. Riscos residuais estruturais (aceitos/monitorar)

1. **Nested writes com `connect`:** a extension não intercepta `connect` de relação para registro de outro tenant (ex.: body com `serviceId` alheio). Mitigado na prática porque as rotas validam FKs com `findFirst` (escopado) e o RLS cobre quando armado — mais um motivo para o A2.
2. **Fail-soft do host default:** qualquer host não reconhecido opera como tenant default até `TENANT_STRICT_HOST=1`.
3. **`groupBy` de models não escopados** não é filtrável por RLS nem extension — resolvido pela wave de `tenantId` (A4).
4. **Cache de host→tenant** no `TenantService`: suspensão de tenant pode levar o TTL do cache para refletir (verificar TTL se houver requisito de corte imediato).

---

## 5. Conclusão

A fundação (contexto por request, extension DMMF, RLS, uniques compostas, claims JWT, console de plataforma, jobs por tenant, uploads particionados, billing/status/features) está **implementada corretamente e com qualidade acima da média**. O que falta é o **fechamento do ciclo**: cortar a janela de dupla aceitação (A1), armar o RLS e o modo estrito em produção (A2), e completar a cobertura de `tenantId` nos models retardatários (A3/A4/A5).

O plano completo de correção está em `PLANO_CORRECAO_MULTI_TENANT_2026-07-13.md`.
