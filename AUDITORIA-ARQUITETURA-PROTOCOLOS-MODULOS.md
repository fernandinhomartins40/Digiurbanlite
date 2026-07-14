# DigiUrban — Auditoria de Arquitetura e Proposta de Motor de Dados Orientado a Metadados

> Diagnóstico de como o sistema trata **serviços, protocolos, dados estruturados e "módulos" de secretaria**, e proposta de uma arquitetura que permite que qualquer serviço novo se auto-organize, indexe, relacione e gere painéis **sem escrever código**.
>
> Base: leitura direta de `schema.prisma` (232 models), rotas do backend (~94 prefixos) e serviços de negócio.
> Arquivos-chave verificáveis: `routes/management-configs.ts`, `routes/tab-modules.ts`, `services/protocol-module.service.ts`, `services/auto-categorization.service.ts`, `prisma/schema.prisma`.

## Tese em uma frase

O sistema **já é ~80% orientado a metadados** — mas os metadados que descrevem cada módulo estão **hardcoded em TypeScript** (`MANAGEMENT_CONFIGS`) e ramificados em `switch(moduleType)`. "Criar um módulo" hoje significa escrever um objeto de config + um `case` + (às vezes) uma tabela. A nova arquitetura **move esses metadados para o banco** e **torna a análise genérica**. O trabalho é de **consolidação e promoção**, não de reescrita.

---

# Parte I — Auditoria

## 01. Arquitetura atual, como realmente funciona

Existem **duas camadas de dados que coexistem e competem** para o mesmo propósito (armazenar o que o cidadão informa num serviço):

- **Camada A — Núcleo genérico.** `ServiceSimplified` descreve o serviço (`formSchema`, `formFieldsConfig`, `moduleType`). Ao solicitar, cria-se `ProtocolSimplified` e os dados vão para `customData` (JSON) como uma **"entidade virtual"** com bloco `_meta` (`entityType`, `status`, `isActive`, `approvedAt`, `approvedBy`). Genérico, serve qualquer serviço.
- **Camada B — Domínios concretos.** Dezenas de tabelas dedicadas: `SolicitacaoTFD`, `ViagemTFD`, `InscricaoMatricula`, `Matricula`, `CadUnicoFamilia`, `AtendimentoMedico`, `DispensacaoMedicamento`… Cada uma com colunas próprias, rotas próprias (`/saude/tfd`, `/saude/farmacia`) e adaptadores (`saude-unified-adapter`).

Sobre o núcleo genérico existe ainda um **terceiro mecanismo**: `ProtocolDataField` — um **EAV** clássico (uma linha por campo: `fieldKey / fieldLabel / fieldValue`) com fluxo de aprovação campo-a-campo (`FieldApproval`, `FieldChange`, status `PENDING → UNDER_REVIEW → APPROVED / REJECTED / CORRECTED`). Portanto o mesmo dado pode viver em **três lugares**.

### Os "módulos" — o que são de fato

Não existe artefato "módulo" no banco. Um módulo é a soma de:

1. Um valor de `moduleType` (string) no serviço — ex. `CADASTRO_PRODUTOR`;
2. Um objeto `ManagementModuleConfig` em `management-configs.ts` (campos, filtros, quick-filters, colunas, ações em lote) — **escrito à mão em TypeScript**;
3. Um `case '<moduleType>'` na função `analyzeCustomData()` de `tab-modules.ts`, que gera KPIs/gráficos do dashboard;
4. Opcionalmente, uma `CitizenCategory` com `triggerServices: ['CADASTRO_PRODUTOR']` — o mecanismo que faz "cidadão vira Produtor Rural" ao aprovar o protocolo.

> **Descoberta central:** as rotas de módulo **já são genéricas** — `GET /api/:department/:module/{list,approval,dashboard,management}` em `tab-modules.ts` servem *todos* os módulos. O que **não** é genérico é (a) a **fonte dos metadados** (código, não banco) e (b) a **função de análise** do dashboard (`switch` hardcoded). Resolver esses dois pontos elimina o "criar módulo novo".

### A tipagem do cidadão já existe — e é sofisticada

`CitizenCategory` + `CitizenCategoryAssignment` são um sistema de perfis dinâmicos maduro: hierarquia (pai/filho), pré-requisitos, categorias conflitantes/complementares, validade e renovação, progressão/níveis, badges, histórico (`CitizenCategoryProtocolHistory`) e auditoria (`CitizenCategoryAuditLog`). A atribuição automática vem de `auto-categorization.service.ts`, que na aprovação busca categorias onde `moduleType = ANY(triggerServices)`. **Isto já é a resposta correta** para "cidadão passa a ser Produtor Rural, Ambulante, Artesão".

### Fundação multi-tenant

Isolamento por `tenantId` via extension do Prisma (detecção por DMMF) + RLS PostgreSQL (`app.tenant_id` GUC, role `digiurban_app`). Uniques de catálogo são compostas `[tenantId, x]`. Categorias e fluxos do bot são por tenant. **A nova arquitetura herda tudo disso.**

## 02. Pontos fortes

- **Núcleo serviço/protocolo já dinâmico** — `formSchema` + `customData` permitem a maioria dos serviços sem tabela nova. O padrão "entidade virtual" com `_meta` é uma abstração correta.
- **Rotas de módulo genéricas por convenção** — `/api/:department/:module/*` já não é código-por-módulo.
- **Sistema de categorias/tipagem maduro** — hierarquia, validade, progressão, badges, auditoria e auto-atribuição por `triggerServices`.
- **Multi-tenant com RLS real** — isolamento em duas camadas (extension + RLS), transparente para a aplicação.
- **Workflow e SLA desacoplados** — `ServiceWorkflow`, `ProtocolStage`, `ProtocolSLA`, matriz de transição por role em `protocol-status.config.ts`.
- **Rastreabilidade forte** — `ProtocolHistorySimplified`, `FieldApproval/FieldChange`, `CitizenCategoryAuditLog`.

## 03. Pontos fracos

| Sev. | Ponto | Detalhe |
|---|---|---|
| 🔴 Crítico | **Metadados de módulo vivem em código** | `MANAGEMENT_CONFIGS` e o `switch` de `analyzeCustomData` exigem deploy para cada módulo novo. Causa-raiz de "cada serviço vira um módulo à mão". |
| 🔴 Crítico | **Três mecanismos de dados concorrentes** | `customData` (JSON) vs `ProtocolDataField` (EAV) vs tabelas de domínio. Sem fonte de verdade única; risco de divergência. |
| 🔴 Crítico | **Sem esquema forte para `customData`** | É `Json?` livre. Nada garante aderência ao `formSchema` vigente; sem versionamento; renomear campo quebra dados históricos silenciosamente. |
| 🟠 Atenção | **Análise de dashboard não genérica** | KPIs/gráficos só para 3 `case` (`CADASTRO_PRODUTOR`, `_PACIENTE`, `_ESTUDANTE`). Outros módulos caem em caminho vazio. |
| 🟠 Atenção | **Entidades não são de primeira classe** | Produtor, Ambulante, Empresa, Imóvel só existem como categoria + JSON dentro de um protocolo. Não há tabela consultável de "todos os imóveis"/"todas as empresas" independente do protocolo. |
| 🟠 Atenção | **Sobreposição de rotas** | `services.ts`, `dynamic-services.ts`, `admin-dynamic-services.ts`, `unified-protocols.routes.ts`, `saude-unified-adapter` resolvem problemas próximos de formas diferentes. |

## 04. Gargalos

| Gargalo | Onde | Efeito |
|---|---|---|
| **Busca em `customData` em memória** | `tab-modules.ts` carrega protocolos e filtra em JS | Não usa índice; cresce O(n); filtros do config não viram `WHERE`. |
| **Sem índice GIN em JSON** | schema — `customData Json?` | Impossível filtrar/ordenar por campo dinâmico no banco. "Por bairro", "com DAP" é O(n) na aplicação. |
| **Deploy no caminho crítico de negócio** | criar módulo = editar TS + `case` + build | Secretaria não é autônoma; TI vira gargalo humano por serviço. |
| **Análise por `switch`** | `analyzeCustomData` | Dashboards só para módulos conhecidos. |
| **Fan-out de rotas de saúde** | `/saude/*` (~130 endpoints) | Reimplementa CRUD/consulta que o núcleo genérico já faria. |

## 05. Escalabilidade

- **Features crescem em O(desenvolvedor):** mais serviços estruturados ⇒ mais configs em TS ⇒ mais `case` ⇒ mais deploy. Custo marginal não tende a zero.
- **Dados limitados pelo JSON não-indexado:** com dezenas de milhares de protocolos/tenant, gestão e dashboards degradam por filtrarem em memória.
- **Explosão de schema:** 232 models e crescendo — cada domínio novo tende a adicionar tabelas concretas (cada uma exige `tenantId` + índice + política RLS).
- **Onboarding de município:** tenant novo depende de seeds que replicam configs de código; falta um "catálogo de tipos de serviço" que o município ative sozinho.

## 06. Manutenção

- **Metadados duplicados em três dialetos:** `formSchema` (definição), `formFieldsConfig`/`enabledFields` (habilitação) e `ManagementModuleConfig` (exibição/filtro) descrevem os mesmos campos com formatos diferentes; sincronia manual e frágil.
- **Renomear campo é perigoso:** a chave em `customData` é a mesma string dos configs; alterar `formSchema` não migra os JSONs gravados.
- **Rotas redundantes:** múltiplas rotas de "serviço dinâmico"/"protocolo unificado" com fronteiras difusas.
- **Código morto documentado:** o schema registra remoção de tentativas anteriores de genéricos (`CustomDataTable`, `CustomDataRecord`) e de `municipioId` órfão — sinal de que o rumo metadata-driven já foi tentado sem consolidar.

## 07. Performance

| Sev. | Ponto | Detalhe |
|---|---|---|
| 🔴 Crítico | **Filtro/ordenação de dados dinâmicos fora do banco** | Sem GIN nem colunas projetadas, tudo é carregado e iterado em JS. Ignora o planner do PostgreSQL. |
| 🟠 Atenção | **Dashboards recomputados a cada request** | `analyzeCustomData` agrega em tempo real sobre o conjunto carregado; sem materialização/cache por tenant+módulo. |
| 🟠 Atenção | **EAV amplifica linhas** | Se `ProtocolDataField` escalar, N campos ⇒ N linhas/protocolo; joins/agregações caros sem pivot. |
| 🟢 OK | **Índices do núcleo adequados** | `ProtocolSimplified` indexa `status`, `createdAt`, `[moduleType,status]`, `[departmentId,status]`, `citizenId`, `tenantId`. Problema é só o **interior** do JSON. |

## 08. Dependências desnecessárias

- **Módulo ↔ deploy** — a mais cara. Quebrar movendo metadados para o banco.
- **Dashboard ↔ tipo conhecido** — `analyzeCustomData` depende de conhecer o módulo em compile-time. Deve virar agregação dirigida por metadados.
- **Tabelas de domínio ↔ núcleo** — TFD/Matrícula/CadÚnico reimplementam o protocolo genérico. Boa parte pode virar "tipo de entidade"; casos com regra clínica/fiscal pesada permanecem (decisão caso-a-caso, ver §12).
- **Três formatos de metadados de campo** — colapsar num único *Field Definition* canônico elimina a sincronização manual.

---

# Parte II — Fluxos

## 09. Fluxo completo dos dados (hoje)

```
Cidadão/Bot/Atendente preenche formulário
      → ServiceSimplified.formSchema (definição)
      → ProtocolSimplified.customData (+ _meta)   ← persistência (JSON opaco)
      → aprovação: _meta.status vira ativo (opcional EAV em ProtocolDataField)
      → CitizenCategoryAssignment via triggerServices (tipagem do cidadão)
```

Depois de gravado, o dado é lido por três consumidores: **listagem/gestão** (`tab-modules`, filtra em memória), **dashboard** (`analyzeCustomData`, por `switch`) e **perfil do cidadão** (categorias). O JSON nunca é normalizado nem indexado no banco.

> **Onde quebra:** o dado **entra estruturado** (o formulário sabe os tipos) mas é **gravado como JSON opaco**. A partir daí, toda inteligência (filtrar, agregar, relacionar) precisa ser reconstruída em código específico. A estrutura existe na entrada e é jogada fora na persistência.

## 10. Fluxo completo dos protocolos

```
VINCULADO → PROGRESSO → CONCLUIDO (terminal)
                      → CANCELADO (terminal)
          → PENDENCIA → PROGRESSO
          → ATUALIZACAO → PROGRESSO
```

Transições governadas por role em `protocol-status.config.ts`, executadas por `protocol-status.engine.ts`; cada transição grava `ProtocolHistorySimplified`. Em paralelo: **estágios** (`ProtocolStage`/`ServiceWorkflow`), **SLA** (`ProtocolSLA.isOverdue/daysOverdue`), **pendências** (`ProtocolPending`), **documentos** (`ProtocolDocument`, assinatura digital), **atribuição** (`currentAssignedUserId`, `Team`, `ProtocolServerAssignment`) e, na aprovação, a **categorização automática**.

> **Gancho-chave:** a **aprovação** já é o ponto onde "dado vira fato de negócio" (ativa a entidade virtual e atribui categoria). É exatamente aí que a nova entidade de primeira classe deve ser **materializada**.

## 11. Fluxo completo dos serviços

1. **Criação** (admin): `name`, `departmentId`, `serviceType` (COM_DADOS/sem dados), `moduleType`, `formSchema`, documentos, regras de unicidade, workflow.
2. **Publicação:** aparece no catálogo do cidadão (`citizen-services`) e no bot (`solicitar-servico.json`).
3. **Solicitação:** `protocol-module.service.ts` valida unicidade, resolve geolocalização, gera número, cria protocolo com `customData`.
4. **Tratamento:** workflow/estágios/SLA; validação de campos (opcional via EAV).
5. **Conclusão:** aprovação ativa a entidade virtual, atribui categoria, gera documento assinado.

**Falta** um passo de "declarar o que este serviço produz": que tipo de entidade permanente (Produtor, Imóvel, Empresa), quais campos são indexáveis, quais viram indicadores. Hoje isso é suprido depois, à mão, no código do módulo.

## 12. Como eliminar os módulos específicos

Um "módulo" se decompõe em quatro responsabilidades — cada uma com substituto orientado a metadados:

| Responsabilidade hoje | Onde vive hoje | Substituto metadata-driven |
|---|---|---|
| Definir campos do formulário | `formSchema` (já em banco) | Manter — vira fonte única de *Field Definitions*. |
| Colunas/filtros/quick-filters de gestão | `MANAGEMENT_CONFIGS` (código) | **Mover para banco:** `EntityType`/`FieldDefinition` com flags `indexable/filterable/facetable/displayIn*`. |
| Gerar KPIs e gráficos | `switch` em `analyzeCustomData` | **Agregador genérico:** deriva indicadores dos campos `metric/facet` — count/sum/avg/group-by/série temporal. |
| Transformar cidadão em "tipo" | `CitizenCategory.triggerServices` | Manter — já metadata-driven. Estender para Imóvel/Empresa via mesmo padrão de trigger. |

> **Resultado:** criar serviço estruturado novo passa a ser **preencher um formulário de definição** (campos + flags de indexação + o que vira indicador + que entidade materializa). **Zero deploy, zero `case`, zero tabela nova.** As tabelas de domínio realmente especializadas (regras clínicas do e-SUS, fiscais do TFD) permanecem — mas deixam de ser o *default* para todo serviço.

---

# Parte III — Nova arquitetura

## 13. Proposta — "Motor de Dados Governamentais"

Um núcleo único orientado a metadados, sobre a fundação atual (protocolo, categoria, multi-tenant), com seis subsistemas:

1. **Registry de esquemas** — define entidades e campos em banco.
2. **Store de registros** — dado estruturado + JSONB validado/versionado.
3. **Motor de indexação** — projeta campos indexáveis.
4. **Motor de busca/filtro elástico** dirigido por metadados.
5. **Motor de dashboards automáticos** (facets/metrics).
6. **Grafo de relações entre entidades** (entity resolution).

**Princípio:** a estrutura que já existe na entrada do formulário **nunca é descartada** — é declarada uma vez (Registry), gravada com contrato (Store), projetada para o índice (Indexação) e daí alimenta busca, dashboards e relações automaticamente.

> **Estratégia de armazenamento — híbrido JSONB + projeção:** o registro canônico vive num único `data JSONB` (validado contra o schema, versionado); os campos marcados `indexable` são **projetados** para um índice invertido tipado + GIN no JSONB. Combina flexibilidade do JSON com consultabilidade relacional, sem cair no EAV puro (linhas demais) nem no JSON puro (não-indexável).

## 14. Modelo conceitual

- **EntityType** — "o que existe no mundo": Cidadão, Produtor Rural, Imóvel, Empresa, Ambulante, Atendimento. Promoção do atual `moduleType`/`CitizenCategory` a cidadão de primeira classe.
- **FieldDefinition** — "quais atributos um tipo tem": tipo de dado, validação, flags (indexável, filtrável, facetável, métrica, PII).
- **EntityRecord** — "uma ocorrência concreta": este produtor, este imóvel. Contém o `data JSONB`.
- **Service/Protocol** — "o processo que cria/muda registros". O protocolo continua sendo o veículo transacional; ao ser aprovado, materializa/atualiza um `EntityRecord`.
- **EntityRelation** — "como as ocorrências se ligam": cidadão *possui* imóvel; empresa *emprega* cidadão.

```
EntityType 1—N FieldDefinition
      → EntityRecord (data JSONB)
      → Protocol (aprovação materializa)
      → EntityRelation (grafo)
```

## 15. Modelo lógico

| Entidade | Atributos-chave | Relações |
|---|---|---|
| `EntityType` | code, name, department, icon, color, kind (PERSON_ROLE/PROPERTY/ORG/EVENT), materializesFrom (moduleType[]) | 1—N FieldDefinition · 1—N EntityRecord |
| `FieldDefinition` | key, label, dataType, required, validation, **indexable**, **filterable**, **facetable**, **isMetric**, aggregation, isPII, displayInTable/Card, order | N—1 EntityType |
| `EntityRecord` | entityTypeId, **data JSONB**, schemaVersion, status, sourceProtocolId, citizenId?, createdAt | N—1 EntityType · 0—1 Protocol · 1—N RecordIndex |
| `RecordIndex` | recordId, fieldKey, valueText, valueNumber, valueDate, valueBool | N—1 EntityRecord (projeção dos indexáveis) |
| `EntityRelation` | fromRecordId, toRecordId, relType (OWNS/EMPLOYS/LIVES_AT/…), metadata | N—N EntityRecord |

`EntityType` **absorve** `CitizenCategory` quando `kind = PERSON_ROLE`; para Imóvel/Empresa, materializa uma linha real e consultável — resolvendo "entidades não são de primeira classe".

## 16. Modelo físico (PostgreSQL / Prisma)

> Todas as tabelas herdam `tenantId` + `@@index([tenantId])` + política RLS, como o restante do schema.

```prisma
model EntityType {
  id            String  @id @default(cuid())
  tenantId      String?
  code          String            // PRODUTOR_RURAL, IMOVEL_URBANO
  name          String
  kind          String            // PERSON_ROLE | PROPERTY | ORG | EVENT
  department    String
  materializesFrom String[]       // moduleTypes que geram este tipo
  fields        FieldDefinition[]
  records       EntityRecord[]
  @@unique([tenantId, code])
}

model FieldDefinition {
  id           String  @id @default(cuid())
  tenantId     String?
  entityTypeId String
  key          String             // area_hectares
  label        String
  dataType     String             // TEXT NUMBER DATE BOOL ENUM ARRAY GEO CPF REFERENCE
  required     Boolean @default(false)
  validation   Json?
  indexable    Boolean @default(false)
  filterable   Boolean @default(false)
  facetable    Boolean @default(false)
  isMetric     Boolean @default(false)
  aggregation  String?            // SUM | AVG | COUNT | MIN | MAX
  isPII        Boolean @default(false)
  order        Int     @default(0)
  entityType   EntityType @relation(fields:[entityTypeId], references:[id])
  @@unique([tenantId, entityTypeId, key])
}

model EntityRecord {
  id               String  @id @default(cuid())
  tenantId         String?
  entityTypeId     String
  data             Json               // canônico, validado contra o schema
  schemaVersion    Int     @default(1)
  status           String  @default("ACTIVE")
  sourceProtocolId String?
  citizenId        String?
  indexes          RecordIndex[]
  @@index([tenantId, entityTypeId, status])
}

// Projeção invertida dos campos indexáveis — vira WHERE/ORDER BY reais
model RecordIndex {
  id          String  @id @default(cuid())
  tenantId    String?
  recordId    String
  fieldKey    String
  valueText   String?
  valueNumber Float?
  valueDate   DateTime?
  valueBool   Boolean?
  @@index([tenantId, fieldKey, valueText])
  @@index([tenantId, fieldKey, valueNumber])
}

model EntityRelation {
  id           String @id @default(cuid())
  tenantId     String?
  fromRecordId String
  toRecordId   String
  relType      String             // OWNS LIVES_AT EMPLOYS …
  metadata     Json?
  @@index([tenantId, fromRecordId, relType])
  @@index([tenantId, toRecordId, relType])
}
```

Complementarmente, um **índice GIN** em `EntityRecord.data` (via migration SQL bruta, pois Prisma não modela GIN) habilita consultas ad-hoc de contenção JSONB (`@>`) para campos não projetados.

## 17. Estrutura das entidades

| Entidade | kind | Materializada por | Ancorada em |
|---|---|---|---|
| Cidadão | — | base (já existe) | `Citizen`/`Person` (mantidos) |
| Produtor Rural | PERSON_ROLE | CADASTRO_PRODUTOR | Citizen (via `citizenId`) |
| Ambulante / Artesão | PERSON_ROLE | CADASTRO_AMBULANTE / _ARTESAO | Citizen |
| Empresa | ORG | CADASTRO_EMPRESARIAL | EntityRecord autônomo + relação com Citizen (sócio) |
| Imóvel | PROPERTY | CADASTRO_IMOVEL / ambiental | EntityRecord autônomo + relação OWNS/LIVES_AT |
| Atendimento / Evento | EVENT | serviços consultivos | EntityRecord ligado a protocolo |

**PERSON_ROLE** reusa o motor de `CitizenCategory` (mesmo conceito, unificado). **PROPERTY/ORG** ganham existência própria: passa a ser possível consultar "todos os imóveis do bairro X" ou "empresas com alvará vencido" **independentemente do protocolo de origem** — impossível hoje.

## 18. Estrutura dos metadados

Os três formatos atuais colapsam num único **FieldDefinition canônico**. Cada flag responde a uma pergunta operacional:

| Flag | Pergunta | Efeito automático |
|---|---|---|
| `indexable` | Preciso filtrar/ordenar rápido? | Projeta para `RecordIndex` (WHERE/ORDER BY reais). |
| `filterable` | Aparece na barra de filtros? | Gera controle de filtro na UI. |
| `facetable` | Serve para agrupar/segmentar? | Vira facet de busca + eixo de dashboard (group-by). |
| `isMetric` + `aggregation` | É número que somo/médio? | Gera KPI automático (soma de hectares, média de renda). |
| `isPII` | É dado sensível? | Mascaramento/controle de acesso + trilha LGPD. |
| `displayInTable/Card` | Onde exibir? | Colunas da tabela e campos do card — sem código. |

O **formulário de definição de serviço** (que a secretaria preenche) escreve esses metadados. É o único ponto de autoria — declarativo, não programático.

## 19. Estratégia de indexação

- **Camada 1 — Projeção invertida (`RecordIndex`).** No *write* (aprovação/edição), campos `indexable` são projetados em linhas tipadas. Filtros/ordenação viram `JOIN + WHERE` nativos (B-tree). Caminho quente das listagens.
- **Camada 2 — GIN em `data JSONB`.** Consultas ad-hoc sobre campos não projetados (contenção `@>`, existência de chave). Rede de segurança para relatórios exploratórios.
- **Camada 3 — Full-text (`tsvector`) opcional.** Coluna gerada sobre campos `searchable` + GIN, para busca por texto livre. Evita depender de Elasticsearch numa v1.

> **Consistência write→index:** a projeção roda na mesma transação da escrita do `EntityRecord` (garantia forte); job idempotente de *reindex* por `EntityType` cobre mudanças de `indexable false→true`.

## 20. Estratégia de buscas inteligentes

Uma única API dirigida por metadados atende todas as formas de busca (cidadão, CPF, protocolo, imóvel, empresa, categoria, serviço, situação, secretaria):

```jsonc
POST /api/registry/query
{
  "entityType": "PRODUTOR_RURAL",
  "filters": [
    { "field":"bairro", "op":"eq", "value":"Centro" },
    { "field":"areaTotalHectares", "op":"gte", "value":10 },
    { "field":"possuiCertificacaoOrganica", "op":"eq", "value":true }
  ],
  "search": "cooperativa",          // full-text nos campos searchable
  "facets": ["tipoProdutor","principaisCulturas"],
  "sort": [{ "field":"areaTotalHectares", "dir":"desc" }],
  "page": 1, "pageSize": 50
}
```

O motor valida cada `field/op` contra o `FieldDefinition` (segurança + tipagem), roteia campos `indexable` para `RecordIndex`, os demais para GIN/JSONB, e retorna resultados + contagens por facet numa só resposta. **Elastic filtering** sai de graça porque os operadores válidos derivam do `dataType`.

## 21. Estratégia de dashboards automáticos

O `switch` de `analyzeCustomData` é substituído por um **gerador dirigido por metadados**. Para qualquer `EntityType`:

- **KPIs** ← campos `isMetric`: total de registros, soma/média conforme `aggregation`.
- **Distribuições (donut/barra)** ← campos `facetable` ENUM/ARRAY (por tipo de produtor, por cultura).
- **Série temporal** ← `createdAt` do registro/protocolo (novos cadastros por mês).
- **Mapa** ← campos `GEO` (usa a geolocalização já capturada no protocolo).
- **Cross-tab** ← combinação de dois `facetable` (bairro × certificação orgânica).

> **Materialização:** agregações caras são pré-computadas por `tenant + entityType` (reusar `MetricCache`/`Dashboard` já existentes) e invalidadas por eventos de escrita, eliminando o recompute a cada request (§07).

## 22. Estratégia de relacionamento entre entidades

`EntityRelation` forma um **knowledge graph** leve dentro do PostgreSQL. Relações criadas de três formas:

1. **Declarativa:** `FieldDefinition` do tipo `REFERENCE` apontando para outro `EntityType` (ex. cadastro de imóvel referencia o cidadão proprietário). Na materialização, a relação é criada automaticamente.
2. **Entity resolution:** ao materializar registro com CPF/CNPJ, o motor procura entidades existentes com o mesmo identificador e vincula (dedup por identificador natural), evitando duplicatas do mesmo produtor/empresa.
3. **Manual/curada:** a gestão pode ligar registros (ex. "este imóvel pertence a esta empresa").

Consultas de grafo úteis ficam triviais: "todos os imóveis de um cidadão", "todas as empresas de um sócio", "cidadãos ligados a um imóvel". Como cada `EntityRecord` aponta para `sourceProtocolId` e `citizenId`, o grafo já nasce conectado ao histórico e ao cidadão — **event-driven updates:** cada aprovação de protocolo emite um evento que cria/atualiza registro e relações.

---

# Parte IV — Execução

## 23. Plano de migração (não-destrutivo e reversível)

As novas tabelas convivem com as atuais; nada é apagado até o novo caminho estar validado em produção.

- **M1 — Introduzir o Registry sem tocar no fluxo.** Criar `EntityType/FieldDefinition/EntityRecord/RecordIndex/EntityRelation` (com `tenantId`+RLS). Escrever um *importador* que traduz cada `ManagementModuleConfig` e cada `formSchema` em linhas de `EntityType/FieldDefinition`. Fonte de verdade dupla temporária.
- **M2 — Backfill dos dados existentes.** Job por tenant que lê `ProtocolSimplified.customData` (+ EAV quando houver) e materializa `EntityRecord` + projeta `RecordIndex`. Idempotente e re-executável. `customData` permanece intacto como origem.
- **M3 — Ligar leitura ao Registry atrás de flag.** `tab-modules` lê do Registry quando `REGISTRY_READ=on`; senão, caminho antigo. Shadow read comparando resultados antes de virar a chave por tenant.
- **M4 — Ligar escrita ao Registry.** Na aprovação, além de ativar a entidade virtual, materializar o `EntityRecord` na mesma transação. Categorização continua funcionando (agora `kind=PERSON_ROLE`).
- **M5 — Aposentar o hardcode.** Depois de N tenants estáveis, remover `MANAGEMENT_CONFIGS` e o `switch`. Domínios especializados (TFD/e-SUS) permanecem, mas param de crescer para novos serviços genéricos.

## 24. Plano de implementação por fases

Fatias verticais, cada uma entregável e reversível, sem comprometer a estabilidade.

| Fase | Escopo | Entrega | Estabilidade |
|---|---|---|---|
| **F0** | Schema do Registry + migrations + RLS + GIN | Tabelas prontas, sem consumo | Zero risco (aditivo) |
| **F1** | Importador `MANAGEMENT_CONFIGS`/`formSchema` → Registry | Metadados em banco | Zero risco (offline) |
| **F2** | Motor de query genérico + projeção de índice | `POST /api/registry/query` funcional | Novo endpoint isolado |
| **F3** | Backfill + shadow-read em `tab-modules` | Paridade validada de listagem/gestão | Flag por tenant, rollback trivial |
| **F4** | Dashboards automáticos (facets/metrics) | KPIs/gráficos p/ qualquer `EntityType` | Substitui `switch` atrás de flag |
| **F5** | Materialização na aprovação + entity resolution + relações | Entidades de 1ª classe (Imóvel/Empresa) consultáveis | Escrita adicional transacional |
| **F6** | Editor no-code de serviço/entidade (UI secretaria) | Secretaria cria serviço estruturado sozinha | Fecha o objetivo: zero deploy |
| **F7** | Full-text/tsvector + limpeza do hardcode | Busca por texto livre; remoção de código morto | Só após F3–F5 estáveis |

O **objetivo** ("novo serviço sem novo módulo") é atingido funcionalmente em **F4** (leitura/dashboard genéricos) e plenamente em **F6** (autoria pela secretaria).

## 25. Riscos técnicos e mitigação

| Risco | Sev. | Mitigação |
|---|---|---|
| **Divergência de dados no backfill** — `customData` com chaves inconsistentes entre versões | 🔴 Alto | Versionar `FieldDefinition` e gravar `schemaVersion`; backfill tolerante que loga campos órfãos sem descartar o JSON original (sempre recuperável). |
| **Custo de escrita dobrado** (registro + projeção) | 🟠 Médio | Projetar só campos `indexable` (poucos), na mesma transação; reindex assíncrono para mudança de schema; medir com métricas antes de F5. |
| **Regressão de paridade em listagens/dashboards** | 🟠 Médio | Shadow-read comparando saída antiga vs nova por tenant; flag por tenant com rollback imediato; aposentar hardcode só após janela de estabilidade. |
| **Vazamento de isolamento multi-tenant** | 🟠 Médio | Toda tabela nova com `tenantId` + índice + RLS; incluir no `npm run smoke:tenant:isolation` e nos flags `TENANT_STRICT*` desde F0. |
| **Domínios especializados forçados no genérico** (TFD/e-SUS) | 🟠 Médio | Decisão explícita por `EntityType`: genérico é o default, mas domínios com lógica clínica/fiscal permanecem em suas tabelas; o Registry pode *indexá-los* para busca/dashboard sem absorver a regra. |
| **Adoção pelas secretarias (no-code)** | 🟢 Baixo | Reusar o padrão de wizard visual já existente; nunca expor editor de código — o formulário de definição é WYSIWYG, coerente com as convenções do frontend. |

---

## Recomendação final

**Não reescrever.** O caminho de menor risco e maior retorno é **promover os metadados de código para banco** e **tornar genérica a camada de análise**, construindo sobre protocolo, categoria e multi-tenant que já são sólidos. **F0–F4** já entregam o objetivo central; **F5–F7** transformam DigiUrban num verdadeiro *data catalog* municipal onde cada serviço novo é apenas mais metadado.
