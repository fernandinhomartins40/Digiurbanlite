# PLANO DE CORREÇÃO MULTI-TENANT DIGIURBAN — 2026-07-13

> ## ✅ STATUS DA IMPLEMENTAÇÃO (2026-07-14)
>
> | Fase | Status | Observações |
> |---|---|---|
> | 1. Corte dos endpoints legados | ✅ Implementada | `/api/super-admin/tenants*`, invoices, leads, modules, platform-info → **410 Gone**; tudo movido para `/api/platform` (novo `routes/platform-panel.routes.ts`, guard `platformAuthMiddleware` + `PLATFORM_ADMIN` p/ escrita). Ponte de identidade no login do super-admin: SUPER_ADMIN do tenant default é espelhado como `PlatformUser` e recebe o cookie `digiurban_platform_token` (sem segundo login); SUPER_ADMIN de outro tenant NÃO ganha acesso de plataforma. Frontend atualizado (páginas + proxies Next em `app/api/platform/*`). |
> | 2. Hardening de deploy | ✅ Código pronto / ⚠️ ops pendente | Compose: `TENANT_REQUIRE_TOKEN_CLAIM=1` (default LIGADO), `TENANT_STRICT_HOST` e `TENANT_STRICT` opt-in, `MIGRATE_DATABASE_URL` suportada no `startup.sh` (função `prisma_migrate`). **Pendente no VPS:** rodar `setup-app-role.sql`, trocar `DATABASE_URL` para `digiurban_app` e definir `MIGRATE_DATABASE_URL` no `.env`. |
> | 3. Wave 8 de tenantId | ✅ Implementada | Migration `20260713120000_add_tenant_id_wave8`: 26 tabelas (catálogos + AlunoRota + e-SUS + FlowDefinition), backfill derivado (AlunoRota←rota; conversas←cidadão), uniques globais→compostas `[tenantId, x]` (17 conversões), RLS+FORCE. Seeds convertidos p/ findFirst+create; passo de normalização de `tenantId` NULL no fim do `seed-consolidated.ts`; dados de catálogo extraídos p/ `src/data/default-catalogs.data.ts` (fonte única); `seedDefaultCatalogs()` no provisionamento — município novo nasce com os catálogos. |
> | 4. Fluxos do bot por tenant | ✅ Implementada | `FlowDefinition` com `[tenantId, name]`; seeder do Messages Server itera tenants ativos (adota linhas legadas NULL p/ o default); `FlowEngine`/`FlowEngineService` resolvem fluxo por tenant do contexto com fallback legado; `admin-flows` usa findFirst escopado. |
> | 5. Conversas com tenant | ✅ Implementada | Schema do Messages Server sincronizado (Conversation/Message/FlowDefinition); helper `resolveTenantId()` (ALS → conversa → cidadão → default); todos os 9 pontos de escrita preenchem `tenantId`; backfill na migration wave8. |
> | 6. Infra p/ /api/platform | ✅ Implementada | metrics, schema, run-migrations e suite de backups movidos p/ `/api/platform/system|schema` (410 nos caminhos antigos); `/system/health` permanece no super-admin. |
> | 7. Verificações | ✅ Parcial | Smoke de isolamento com 2 tenants efêmeros: `npm run smoke:tenant:isolation` (backend). Cache: `updateTenant` já limpa tudo. **Pendências documentadas:** auditoria dedicada de email (A7) e seletor de município no domínio raiz (A8, decisão de produto). |
>
> Validação: `type-check` do backend e do Messages Server passando; `prisma validate` ok nos dois schemas. O smoke exige banco (rodar no VPS/CI após o deploy da migration).

**Base:** achados A1–A8 da `AUDITORIA_MULTI_TENANT_2026-07-13.md`.
**Objetivo:** fechar as lacunas para a aplicação ser 100% SaaS multi-tenant, na ordem de maior risco ÷ menor esforço.
**Princípio:** a Prisma tenant extension cobre automaticamente (via DMMF) qualquer model que ganhe o campo `tenantId` — a maior parte do plano é migration + backfill, **sem tocar em rotas**.

---

## Visão geral das fases

| Fase | Achado | Esforço | Risco se não fizer |
|---|---|---|---|
| 1. Corte dos endpoints legados de plataforma | A1 | Baixo (remoção) | SUPER_ADMIN de tenant controla a plataforma |
| 2. Armar RLS + modo estrito (deploy) | A2 | Baixo (ops) | RLS inerte; fail-soft silencioso |
| 3. Wave 8 de `tenantId` — catálogos municipais | A4 | Médio | Dados compartilhados entre municípios |
| 4. Fluxos do bot por tenant | A3 | Médio | Bot de todos alterado por um município |
| 5. Conversas do Messages Server com tenant | A5 | Médio | Chat sem isolamento at-rest |
| 6. Mover infraestrutura para `/api/platform` | A6 | Baixo | Metadados globais expostos |
| 7. Verificações finais + observações | A7/A8 | Baixo | — |

Fases 1 e 2 são independentes e podem ser feitas hoje. Fases 3–5 são migrations + backfill e podem ir juntas num único deploy. Fase 6 pode acompanhar a 1.

---

## FASE 1 — Cortar os endpoints legados `/api/super-admin/tenants*` (A1) 🔴

**Arquivo:** `digiurban/backend/src/routes/super-admin.ts` (bloco a partir de ~linha 2939).

### Passos
1. Remover os handlers legados (todos já duplicados em `/api/platform` via `tenant-provisioning.service.ts`):
   - `GET /tenants`
   - `POST /tenants`
   - `PATCH /tenants/:id`
   - `POST /tenants/:id/admins`
   - `POST /tenants/:id/users/:userId/reset-password`
   - `PATCH /tenants/:id/users/:userId`
   - `POST /tenants/:id/invoices`
2. No lugar, registrar um catch-all `router.all('/tenants*', ...)` retornando **410 Gone** com mensagem apontando para `/api/platform/tenants` (evita 404 genérico e facilita diagnóstico de clientes antigos).
3. **Frontend:** localizar chamadas a `/api/super-admin/tenants` nas páginas `/super-admin/*` e trocá-las para `/api/platform/tenants` com o fluxo de login de PlatformUser (cookie `digiurban_platform_token`). Se a UI de gestão de municípios dentro do `/super-admin` for mantida (memória do projeto: painel unificado), ela deve autenticar contra `/api/platform/auth/login` — a identidade muda, a UI pode permanecer.
4. Registrar `logAuditEvent` no corte (evento de segurança).

### Critério de aceite
- Nenhuma rota sob `adminAuthMiddleware` consegue ler ou mutar dados de outro tenant.
- Smoke: logar como SUPER_ADMIN do tenant A → `GET /api/super-admin/tenants` retorna 410; `POST /api/platform/tenants` sem token de plataforma retorna 401.

---

## FASE 2 — Armar RLS e modo estrito em produção (A2) 🔴

**Natureza:** operação de deploy (VPS), sem mudança de código.

### Passos
1. **Role não-superuser:**
   ```bash
   # no VPS, uma vez, como superuser:
   psql "$DATABASE_URL" -f digiurban/backend/scripts/setup-app-role.sql
   psql "$DATABASE_URL" -c "ALTER ROLE digiurban_app PASSWORD '<SENHA_FORTE>'"
   ```
2. Trocar o `DATABASE_URL` **da aplicação** (backend + messages server) no `.env` do VPS para `postgresql://digiurban_app:...@postgres:5432/digiurban`. **Migrations continuam com o usuário dono** — criar variável separada (ex.: `MIGRATE_DATABASE_URL`) se o `startup.sh` roda `prisma migrate deploy` no boot; ajustar o script para usar a credencial de migração.
3. Smoke de RLS armado: com a app conectada como `digiurban_app`, executar consulta com `set_config('app.tenant_id', '<tenant-A>', true)` e confirmar que linhas do tenant B não aparecem.
4. **Flags — ativação em 2 ondas, guiada pela telemetria** (`tenant-telemetry.ts` loga `reportTenantFailSoft`):
   - Onda 1 (imediata): `TENANT_REQUIRE_TOKEN_CLAIM=1` (invalida sessões antigas sem claim — usuários fazem re-login, impacto controlado) e `TENANT_STRICT_HOST=1` (host desconhecido deixa de cair no default; conferir antes que todos os domínios/subdomínios em uso estão em `TENANT_DEFAULT_HOSTS` ou cadastrados como tenant).
   - Onda 2 (após telemetria de `prisma-extension` fail-soft zerar por alguns dias): `TENANT_STRICT=1`.
5. Adicionar as três flags ao `docker-compose.vps.yml` (serviço backend) e documentar no `.env.example`.

### Critério de aceite
- `SELECT current_user` pela app retorna `digiurban_app`.
- Logs sem ocorrência de `tenant fail-soft` por 72h antes de `TENANT_STRICT=1`.

---

## FASE 3 — Wave 8 de `tenantId`: catálogos e dados municipais (A4) 🟠

**Padrão consolidado das waves 1–7:** adicionar coluna nullable + backfill com o tenant default + índice + (depois) política RLS. A extension cobre os models automaticamente via DMMF.

### 3.1 Models a escopar (migration `add_tenant_id_wave8`)
Prioridade 1 — usados em rotas hoje:
- `EspecialidadeMedica` (CRUD em saude-cadastros)
- `DestinoTFD`, `EspecialidadeTFD` (TFD)
- `ConjuntoHabitacional` (enums dropdown)
- `AlunoRota` (transporte escolar)
- `TipoDocumento`, `ProcedimentoOdonto` (se usados nas rotas de saúde — confirmar no momento da implementação)

Prioridade 2 — dado municipal latente (escopar na mesma wave para não deixar armadilha):
- `EspacoPublico`, `ViaturaSeguranca`, `GuiaTuristico`, `ParquePraca`, `EstabelecimentoTuristico`, `ModalidadeEsportiva`, `TipoOcorrencia`, `CursoProfissionalizante`, `ProgramaHabitacional`, `ProgramaAmbiental`, `TipoProducaoAgricola`, `MaquinaAgricola`, `EspecieArvore`, `TipoAtividadeCultural`, `TipoObraServico`, `TipoEstabelecimentoTuristico`

NÃO escopar (globais legítimos): `Tenant`, `PlatformUser`, `MunicipioConfig`, `Lead`, `Email*` (plataforma), `CacheEntry`, junction tables de pais escopados (`TeamMember`, `FieldApproval`, `ProfissionalEquipe`, `ProtocolServerAssignment`, `EmployeeHierarchy`, `*ProfessionalData`, `Signature`, `SchoolSecurityConfiguration`, `IndisponibilidadeAgenda` etc.).

### 3.2 Receita por model
```prisma
model EspecialidadeMedica {
  // ...campos existentes
  tenantId String?
  tenant   Tenant? @relation("Tenant8EspecialidadeMedica", fields: [tenantId], references: [id])
  @@index([tenantId])
}
```
```sql
-- migration wave8
ALTER TABLE "especialidades_medicas" ADD COLUMN "tenantId" TEXT;
UPDATE "especialidades_medicas" SET "tenantId" = '<DEFAULT_TENANT_ID>' WHERE "tenantId" IS NULL;
CREATE INDEX ... ON "especialidades_medicas"("tenantId");
-- + repetir padrão das waves anteriores para as demais tabelas
-- + estender a migration de RLS (política tenant_isolation) a essas tabelas
```
Depois, na janela seguinte (padrão `tenant_id_not_null_*`): `SET NOT NULL`.

### 3.3 Casos especiais
- **`ConfiguracaoESUS` / `TransmissaoESUS`:** o `municipioId @unique` é modelagem single-tenant. Trocar por `tenantId` + `@@unique([tenantId])` (uma config e-SUS por município). Verificar as rotas que leem `configuracaoESUS.findFirst()` — com a extension escopando, passam a funcionar por município sem mudança.
- **`AlunoRota`:** além do `tenantId`, corrigir em `transporte-escolar.service.ts`:
  - `count()`/`groupBy` globais (linhas ~310-312) passam a ser escopados automaticamente pela extension após a wave — nada a fazer além da migration.
  - `desvincularAluno(alunoRotaId)` — o `update` por id ganha o preflight de ownership automaticamente após a wave.
- **Seeds de catálogo** (se existirem, ex.: especialidades padrão): rodar dentro de `runAsTenant` por tenant, ou no provisionamento de tenant (`tenant-provisioning.service.ts`) — novo município nasce com os catálogos padrão.

### 3.4 Provisionamento
Atualizar `tenant-provisioning.service.ts` para semear os catálogos default (especialidades, tipos, destinos TFD) ao criar município novo — senão o município novo nasce com dropdowns vazios.

### Critério de aceite
- `getTenantScopedModels()` (export de diagnóstico da extension) inclui todos os models da wave.
- Smoke com 2 tenants: criar `EspecialidadeMedica` no tenant A → invisível no tenant B; `groupBy` de `AlunoRota` no tenant A não soma o B.

---

## FASE 4 — Fluxos do bot por tenant (A3) 🟠

**Decisão de produto embutida:** fluxo do bot é customizável por município (recomendado) ou é asset de plataforma?

### Caminho recomendado: `FlowDefinition` com `tenantId`
1. Migration: `tenantId String?` em `flow_definitions`; trocar unique de `name`(+version) para `@@unique([tenantId, name, version])`.
2. Backfill: fluxos existentes → tenant default.
3. **Seeder (`FlowDefinitionSeeder`, Messages Server):** semear os 9 fluxos para cada tenant ativo no boot (iterar tenants) e no provisionamento de novo município.
4. **FlowEngine/FlowEngineService:** resolver o fluxo por `(tenantId, name)` usando o `getBotTenantId()` do contexto já existente.
5. `admin-flows.routes.ts` não muda — a extension escopa automaticamente (CRUD do admin passa a afetar só o próprio município).

### Alternativa mínima (se fluxo for asset de plataforma)
Trocar o middleware de `admin-flows.routes.ts` para `platformAuthMiddleware` e remover a UI de admin municipal. Menor esforço, mas perde customização por município (o editor de fluxos em `/admin/bot-flows` deixa de fazer sentido para prefeituras).

### Critério de aceite
- Editar `menu-principal` no tenant A não altera o bot do tenant B.
- Município recém-provisionado tem os 9 fluxos funcionando.

---

## FASE 5 — Conversas do Messages Server com tenant (A5) 🟡

1. **Sincronizar o schema:** adicionar `tenantId String?` aos models `Conversation`, `Message` (e `ConversationParticipant` se existir) no `ultrazend-messages-server/prisma/schema.prisma` (espelhando o backend; mesmo banco, sem nova migration além da já existente no backend — conferir se as colunas já existem, pois o backend já as tem no schema).
2. **Backfill** das linhas NULL: derivar do participante cidadão (`Citizen.tenantId`) — script único:
   ```sql
   UPDATE conversations c SET "tenantId" = ct."tenantId"
   FROM citizens ct WHERE c."tenantId" IS NULL AND c."citizenId" = ct.id;
   UPDATE messages m SET "tenantId" = c."tenantId"
   FROM conversations c WHERE m."tenantId" IS NULL AND m."conversationId" = c.id;
   ```
   (ajustar nomes de coluna reais na implementação)
3. **ConversationService (Messages Server):** preencher `tenantId` nos `create` a partir de `getBotTenantId()` / claim do socket. Como o schema local não tem extension, setar explicitamente nos ~5 pontos de escrita.
4. **Leituras do Messages Server:** adicionar `tenantId` ao `where` das `findMany`/`findFirst` de conversas quando o contexto tiver tenant (defesa em profundidade sobre o ownership atual).
5. Estender a política RLS às tabelas de conversa (mesma migration da Fase 3 ou dedicada).
6. Documentar no CLAUDE.md do repo que o schema do Messages Server deve ser re-sincronizado a cada mudança de schema compartilhado (ou automatizar com um script de cópia).

### Critério de aceite
- Nova conversa criada pelo bot tem `tenantId` preenchido.
- Rotas do backend enxergam as conversas do próprio tenant (hoje ficam invisíveis por serem NULL).
- Zero linhas NULL após backfill.

---

## FASE 6 — Mover infraestrutura para `/api/platform` (A6) 🟡

1. Migrar de `super-admin.ts` para `platform.ts` (guardados por `platformAuthMiddleware` + `requirePlatformRole('PLATFORM_ADMIN')`):
   - `GET /system/metrics`, `GET /schema`, `POST /schema/run-migrations`
   - `POST /system/backup`, `GET /system/backups`, restore/delete de backup
2. O que permanece no `/super-admin` (escopo do próprio município): `/municipio`, `/stats` (já escopado pela extension), `/settings/municipal`, gestão de usuários do próprio tenant.
3. Backup por tenant (o atual já sai escopado pela extension) pode continuar existindo no `/super-admin` como "exportar dados do meu município" — renomear para deixar claro o escopo.

### Critério de aceite
- SUPER_ADMIN de tenant não acessa mais metadados de banco/migrations (401/410).

---

## FASE 7 — Verificações finais e observações (A7/A8) 🟢

1. **Email (A7):** auditoria dedicada nas rotas `admin-email*` / `email-domains` / `email-server` antes do 2º município usar email: caixas, domínios e credenciais SMTP devem ser resolvidos pelo tenant do request (ou explicitamente documentados como serviço de plataforma). O SMTP Server em si pode permanecer tenant-agnostic (roteia por domínio).
2. **Seletor de município no domínio raiz (A8, opcional de produto):** se desejado, implementar no frontend o envio de `X-Tenant-Slug`/cookie `digiurban_tenant_slug` (o backend já suporta). Caso contrário, garantir que o domínio raiz não ofereça cadastro de cidadão (hoje cairia no tenant default).
3. **Cache host→tenant:** confirmar TTL do cache do `TenantService` vs. requisito de corte imediato na suspensão de tenant; se necessário, invalidar cache no `PATCH /tenants/:id`.
4. **Testes de regressão multi-tenant (contínuo):** criar smoke automatizado com 2 tenants seedados cobrindo: login cruzado (token A em host B → 401), leitura cruzada (lista de protocolos/cidadãos/conversas), escrita cruzada (update por id de recurso alheio → P2025), jobs (`forEachActiveTenant` processa ambos), uploads (`/t/{A}/...` com token B → 403). Rodar no CI.

---

## Ordem de execução sugerida

```
Dia 1:  Fase 1 (corte legado) + Fase 6 (mover infra)         → 1 deploy
Dia 1:  Fase 2 passos 1–3 (role digiurban_app no VPS)         → ops
Dia 2:  Fase 2 onda 1 de flags (REQUIRE_TOKEN_CLAIM + STRICT_HOST)
Dia 2+: Fase 3 (wave 8) + Fase 4 (flows) + Fase 5 (conversas) → 1 deploy com migrations
Depois: Fase 2 onda 2 (TENANT_STRICT=1) quando telemetria zerar
Sempre: Fase 7.4 (smoke multi-tenant no CI)
```

## Riscos do plano
- **Fase 1/6:** se alguma tela do `/super-admin` ainda consome os endpoints legados, quebra a UI de gestão de municípios até migrar para `/api/platform` — mapear as chamadas do frontend ANTES do corte.
- **Fase 2:** trocar o role do banco sem separar a credencial de migração quebra o `prisma migrate deploy` do boot — tratar `MIGRATE_DATABASE_URL` junto.
- **Fase 3:** `SET NOT NULL` prematuro em tabela com escrita fora do contexto (jobs antigos, scripts) causa erro em produção — manter nullable até `TENANT_STRICT=1` estar estável, como nas waves anteriores.
- **Fase 4:** seeder por tenant no boot aumenta o tempo de inicialização do Messages Server com muitos tenants — semear on-demand ou no provisionamento se virar gargalo.
