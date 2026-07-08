# AUDITORIA COMPLETA — PLATAFORMA DIGIURBAN

> **Versão:** 1.0 · **Data:** 2026-07-07
> **Escopo:** Engenharia reversa e auditoria técnica da base de código atual (single-tenant), com foco em preparação para evolução Multi-Tenant SaaS.
> **Fonte de verdade:** código-fonte. Divergências com a documentação (`CLAUDE.md`) estão registradas na seção 10.

---

## Sumário

1. [Visão Geral da Arquitetura Atual](#1-visão-geral-da-arquitetura-atual)
2. [Auditoria Arquitetural](#2-auditoria-arquitetural)
3. [Auditoria de Banco de Dados](#3-auditoria-de-banco-de-dados)
4. [Auditoria de Segurança](#4-auditoria-de-segurança)
5. [Auditoria do Backend](#5-auditoria-do-backend)
6. [Auditoria do Frontend](#6-auditoria-do-frontend)
7. [Auditoria de Fluxos](#7-auditoria-de-fluxos)
8. [Auditoria de Infraestrutura](#8-auditoria-de-infraestrutura)
9. [Auditoria de Preparação para Multi-Tenant](#9-auditoria-de-preparação-para-multi-tenant)
10. [Inconsistências entre Documentação e Código](#10-inconsistências-entre-documentação-e-código)
11. [Conclusão e Veredito](#11-conclusão-e-veredito)

---

## 1. Visão Geral da Arquitetura Atual

### 1.1 Topologia (verificada no código, não na documentação)

O `docker-compose.vps.yml` revela **8 containers**, mais do que os 4 serviços documentados:

| Container | Porta | Função | Evidência |
|---|---|---|---|
| `digiurban-vps` | 3060→80 | Nginx + Backend Express (3001) + Frontend Next.js (3000) via supervisord | `Dockerfile`, `docker/supervisord.conf` |
| `digiurban-postgres` | 5432 | PostgreSQL 15 (banco único compartilhado) | compose L3-13 |
| `digiurban-redis` | 6379 | Redis 7 (cache, BullMQ, Socket.IO adapter) | compose L24-27 |
| `ultrazend-messages` | 9001 | Socket.IO + Bot Engine (FlowEngine) | compose L121-123 |
| `ultrazend-smtp` | 25, 587 | MX + Submission SMTP com DKIM | compose L43-46 |
| `digiurban-llamacpp` | 18080→8080 | Inferência LLM local (llama.cpp server) | compose L71-101 |
| `digiurban-ai` | 9004 | Serviço de IA (proxy consumido via `/api/ai`) | compose L227-229 |
| `ultrazend-face` | 9006 | Plataforma de reconhecimento facial (segurança escolar) | compose L176-178 |

O backend ainda faz proxy para dois serviços externos adicionais (`digiurban-prices` e `digiurban-flow`) via `src/routes/prices-proxy.routes.ts` e `flow-proxy.routes.ts` ([index.ts:176-179](digiurban/backend/src/index.ts#L176-L179)).

### 1.2 Estilo arquitetural

- **Monolito modular** no backend: Express 5 + Prisma, um único processo, ~65 registros de rota via helper `loadRoute()` com try/catch individual ([index.ts:148-170](digiurban/backend/src/index.ts#L148-L170)).
- **Frontend monolítico** Next.js 14 App Router com **249 páginas** (`find app -name page.tsx` = 249).
- **Banco único compartilhado** entre Backend, Messages Server e SMTP Server (três clients Prisma distintos apontando para o mesmo PostgreSQL) — acoplamento por banco de dados, padrão *shared database integration*.
- **Comunicação inter-serviços:** HTTP com token estático (`DIGIURBAN_SERVICE_TOKEN`, [internal-auth.ts:10](digiurban/backend/src/middleware/internal-auth.ts#L10)) + Socket.IO com Redis adapter.

### 1.3 Dimensões da base de código

| Métrica | Valor | Evidência |
|---|---|---|
| Models Prisma | **229** | `grep -c "^model " schema.prisma` |
| Linhas do schema | 8.927 | `wc -l schema.prisma` |
| Migrations | 45 | `ls prisma/migrations` |
| Arquivos de rota backend | ~100 | `ls src/routes` |
| Linhas totais em `src/routes/` | **~60.123** | `wc -l src/routes/*.ts` |
| Índices declarados (`@@index`) | 542 | grep no schema |
| Campos `Json` | 236 | grep no schema |
| Páginas frontend | 249 | find `app/**/page.tsx` |
| Hooks frontend | 45 (`hooks/`) + 4 (`src/hooks/`) | ls |

---

## 2. Auditoria Arquitetural

### 2.1 Pontos fortes

1. **Registro de rotas resiliente e padronizado** — o helper `loadRoute()` com try/catch e log estruturado impede que um módulo quebrado derrube o boot ([index.ts:148-170](digiurban/backend/src/index.ts#L148-L170)).
2. **Middlewares de autenticação bem separados por contexto**: `admin-auth.ts`, `citizen-auth.ts`, `super-admin-auth.ts`, `internal-auth.ts` — cada superfície de ataque tem seu guard próprio.
3. **Camada de serviços existente e rica** (~60 serviços em `src/services/`, incluindo subdomínios organizados: `farmacia/`, `prontuario/`, `cadunico/`, `matricula/`).
4. **Validação de configuração fail-fast**: o boot aborta se `JWT_SECRET` não existir ([index.ts:17-20](digiurban/backend/src/index.ts#L17-L20)).
5. **Logging estruturado** com Winston (`request-logger.middleware`, `logger.config`), substituindo Morgan.
6. **Error handler global** que garante respostas JSON e não vaza mensagens de erro 500 em produção ([error-handler.ts:25-28](digiurban/backend/src/middleware/error-handler.ts#L25-L28)).

### 2.2 Problemas encontrados

#### P1 — Lógica de negócio massivamente concentrada nas rotas (severidade: ALTA)

`src/routes/` soma **~60 mil linhas**; 71 dos ~100 arquivos de rota usam `prisma.*` diretamente, contornando a camada de serviços. Exemplos extremos:

| Arquivo | Linhas |
|---|---|
| `super-admin.ts` | 2.871 |
| `protocols-simplified.routes.ts` | 2.555 (existe `protocol-simplified.service.ts` paralelo) |
| `saude-cadastros.routes.ts` | 2.546 |
| `admin-management.ts` | 2.339 |
| `citizen-protocols.ts` | 1.978 |

**Impacto para Multi-Tenant:** cada query Prisma inline em rota é um ponto onde o filtro de tenant precisaria ser adicionado manualmente — milhares de pontos de falha. Este é o principal argumento para a estratégia de filtro automático (Prisma Extension + RLS) recomendada no plano.

#### P2 — Fail-soft no carregamento de rotas (severidade: MÉDIA)

Se um módulo de rota falha o `require()`, o servidor sobe **sem aquele prefixo** — o erro vira 404 silencioso para o cliente. Aceitável em dev, perigoso em produção (deploy "bem-sucedido" com funcionalidade faltando). Recomendação: em `NODE_ENV=production`, acumular falhas e abortar o boot (ou expor no `/health`).

> **STATUS (2026-07-07):** o middleware de status/limites foi **reescrito e reativado** como `tenant-status.ts` — agora fail-closed, por tenant, registrado em `/api` e verificado por HTTP (suspensão bloqueia acesso ao município, preserva login e plataforma). Os `.original/.backup` e codemods `fix-*.js` seguem pendentes de remoção (limpeza da Fase 10).

#### P3 — Código morto e artefatos de desenvolvimento versionados (severidade: MÉDIA)

- `src/services/entity-handlers.ts.original`, `module-workflow.service.ts.backup`, `src/_deprecated/`
- Frontend: `comment-legacy-imports.js`, `fix-legacy-hooks-imports.js`, `fix-missing-department-type.js`, `fix-module-configs.js`, `replace-specialized-urls.js`, `frontend-ts-errors.txt`, logs `dev-sidebar-3002.*.log` na raiz.
- **Middlewares `checkMunicipioStatus` e `checkUsageLimits` nunca são registrados** (grep em todo o backend: zero usos fora do próprio arquivo [municipio-status.ts](digiurban/backend/src/middleware/municipio-status.ts)). Toda a lógica de suspensão/limites de plano do `MunicipioConfig` está **inerte**.

#### P4 — Duplicação estrutural no frontend (severidade: MÉDIA)

Coexistem `digiurban/frontend/components/` **e** `digiurban/frontend/src/components/` (com subpastas de mesmo nome: `admin/`, `bot/`, `citizen/`, `ui/`, `Messages/`, `CitizenCategories/`), além de `hooks/` (45) e `src/hooks/` (4). Também há `services/`, `shared/`, `utils/` na raiz e dentro de `src/`. Isso confunde imports, dificulta tree-shaking e contradiz a documentação.

#### P5 — Três clientes HTTP concorrentes no frontend (severidade: MÉDIA)

- `lib/api.ts` — classe `ApiClient` baseada em fetch
- `lib/api-client.ts` — objeto `apiClient` baseado em fetch com sanitização própria de path
- Axios (dependência declarada e citada na documentação)

Cada um trata erros e base URL de forma diferente (`api-config.ts` vs `process.env.NEXT_PUBLIC_API_URL` hardcoded em `api-client.ts:10-15`). Para multi-tenant, a resolução de tenant precisará ser implementada em **um único** ponto de saída HTTP.

#### P6 — Acoplamento por banco compartilhado entre serviços (severidade: MÉDIA)

Backend, Messages Server e SMTP Server compartilham o mesmo PostgreSQL com schemas Prisma próprios. Mudanças de schema exigem sincronizar três codebases. O Messages Server também valida JWT com o **mesmo `JWT_SECRET`** do backend ([WebSocketServer.ts:87](ultrazend-messages-server/src/server/WebSocketServer.ts#L87)) — rotação de segredo é operação acoplada.

### 2.3 Avaliação de coesão/acoplamento

| Dimensão | Nota | Comentário |
|---|---|---|
| Modularização de domínios | 7/10 | Domínios claros (saúde, educação, protocolos, email, bot), mas fronteiras vazam nas rotas |
| Separação de responsabilidades | 4/10 | Camada de serviço existe mas é contornada em 71 arquivos de rota |
| Acoplamento entre serviços | 5/10 | Banco compartilhado + JWT compartilhado |
| Reutilização | 6/10 | Bons utilitários; duplicação no frontend |
| Manutenibilidade | 5/10 | Arquivos de 2-3k linhas; artefatos mortos |

---

## 3. Auditoria de Banco de Dados

### 3.1 Pontos fortes

1. **PKs `cuid()`** em praticamente todos os models — não sequenciais, não enumeráveis, seguros para URLs e prontos para merge de dados multi-tenant (sem colisão entre bancos).
2. **542 índices declarados** — cobertura consciente (ex.: `UserSession` indexa `[userId, isActive]`, `UserDepartment` indexa `[userId, isPrimary]`).
3. **157 usos de `onDelete`** com estratégias deliberadas (`Cascade` para dados dependentes, `SetNull` para vínculos opcionais como `User.personId`).
4. **Convenção `@@map` snake_case** consistente para nomes físicos de tabela.
5. **Modelo de identidade unificado** (`Person` como âncora de `User` e `Citizen` via `personId`) — reduz duplicação de pessoas físicas.
6. **45 migrations versionadas** — histórico rastreável, sem uso de `db push` destrutivo aparente.

### 3.2 Problemas encontrados

#### B1 — Ausência total de discriminador de tenant (esperado, mas dimensiona o trabalho)

`grep municipalityId|tenantId` no schema: **0 ocorrências em 229 models**. Todo dado é implicitamente "do município".

#### B2 — Constraints únicas globais que quebram em multi-tenant (severidade: CRÍTICA para a migração)

| Model | Constraint atual | Problema multi-tenant |
|---|---|---|
| `Citizen` | `@@unique([cpf])` ([schema:427](digiurban/backend/prisma/schema.prisma#L427)) | O mesmo cidadão não poderia existir em dois municípios |
| `User` | `email @unique`, `cpf @unique`, `matricula @unique` | Servidor não pode atuar em dois municípios; matrícula é única *por prefeitura*, não global |
| `Department` | `name @unique`, `code @unique` ([schema:301-302](digiurban/backend/prisma/schema.prisma#L301-L302)) | Toda prefeitura tem "Secretaria de Saúde" |
| `MunicipioConfig` | `id @default("singleton")` ([schema:14](digiurban/backend/prisma/schema.prisma#L14)) | Singleton por construção |

Todas precisarão virar uniques compostas `[tenantId, campo]`.

#### B3 — `Citizen.municipioId String?` órfão (severidade: BAIXA, sinal relevante)

Campo existe ([schema:343](digiurban/backend/prisma/schema.prisma#L343)) **sem relação, sem índice e sem uso consistente** — vestígio de uma arquitetura multi-tenant anterior que foi removida. Confirma que a migração já foi tentada/revertida; o plano deve decidir reutilizá-lo ou substituí-lo (recomendação: substituir por `tenantId` padronizado em todas as tabelas).

#### B4 — Uso extensivo de `Json` sem validação de schema (236 campos)

`ServiceSimplified.formSchema`, `Citizen.address`, `User.endereco`, `FlowDefinition.nodes`, `MunicipioConfig.configuracoes/features`, `UserPreferences.dashboardLayout`… Flexível, mas: sem constraint no banco, sem type-safety no Prisma, invalidável apenas na aplicação (Zod/Joi cobrem parte). Em multi-tenant, `features`/`configuracoes` por tenant vão crescer — recomenda-se documentar contratos Zod para cada campo Json crítico.

#### B5 — Convenção de nomes de migration inconsistente

Mistura de timestamps completos (`20260106023614_...`) e datas parciais (`20260119_add_bot_fields_backend`, `20260123_add_external_documents`). Datas parciais ordenam **antes** do timestamp completo do mesmo dia, o que pode alterar a ordem de aplicação em bancos recriados. Padronizar daqui em diante.

#### B7 — Histórico de migrations quebrado para instalações novas (severidade: ALTA) ✅ parcialmente reparado

**Comprovado empiricamente** (banco PostgreSQL efêmero + `prisma migrate deploy`): a cadeia de 45 migrations **não aplica em banco vazio**. Tabelas como `digital_certificates` e `profissional_saude` não são criadas por **nenhuma** migration — foram criadas em produção via `prisma db push` (drift de histórico). Migrations posteriores que as alteram sem guarda condicional (ex.: `20260125_add_encrypted_private_key`) abortam o deploy. Consequências: instalação nova só funciona via `db push`; a Fase 2 do plano multi-tenant (ondas de migrations) exige histórico saudável.
**Reparo COMPLETO aplicado (2026-07-07):** 8 migrations tornadas condicionais/idempotentes (`20260125`, `20260131_add_profissional_especialidade`, `20260131155959`, `20260202100000`, `20260202110000`, `20260203_rename_teamid`, `20260223000000`, `20260305213000`) + **migration de baseline** `20260707130000_baseline_drift_repair` (gerada via `prisma migrate diff --from-migrations --to-schema-datamodel`, ~2.7k linhas) que cria os 61 objetos drift. **Verificado:** `migrate deploy` em banco vazio aplica as 48 migrations e converge ao schema (única diferença residual: superset deliberado do enum `ClassificacaoRisco`). ⚠️ Operação em produção: marcar a baseline como aplicada com `npx prisma migrate resolve --applied 20260707130000_baseline_drift_repair` ANTES do próximo deploy (instruções no cabeçalho da migration). Bonus do fail-fast: 3 registros de rota quebrados descobertos — `custom-modules` e `saude-atendimento.routes` **não existem no repositório** (removidos de index.ts; nota: CLAUDE.md documenta os ~52 endpoints de atendimento — drift doc-código) e imports com extensão `.js` em `services/tfd|farmacia/index.ts` quebravam ts-node (corrigidos).

**Causa-raiz identificada (2026-07-07):** [docker/startup.sh](docker/startup.sh) executa `migrate deploy` em todo boot e, em caso de falha, **cai silenciosamente para `prisma db push --accept-data-loss`** — além de marcar automaticamente como *rolled-back* toda migration que falhou. Ou seja: migrations quebradas nunca bloquearam o deploy; o `db push` "consertava" o schema por fora e o histórico apodrecia. Mitigação aplicada: startup agora detecta banco legado e marca a baseline como aplicada (`migrate resolve --applied`) automaticamente; o fallback `db push` foi mantido por compatibilidade, mas com alerta explícito de que disparar = investigar. Recomendação Fase 9: remover o fallback definitivamente no pipeline de migrations dedicado.

#### B8 — ESLint do backend quebrado (severidade: MÉDIA) ✅ reparado

`eslint.config.js` referenciava a regra inexistente `@typescript-eslint/prefer-const` (é regra core do ESLint) — **toda execução de lint abortava com TypeError**, ou seja, o lint nunca rodou de fato no backend. Corrigido para `prefer-const`.

#### B6 — Hot spots de contenção previsíveis

`ProtocolSimplified` é o hub do sistema (relacionado a User, Citizen, Department, Service, SLA, Stage, Document, Interaction, Pending, DataField, Evaluation…). Com N municípios no mesmo banco, os índices desta família de tabelas devem ser os primeiros a receber `tenantId` como coluna líder.

### 3.3 Resposta direta: a estrutura atual facilita ou dificulta Multi-Tenant?

**Facilita mais do que dificulta**, com ressalvas:

- ✅ PKs cuid, FKs consistentes, migrations versionadas, Prisma como camada única de acesso — a mecânica de adicionar `tenantId` é repetitiva mas segura.
- ✅ `MunicipioConfig` já modela plano/limites/features — vira a tabela `Tenant` quase sem redesenho.
- ⚠️ 229 models = esforço de migração grande porém mecânico (script de geração de migration é viável).
- ❌ Uniques globais (B2) e lógica nas rotas (P1) são os dois verdadeiros obstáculos.

---

## 4. Auditoria de Segurança

### 4.1 Pontos fortes (verificados)

| Controle | Evidência |
|---|---|
| JWT em cookie httpOnly, `secure` em produção, `sameSite: lax`, expiração 1h | [admin-auth.ts (rota):183-191](digiurban/backend/src/routes/admin-auth.ts#L183-L191) |
| Rate limiting em 3 camadas: global 100 req/min, login, registro | [rate-limit.ts](digiurban/backend/src/middleware/rate-limit.ts), [index.ts:77](digiurban/backend/src/index.ts#L77) |
| Account lockout (campos `failedLoginAttempts`, `lockedUntil` em User e Citizen + middleware `account-lockout.ts`) | schema + `super-admin.ts:96` |
| Helmet com CSP customizada | [index.ts:30-45](digiurban/backend/src/index.ts#L30-L45) |
| CORS com whitelist estrita e log de origens bloqueadas | [index.ts:48-75](digiurban/backend/src/index.ts#L48-L75) |
| `trust proxy = 1` correto para rate limit atrás do Nginx | [index.ts:27](digiurban/backend/src/index.ts#L27) |
| Upload seguro: whitelist MIME, extensões bloqueadas, checagem de magic numbers maliciosos (EXE/ELF), nomes com crypto | [secure-upload.ts](digiurban/backend/src/middleware/secure-upload.ts) |
| Error handler que só expõe mensagem em dev/4xx | [error-handler.ts](digiurban/backend/src/middleware/error-handler.ts) |
| Chave privada de certificado criptografada AES-256-GCM (`CERTIFICATE_ENCRYPTION_KEY`) | `encryption.service.ts`, migration `20260125_add_encrypted_private_key` |
| Token de serviço dedicado para chamadas internas | [internal-auth.ts](digiurban/backend/src/middleware/internal-auth.ts) |

### 4.2 Vulnerabilidades e fragilidades, por prioridade

#### 🔴 PRIORIDADE ALTA

**S1 — `/uploads` servido estaticamente sem autenticação.**
`app.use('/uploads', express.static(...))` ([index.ts:103](digiurban/backend/src/index.ts#L103)) e `location /uploads/` no Nginx ([nginx.conf:179](docker/nginx.conf#L179)) servem qualquer arquivo a quem tiver a URL. Nomes randômicos (crypto) mitigam enumeração, mas URLs vazam (logs, e-mails, histórico). Documentos de protocolo têm rota autenticada dedicada no Nginx (L85), porém o diretório inteiro continua exposto. **Em multi-tenant isso vira vazamento cross-tenant imediato.** Ação: mover downloads para endpoint autenticado com verificação de ownership; bloquear `/uploads/` direto.

**S2 — Auditoria não sistemática.**
O middleware `auditLog()` apenas faz `console.log` — a persistência em `AuditLog` está **comentada** ([admin-auth.ts:391-413](digiurban/backend/src/middleware/admin-auth.ts#L391-L413)). O model `AuditLog` existe e é usado pontualmente (11 arquivos), mas operações críticas (mudança de role, exclusão de usuário, alteração de protocolo) não têm trilha garantida. Para um SaaS governamental, auditoria é requisito legal (LGPD art. 37+).

**S3 — Endpoints de super-admin executam operações de infraestrutura via HTTP.**
`POST /super-admin/system/backup/:fileName/restore` e `POST /super-admin/schema/run-migrations` ([super-admin.ts:692,958](digiurban/backend/src/routes/super-admin.ts#L692)). Um único JWT comprometido de SUPER_ADMIN permite restaurar backup arbitrário ou rodar migrations. Ação: exigir segundo fator/step-up auth, IP allowlist e trilha de auditoria imutável para esses endpoints; idealmente removê-los do plano de dados HTTP.

**S4 — Logs de debug de autenticação em produção.**
`[AUTH DEBUG]` com método, URL e presença de token em **cada request** autenticada ([admin-auth.ts:26-38](digiurban/backend/src/middleware/admin-auth.ts#L26-L38)). Ruído, custo e risco de vazamento em agregadores de log. Remover ou condicionar a `NODE_ENV`.

#### 🟡 PRIORIDADE MÉDIA

**S5 — `citizen-auth` aceita token de admin como fallback** ([citizen-auth.ts:22-26](digiurban/backend/src/middleware/citizen-auth.ts#L22-L26)). Intencional (servidor operando em nome do cidadão), mas sem registro de auditoria de "acesso por representação" (*impersonation*). Em multi-tenant, um admin do município A não pode virar "cidadão" no município B — este fallback precisa de verificação de tenant.

**S6 — RBAC hardcoded.** `getRolePermissions()` é uma função estática no middleware ([admin-auth.ts:285-373](digiurban/backend/src/middleware/admin-auth.ts#L285-L373)). Sem persistência, sem customização por município, sem granularidade real por departamento (apenas o `addDataFilter` heurístico). Nota: `SUPER_ADMIN` já possui a permissão vestigial `tenants:manage`.

**S7 — CSP permissiva:** `script-src 'unsafe-inline' 'unsafe-eval'` ([index.ts:34](digiurban/backend/src/index.ts#L34)). Necessário para Next.js hoje, mas planejar nonces.

**S8 — JWT_SECRET único compartilhado** entre backend e messages-server; sem rotação, sem `kid`. Cookies de admin e super-admin usam o **mesmo cookie** (`digiurban_admin_token`) — a elevação é só o campo `role` no banco.

**S9 — Fail-open declarado** em `checkMunicipioStatus` (catch → `next()`, [municipio-status.ts:82-86](digiurban/backend/src/middleware/municipio-status.ts#L82-L86)). Hoje irrelevante (middleware não registrado), mas o padrão não deve ser replicado no enforcement de tenant — ali o correto é **fail-closed**.

**S10 — Sessões não revogáveis:** `UserSession` existe no schema, mas o `adminAuthMiddleware` valida apenas o JWT + `isActive` do usuário — não consulta a tabela de sessões. Logout/revogação de sessão individual não invalida o token até expirar (1h).

#### 🟢 PRIORIDADE BAIXA

- `Invoice`/`Lead` sem uso aparente nas rotas (superfície morta).
- `body-parser` com limite 50mb global (JSON) — alto para endpoints comuns; restringir por rota.
- Divulgação de `currentRole` em respostas 403 do super-admin-auth (enumeração de privilégio menor).

---

## 5. Auditoria do Backend

### 5.1 Camadas encontradas vs. ideais

| Camada | Estado | Observação |
|---|---|---|
| Rotas (Controllers) | ⚠️ Hipertrofiadas | 60k linhas, validação + negócio + Prisma inline |
| Services | ✅ Presente, subutilizada | ~60 serviços bem nomeados; rotas os contornam |
| Repositories | ❌ Inexistente | Prisma é chamado direto (aceitável com Prisma, desde que via services) |
| Models | ✅ Prisma schema única fonte | 229 models |
| Policies | ❌ Difusa | `requirePermission`/`requireMinRole`/`addDataFilter` no middleware; sem policy por recurso |
| Middlewares | ✅ Bom conjunto | auth ×4, rate-limit, lockout, upload, validação, error handler, logger |
| Jobs | ✅ Presente | `src/jobs/` (ex.: `email-counters-reset.ts`) + BullMQ/workers |
| Events | ⚠️ Implícito | Socket.IO + notification-triggers; sem barramento de eventos formal |

### 5.2 Responsabilidades incorretas identificadas

1. **`super-admin.ts` (2.871 linhas)** mistura: auth, CRUD de usuários, configuração municipal, features, limites, backup/restore, migrations, leitura de logs do sistema, auditoria e SSE de logs. São no mínimo 6 módulos distintos.
2. **Duplicação de registro:** `/api/admin/email` e `/api/admin/email-service` carregam **o mesmo arquivo** `admin-email.ts` ([index.ts:302-303](digiurban/backend/src/index.ts#L302-L303)) — alias intencional ou resíduo; documentar ou remover.
3. **Prefixos sobrepostos:** cinco `loadRoute('/api/protocols', ...)` distintos + `loadRoute('/api', ...)` genéricos (`dynamic-services`, `protocol-data-fields`, `document-templates`) tornam a resolução de rota dependente da ordem de registro — frágil.
4. **`addDataFilter`** injeta filtros em `(req as any).dataFilters` — contrato não tipado, cada rota decide se aplica. Enforcement opcional = enforcement inexistente.

### 5.3 Oportunidades de simplificação

- Extrair validação Zod/Joi para schemas por recurso (há mistura de Zod e Joi — padronizar em Zod, que já domina o frontend).
- Consolidar os quatro middlewares de auth em um `authenticate(contexts: ...)` parametrizado, mantendo wrappers finos.
- Introduzir convenção `Router → Service → Prisma` como regra de lint (ex.: proibir import de `lib/prisma` em `src/routes/**` via ESLint `no-restricted-imports`) — pré-requisito prático para o multi-tenant.

---

## 6. Auditoria do Frontend

### 6.1 Estado geral

- **249 páginas** em `app/` (raiz do pacote, **não** `src/app/` como documenta o CLAUDE.md).
- App Router, shadcn/ui, TanStack Query, react-hook-form + Zod — stack moderna e adequada.
- `middleware.ts` protege `/admin/*` apenas verificando **presença** do cookie (design correto: validação real no backend; comentário explícito no código).
- PWA configurada; `ignoreBuildErrors: true` e `ignoreDuringBuilds: true` — o type-check não bloqueia build (existe `frontend-ts-errors.txt` versionado com erros conhecidos).

### 6.2 Problemas

| # | Problema | Impacto |
|---|---|---|
| F1 | Duplicação `components/` vs `src/components/`, `hooks/` vs `src/hooks/`, `services/`, `utils/`, `shared/` em dois níveis | Imports ambíguos, dead code invisível |
| F2 | 3 clientes HTTP (`lib/api.ts`, `lib/api-client.ts`, axios) com regras de base-URL divergentes | Ponto único de injeção de tenant inexistente |
| F3 | Build ignora erros TS/ESLint | Regressões silenciosas; arriscado durante refactor multi-tenant |
| F4 | Scripts codemod `fix-*.js` e logs de dev versionados na raiz | Higiene do repositório |
| F5 | `NEXT_PUBLIC_*` resolvidas em **build time** no Dockerfile | Impede white-label/branding por tenant em runtime (uma imagem por cliente seria necessária) |
| F6 | 249 páginas com templates por secretaria — muita duplicação estrutural entre os 21 departamentos | Mudanças transversais custam 21× |

### 6.3 Pontos fortes

- Convenções de UX documentadas e visíveis no código (WYSIWYG TipTap com extensões custom, `iframe srcDoc` para previews, páginas dedicadas > modais).
- Server state 100% em TanStack Query/SWR, sem store global desnecessário.
- Sistema de temas via CSS variables HSL — **base excelente para theming por tenant** (basta injetar variáveis por município).

---

## 7. Auditoria de Fluxos

### 7.1 Fluxo: Abertura de protocolo pelo cidadão (portal)

```
Origem: /cidadao/servicos → formulário dinâmico (ServiceSimplified.formSchema JSON)
  ↓ Processamento: citizen-services.ts / protocols-simplified.routes.ts
      • citizenAuthMiddleware (cookie digiurban_citizen_token)
      • validação do formSchema · protocol-number.service (numeração)
  ↓ Persistência: ProtocolSimplified (+ ProtocolDataField, ProtocolDocument via secure-upload,
      ProtocolSLA calculado, ProtocolHistorySimplified)
  ↓ Integrações: notification.service → Notification + Web Push + SSE (/api/notifications)
      Socket.IO (admin :3001/api/socket)
  ↓ Resposta: { protocol } JSON; acompanhamento em /cidadao/protocolos
```

### 7.2 Fluxo: Abertura de protocolo pelo bot (DigiBot)

```
Origem: widget chat → Messages Server :9001 POST /api/bot-flow/message
  ↓ FlowEngineService → FlowEngine (nós: menu/question/form/action…)
      • fluxo solicitar-servico.json · IA (llama.cpp via digiurban-ai) p/ texto livre
  ↓ ActionHandlers → DigiUrbanIntegration → Backend /api/internal (Bearer DIGIURBAN_SERVICE_TOKEN)
  ↓ Persistência: mesma família ProtocolSimplified + BotConversation/BotMessage/FlowExecution
  ↓ Resposta: mensagens do bot via Socket.IO (room user:{id}:CITIZEN)
```

**Achado:** o caminho interno (`/api/internal`, 1.498 linhas) reimplementa parte das regras do caminho portal. Dois caminhos de escrita para o mesmo agregado = risco de divergência de regra de negócio (ex.: SLA calculado num caminho e não no outro). Unificar em serviços compartilhados antes do multi-tenant.

### 7.3 Fluxo: Tramitação e conclusão

```
VINCULADO → PROGRESSO → CONCLUIDO/CANCELADO (+ PENDENCIA/ATUALIZACAO → PROGRESSO)
Matriz por role em config/protocol-status.config.ts · concludedAt marca término
ProtocolServerAssignment + currentAssignedUserId · ProtocolStage por workflow
Avaliação: ProtocolEvaluationSimplified (rating 0-5)
```

### 7.4 Fluxo: Documento oficial assinado

```
Template (DocumentTemplate WYSIWYG) → GeneratedDocument → detecção .signature-placeholder
→ DigitalCertificate do sistema (userId=null, citizenId=null, ACTIVE)
→ decrypt AES-256-GCM → assinatura PDF → isSigned=true
⚠️ Falha de assinatura é silenciosa (documento sai sem assinatura) — deveria ao menos auditar
```

### 7.5 Fluxo: Email

```
Recebimento: MX :25 → ReceivedEmailService → ReceivedEmail (banco compartilhado)
Envio: /admin/email → EmailSenderService → Submission :587 → DKIM → MX destino
Modelos: EmailServer/EmailDomain/EmailUser/EmailPlanConfig — já modelados "por domínio",
o subsistema de email é o mais próximo de multi-tenant que existe hoje na plataforma.
```

---

## 8. Auditoria de Infraestrutura

### 8.1 Achados

1. **Single-box por design:** `digiurban-vps` empacota Nginx + backend + frontend num único container com supervisord. Escala apenas vertical; um crash de supervisord derruba as três camadas.
2. **Nginx como único roteador**: `/api → backend`, `/socket.io → messages`, `/messages-api → messages`, `/uploads` direto, `/ → frontend` ([nginx.conf:53-187](docker/nginx.conf#L53-L187)). Ponto natural para futura resolução de tenant por host.
3. **Postgres e Redis sem réplica/backup automatizado externo** — backup é feito via endpoint HTTP do super-admin (S3 do achado de segurança S3 acima).
4. **Estado em disco local:** `uploads/`, backups e logs vivem no filesystem do container/volume — obstáculo para escala horizontal e para isolamento por tenant.
5. **llama.cpp/AI/face** já isolados em containers próprios — bom precedente de decomposição.

---

## 9. Auditoria de Preparação para Multi-Tenant

### 9.1 O que JÁ está preparado (herança da versão multi-tenant anterior)

| Item | Evidência |
|---|---|
| Tabela de tenant embrionária com plano, limites, features, suspensão, pagamento | `MunicipioConfig` ([schema:13-36](digiurban/backend/prisma/schema.prisma#L13-L36)) |
| Middlewares de enforcement de status/limites de plano (prontos, só desligados) | [municipio-status.ts](digiurban/backend/src/middleware/municipio-status.ts) |
| Permissão `tenants:manage` no SUPER_ADMIN | [admin-auth.ts:366](digiurban/backend/src/middleware/admin-auth.ts#L366) |
| Comentários "Single tenant: verificação de tenant removida" nos dois middlewares de auth | admin-auth.ts:60, citizen-auth.ts |
| Campo `Citizen.municipioId` remanescente | schema:343 |
| PKs cuid não sequenciais | todo o schema |
| Painel `/super-admin` com gestão de município, features, limites e auditoria | `super-admin.ts` |
| Subsistema de e-mail já multi-domínio | `EmailDomain`, `EmailPlanConfig` |
| Theming por CSS variables | frontend |

### 9.2 O que exige alteração (mapa de impacto)

| Área | Impacto | Esforço |
|---|---|---|
| **Banco** | `tenantId` em ~150-180 models "raiz e quentes" (nem todos os 229 — tabelas filhas herdam via FK, mas coluna direta é recomendada nas consultadas com frequência); conversão de ~10 uniques globais em compostas; índices `[tenantId, ...]` | ALTO (mecânico) |
| **Backend** | Contexto de tenant (AsyncLocalStorage) + Prisma Client Extension para filtro automático; refactor das rotas gordas para services; enforcement fail-closed | ALTO |
| **AuthN** | Claim `tenantId` no JWT; resolução de tenant por host/subdomínio; login escopado; cookies por domínio do tenant | MÉDIO |
| **AuthZ** | RBAC persistido por tenant; SUPER_ADMIN → papel de plataforma (cross-tenant) separado do ADMIN municipal | MÉDIO |
| **Frontend** | Provider de tenant, branding runtime (eliminar dependência de `NEXT_PUBLIC_*` build-time), URLs por subdomínio | MÉDIO |
| **Messages/Bot** | Rooms com tenant (`tenant:{id}:user:{id}`), FlowDefinition por tenant, DigiUrbanIntegration propagando tenant | MÉDIO |
| **SMTP** | Já parcialmente pronto (por domínio); mapear domínio→tenant | BAIXO |
| **Uploads/Storage** | Particionar `uploads/{tenantId}/` ou migrar para object storage; endpoint autenticado | MÉDIO |
| **Redis/Filas** | Prefixo de chave e de fila por tenant | BAIXO |
| **Infra** | Wildcard DNS/TLS, migrations pipeline, backup por tenant, observabilidade com dimensão tenant | MÉDIO |

### 9.3 Resposta direta: a arquitetura suporta migração gradual?

**Sim — com estratégia de banco compartilhado + coluna discriminadora, a migração pode ser gradual e reversível.** Três fatores decidem isso:

1. O acesso a dados passa 100% pelo Prisma (singleton em `lib/prisma.ts`) — uma **Prisma Client Extension** pode injetar o filtro de tenant globalmente sem tocar nas ~60 mil linhas de rota de uma vez, e **PostgreSQL RLS** dá a segunda camada (defesa em profundidade) para o que escapar.
2. O sistema pode operar como "multi-tenant com 1 tenant" indefinidamente: cria-se o tenant default, faz-se o backfill, e cada release aperta um parafuso sem big-bang.
3. Os vestígios da versão anterior mostram que o domínio já foi pensado para isso; o que faltou foi a camada de enforcement automático — exatamente o que a estratégia acima resolve.

Estratégias alternativas avaliadas e **não recomendadas** como primeiro passo:
- **Schema-per-tenant:** Prisma tem suporte fraco a multi-schema dinâmico; 229 models × N schemas explode o custo de migration.
- **Database-per-tenant:** isolamento máximo, mas exige orquestração de conexões, migrations em N bancos e inviabiliza analytics agregado; pode ser oferecido futuramente como *tier enterprise* sobre a mesma base de código (o filtro por tenant continua válido com N=1 por banco).

---

## 10. Inconsistências entre Documentação e Código

Conforme instruído, o código prevaleceu. Divergências encontradas no `CLAUDE.md`:

| # | Documentação diz | Código mostra |
|---|---|---|
| D1 | "213 models" | **229 models** (`grep -c "^model "`) |
| D2 | "4 serviços" | 8 containers + 2 serviços proxied (`ultrazend-face`, `digiurban-ai`, `digiurban-prices`, `digiurban-flow` não documentados) |
| D3 | "rotas em `src/app/`" (frontend) | Rotas em `app/` na raiz do pacote; `src/` contém uma segunda árvore parcial de components/hooks |
| D4 | "~94 prefixos de rota" | 65 chamadas `loadRoute()` + registros manuais (~70 prefixos efetivos) |
| D5 | "Auth interna: `MESSAGES_SERVICE_TOKEN`" | Variável real: **`DIGIURBAN_SERVICE_TOKEN`** ([internal-auth.ts:10](digiurban/backend/src/middleware/internal-auth.ts#L10)) |
| D6 | Cliente HTTP: "lib/api.ts — Cliente Axios" | `lib/api.ts` é fetch puro; axios coexiste em outros pontos |
| D7 | Não menciona | Middlewares de limite de plano existem e estão desativados; diretórios `ai-training/` e `anjoinovador/` não rastreados na raiz do repo |

---

## 11. Conclusão e Veredito

### Nota geral de prontidão para Multi-Tenant: **6/10**

**A fundação é boa.** Stack moderna, schema disciplinado, autenticação por contexto, segurança acima da média para o estágio do produto, e — decisivo — vestígios claros de que o produto foi desenhado por alguém que já pensou em multi-tenancy (MunicipioConfig com plano/limites/features, middlewares de enforcement prontos, permissão `tenants:manage`).

**Os três débitos que precisam ser pagos ANTES de introduzir `tenantId`:**

1. **Lógica de negócio nas rotas (P1)** — sem afunilar o acesso a dados em services + extensão Prisma, o isolamento de tenant dependeria de disciplina manual em 60 mil linhas. É o risco nº 1 de vazamento cross-tenant.
2. **Uploads públicos (S1) e auditoria não sistemática (S2)** — inaceitáveis num SaaS multi-prefeitura sob LGPD.
3. **Fragmentação do frontend (F1/F2)** — a resolução de tenant precisa de um único ponto de entrada HTTP e uma única árvore de código.

O plano de implementação detalhado, faseado e com critérios de aceite encontra-se em [PLANO_IMPLEMENTACAO_MULTI_TENANT_DIGIURBAN.md](PLANO_IMPLEMENTACAO_MULTI_TENANT_DIGIURBAN.md).
