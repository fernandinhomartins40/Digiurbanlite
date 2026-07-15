# Plano — Dois Módulos Gerais por Secretaria (fim dos módulos por serviço)

> Reorganiza o admin das secretarias de **N módulos (um por serviço-com-dados) + módulo de serviços-sem-dados** para **2 módulos gerais e reutilizáveis por secretaria**, dirigidos pelos metadados do [Registry](PLANO-IMPLEMENTACAO-REGISTRY.md). As funções inteligentes (cadastro, mapa, filtros, busca, aprovação, painel, relações) deixam de ser reprogramadas por serviço e passam a viver nos módulos gerais.
>
> **Não** é uma tela genérica que empobrece — é um sistema **mais inteligente**: as capacidades ricas que hoje existem espalhadas passam a ser oferecidas por metadados, para qualquer tipo de dado coletado, sem código por serviço.

---

## 0. Três conceitos que NÃO se confundem

Antes de tudo, a separação definitiva (verificada no código — ver memória `tres-conceitos-etiqueta-dado-app`):

| Conceito | O que é | Onde vive | Entra na reforma? |
|---|---|---|---|
| **Etiqueta / marcação** | Característica que o cidadão ganha ao solicitar um serviço (ex.: "Produtor Rural", "Beneficiário") | `CitizenCategory` + `CitizenCategoryAssignment` (uma linha marcando o cidadão) — **sem tabela dedicada** | Aparece no **perfil do cidadão**, não é módulo |
| **Dado coletado** | Campos do formulário de um serviço `COM_DADOS` | **`ProtocolSimplified.customData`** (JSON) — **sem tabela dedicada** | **SIM — é o que o módulo Dados trata** |
| **App** | Sistema operacional completo da secretaria (TFD, Atendimento, Farmácia) | **Tabelas dedicadas ricas** (`SolicitacaoTFD`, `AtendimentoMedico`…) + rotas `/api/saude/*` + `app/admin/apps/**` | **NÃO — intocado** |

**O módulo Dados trata EXCLUSIVAMENTE o `customData` dos protocolos de serviços `COM_DADOS`.** Não toca tabelas dedicadas, não toca apps.

### ⚠️ Agricultura NÃO é um módulo de dados — é um app inacabado
`app/admin/agricultura/{produtores,propriedades,sementes,...}` tinha tabelas dedicadas **planejadas**, mas o backend **nunca foi concluído**: o arquivo `routes/secretarias-agricultura-produtores.ts` não existe (require falha silencioso); `use-agricultura-api` chama `/agricultura/produtores` que não responde; não há model `Produtor`/`Propriedade` no schema. **É um app em desenvolvimento — fica de fora da reforma**, e será tratado como app quando retomado. Secretarias com apps inacabados assim **não entram** neste plano.

---

## 1. Situação atual (o que incomoda)

Cada secretaria hoje tem:

- **Um módulo por serviço-com-dados** — cada um é uma página que **repete** as mesmas funções (cadastro, listagem, KPIs, às vezes mapa) sobre o `customData` daquele serviço. Muitos usam o `BaseModuleView` (4 abas: `list`/`approval`/`dashboard`/`management`, em `components/modules/`).
- **Um módulo de serviços-sem-dados** — listagem de protocolos sem estrutura de dados.

Problemas: navegação confusa (o servidor "pula" entre módulos que são a mesma coisa), abas que **não tratam de verdade os dados coletados** (listar/cadastrar raso, sem busca por campo, filtros, facets, relações, exportação), e **cada serviço novo exige programar um módulo**.

---

## 2. Modelo alvo — 2 módulos gerais por secretaria

Cada secretaria, **além das demais seções que permanecem intocadas**, passa a ter **exatamente dois módulos gerais**, eliminando os módulos por-serviço e o de serviços-sem-dados:

### 2.1. Módulo **Protocolos**
Fluxo de trabalho — vale para serviços **COM e SEM dados**.

- **Default: "Meus protocolos"** — só os do servidor logado (`currentAssignedUserId`), para acessar e dar andamento nos processos.
- **Alternador** para "Protocolos da secretaria" (a secretaria toda), respeitando permissão por role.
- Listagem com status, SLA, prazo, prioridade; abre o protocolo para tramitar (reusa o núcleo de protocolos que já existe).
- Substitui o antigo **módulo de serviços-sem-dados** e a função de listagem dos módulos por-serviço.

### 2.2. Módulo **Dados**
Um só módulo que concentra e trata **todos os dados coletados da secretaria** (o `customData` dos serviços `COM_DADOS`) — num lugar só.

- **Seletor por tipo** no topo: Produtores, Propriedades… (cada um é um `EntityType` do Registry, derivado do `moduleType` do serviço). Ao escolher o tipo, a tela se adapta via metadados.
- Concentra as **funções inteligentes que hoje estão espalhadas**, agora dirigidas por metadados:
  - **Cadastro / edição** — formulário gerado pelos `FieldDefinition`.
  - **Mapa** — quando o tipo tem campo `GEO`; plota os registros (reusa `LocationPicker`/mapa existente).
  - **Filtros** — por campo (`filterable`) e **facets** (`facetable`).
  - **Busca** — texto livre nos campos `searchable`.
  - **Aprovação** — fila dos registros pendentes.
  - **Painel** — KPIs/gráficos automáticos.
  - **Relações** — "propriedades deste produtor" etc.
  - **Exportar** CSV / ações em lote.
- Substitui **todos** os módulos individuais por serviço-com-dados.

**As demais seções da secretaria (as que não são módulos por-serviço) permanecem intocadas.** Os **apps** (TFD, atendimento, farmácia) seguem como sistemas à parte, intocados.

---

## 3. Como o Registry sustenta isso (já pronto)

Nada disso exige "programar por serviço" porque o Registry (F0–F7, já no ar) fornece a inteligência por metadados, lendo o `customData` dos protocolos:

| Necessidade do módulo Dados | Fonte no Registry |
|---|---|
| Quais tipos de dado a secretaria tem | `EntityType` (filtra por `department`) |
| Colunas, filtros, facets, busca | `FieldDefinition` (flags) + `POST /api/registry/query` |
| Cadastro/edição | `GET /entity-types/:code/schema` → formulário |
| Mapa | `FieldDefinition` tipo `GEO` |
| Painel (KPIs/gráficos) | `GET /entity-types/:code/dashboard` |
| Relações | `GET /records/:id/relations` |
| Serviço novo com dados sem deploy | `POST /entity-types` (editor no-code, F6) |

O cliente TS (`frontend/src/services/registry.service.ts`) já expõe tudo isso. Os `EntityRecord` são materializados a partir do `customData` (backfill dos protocolos existentes + gancho na aprovação).

---

## 4. O que morre, o que fica, o que nasce

**Morre (remoção controlada, ao final):**
- Páginas por serviço-com-dados (as que instanciam `BaseModuleView` uma vez por serviço) e equivalentes.
- Módulo de serviços-sem-dados.

**Fica (intocado):**
- **Apps**: `app/admin/apps/**` (TFD, atendimento, farmácia) e suas tabelas dedicadas.
- **Demais seções** da secretaria que não são módulos por-serviço.
- Núcleo de protocolos, cidadãos, gabinete, organograma, etc.
- **Etiquetas** do cidadão (`CitizenCategory`) — continuam sendo atribuídas na aprovação e exibidas no perfil do cidadão.
- Componentes reaproveitáveis: `BaseModuleView` e `tabs/*` (viram base do módulo Dados), `DataTable`, `FilterBar`, `StatsCard`, `LocationPicker`.

**Nasce:**
- `SecretariaProtocolosModule` — módulo Protocolos geral (meus / da secretaria).
- `SecretariaDadosModule` — módulo Dados geral (seletor de tipo + abas inteligentes), dirigido pelo Registry.

---

## 5. Fases de implementação (frontend, sobre o Registry pronto)

Cada fase é entregável e reversível; os módulos antigos convivem até o novo ser validado por secretaria.

- **UI-0 — Fundação de dados.** Em produção: `import-configs --apply` (popula EntityType/FieldDefinition dos serviços `COM_DADOS`) + `backfill --apply` (materializa os registros a partir do `customData`). Sem UI. *(Pré-requisito.)*
- **UI-1 — Módulo Protocolos geral.** "Meus protocolos" (default) + alternador secretaria, sobre as rotas de protocolo já existentes. Plugar numa secretaria piloto ao lado dos módulos atuais.
- **UI-2 — Módulo Dados (leitura).** Seletor de tipo + tabela rica (busca/filtros/facets/painel) lendo do Registry. Só leitura primeiro.
- **UI-3 — Dados: cadastro/edição + mapa + aprovação.** Formulário por `FieldDefinition`, campo `GEO` no mapa, fila de aprovação. Paridade com as funções espalhadas de hoje.
- **UI-4 — Dados: relações + exportação + ações em lote.** As ferramentas que faltam hoje.
- **UI-5 — Trocar a navegação.** Menu da secretaria passa a mostrar só **Protocolos** e **Dados** (fora as demais seções intocadas); páginas por-serviço saem do menu.
- **UI-6 — Remoção.** Apagar páginas por-serviço órfãs.

**Piloto sugerido:** uma secretaria cujos serviços-com-dados já passam pelo protocolo/`customData` (ex.: assistência social, educação — via inscrições). **Não** começar pela agricultura (app inacabado).

---

## 6. Riscos e decisões em aberto

- **Paridade de funções antes de remover:** antes de aposentar uma página por-serviço, checar que o módulo Dados cobre tudo que ela fazia. Ações específicas (ex.: "emitir carteirinha") viram **ação declarada no metadado**, não código solto.
- **Permissão por role:** no alternador de protocolos (meus/secretaria) e na edição de dados — reusar o middleware existente.
- **Classificação prévia obrigatória:** para cada "módulo" atual, classificar antes (etiqueta? dado coletado? app?). Só os de **dado coletado** entram. Apps e apps-inacabados (agricultura) ficam de fora.
- **Sem big-bang:** nunca remover um módulo antigo antes de o novo estar validado naquela secretaria.

---

## 7. Resultado

Cada secretaria: as seções que já tem **mais** dois módulos gerais — **Protocolos** (dar andamento, foco no que é meu, com alternador para a secretaria) e **Dados** (gerir e tratar tudo que foi coletado, com cadastro/mapa/filtros/busca/painel/relações), reutilizáveis e alimentados por metadados. Serviço novo com dados → aparece automaticamente como um tipo dentro de "Dados", sem novo módulo e sem deploy. Etiquetas seguem no perfil do cidadão; apps seguem como aplicações à parte.
