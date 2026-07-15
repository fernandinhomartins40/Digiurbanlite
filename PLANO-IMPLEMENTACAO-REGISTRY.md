# Plano de Implementação — Motor de Dados Orientado a Metadados (Registry)

> Plano executável para migrar do modelo "módulo-por-serviço" para o **Registry metadata-driven** descrito em [AUDITORIA-ARQUITETURA-PROTOCOLOS-MODULOS.md](AUDITORIA-ARQUITETURA-PROTOCOLOS-MODULOS.md), **sem quebrar a aplicação em nenhum momento**.
>
> Princípio-mestre: **cada mudança é aditiva, atrás de flag e reversível.** Nada do fluxo atual é removido até o novo caminho estar validado em produção, tenant a tenant.

> **Progresso:** ✅ F0 (schema/migration/RLS/GIN, em produção) · ✅ F1 (importador de metadados) · ✅ F2 (motor de query + rotas `/api/registry/*`) · ✅ F3 (materialização + backfill + shadow-read atrás de `REGISTRY_READ`) · ✅ F4 (dashboards automáticos atrás de `REGISTRY_DASHBOARD`) · ⬜ F5–F7.
>
> **Marco atingido (F4):** serviço novo já tem listagem, filtro, busca e **dashboard** genéricos sem código.

---

## Índice

- [Regras de ouro (invioláveis)](#regras-de-ouro-invioláveis)
- [Pontos de integração no código atual](#pontos-de-integração-no-código-atual)
- [Estratégia de segurança: flags e rollback](#estratégia-de-segurança-flags-e-rollback)
- [F0 — Schema do Registry (aditivo)](#f0--schema-do-registry-aditivo)
- [F1 — Importador de metadados (offline)](#f1--importador-de-metadados-offline)
- [F2 — Motor de query genérico](#f2--motor-de-query-genérico)
- [F3 — Backfill + shadow-read](#f3--backfill--shadow-read)
- [F4 — Dashboards automáticos](#f4--dashboards-automáticos)
- [F5 — Materialização na aprovação + relações](#f5--materialização-na-aprovação--relações)
- [F6 — Editor no-code (secretaria)](#f6--editor-no-code-secretaria)
- [F7 — Full-text + limpeza do hardcode](#f7--full-text--limpeza-do-hardcode)
- [Checklist multi-tenant por fase](#checklist-multi-tenant-por-fase)
- [Critérios de "pronto" (Definition of Done)](#critérios-de-pronto-definition-of-done)

---

## Regras de ouro (invioláveis)

1. **Aditivo primeiro.** Toda migration de schema só **adiciona** tabelas/colunas. Nenhuma remoção antes da F7.
2. **Dupla escrita antes de trocar a leitura.** O Registry é populado (F3–F5) enquanto `customData` continua sendo a fonte de verdade. A leitura só migra depois de paridade comprovada.
3. **Flag por tenant.** Cada corte de comportamento (`REGISTRY_READ`, `REGISTRY_WRITE`, `REGISTRY_DASHBOARD`) liga/desliga por tenant, com rollback imediato.
4. **`customData` nunca é descartado.** Ele permanece intacto como origem e rede de recuperação, mesmo após a materialização.
5. **Toda tabela nova nasce multi-tenant.** `tenantId String?` + `@@index([tenantId])` + política RLS + inclusão no smoke de isolamento — desde a F0.
6. **`type-check` + `diagnose` verdes a cada PR.** `npm run type-check` e `npm run diagnose` (carregamento de rotas) não podem regredir.
7. **Nenhuma fase depende da seguinte para ser estável.** Se o projeto parar em qualquer F, a aplicação continua funcional.

---

## Pontos de integração no código atual

Referências verificadas — os passos abaixo tocam exatamente estes locais:

| O que | Arquivo / símbolo |
|---|---|
| Criação de protocolo com `customData` + `_meta` | `services/protocol-module.service.ts` → `createProtocolWithModule` (~L155) |
| **Aprovação** (gancho de materialização) | `services/protocol-module.service.ts` → `approveProtocol()` (L422) |
| Categorização automática (já existe) | `routes/protocols-simplified.routes.ts` (L1508) → `services/auto-categorization.service.ts` → `assignCategoriesOnProtocolApproval()` |
| Leitura de módulos (list/approval/dashboard/management) | `routes/tab-modules.ts` |
| Metadados hardcoded (a promover) | `routes/management-configs.ts` → `MANAGEMENT_CONFIGS` |
| Análise de dashboard hardcoded (a generalizar) | `routes/tab-modules.ts` → `analyzeCustomData()` (`switch`) |
| Definição do serviço/formulário | `schema.prisma` → `ServiceSimplified.formSchema` / `formFieldsConfig` |
| Tenant runtime (GUC) | `lib/prisma-tenant-extension.ts`, `lib/tenant-context.ts` (`withTenantTransaction`) |
| Iteração de tenants (jobs/seeds) | `lib/tenant-iterator.ts` (`forEachActiveTenant`, `runAsTenant`) |
| Padrão de migration RLS | `prisma/migrations/*force_row_level_security*` (função `current_tenant_id()`) |
| Smoke de isolamento | `npm run smoke:tenant:isolation` (`scripts/smoke-multi-tenant.ts`) |
| Migrations com role não-superuser | `MIGRATE_DATABASE_URL` (RLS só vale com `digiurban_app`) |

---

## Estratégia de segurança: flags e rollback

Três flags independentes, resolvidas **por tenant** (via `MunicipioConfig` ou env com allowlist de tenants):

```
REGISTRY_READ       # tab-modules lê do Registry (default: OFF → caminho atual)
REGISTRY_WRITE      # aprovação materializa EntityRecord (default: OFF)
REGISTRY_DASHBOARD  # dashboard usa agregador genérico (default: OFF)
```

Regras:
- **OFF é sempre o comportamento atual, byte a byte.** Ligar uma flag nunca pode ser pré-requisito de outra funcionalidade existente.
- **Ordem de ativação por tenant:** `WRITE` (popular) → `READ` (shadow → trocar) → `DASHBOARD`.
- **Rollback:** desligar a flag. Como `customData` permanece intacto e a escrita no Registry é idempotente, não há perda de dados nem estado inconsistente.

---

## F0 — Schema do Registry (aditivo)

**Objetivo:** tabelas prontas, sem nenhum consumo. Risco zero (puramente aditivo).

### Passos

1. **Adicionar os 5 models** ao `schema.prisma` (`EntityType`, `FieldDefinition`, `EntityRecord`, `RecordIndex`, `EntityRelation`) — todos com `tenantId String?` + relação `tenant` + `@@index([tenantId])`, seguindo o padrão das ondas de multi-tenant existentes.
2. **Gerar migration** com `prisma migrate dev --create-only` (revisar SQL antes de aplicar).
3. **Escrever migration SQL complementar** (Prisma não modela GIN):
   ```sql
   -- Índice GIN para consulta ad-hoc no JSONB canônico
   CREATE INDEX IF NOT EXISTS idx_entity_record_data_gin
     ON entity_records USING GIN (data jsonb_path_ops);
   ```
4. **Estender a política RLS** — adicionar `entity_types`, `field_definitions`, `entity_records`, `record_indexes`, `entity_relations` ao array de tabelas da função de RLS (mesmo bloco `FOREACH t IN ARRAY [...]` do `current_tenant_id()`).
5. **Aplicar via `MIGRATE_DATABASE_URL`** (owner) e validar com `npm run diagnose` + `npm run type-check`.
6. **Adicionar as 5 tabelas ao `scripts/smoke-multi-tenant.ts`** para o smoke cobrir o isolamento desde já.

### Definition of Done F0
- [ ] Migration aplica e reverte limpa em banco local.
- [ ] `type-check` e `diagnose` verdes.
- [ ] `npm run smoke:tenant:isolation` passa incluindo as tabelas novas.
- [ ] Nenhuma rota nova exposta; nenhum comportamento alterado.

---

## F1 — Importador de metadados (offline)

**Objetivo:** transformar o conhecimento hardcoded em linhas de banco, sem tocar no runtime.

### Passos

1. **Script `scripts/registry/import-configs.ts`** que, para cada tenant ativo (`forEachActiveTenant`):
   - Lê `MANAGEMENT_CONFIGS` (`management-configs.ts`) e cada `ServiceSimplified` COM_DADOS (com `formSchema`/`formFieldsConfig`).
   - Cria/atualiza um `EntityType` por `moduleType` (idempotente por `[tenantId, code]`).
   - Cria `FieldDefinition` a partir dos campos, mapeando as flags:
     - `searchable/filterable` do config → `filterable` (+ `indexable` quando usado em filtro/ordenação).
     - campos numéricos usados em KPI → `isMetric` + `aggregation`.
     - campos `enum/array` → `facetable`.
     - `displayInTable/displayInCard` → preservados.
   - Vincula `EntityType.materializesFrom = [moduleType]`.
2. **Reconciliar com `CitizenCategory`:** onde `triggerServices` referencia o `moduleType`, marcar `EntityType.kind = 'PERSON_ROLE'` e registrar o vínculo (a categoria continua sendo a fonte da tipagem do cidadão).
3. **Relatório de importação** (dry-run por padrão): quantos types/fields por tenant, campos ambíguos, colisões — sem gravar até `--apply`.

### Definition of Done F1
- [ ] Dry-run gera relatório coerente para todos os tenants.
- [ ] `--apply` popula `EntityType`/`FieldDefinition` de forma idempotente (rodar 2× não duplica).
- [ ] Nenhuma rota de runtime consome ainda essas tabelas.

---

## F2 — Motor de query genérico

**Objetivo:** um endpoint de consulta dirigido por metadados, isolado (não substitui nada ainda).

### Passos

1. **Serviço `services/registry/registry-query.service.ts`** com uma função `query(entityTypeCode, { filters, search, facets, sort, page })` que:
   - Carrega os `FieldDefinition` do type (cache por tenant+type).
   - **Valida** cada `field/op` contra o `dataType` (rejeita operador inválido → segurança + tipagem forte).
   - Roteia campos `indexable` para `JOIN record_indexes` (WHERE/ORDER BY nativos); demais para `data @> ...` (GIN).
   - Calcula contagens por facet.
   - Roda dentro de `withTenantTransaction` (RLS aplicado).
2. **Rota `routes/registry.routes.ts`** → `POST /api/registry/query` (auth admin, `requireMinRole(USER)`), registrada em `index.ts` via `loadRoute()`.
3. **Testes de contrato** cobrindo cada `dataType`/operador e paginação.

> Nesta fase o endpoint retorna dados **apenas se o Registry estiver populado** (F3). Pode ser testado contra o resultado do backfill em staging.

### Definition of Done F2
- [ ] `POST /api/registry/query` responde com validação de tipo e facets.
- [ ] Query usa índice (`EXPLAIN` confirma uso de `record_indexes`/GIN, sem seq scan no caminho quente).
- [ ] `diagnose` reconhece a rota nova.

---

## F3 — Backfill + shadow-read

**Objetivo:** popular o Registry a partir do histórico e **provar paridade** antes de trocar a leitura.

### Passos

1. **Job `scripts/registry/backfill.ts`** (por tenant, idempotente, re-executável):
   - Para cada `ProtocolSimplified` COM_DADOS: cria/atualiza `EntityRecord` (`data` = `customData` sem `_meta`, `sourceProtocolId`, `citizenId`, `schemaVersion`), e **projeta** os campos `indexable` em `RecordIndex`.
   - Tolerante a divergência: campo presente no JSON mas ausente do schema → grava no `data` e **loga** como órfão; nunca descarta.
   - Processa em lotes com checkpoint (retomável).
2. **Shadow-read em `tab-modules.ts`:** quando `REGISTRY_READ` está em modo `shadow`, executa **as duas** leituras (atual + Registry), retorna a atual ao usuário e **compara em background**, logando divergências por tenant/módulo.
3. **Painel de paridade** (log/telemetria): % de igualdade por módulo. Meta: ≥ 99,9% antes de virar a chave.
4. **Virar `REGISTRY_READ=on`** tenant a tenant, começando por um piloto de baixo volume.

### Definition of Done F3
- [ ] Backfill roda 2× sem duplicar e sem perder órfãos.
- [ ] Shadow-read reporta paridade por tenant; divergências investigadas e zeradas.
- [ ] Pelo menos 1 tenant piloto lendo do Registry em produção, com rollback testado.

---

## F4 — Dashboards automáticos

**Objetivo:** substituir o `switch` de `analyzeCustomData` por um agregador genérico dirigido por metadados.

### Passos

1. **Serviço `services/registry/registry-dashboard.service.ts`** que, para um `EntityType`, deriva:
   - **KPIs** dos campos `isMetric` (count/sum/avg conforme `aggregation`).
   - **Distribuições** dos campos `facetable` (group-by → donut/barra).
   - **Série temporal** por `createdAt` (novos registros/mês).
   - **Mapa** de campos `GEO` (reusa lat/long já capturados no protocolo).
2. **Materialização/cache** por `tenant + entityType` reusando `MetricCache`/`Dashboard` já existentes; invalidação por evento de escrita (elimina recompute por request).
3. **Ligar atrás de `REGISTRY_DASHBOARD`** em `tab-modules.ts`: flag ON → agregador genérico; OFF → `switch` atual.
4. **Comparar** os 3 módulos já cobertos (`CADASTRO_PRODUTOR/_PACIENTE/_ESTUDANTE`) contra o resultado do `switch` (paridade de KPIs).

### Definition of Done F4
- [ ] Qualquer `EntityType` gera dashboard sem código específico.
- [ ] Paridade confirmada nos 3 módulos legados.
- [ ] Cache invalida corretamente após escrita.

> **Marco de negócio:** a partir daqui, "serviço novo tem dashboard automático" — o objetivo central já é funcional.

---

## F5 — Materialização na aprovação + relações

**Objetivo:** tornar o Registry a fonte viva (não só backfill) e criar entidades de 1ª classe (Imóvel, Empresa).

### Passos

1. **Gancho em `approveProtocol()`** (`protocol-module.service.ts:422`), atrás de `REGISTRY_WRITE`:
   - **Na mesma transação** que ativa a entidade virtual e chama a categorização, cria/atualiza o `EntityRecord` + projeta `RecordIndex`.
   - Mantém a chamada existente a `assignCategoriesOnProtocolApproval` (nada muda para `PERSON_ROLE`).
2. **Entity resolution:** ao materializar com CPF/CNPJ, procurar `EntityRecord` existente com o mesmo identificador natural e vincular (dedup) em vez de duplicar.
3. **Relações declarativas:** `FieldDefinition` do tipo `REFERENCE` → cria `EntityRelation` automaticamente (ex. imóvel → cidadão proprietário `OWNS`).
4. **Consistência:** falha na materialização **não** pode derrubar a aprovação — a materialização é parte da transação; se a política for "aprovação nunca falha por causa do Registry", isolar num passo com retry/outbox e alerta (decisão a registrar no PR).

### Definition of Done F5
- [ ] Aprovar protocolo com `REGISTRY_WRITE=on` materializa registro + índices + relações.
- [ ] CPF repetido não gera entidade duplicada.
- [ ] Consulta "todos os imóveis do cidadão X" retorna via `EntityRelation`.
- [ ] Categorização do cidadão continua idêntica.

---

## F6 — Editor no-code (secretaria)

**Objetivo:** fechar o objetivo — secretaria cria serviço estruturado **sem deploy**.

### Passos

1. **Estender o wizard de serviço** (frontend, padrão WYSIWYG já existente) para, ao definir os campos do `formSchema`, permitir marcar por campo: `indexable`, `filterable`, `facetable`, `isMetric`+`aggregation`, `isPII`, `displayInTable/Card`, e escolher a `EntityType`/`kind` que o serviço materializa.
2. **Endpoints admin** para CRUD de `EntityType`/`FieldDefinition` (`routes/registry.routes.ts`), respeitando permissão por secretaria/role.
3. **Ao salvar o serviço**, gravar os `FieldDefinition` correspondentes (a definição do formulário passa a ser a fonte única — fim do `formSchema` desalinhado dos configs).
4. **Nunca expor editor de código** — só o formulário visual (convenção do produto: usuários são leigos).

### Definition of Done F6
- [ ] Uma secretaria cria um serviço estruturado novo e obtém listagem, filtros, busca e dashboard **sem PR/deploy**.
- [ ] Permissões por secretaria respeitadas.

---

## F7 — Full-text + limpeza do hardcode

**Objetivo:** busca por texto livre e remoção segura do código legado — **só após F3–F5 estáveis em N tenants**.

### Passos

1. **`tsvector` gerado** sobre campos `searchable` + índice GIN; ligar a busca por texto livre no motor de query (§20 da auditoria).
2. **Remover `MANAGEMENT_CONFIGS`** e o `switch` de `analyzeCustomData` **depois** que todos os tenants leem do Registry (`REGISTRY_READ`/`REGISTRY_DASHBOARD` = on há uma janela de estabilidade).
3. **Consolidar rotas redundantes** (`services.ts` / `dynamic-services.ts` / `admin-dynamic-services.ts` / `unified-protocols`) — depreciar as sobrepostas apontando para o Registry.
4. **Documentar no `CLAUDE.md`** o novo padrão: "serviço estruturado novo = `EntityType` + `FieldDefinition`, sem módulo".
5. Domínios especializados (TFD, e-SUS, farmácia) **permanecem** — mas podem ser *indexados* pelo Registry para busca/dashboard sem absorver a regra.

### Definition of Done F7
- [ ] Busca textual funcional.
- [ ] `MANAGEMENT_CONFIGS` e `switch` removidos sem regressão (paridade histórica mantida).
- [ ] `CLAUDE.md` atualizado.

---

## Checklist multi-tenant por fase

Aplicar a **toda** tabela/rota nova, em **toda** fase:

- [ ] `tenantId String?` + relação `tenant` + `@@index([tenantId])`.
- [ ] Tabela incluída na política RLS (`current_tenant_id()`).
- [ ] Uniques de catálogo compostas `[tenantId, x]` (usar `findFirst`, não `findUnique`, pois a extension escopa).
- [ ] Escritas em job/seed via `runAsTenant` / `forEachActiveTenant`; `$queryRaw` via `withTenantTransaction`.
- [ ] Migration aplicada com `MIGRATE_DATABASE_URL` (owner); runtime usa `digiurban_app`.
- [ ] `npm run smoke:tenant:isolation` cobre as tabelas novas e passa.

---

## Critérios de "pronto" (Definition of Done)

**Por PR:** `type-check` verde · `diagnose` verde · smoke de isolamento verde · flag nova default OFF · rollback documentado.

**Por fase:** DoD específico acima + nenhuma regressão no caminho atual (flags OFF reproduzem o comportamento byte a byte).

**Do projeto (objetivo do usuário):**
- **Atingido funcionalmente em F4** — serviço novo já tem listagem, filtro, busca e dashboard genéricos.
- **Atingido plenamente em F6** — a secretaria cria o serviço sozinha, sem desenvolvimento nem deploy.
- **F7** consolida e remove o legado, transformando o DigiUrban num *data catalog* municipal onde cada serviço novo é apenas mais metadado.

---

## Ordem de execução recomendada e paralelismo

```
F0 ──► F1 ──► F2 ──┐
                   ├──► F3 (backfill + shadow) ──► F4 (dashboards) ──► F5 (write/relações) ──► F6 (no-code) ──► F7 (limpeza)
   (F1 e F2 podem correr em paralelo após F0)
```

- **F0** é pré-requisito de tudo (schema).
- **F1** (importador) e **F2** (motor de query) são independentes entre si; podem ser feitas em paralelo.
- **F3** precisa de F1+F2. As demais são sequenciais por dependerem de dados/leitura estáveis.
- **F7** só inicia após janela de estabilidade de F3–F5 em produção.
