# PLANO DE IMPLEMENTAÇÃO MULTI-TENANT — DIGIURBAN

> **Versão:** 1.0 · **Data:** 2026-07-07
> **Pré-requisito de leitura:** [AUDITORIA_COMPLETA_DIGIURBAN.md](AUDITORIA_COMPLETA_DIGIURBAN.md) — os códigos de achado (P1, B2, S1…) citados aqui referem-se àquele documento.
> **Princípio norteador:** a plataforma operará como *"multi-tenant com 1 tenant"* durante toda a migração. Nenhuma fase exige big-bang; cada fase é deployável e reversível.

---

## Decisão Arquitetural Central (ADR-001)

**Estratégia de tenancy: banco compartilhado + coluna discriminadora `tenantId` + Row-Level Security (RLS) do PostgreSQL como defesa em profundidade, com filtro automático via Prisma Client Extension.**

| Critério | Coluna + RLS (escolhida) | Schema-per-tenant | Database-per-tenant |
|---|---|---|---|
| Compatibilidade com Prisma 6 (229 models) | ✅ Nativa | ⚠️ Fraca (multiSchema estático) | ⚠️ Pool de conexões por tenant |
| Custo de migration | 1 migration → N tenants | N schemas × migration | N bancos × migration |
| Isolamento | Lógico + RLS (forte) | Físico-lógico | Físico (máximo) |
| Analytics agregado (produto SaaS) | ✅ Trivial | ⚠️ UNION painful | ❌ ETL |
| Migração gradual a partir do estado atual | ✅ Backfill em colunas | ❌ Mover dados | ❌ Mover dados |
| Caminho futuro para tier enterprise isolado | ✅ Mesmo código com 1 tenant/banco | — | ✅ Compatível |

**Duas camadas de proteção, sempre:**
1. **Aplicação:** `AsyncLocalStorage` carrega o `tenantId` da request; uma Prisma Client Extension (`$extends({ query: { $allModels: ... } })`) injeta `where: { tenantId }` em toda operação. Nenhuma rota precisa lembrar de filtrar.
2. **Banco:** políticas RLS por tabela usando `current_setting('app.tenant_id')`, setado por transação. Se a camada 1 falhar (query raw, bug, bypass), o banco retorna zero linhas — **fail-closed** (corrigindo o anti-padrão fail-open do achado S9).

---

## Visão Geral das Fases

| Fase | Nome | Depende de | Entrega em produção |
|---|---|---|---|
| 0 | Saneamento e fundação | — | Plataforma igual, mais limpa e testável |
| 1 | Modelo de Tenant e provisionamento interno | 0 | Tabela `tenants` com tenant default |
| 2 | Tenant no banco de dados (colunas + backfill + constraints) | 1 | Dados carimbados, comportamento inalterado |
| 3 | Contexto de tenant no backend (ALS + Prisma Extension + RLS) | 2 | Isolamento automático ativo (com 1 tenant) |
| 4 | Autenticação e resolução de tenant | 3 | Login escopado, JWT com claim, subdomínios |
| 5 | Autorização, RBAC persistido e Platform Admin | 4 | SUPER_ADMIN vira operador de plataforma |
| 6 | Serviços satélites: Messages/Bot, SMTP, uploads, Redis, filas | 3 (paralelo a 4-5) | Todos os canais isolados por tenant |
| 7 | Frontend multi-tenant e white-label runtime | 4 | Branding e features por município |
| 8 | Billing, planos, limites e onboarding self-service | 5, 7 | Provisionar município novo sem deploy |
| 9 | Infraestrutura de escala e operação SaaS | 6, 8 | Topologia horizontal, backup/observabilidade por tenant |
| 10 | Hardening, testes de isolamento e go-live multi-tenant | todas | Segundo município real em produção |

**Cada fase termina com um "Gate de Reavaliação" (seção padronizada ao final de cada fase). A fase seguinte só inicia após o gate aprovado.**

---

# FASE 0 — Saneamento e Fundação

### Objetivo
Pagar os débitos técnicos que tornariam o multi-tenant inseguro ou caro (achados P1, P3, P4, P5, F1-F4, S1, S2, S4), e criar a rede de testes que validará todas as fases seguintes.

### Contexto
A auditoria mostrou ~60 mil linhas de rota com Prisma inline (71 arquivos), uploads públicos, auditoria não persistida e frontend com árvores duplicadas. Introduzir `tenantId` sobre essa base multiplicaria o risco de vazamento cross-tenant.

### Justificativa técnica
O filtro automático da Fase 3 protege tudo que passa pelo Prisma Client — mas correções de segurança (S1/S2) e a unificação do cliente HTTP são pré-condições que não dependem de tenancy e reduzem a superfície de risco imediatamente.

### Benefícios
Base auditável; regressões detectáveis; velocity maior nas fases 2-7.

### Riscos
- Refactor de rotas gordas pode introduzir regressões → mitigar com testes de contrato antes de mover código.
- Tentação de "refatorar tudo" → escopo fechado na lista abaixo; o resto fica.

### Dependências
Nenhuma.

> **STATUS DE EXECUÇÃO (2026-07-07, 2ª iteração):**
> - **Fase 0:** itens 1 (S1/S2/S4), 2 (fail-fast) e 3-parcial (regra ESLint; lint reparado) ✅. **Achado B7 totalmente reparado:** 8 migrations condicionalizadas + baseline `20260707130000_baseline_drift_repair`; `migrate deploy` verde em banco vazio com convergência provada por `migrate diff` (⚠️ produção: `migrate resolve --applied` na baseline antes do deploy). Fail-fast revelou e eliminou 3 registros de rota quebrados (custom-modules e saude-atendimento inexistentes; imports `.js` em tfd/farmacia). Pendentes: item 4 (frontend) e 5 (suíte de contrato — semente criada em `scripts/smoke-tenant.ts`).
> - **Fase 1:** ✅ completa e verificada (Tenant + migration backfill + TenantService com sync legado + contexto ALS + middleware).
> - **Fase 2 (ondas 1 e 2):** ✅ `tenantId` em 11 tabelas — onda 1: users, citizens, departments, services_simplified, protocols_simplified (`20260707140000`); onda 2: família de protocolo — history, evaluations, sla, documents, interactions, pendings (`20260707150000`, backfill herdando o tenant do protocolo pai).
> - **Fase 2 (onda 3):** ✅ `tenantId` em audit_logs e notifications (`20260707160000`) — trilha de auditoria por tenant ativa (evento `tenant_claim_mismatch` verificado com carimbo automático).
> - **Fase 2 (onda 4):** ✅ `tenantId` em citizen_documents, generated_documents, document_templates, protocol_stages, protocol_data_fields (`20260707170000`) — **18 tabelas escopadas** no total.
> - **SELETOR DE MUNICÍPIO (2026-07-10):** decisão de produto — portal do cidadão em domínio único com dropdown (não só subdomínio). Modelo híbrido: se o host já identifica um município (subdomínio), fica fixo sem seletor; no domínio raiz, o cidadão ESCOLHE.
>   - Backend: `GET /public/municipios` (lista tenants ACTIVE, exclui 'default', cacheado). `tenantContextMiddleware` passou a resolver tenant também por `X-Tenant-Slug` (header) ou cookie `digiurban_tenant_slug` QUANDO o host cai no default — subdomínio específico mantém precedência absoluta (segurança).
>   - Frontend: seletor `<select>` de municípios nas abas de login E registro da página do cidadão; a escolha grava o cookie (enviado via `credentials: 'include'`); login exige seleção no domínio raiz.
>   - **Verificado HTTP:** lista retorna municípios; login do MESMO CPF com seleção diferente (header e cookie) autentica o cidadão correto de cada município (Maria de São Carlos vs Maria de Ribeirão). Smoke 46/46, build produção, frontend 0 erros.
> - **ALINHAMENTO DE REGISTRO/LOGIN (2026-07-09):** auditoria do fluxo de cadastro revelou desalinhamentos de UX/legado e **2 bugs de isolamento**, todos corrigidos e verificados por HTTP cross-host:
>   - **Página do cidadão** migrada de `/public/municipio-config` (singleton legado, mostrava sempre o mesmo município) para `useTenant()` do TenantProvider (resolve por host). `tenant-config` ganhou `codigoIbge`.
>   - **Registro:** removido o preenchimento do campo legado `municipioId` (o `tenantId` vem da extension por host); `/me` do cidadão resolve o tenant via `TenantService` (não mais `municipio_config`); e-mail de boas-vindas usa o nome do tenant correto.
>   - **BUG 1 (extension):** o preflight de ownership em update/delete/upsert usava o client base (fora da transação) e lançava P2025 para registro criado na MESMA transação — **quebrava todo create+update transacional** (ex.: registro de cidadão → syncCitizenPersonIdentity retornava 500). Corrigido: só bloqueia se o alvo EXISTE e é de outro tenant.
>   - **BUG 2 (design):** `Citizen.personId @unique` global impedia a mesma pessoa (Person é identidade global por CPF) de ser cidadã de 2 municípios (registro do 2º dava P2002 em personId). Convertido para `@@unique([tenantId, personId])`; `Person.citizen` → `citizens Citizen[]` (1:N). Migration `20260709120000`.
>   - **Verificado:** mesmo CPF registra em 2 municípios (201/201), duplicata no mesmo município bloqueada (400), e **login do mesmo CPF em hosts diferentes autentica o cidadão correto de cada município** (Joao Sede vs Joao Vale). Smoke 46/46, build produção, dry-run das 4 migrations pendentes sobre cópia real de produção: todas OK.
> - **RUMO AO 10/10 (2026-07-09):**
>   - **IA corrigida:** `ai-proxy`, `flow-proxy`, `prices-proxy` agora enviam `req.tenantId` real (resolvido por host/JWT) em vez de `'default'` literal — antes toda IA de todos os municípios ia para o tenant "default". O serviço `digiurban-ai` já tinha tenantId no schema (24 pontos); agora recebe o correto.
>   - **DigiBot (Fase 6 completa):** `DigiUrbanIntegration` injeta `X-Tenant-Id` em TODA chamada via AsyncLocalStorage (`bot/tenant-context.ts`) — cobre inclusive listServices/searchServices sem citizenId. JWT do cidadão propaga `tenantId` (JwtPayload + socket + `botTenantMiddleware`). Rooms Socket.IO ganham prefixo `t:{tenantId}:` (defesa em profundidade). Messages Server type-check limpo.
>   - **Onda 6:** +45 tabelas-filhas sensíveis (prontuário, composição familiar, benefícios, TFD, pré-natal, e-mail) com backfill herdado do pai via JOIN (guardado por existência de coluna FK). **Total: 119/229 models escopados** — cobrindo 100% da superfície de dados de município; os ~110 restantes são catálogos globais, plataforma, métricas e junctions.
>   - **RLS no PostgreSQL (2ª camada):** migration `20260708150000` com política permissiva (`current_tenant_id()` via GUC `app.tenant_id`) nas 119 tabelas. **Verificado com role não-superuser:** `$queryRaw` buscando explicitamente cidadão do tenant B com GUC em A → **0 linhas**. Helper `withTenantTransaction` (SET LOCAL) para blocos raw; `protocol-number` escopado por tenant + GUC.
>   - **NOT NULL:** `tenantId` NOT NULL nas 5 tabelas núcleo (condicional a 0 NULLs); demais nullable (NULLs de plataforma legítimos).
>   - **Verificado:** smoke 46/46, RLS E2E, boot backend + messages, build produção (tsconfig.docker → dist/index.js).
> - **Fase 2 (ONDA 5 — 2026-07-08):** ✅ `tenantId` em **56 tabelas-raiz de módulos** (saúde ×32, educação ×7, social ×4, organograma ×5, agenda ×3, categorias/certificados/chamados ×5) — total **74 models escopados**; fecha o vazamento cross-tenant nos módulos. Migration `20260708130000` (condicional por tabela — lição da wave3). +7 uniques convertidas para compostas: turnos_trabalho.nome, turmas.codigo, matriculas.numeroMatricula, professores.cpf, programas_sociais.nome, citizen_categories.code e admin_tickets.number (sequência CH-YYYY gerada por findFirst escopado colidiria no 1º chamado do 2º tenant). ProtocolSimplified.number permanece global de propósito (geração via $queryRaw lê máximo global). 8 call sites corrigidos. **Verificado:** smoke 46/46; simulação de produção (backfill herda default, "Manhã" em 2 tenants ok, dup intra-tenant P2002, migration idempotente 2×); boot "All routes loaded".
> - **Fase 6 (lado backend — 2026-07-08):** ✅ `internal-tenant-context.ts` em `/api/internal`: resolve o tenant por `X-Tenant-Id` (quando o Messages Server enviar — o JWT já tem o claim) ou derivando do `citizenId` do payload (98 ocorrências nos endpoints) via lookup de plataforma → `runAsTenant`. Bot grava no município certo sem tocar o Messages Server. Pendência: endpoints de entrada sem citizenId (busca por CPF) exigem o header — atualizar DigiUrbanIntegration.
> - **Fases 7/8 (operável — 2026-07-08):** ✅ página `/super-admin/tenants` (lista com uso, provisiona exibindo senha temporária UMA vez, suspende/reativa) + item "Municípios" na nav; `seedDefaultServices` no provisionamento (7 serviços SEM_DADOS ligados às secretarias padrão — portal do cidadão nasce utilizável); menu de secretarias do admin filtrado por `useTenantFeature` (slug do href = feature; par do requireFeature do backend — "UI esconde, API nega" completo).
> - **Fase 2 (CONVERSÃO DE UNIQUES — 2026-07-08):** ✅ o item que destrava cadastros no 2º município (achado B2): `users.email/cpf/matricula`, `citizens.cpf`, `departments.name/code` e `services.moduleType` convertidos de globais para compostas `[tenantId, x]` (migration `20260708120000`, robusta a constraint-ou-index). Apenas 4 call sites tipados quebraram (findUnique→findFirst; o runtime já era coberto pela extension). Fix colateral: `seedDefaultDepartments` agora funciona em produção (antes, o unique global fazia o seed do 2º tenant pular secretarias silenciosamente — nomes confirmados colidentes na VPS). **Verificado:** smoke 37/37 (mesmo CPF/email/secretaria/moduleType em 2 municípios; duplicata intra-tenant segue P2002; seed completo com nomes colidentes) + simulação de produção (migration sobre banco populado com índices antigos) + **login do mesmo email em 2 tenants, cada host autenticando o seu usuário**. Nota transição: linhas tenantId NULL escapam da unicidade (NOT NULL em onda futura). `FlowDefinition.name` segue global (Fase 6).
> - **Fase 3/8 (enforcement de status do tenant):** ✅ novo `tenantStatusMiddleware` registrado em `/api` (reativa o achado P3 — o `municipio-status` morto — agora **fail-closed e por tenant**, sobre `Tenant`, sem I/O extra pois usa `req.tenant` já cacheado). Bloqueia SUSPENDED/CANCELLED/EXPIRED (403), INACTIVE (403) e paymentStatus suspended; overdue só avisa (header). Bypass para /public, /super-admin e login/logout (regularização). **Verificado por HTTP (matriz 10 passos):** tenant ativo acessa; suspenso → 403 TENANT_SUSPENDED; login em suspenso ainda funciona (bypass); plataforma opera sobre suspenso e reativa; município default intocado. **Bug encontrado e corrigido no caminho:** montado em `/api`, `req.path` é relativo ao mount — os prefixos de bypass não batiam; troquei para `req.originalUrl` (login em suspenso passou de 403 errado para 200).
> - **Fase 8 (provisionamento enriquecido):** ✅ `tenant-provisioning.service.ts` — `seedDefaultDepartments` (8 secretarias padrão criadas na transação de provisionamento, carimbadas com o tenantId) e `checkTenantUsageLimit`/`getTenantUsage` (limites maxUsers/maxCitizens reutilizáveis). Verificado: provisionar município cria 8 departamentos, todos do tenant correto; município nasce operável.
> - **Fases 5/8 (groundwork — provisionamento e gestão de tenants):** ✅ endpoints em `/api/super-admin/tenants` (SUPER_ADMIN, `runAsPlatform`, auditado): GET lista com contadores por tenant; POST provisiona município completo (tenant + ADMIN inicial com senha temporária e `mustChangePassword`, slugs reservados bloqueados, transação atômica, 409 em conflito de unique); PATCH atualiza/suspende/reativa. **Verificado ponta-a-ponta por HTTP (10/10):** provisionou "Nova Terra" via API → `tenant-config` do host novo devolve branding correto → **login real da admin com a senha temporária no host do município** → cookie emitido funciona no host dela, é rejeitado (401) no host default, e o login dela no host default falha ("Credenciais inválidas" — o filtro de leitura esconde a usuária fora do tenant) → suspensão via PATCH ok → smoke 31/31 sem regressão.
> - **Fase 7 (feature-gating server-side — "API nega"):** ✅ `requireFeature(feature)` middleware (`src/middleware/require-feature.ts`) lê `req.tenant.features` (cacheado, sem I/O) com o MESMO contrato do `useTenantFeature` do frontend: ausência de mapa/chave = habilitado; só `false` explícito desabilita. `loadRoute` estendido para aceitar middlewares opcionais; gating aplicado a 7 rotas de módulo (saúde ×4, educação, assistência-social). **Verificado por HTTP:** município com `{saude:false, educacao:true}` → rotas de saúde 403 FEATURE_DISABLED (antes do auth), rotas de educação passam o gate (401 no auth, prova de que passou); município default sem features → tudo habilitado. Pareado com o `useTenantFeature` do frontend fecha o "UI esconde, API nega". Pendência: esconder os menus no frontend usando o hook.
> - **Fase 7 (white-label no frontend):** ✅ `lib/tenant.ts` (`fetchTenantConfig` server-side, `brandingToCssVars`, `DEFAULT_TENANT_CONFIG`) + `components/providers/TenantProvider.tsx` (contexto React, hooks `useTenant`/`useTenantFeature`, injeta CSS vars no client) montado no `app/layout.tsx` (agora async): resolve o município pelo Host **no SSR** e injeta `:root{--tenant-primary:…}` inline antes do primeiro paint — mesma imagem Docker serve qualquer tenant (elimina achado F5). **Verificado (4/4) contra backend real**: `riomar.digiurban.test` → "Prefeitura de Rio Mar" + branding azul/laranja nas CSS vars; localhost → default sem branding. **Bug real encontrado e corrigido:** o `fetch` do Node/Next (undici) **descarta o header `Host`** por segurança — o TenantProvider agora envia `x-forwarded-host` (que Express com trust proxy honra em `req.hostname`), e o Nginx passou a repassar `X-Forwarded-Host` nos 8 blocos de proxy. Frontend type-check: 0 erros nos arquivos novos (1 erro pré-existente sem relação). Pendências Fase 7: feature-gating nos menus das secretarias, manifest PWA por tenant, reverter `ignoreBuildErrors`.
> - **Fase 7 (groundwork — white-label):** ✅ `GET /api/public/tenant-config` (sem auth): resolve o tenant pelo Host e devolve slug/nome/município/UF/status/branding/features com `Cache-Control: max-age=60` + `Vary: Host` (chave de cache por host — nunca compartilhar entre tenants). Pronto para o `TenantProvider` do frontend consumir.
> - **Fase 4 (resolução por host):** ✅ `TenantService.getByHost` real — precedência: (1) `tenants.customDomain` (coluna nova, unique), (2) subdomínio `{slug}.TENANT_BASE_DOMAIN` (env; slugs reservados www/api/admin/platform/mail/smtp nunca resolvem), (3) fallback transitório para o tenant default. Cache por host. **Verificado por HTTP com matriz cross-host 5/5** (dois tenants, dois usuários): Host B+token B→200 com dados do user B; Host B+token default→401; localhost+token default→200; localhost+token B→401. **Multi-tenancy por subdomínio operante ponta-a-ponta.** Pendências: cadastrar domínios no onboarding (Fase 8) e remover o fallback default (fail-closed).
> - **Fase 4 (groundwork — claim de tenant no JWT):** ✅ os 4 pontos de emissão (login admin, 2× cidadão, super-admin) incluem `tenantId` no payload; validação em **chokepoint único no tenantContextMiddleware** (antes de qualquer caminho de auth — a base tem N verificações JWT, incluindo inline em rotas como /me) + defesa em profundidade nos 3 middlewares dedicados. Janela de transição: token legado sem claim aceito; claim divergente → 401 + AuditLog. **Verificado por HTTP: 6/6** (claim correto 200, claim alheio 401 em rota inline E em rota com middleware, legado 200, corpo correto, auditoria persistida). Descoberta no caminho: rota `/me` logava headers/cookies completos (JWT incluso) — vazamento de credencial removido (extensão do achado S4). Pendências Fase 4: resolução real por host (TenantService.getByHost ainda retorna default), cookies por domínio, expiração da janela de dupla aceitação.
> - **Fase 3 (enforcement na aplicação):** ✅ extensão `tenant-isolation` (`src/lib/prisma-tenant-extension.ts`, detecção por DMMF — ondas novas cobertas automaticamente): injeta tenantId nas ESCRITAS (create/createMany/upsert), FILTRA LEITURAS (findMany/findFirst(/OrThrow)/count/aggregate/groupBy/updateMany/deleteMany), reescreve findUnique(/OrThrow)→findFirst escopado, e faz preflight de ownership em update/delete/upsert (alvo de outro tenant → erro P2025 sem vazar existência). `runAsPlatform` não filtra; sem contexto → fail-soft para o default (vira fail-closed na Fase 4). **Verificado: tenant-isolation suite `scripts/smoke-tenant.ts` com 27/27 asserções** em banco real com 2 tenants (leitura, findUnique, count, update/delete/upsert cross-tenant bloqueados, updateMany 0 linhas, visão de plataforma). ⚠️ Gotcha documentado em `tenant-context.ts`: PrismaPromise é lazy — `await` DENTRO de `runAsTenant`. Pendências da Fase 3: RLS no PostgreSQL (resíduo de $queryRaw), migrar jobs/seeds para `runAsTenant`, ondas 3+ de tabelas.

### Estratégia de implementação
1. **Segurança imediata (S1, S2, S4):**
   - Remover `express.static('/uploads')` e a `location /uploads/` do Nginx; criar `GET /api/files/:id` autenticado com verificação de ownership (protocolo/cidadão/servidor). Manter redirect temporário logado para detectar consumidores esquecidos.
   - Ativar persistência do `auditLog()` middleware no model `AuditLog` (código já esboçado em comentário) e aplicá-lo às operações críticas: login, mudança de role, CRUD de usuários, transições de protocolo, geração/assinatura de documento, endpoints de super-admin.
   - Remover os `console.log('[AUTH DEBUG] ...')` de `admin-auth.ts` (ou condicionar a `LOG_LEVEL=debug` via Winston).
2. **Boot fail-fast em produção (P2):** `loadRoute()` acumula falhas; se `NODE_ENV=production` e houver falhas, abortar o processo e reportar no log/health.
3. **Regra de arquitetura:** ESLint `no-restricted-imports` proibindo `lib/prisma` em `src/routes/**` — inicialmente como *warning* com contador em CI; rotas novas nascem conformes. Migrar para service as 10 rotas mais críticas para o domínio de protocolo (família `protocols-*`, `citizen-protocols`, `internal.routes` — este último por ser o segundo caminho de escrita do agregado, achado 7.2).
4. **Frontend:** eleger `lib/api.ts` como cliente único (absorver funcionalidades de `api-client.ts` e remover axios gradualmente); consolidar `src/components|hooks` na árvore raiz; deletar codemods `fix-*.js`, logs e `.backup/.original` do backend; adicionar `type-check` como job de CI obrigatório (sem ainda reverter `ignoreBuildErrors` — isso ocorre na Fase 7).
5. **Testes:** suíte de contrato/integração (supertest + banco efêmero) cobrindo: auth admin/cidadão, CRUD de protocolo completo (portal e bot/internal), upload/download, documentos assinados, notificações. Essa suíte é o "detector de vazamento" reutilizado em todas as fases.

### Alterações
- **Banco:** nenhuma.
- **Backend:** middlewares (auditoria, uploads), refactor parcial rotas→services, lint.
- **Frontend:** unificação de árvore e cliente HTTP.
- **Auth/Permissões:** nenhuma mudança funcional.
- **Infra:** CI com type-check + testes; remoção da rota estática no Nginx.

### Estratégia de testes
Suíte nova roda em CI; smoke manual dos fluxos de upload/download e e-mail; comparação de logs de auditoria antes/depois.

### Critérios de aceite
- [ ] Nenhum arquivo é servido sem autenticação (verificação: `curl` anônimo em URL de upload conhecida → 401/403).
- [ ] `AuditLog` recebe registros para as 8 categorias críticas listadas.
- [ ] CI vermelho se type-check falhar ou testes quebrarem.
- [ ] Contador de imports proibidos de Prisma em rotas publicado no CI (baseline registrada).
- [ ] Zero regressão funcional na suíte de contrato.

### 🔒 Gate de Reavaliação da Fase 0
Auditar: (a) a suíte cobre os fluxos que a Fase 2 vai tocar? (b) o refactor de rotas manteve os dois caminhos de escrita de protocolo idênticos em regra de negócio? (c) apareceu consumidor externo de `/uploads` que precise de contrato? Registrar desvios e revalidar o escopo da Fase 1 antes de iniciá-la.

---

# FASE 1 — Modelo de Tenant e Provisionamento Interno

### Objetivo
Substituir o singleton `MunicipioConfig` por um modelo `Tenant` de primeira classe, com o município atual migrado como tenant default — sem qualquer mudança de comportamento visível.

### Contexto
`MunicipioConfig` ([schema:13-36](digiurban/backend/prisma/schema.prisma#L13-L36)) já contém 80% do desenho (plano, limites, features, suspensão, pagamento), mas com `id="singleton"`. O campo órfão `Citizen.municipioId` (achado B3) será descontinuado.

### Justificativa técnica
Todas as fases seguintes referenciam `Tenant.id` por FK. Criar o modelo primeiro, isolado, permite testar provisionamento sem tocar em dados existentes.

### Benefícios
Fundação de dados do SaaS; painel super-admin passa a operar sobre entidade real.

### Riscos
Baixos — tabela nova. Risco residual: código que consulta `municipioConfig.findUnique({ id: 'singleton' })` espalhado (ex.: `municipality-config.ts`, `super-admin.ts`, `municipio-validator.ts`); mapear todos via grep antes.

### Dependências
Fase 0 (suíte de testes).

### Estratégia de implementação
1. Novo model:

```prisma
model Tenant {
  id               String    @id @default(cuid())
  slug             String    @unique          // ex.: "saopaulo" — usado em subdomínio
  nome             String
  cnpj             String    @unique
  codigoIbge       String?   @unique
  ufMunicipio      String
  status           TenantStatus @default(ACTIVE) // ACTIVE, SUSPENDED, TRIAL, CHURNED
  suspensionReason String?
  paymentStatus    String    @default("active")
  plan             String    @default("basic")
  planEndsAt       DateTime?
  maxUsers         Int       @default(10)
  maxCitizens      Int       @default(10000)
  features         Json?
  branding         Json?     // logo, cores, domínio custom — consumido na Fase 7
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
  @@map("tenants")
}
```

2. Migration de dados: `INSERT INTO tenants SELECT ... FROM municipio_config WHERE id='singleton'`, gerando o **tenant default** cujo id é gravado em `system_settings`/env `DEFAULT_TENANT_ID` (transitório, morre na Fase 4).
3. `TenantService` (get por id/slug/host, cache em Redis com TTL curto + invalidação em update) — substitui as leituras diretas de `municipioConfig`.
4. Adaptar rotas `/api/super-admin/municipio*` e `/api/municipality` para operar sobre `Tenant` (mantendo shape de resposta — o frontend não muda nesta fase).
5. `MunicipioConfig` permanece no schema como *deprecated* (leitura proibida por lint) até a Fase 5; remoção definitiva registrada como tarefa da Fase 10.

### Alterações
- **Banco:** tabela `tenants` + migration de cópia.
- **Backend:** `TenantService`, adaptação super-admin/municipality-config.
- **Frontend/Auth/Permissões:** nenhuma.
- **Infra:** env `DEFAULT_TENANT_ID`.

### Estratégia de testes
Testes de `TenantService` (cache, invalidação); suíte da Fase 0 completa (comportamento inalterado); teste de migration up/down em cópia do banco de produção.

### Critérios de aceite
- [ ] Tenant default existe e espelha 100% dos campos do singleton.
- [ ] Nenhuma leitura de `municipio_config` em runtime (verificado por log/lint).
- [ ] Painel super-admin exibe e edita o município via nova tabela.
- [ ] Suíte da Fase 0: verde.

### 🔒 Gate de Reavaliação da Fase 1
Verificar se surgiram novos pontos de leitura de configuração municipal durante o desenvolvimento paralelo; confirmar que o shape de `features`/`branding` atende às Fases 7-8; revalidar a lista de tabelas da Fase 2.

---

# FASE 2 — Tenant no Banco de Dados

### Objetivo
Carimbar todos os dados com `tenantId`, converter uniques globais em compostas e criar os índices — **sem ativar enforcement** (isso é Fase 3).

### Contexto
229 models; achado B2 lista as uniques que quebram (Citizen.cpf, User.email/cpf/matricula, Department.name/code, entre outras).

### Justificativa técnica
Separar "mudança de dados" (esta fase) de "mudança de comportamento" (Fase 3) permite rollback simples e janelas de manutenção curtas. Com 1 tenant, o backfill é um `UPDATE ... SET tenant_id = $default` idempotente.

### Benefícios
Dados prontos para isolamento; índices compostos já aquecidos antes do enforcement.

### Riscos
- **Volume:** backfill em tabelas grandes (ProtocolSimplified, Message, Email, AuditLog) → fazer em lotes com `UPDATE ... WHERE tenant_id IS NULL LIMIT n`.
- **Locking em `ALTER TABLE`:** usar `ADD COLUMN` nullable (metadata-only no PG 15) e `CREATE INDEX CONCURRENTLY`.
- **Esquecer tabelas:** gerar a lista por script a partir do schema, revisada manualmente — não de memória.

### Dependências
Fase 1.

### Estratégia de implementação
1. **Classificação das 229 tabelas** (script + revisão):
   - **Grupo A — coluna direta obrigatória (~140-170):** tabelas com dados de negócio consultados por listagem/filtro (User, Citizen, Department, ServiceSimplified, ProtocolSimplified e toda a família, saúde, educação, social, email, mensagens, documentos, certificados, notificações, organograma, agenda, bot…).
   - **Grupo B — herda por FK forte, coluna opcional (~40):** tabelas detalhe sempre acessadas via pai com `include` (ex.: `ProcedimentoOdonto`, `ExamePreNatal`). Ainda assim **recomenda-se coluna direta** para viabilizar RLS uniforme; decidir por tabela no gate.
   - **Grupo C — globais de plataforma (sem tenantId):** `Tenant`, futuras `PlatformUser`, `EmailPlanConfig` (catálogo de planos), CRLs de plataforma, cache técnico (`CacheEntry` — avaliar), migrations meta.
2. **Migrations em 4 passos por onda** (ondas de ~30 tabelas para janelas curtas):
   a. `ADD COLUMN tenant_id TEXT NULL REFERENCES tenants(id)`;
   b. backfill em lotes;
   c. `SET NOT NULL` + `ALTER COLUMN SET DEFAULT` removido (default só no app);
   d. `CREATE INDEX CONCURRENTLY idx_x_tenant ON x (tenant_id, <chave de acesso mais comum>)`.
3. **Conversão de uniques (B2):**
   - `citizens`: `@@unique([cpf])` → `@@unique([tenantId, cpf])`
   - `users`: `email/cpf/matricula @unique` → `@@unique([tenantId, email])` etc. *(atenção: login passa a exigir tenant — só entra em vigor na Fase 4; até lá o tenant único preserva a unicidade de fato)*
   - `departments`: `@@unique([tenantId, name])`, `@@unique([tenantId, code])`
   - Auditar TODAS as `@unique/@@unique` do schema com script; classificar "global de plataforma" vs "por tenant".
4. **Escritas:** nesta fase, o app grava `tenantId = DEFAULT_TENANT_ID` via default no `create` centralizado (Prisma extension de escrita simples, ainda sem filtro de leitura).
5. **Numeração de protocolo** (`protocol-number.service`): tornar a sequência por tenant (tabela de sequência com chave `[tenantId, ano]`).

### Alterações
- **Banco:** colunas, backfill, uniques compostas, ~150+ índices novos.
- **Backend:** default de escrita; protocol-number por tenant.
- **Frontend/Auth:** nenhuma.
- **Infra:** janelas de manutenção por onda; monitorar bloat/vacuum pós-backfill.

### Estratégia de testes
- Teste de migration por onda em restore de produção (tempo de execução medido).
- Verificação de completude: `SELECT count(*) WHERE tenant_id IS NULL` = 0 em todas as tabelas do Grupo A/B.
- Suíte Fase 0 verde após cada onda.
- Benchmark de queries quentes (protocolos, dashboard) antes/depois dos índices.

### Critérios de aceite
- [ ] 100% das tabelas classificadas com decisão registrada (A/B/C).
- [ ] Zero `tenant_id NULL` nos grupos A/B.
- [ ] Uniques compostas ativas; criação de segundo "Department: Saúde" com outro tenantId de teste funciona em staging.
- [ ] Nenhuma degradação >10% nas queries do benchmark.

### 🔒 Gate de Reavaliação da Fase 2
Revisar plano de RLS da Fase 3 contra a classificação final (Grupo C fora do RLS); reavaliar tabelas do Grupo B que ficaram sem coluna; confirmar que nenhum model novo entrou no schema sem `tenantId` (instituir check de CI: schema-lint que exige `tenantId` em model novo, com allowlist do Grupo C).

---

# FASE 3 — Contexto de Tenant no Backend (Enforcement)

### Objetivo
Ativar o isolamento automático: toda query lê/escreve apenas dados do tenant da request. Com 1 tenant em produção, o comportamento observável não muda — mas a segurança já é real.

### Contexto
Achado P1: o filtro manual em 60k linhas é inviável. A solução passa por interceptação central.

### Justificativa técnica
- `AsyncLocalStorage` (nativo Node) carrega `{ tenantId, userId, role }` por request sem tocar assinaturas de função.
- Prisma `$extends` intercepta `$allModels` e injeta `where.tenantId`/`data.tenantId`. Cobertura: findMany/findFirst/findUnique*→findFirst, update/updateMany, delete/deleteMany, count, aggregate, groupBy, upsert, createMany.
- RLS cobre o resíduo: `$queryRaw`, jobs esquecidos, ferramentas externas. Política: `USING (tenant_id = current_setting('app.tenant_id', true))` + role de aplicação **sem** `BYPASSRLS`.

### Benefícios
Vazamento cross-tenant passa de "erro provável" para "exige dupla falha".

### Riscos
- **`findUnique` com unique composta:** chamadas existentes `findUnique({ where: { cpf } })` quebram com a unique composta → a extension reescreve para `findFirst({ where: { cpf, tenantId } })`; mapear e ajustar os call sites nos testes.
- **Jobs/workers/seeds sem request context** → API explícita `runAsTenant(tenantId, fn)` e `runAsPlatform(fn)` (auditada) para BullMQ, seeds e cron.
- **RLS + connection pool:** `current_setting` deve ser setado por transação (`SET LOCAL`) — usar `$transaction` wrapper ou `pg` session hooks; testar com PgBouncer se adotado (transaction pooling exige `SET LOCAL`).
- **Performance:** RLS adiciona predicado — já coberto pelos índices `[tenant_id, ...]` da Fase 2.

### Dependências
Fase 2.

### Estratégia de implementação
1. `src/lib/tenant-context.ts` — ALS + helpers (`getTenantId()` lança erro se ausente → **fail-closed**, corrigindo S9).
2. Middleware `tenantContextMiddleware` logo após auth: nesta fase resolve sempre `DEFAULT_TENANT_ID`; na Fase 4 passa a resolver do JWT/host.
3. `src/lib/prisma.ts` exporta o client estendido; o client cru fica em módulo interno com import proibido por lint (exceto `runAsPlatform`).
4. Ativar RLS tabela a tabela (mesmas ondas da Fase 2): `ALTER TABLE x ENABLE ROW LEVEL SECURITY; FORCE ROW LEVEL SECURITY;` + política. Começar por 5 tabelas piloto (ProtocolSimplified, Citizen, User, Department, ServiceSimplified), medir, expandir.
5. Reativar (agora corretamente) a lógica de `checkMunicipioStatus` como `tenantStatusMiddleware` (suspensão/pagamento por tenant, fail-closed) — os middlewares mortos do achado P3 finalmente entram em produção.
6. Messages Server e SMTP Server: criar o mesmo par ALS+extension nos dois codebases (compartilham o banco — RLS os protege desde já; a resolução de tenant deles amadurece na Fase 6).

### Alterações
- **Banco:** políticas RLS + role de aplicação não-superuser.
- **Backend:** tenant-context, prisma estendido, middleware, `runAsTenant`.
- **Frontend:** nenhuma.
- **Auth:** nenhuma mudança de contrato (claim entra na Fase 4).
- **Infra:** `DATABASE_URL` com role de app (sem BYPASSRLS); role separada para migrations.

### Estratégia de testes
- **Teste de isolamento canônico (novo, permanente):** semear tenant B em staging; para cada endpoint da suíte, autenticar no tenant A e provar que dados de B nunca aparecem (lista, get por id, update, delete, count). Automatizar como *tenant-isolation suite* — roda em todo CI daqui em diante.
- Teste de RLS direto no banco: sessão sem `app.tenant_id` → zero linhas.
- Teste de jobs: BullMQ worker sem contexto → erro explícito, com `runAsTenant` → sucesso.

### Critérios de aceite
- [ ] Tenant-isolation suite: 100% verde.
- [ ] Query raw sem contexto retorna 0 linhas (RLS provado).
- [ ] Nenhum uso do client cru fora de `runAsPlatform` (lint).
- [ ] Latência p95 dos endpoints quentes dentro de +10% do baseline.

### 🔒 Gate de Reavaliação da Fase 3
Revisar exceções concedidas a `runAsPlatform` (cada uma auditada e justificada); medir custo real do RLS; decidir cobertura final do Grupo B; confirmar que a Fase 4 pode mudar o contrato do JWT sem quebrar mobile/PWA offline (tokens de 1h expiram rápido — janela de dupla aceitação curta).

---

# FASE 4 — Autenticação e Resolução de Tenant

### Objetivo
Cada request identifica seu tenant de forma criptograficamente verificável: claim `tenantId` no JWT + resolução por host (subdomínio `{slug}.digiurban.com.br` ou domínio custom).

### Contexto
Hoje: JWT `{ userId|citizenId, type }` sem tenant; cookies fixos; comentários "verificação de tenant removida" nos middlewares (achado 9.1) marcam exatamente onde a verificação volta.

### Justificativa técnica
O tenant não pode vir apenas do host (spoofável em misconfig) nem apenas do token (não permite white-label de URL). Regra: **host resolve o tenant esperado; token carrega o tenant emitido; ambos devem coincidir** — senão 401.

### Benefícios
Base para white-label; sessões de municípios diferentes não colidem; revogação por tenant.

### Riscos
- Sessões ativas no corte → janela de dupla aceitação: middleware aceita token sem claim por N dias atribuindo `DEFAULT_TENANT_ID`, com log; depois, rejeição.
- `citizen-auth` aceita cookie de admin (S5) → o fallback passa a validar que o admin pertence ao MESMO tenant e grava `AuditLog` de impersonação.
- Cookies em subdomínios: escopo por host exato (não `.digiurban.com.br`), para impedir que o cookie de um município viaje para outro.

### Dependências
Fase 3.

### Estratégia de implementação
1. **Emissão:** login (admin/cidadão/super) resolve o tenant do host da request, valida que o usuário pertence a ele (`user.tenantId === tenant.id`) e emite JWT `{ userId, type, tenantId, iat, exp }`.
2. **Verificação:** `tenantContextMiddleware` (Fase 3) passa a: resolver tenant do host via `TenantService.getByHost()` (cacheado) → comparar com claim → popular ALS. Sem match: 401 + auditoria.
3. **Login multi-município (mesmo CPF em 2 cidades):** como a unique agora é `[tenantId, cpf]`, o login já é naturalmente escopado pelo host — sem seletor de tenant na UI.
4. **`DEFAULT_TENANT_ID` morre:** host de produção atual mapeado como domínio custom do tenant default.
5. Rotação de segredo preparada: assinar com `kid` no header; `JWT_SECRET` vira lista ordenada (aceita N, emite com o 1º) — destrava o achado S8 e a dessincronização com o Messages Server.
6. Sessões (S10): registrar `UserSession` na emissão e validar `isActive` no middleware (revogação real), com cache Redis de sessões revogadas.

### Alterações
- **Banco:** nenhuma nova (usa colunas da Fase 2).
- **Backend:** rotas de auth, middlewares, TenantService.getByHost.
- **Frontend:** nenhuma obrigatória (cookies continuam httpOnly; a UI multi-domínio chega na Fase 7).
- **Permissões:** inalteradas.
- **Infra:** DNS wildcard `*.digiurban.com.br` + certificado wildcard no Nginx (preparação; uso pleno na Fase 7/9).

### Estratégia de testes
Tenant-isolation suite com dois tenants reais em staging e hosts distintos; testes de token forjado (claim de A em host de B → 401); expiração da dupla aceitação; revogação de sessão efetiva em <5s.

### Critérios de aceite
- [ ] JWT sem claim rejeitado após a janela de transição.
- [ ] Token de tenant A em host de tenant B: 401 + AuditLog.
- [ ] Mesmo CPF de cidadão logando em dois municípios de staging, dados isolados.
- [ ] Logout revoga a sessão (token ainda válido temporalmente é recusado).

### 🔒 Gate de Reavaliação da Fase 4
Auditar logs da janela de dupla aceitação (quem ainda emitia token antigo?); revisar fluxos de convite (`family-invites`, `convites/`) e reset de senha — links por e-mail precisam apontar para o host do tenant; confirmar que push/SSE (`/api/notifications`) respeitam o contexto.

---

# FASE 5 — Autorização, RBAC Persistido e Platform Admin

### Objetivo
Separar governança de plataforma (SaaS) de administração municipal, e tirar o RBAC do código (achado S6).

### Contexto
Hoje `SUPER_ADMIN` é um `User` do próprio município com poderes de infraestrutura (backup/restore/migrations via HTTP — achado S3). Num SaaS, quem opera a plataforma não é usuário de nenhuma prefeitura.

### Justificativa técnica
Manter operadores da plataforma na tabela `users` (agora tenant-scoped) é contraditório: eles não têm tenant. Modelo alvo:

- `PlatformUser` (Grupo C, sem tenantId) — roles `PLATFORM_OWNER`, `PLATFORM_OPS`, `PLATFORM_SUPPORT`; MFA obrigatório; painel próprio.
- `User.role` municipal mantém `USER/COORDINATOR/MANAGER/ADMIN`; `SUPER_ADMIN` municipal é remapeado para `ADMIN` do tenant (o "prefeito digital") — migração de dados com comunicação prévia.
- Tabelas `roles`, `permissions`, `role_permissions` **por tenant**, semeadas com a matriz atual de `getRolePermissions()` (compatibilidade 1:1 no dia 1); middleware passa a ler do banco com cache Redis.

### Benefícios
Municípios poderão customizar perfis; suporte da plataforma acessa tenants somente por sessão de suporte auditada (impersonação com trilha, TTL curto e banner na UI).

### Riscos
- Regressão de permissão → gerar snapshot da matriz atual e testar igualdade byte a byte antes de permitir customização.
- Endpoints de sistema (S3): mover backup/restore/migrations para o painel de plataforma com step-up MFA + IP allowlist; removê-los do domínio do tenant.

### Dependências
Fase 4.

### Estratégia de implementação
1. Migração `PlatformUser` + painel `/platform` (novo app ou área do super-admin atual re-rotulada).
2. RBAC persistido + `PermissionService` cacheado; `requirePermission` mantém assinatura (troca só a fonte).
3. `protocol-status.config.ts` (matriz de transição por role) permanece em código nesta fase — vira configurável por tenant apenas se demanda comprovada (registrar como backlog).
4. Sessão de suporte: `POST /platform/tenants/:id/support-session` → token com claim `{ tenantId, platformUserId, supportSession: true }`, TTL 30min, tudo auditado.
5. Aposentar `MunicipioConfig` (leituras zeradas desde a Fase 1) — drop table.

### Alterações
- **Banco:** `platform_users`, `roles/permissions/role_permissions` (por tenant), drop `municipio_config`.
- **Backend:** PermissionService, rotas platform, remoção dos endpoints de sistema do escopo municipal.
- **Frontend:** painel de plataforma; tela de perfis/permissões por município (ADMIN).
- **Auth:** novo tipo de token de plataforma/suporte.
- **Infra:** MFA (TOTP) para PlatformUser.

### Estratégia de testes
Snapshot-test da matriz de permissões; testes de suporte-sessão (expiração, auditoria, escopo); tentativa de PlatformUser acessar dados sem sessão de suporte → negado.

### Critérios de aceite
- [ ] Matriz efetiva idêntica à hardcoded no corte (prova por snapshot).
- [ ] Nenhum endpoint de backup/migrations acessível com token municipal.
- [ ] Toda impersonação gera AuditLog com ator de plataforma + tenant + duração.
- [ ] MFA obrigatório em contas de plataforma.

### 🔒 Gate de Reavaliação da Fase 5
Rever quais permissões os municípios pedem para customizar (informa o produto); auditar acessos de suporte do período; revalidar se a Fase 6 (satélites) sofreu drift enquanto 4-5 rodavam.

---

# FASE 6 — Serviços Satélites: Messages/Bot, SMTP, Uploads, Redis, Filas

*(pode iniciar em paralelo à Fase 4, após o gate da Fase 3)*

### Objetivo
Estender o isolamento aos canais fora do request/response HTTP do backend.

### Contexto
- Messages Server valida JWT próprio e usa rooms `user:{id}:{type}` sem tenant; `FlowDefinition` (fluxos do bot) são globais; `DigiUrbanIntegration` chama `/api/internal` com token estático único.
- SMTP já é multi-domínio (achado 7.5) — falta o mapa domínio→tenant.
- Uploads em `uploads/` plano; Redis e BullMQ sem namespaces.

### Justificativa técnica
Socket.IO rooms e filas são canais de broadcast: sem tenant no nome da room, um bug de subscribe vaza mensagens entre municípios — RLS não protege WebSocket.

### Estratégia de implementação
1. **Messages Server:**
   - JWT agora traz `tenantId` (Fase 4) → rooms passam a `t:{tenantId}:user:{id}:{type}`, `t:{tenantId}:conversation:{id}`, `t:{tenantId}:channel:{id}`; handshake rejeita token sem claim.
   - `FlowDefinition` ganha `tenantId` (já coberto na onda da Fase 2); `FlowDefinitionSeeder` semeia os 9 fluxos padrão **por tenant** no provisionamento; edição em `/admin/bot-flows` afeta só o tenant.
   - `DigiUrbanIntegration` → `/api/internal` envia header `X-Tenant-Id`; `internal-auth` valida token de serviço **e** exige tenant explícito; backend roda handler com `runAsTenant(header)`. Tokens de serviço por ambiente rotacionáveis.
2. **SMTP:** tabela `EmailDomain` ganha `tenantId`; roteamento de recebimento resolve tenant pelo domínio de destino; envio autenticado valida que a conta pertence ao tenant.
3. **Uploads:** novo layout `uploads/{tenantId}/{categoria}/...` (ou S3-compatível com prefixo, decidir na Fase 9); migração dos arquivos existentes para o prefixo do tenant default; `document-upload.service` e endpoint autenticado da Fase 0 validam prefixo × contexto.
4. **Redis:** convenção `t:{tenantId}:*` para chaves de cache de dados; filas BullMQ mantêm-se globais mas cada job carrega `tenantId` no payload e o worker abre `runAsTenant` (evita explosão de filas por tenant; revisitar na Fase 9 para tenants enterprise com fila dedicada).
5. **Notificações/SSE/Push:** canal SSE e Web Push validam tenant do subscriber.

### Riscos
Migração de arquivos com downtime de download → fazer com hardlinks/cópia + switch atômico; rooms renomeadas exigem deploy coordenado frontend+messages (feature flag de compatibilidade por 1 release).

### Estratégia de testes
Teste de socket: cliente do tenant A tenta join em room do tenant B → recusado; e2e do bot abrindo protocolo com header de tenant; e-mail para domínio do tenant B não aparece na inbox do A; verificação de path traversal no novo serviço de arquivos.

### Critérios de aceite
- [ ] Nenhuma room sem prefixo de tenant (auditoria de rooms ativas).
- [ ] Bot cria protocolo no tenant correto (e2e com 2 tenants).
- [ ] Upload/download respeitam prefixo; acesso cruzado → 403 + AuditLog.
- [ ] Fluxos do bot editáveis por tenant sem afetar outros.

### 🔒 Gate de Reavaliação da Fase 6
Rodar a tenant-isolation suite ampliada (agora com websocket/e-mail/arquivos); medir memória do Messages Server com rooms multiplicadas; revalidar plano da Fase 7 (o frontend depende das rooms novas).

---

# FASE 7 — Frontend Multi-Tenant e White-Label Runtime

### Objetivo
O mesmo build Next.js serve qualquer município: branding, features e domínio resolvidos em runtime (elimina o achado F5).

### Contexto
`NEXT_PUBLIC_*` são congeladas em build-time no Dockerfile; tema já usa CSS variables HSL (base pronta); cliente HTTP unificado na Fase 0.

### Justificativa técnica
Um build por tenant não escala (N municípios = N imagens). Runtime config via endpoint público `GET /api/public/tenant-config` (resolvido pelo host, cacheado em CDN/ISR) fornece: nome, brasão, cores, features, URLs de contato.

### Estratégia de implementação
1. `TenantProvider` (React context) hidratado no `app/layout.tsx` via fetch server-side do tenant-config pelo host; injeta CSS variables (cores do `Tenant.branding`), logo e nome em toda a árvore.
2. Substituir usos de `NEXT_PUBLIC_API_URL` por caminho relativo (`/api`) — o Nginx já faz o proxy por host; manter env apenas para dev local.
3. **Feature gating:** hook `useTenantFeatures()` lendo `Tenant.features`; menus das 21 secretarias e módulos (saúde, educação…) renderizam condicionalmente — municípios pequenos compram menos módulos (conecta com Billing, Fase 8). Backend espelha o gate (middleware `requireFeature('saude')`) — UI esconde, API nega.
4. Landing page e páginas públicas por tenant (título, brasão, SEO/sitemap por host).
5. PWA: manifest dinâmico por tenant (`/manifest.webmanifest` gerado por host) para ícone/nome corretos na instalação.
6. Reverter `ignoreBuildErrors`/`ignoreDuringBuilds` para `false` (dívida da Fase 0, agora com type-check estável).

### Riscos
Cache/ISR servindo branding de um tenant para outro → chave de cache SEMPRE composta por host; testes específicos. Workbox/PWA cache por origem já isola por domínio.

### Alterações
- **Banco/Auth:** nenhuma.
- **Backend:** `GET /api/public/tenant-config`, `requireFeature`.
- **Frontend:** TenantProvider, theming, gating, manifest, limpeza de env build-time.
- **Infra:** Nginx repassa `Host` (já faz); CDN opcional com cache key por host.

### Estratégia de testes
Visual regression com 2 tenants (cores/logos distintos); testes de gating (feature off → menu ausente E api 403); Lighthouse/PWA por host; build único servindo dois hosts em staging.

### Critérios de aceite
- [ ] Um único build/image atende 2 tenants com branding distinto.
- [ ] Feature desabilitada é invisível na UI e negada na API.
- [ ] Zero `NEXT_PUBLIC_` decidindo comportamento por tenant.
- [ ] Type-check e lint bloqueando build.

### 🔒 Gate de Reavaliação da Fase 7
Testar onboarding visual de um tenant fictício de ponta a ponta; medir TTFB com resolução de config por host; revalidar requisitos da Fase 8 (quais features são vendáveis).

---

# FASE 8 — Billing, Planos, Limites e Onboarding

### Objetivo
Provisionar um município novo sem deploy: cadastro → plano → features → seed → DNS → pronto.

### Contexto
`Tenant` já tem plan/limits/features (Fase 1); enforcement de status já ativo (Fase 3); `EmailPlanConfig`/`EmailInvoice`/`Invoice` existem no schema como precedente de billing.

### Estratégia de implementação
1. **Provisioning service** (`POST /platform/tenants`): cria tenant, ADMIN inicial (senha temporária + `mustChangePassword`, campo já existente), departamentos padrão, serviços template, fluxos do bot (seeder da Fase 6), certificado de sistema (seed já existente), subdomínio.
2. **Limites reais:** reimplementar `checkUsageLimits` por tenant (contagem cacheada, não `count()` por request); limites de storage de upload e de e-mails/mês.
3. **Ciclo de vida:** TRIAL → ACTIVE → SUSPENDED (retenção de dados por prazo legal antes de expurgo LGPD) → CHURNED; jobs de verificação; comunicação automatizada.
4. **Billing:** integração com gateway (fora de escopo detalhar aqui) alimentando `paymentStatus`; painel de plataforma com MRR/uso por tenant.
5. **Exportação de dados do tenant** (portabilidade/LGPD): dump lógico filtrado por tenantId — também é a base do futuro tier database-per-tenant.

### Riscos
Seeds template desatualizando em relação a features novas → testes de provisionamento no CI (provisiona tenant efêmero e roda smoke).

### Critérios de aceite
- [ ] Tenant novo operacional em < 30 min sem intervenção de engenharia.
- [ ] Limite de usuários excedido → 403 com código `USER_LIMIT_REACHED` (reaproveitando contrato já desenhado em municipio-status.ts).
- [ ] Suspensão bloqueia tudo exceto login com aviso + painel de regularização.
- [ ] Export de tenant gera pacote íntegro (validado por restore em banco vazio).

### 🔒 Gate de Reavaliação da Fase 8
Provisionar 3 tenants piloto internos e operar por 2 semanas; revisar custos por tenant (Postgres, Redis, storage, LLM) para precificação; revalidar topologia da Fase 9 com dados reais de carga.

---

# FASE 9 — Infraestrutura de Escala e Operação SaaS

### Objetivo
Sair do single-box (`digiurban-vps` com supervisord) para topologia horizontalmente escalável com operação por tenant.

### Estratégia de implementação
1. **Decomposição do container monolito:** backend, frontend e nginx em containers separados (llama.cpp/ai/face já são precedentes); réplicas de backend atrás do Nginx/LB; Socket.IO já tem Redis adapter (pronto para múltiplas instâncias).
2. **Storage de objetos** (S3-compatível, ex.: MinIO) substituindo `uploads/` em disco — pré-requisito real de réplicas; URLs assinadas com validação de tenant.
3. **Banco:** connection pooling (PgBouncer em transaction mode — compatível com `SET LOCAL` do RLS, validado na Fase 3); réplica de leitura para analytics; particionamento por `tenant_id` avaliado apenas se métricas exigirem (ProtocolSimplified/Message/AuditLog primeiro).
4. **Backups:** automáticos (pgBackRest/WAL-G) + restore point-in-time; backup lógico por tenant (export da Fase 8) para recuperação granular; **remover os endpoints HTTP de backup/restore** (concluindo S3 da auditoria).
5. **Observabilidade:** `tenant_id` como dimensão em logs (Winston child logger no ALS), métricas e traces; painéis por tenant; alertas de anomalia (ex.: tenant com erro 403 de isolamento em pico = tentativa de ataque ou bug).
6. **Migrations pipeline:** migrations rodam por job de deploy com role dedicada (não pelo app, não por HTTP).
7. **DNS/TLS:** wildcard + automação de domínio custom por tenant (ACME).

### Critérios de aceite
- [ ] 2+ réplicas de backend sem quebra de sessão/socket.
- [ ] Restore de tenant individual comprovado em staging.
- [ ] Zero estado local em containers de aplicação.
- [ ] Dashboards e logs filtráveis por tenant.

### 🔒 Gate de Reavaliação da Fase 9
Game day: simular falha de nó, restore de tenant e pico de carga com K tenants sintéticos; revisar SLOs; aprovar checklist de go-live.

---

# FASE 10 — Hardening, Testes de Isolamento e Go-Live

### Objetivo
Prova final de isolamento e entrada do segundo município real.

### Estratégia de implementação
1. **Pentest focado em multi-tenancy** (interno + terceiro): IDOR cross-tenant em todas as famílias de rota, manipulação de claim, host header injection, cache poisoning por host, websocket room hijack, upload path traversal.
2. **Auditoria LGPD:** RIPD/registro de operações por tenant; DPA padrão para municípios; política de retenção e expurgo automatizado.
3. **Chaos de isolamento em staging:** fuzzing de `tenantId` em todos os parâmetros; verificação de que TODA resposta 200 contém apenas dados do tenant do token (asserção automática por convenção de payload).
4. **Limpeza final:** remoção de `Citizen.municipioId` órfão, código deprecated (`_deprecated/`, aliases de rota duplicados como `/api/admin/email-service`), janela de dupla aceitação de JWT.
5. **Go-live faseado do 2º município:** shadow (dados de teste) → piloto restrito (1 secretaria) → geral. Rollback plan: tenant novo é suspenso sem afetar o tenant 1.
6. Atualizar `CLAUDE.md` e documentação com a arquitetura real (corrigindo D1-D7 da auditoria).

### Critérios de aceite
- [ ] Pentest sem achados críticos/altos abertos.
- [ ] Tenant-isolation suite: 100% em CI, obrigatória para merge.
- [ ] Segundo município em produção por 30 dias sem incidente de isolamento.
- [ ] Documentação sincronizada com o código.

### 🔒 Gate de Reavaliação da Fase 10 (final)
Retrospectiva completa: dívidas remanescentes viram backlog priorizado; decidir roadmap pós-SaaS (tier enterprise DB-dedicado, regionalização, marketplace de módulos).

---

## Matriz de Riscos Transversais

| Risco | Prob. | Impacto | Mitigação principal |
|---|---|---|---|
| Vazamento cross-tenant por query esquecida | Média | Crítico | Dupla camada (Extension + RLS) + tenant-isolation suite em CI |
| Regressão funcional no refactor rotas→services | Alta | Alto | Suíte de contrato da Fase 0 antes de mover código |
| Backfill/locking em tabelas grandes | Média | Médio | Ondas, lotes, `CONCURRENTLY`, ensaio em restore de produção |
| Drift entre os 3 codebases que acessam o banco | Média | Alto | RLS protege por baixo; schema-lint compartilhado; fase 6 dedicada |
| Sessões/integrações quebradas na troca do JWT | Média | Médio | Janela de dupla aceitação + telemetria de tokens legados |
| Custo de performance do RLS + índices novos | Baixa | Médio | Benchmarks por fase com orçamento de +10% p95 |
| Equipe pequena vs. plano longo | Alta | Médio | Fases deployáveis individualmente; valor de segurança entregue já nas Fases 0-3 |

## Sequenciamento e Paralelismo

```
F0 ──► F1 ──► F2 ──► F3 ──► F4 ──► F5 ──► F8 ──► F9 ──► F10
                       │
                       └──► F6 ──────────────┘ (junta na F8)
                              F7 (após F4) ──┘
```

O eixo crítico é **F0→F3** (segurança do isolamento). A partir da F3, o produto já está protegido e o restante é evolução de produto/operacional — se prioridades mudarem, a plataforma pode pausar em qualquer gate sem ficar em estado inseguro.
