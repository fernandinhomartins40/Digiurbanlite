# Plano — Módulo de Gestão de Dados com Widgets Configuráveis

> Redesenho do módulo **Dados** de cada secretaria: deixa de ser "uma aba com tabela" e passa a ser um **workspace de gestão** onde o servidor **trabalha** os dados coletados — com ferramentas ricas (as da antiga aba Gerenciamento + novas) e capacidade de **criar/customizar seus próprios widgets**, tudo dirigido pelos metadados do Registry.
>
> Baseado na análise dos **311 serviços COM_DADOS** dos seeds (21 secretarias). Superset da antiga `ManagementTab` — nada do que ela fazia se perde.

---

## 1. O que a análise dos seeds revelou

311 serviços com dados, agrupados por **arquétipo** (o prefixo do moduleType + a categoria revelam a natureza do dado e, portanto, as ferramentas certas):

| Arquétipo | Qtde | Natureza | Ferramentas que pedem |
|---|---|---|---|
| **CADASTRO / REGISTRO / CREDENCIAMENTO** | ~58 | Base permanente de pessoas/bens (produtor, artista, contribuinte, fornecedor) | Tabela rica, ficha completa, mapa (quando tem endereço), carteirinha, estatísticas |
| **INSCRICAO / PROGRAMA** | ~29 | Inscritos em programas/cursos/eventos (muitos temporários) | **Lista com período/vagas/status**, controle de turmas, presença |
| **SOLICITACAO / AUTORIZACAO / LICENCA / ALVARA / AGENDAMENTO / RESERVA / USO** | ~55 | Fluxos com data e/ou local (uso de espaço, licença, agendamento) | **Agenda/calendário**, mapa, fila de prazos |
| **DENUNCIA / RECLAMACAO / VISTORIA / VISITA** | ~30 | Ocorrências georreferenciadas | **Mapa de ocorrências**, fila por prioridade, roteiro de vistoria |
| **BENEFICIO / AUXILIO / PAGAMENTO / CARTAO / ISENCAO** | ~18 | Concessões financeiras recorrentes | Lista de beneficiários, controle de parcelas, painel de valores |

Além disso: **15 serviços** têm campo de **data/período** (→ agenda), **campos GEO** aparecem em ocorrências (→ mapa), e categorias como "Eventos" (7), "Programas" (13), "Benefícios" (12) confirmam os arquétipos.

**Conclusão:** um único módulo genérico "tabela" não serve. Mas também não queremos um módulo por serviço. A resposta é um **módulo com biblioteca de widgets** que o servidor compõe conforme o tipo de dado.

---

## 2. Conceito: o módulo Dados vira um "workspace de widgets"

Cada **tipo de dado** (EntityType) da secretaria tem um **painel de trabalho** montado por **widgets**. Alguns widgets vêm **sugeridos automaticamente** pelos metadados (se o tipo tem campo GEO → sugere Mapa; se tem campo de data → sugere Agenda; se é INSCRICAO → sugere Lista de inscritos). O servidor pode **adicionar, remover, configurar e criar** widgets — sem programar.

```
Secretaria › Dados
 ├─ [seletor de tipo: Produtores | Propriedades | Eventos | Denúncias …]
 └─ Workspace do tipo selecionado (grade de widgets):
      ┌─────────────┬─────────────┬─────────────┐
      │ Estatísticas│  Filtros    │  Ações      │
      ├─────────────┴─────────────┴─────────────┤
      │  Tabela rica (ou Cards)  │  Detalhe/Ficha│
      ├──────────────────────────┴──────────────┤
      │  Mapa  │  Agenda  │  Gráfico  │  + Widget │
      └─────────────────────────────────────────┘
```

---

## 3. Catálogo de widgets (a biblioteca)

Cada widget é um bloco configurável. Divididos em **dados**, **visualização** e **ferramentas de trabalho**:

### Dados & listagem
1. **Tabela rica** — colunas de `displayInTable`, ordenação, seleção múltipla, paginação.
2. **Cards** — visão em cartão (`displayInCard`), campo primário/secundário.
3. **Ficha/Detalhe** — todos os campos do registro organizados por seção (o "ver detalhe completo").
4. **Filtros rápidos** — botões pré-configurados (ex.: "Orgânicos", "Com DAP", "Vencidos").
5. **Filtros tipados** — por campo, conforme o dataType (multiselect, range numérico, intervalo de datas, boolean).
6. **Busca** — texto livre nos campos searchable.

### Visualização & análise
7. **Estatísticas (stat tiles)** — contadores/KPIs (total, por status, métricas isMetric).
8. **Gráfico** — barras/pizza/linha (Recharts) sobre campos facetable/isMetric.
9. **Mapa** — pontos dos registros com campo GEO; filtro por área.
10. **Linha do tempo** — registros por período (novos por mês, sazonalidade).

### Ferramentas de trabalho (o "trabalhar", não só consultar)
11. **Agenda/Calendário** — para tipos com data (agendamentos, reservas, eventos, vistorias); ver/mover no calendário.
12. **Lista de inscritos/temporários** — para INSCRICAO/PROGRAMA/eventos: vagas, período, status, presença; encerra quando o período acaba.
13. **Fila de aprovação** — pendentes com aprovar/rejeitar + motivo (o que a ApprovalTab já fazia).
14. **Fila de prazos/SLA** — ordena por vencimento (licenças, vistorias).
15. **Ações em lote** — exportar selecionados, notificar, mudar status, emitir documento/carteirinha.
16. **Emissão de documento** — gera documento/carteirinha do registro (integra com templates existentes).
17. **Anotações/checklist** — o servidor registra andamento/observações no registro (roteiro de vistoria).
18. **Relações** — entidades ligadas (produtor↔propriedades) — grafo do Registry.

### Widget customizável pelo servidor
19. **Widget de consulta salva** — o servidor monta uma consulta (filtros + colunas + visualização: tabela/gráfico/mapa/contador) e **salva como widget** com nome próprio. Ex.: "Produtores orgânicos do Centro" como um contador fixo, ou "Eventos deste mês" como agenda.

---

## 4. Arquitetura (sobre o Registry, sem tabela por serviço)

### Sugestão automática de widgets (inteligência)
Ao abrir um tipo, o módulo **deriva os widgets sugeridos** dos metadados:
- tem campo `GEO` → sugere **Mapa**;
- tem campo `DATE` marcado como "evento/agendamento" → sugere **Agenda**;
- `kind`/prefixo INSCRICAO/PROGRAMA → sugere **Lista de inscritos**;
- tem campos `isMetric` → sugere **Estatísticas** + **Gráfico**;
- tem `facetable` → **Filtros rápidos** a partir dos valores mais comuns;
- sempre: **Tabela**, **Busca**, **Ficha**, **Fila de aprovação**.

### Persistência do layout (o que o servidor customiza)
Novo model no Registry (aditivo, multi-tenant):

```prisma
model DataWidget {
  id           String  @id @default(cuid())
  tenantId     String?
  entityTypeId String            // a qual tipo de dado pertence
  scope        String  @default("SHARED") // SHARED (da secretaria) | PERSONAL (do servidor)
  ownerUserId  String?           // quando PERSONAL
  type         String            // TABLE | CARDS | MAP | AGENDA | STATS | CHART | FILTER | ENROLLMENT | SAVED_QUERY | …
  title        String
  config       Json              // filtros, colunas, campo de data, agregação, cor… por tipo de widget
  layout       Json?             // posição/tamanho na grade
  order        Int     @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@index([tenantId, entityTypeId])
}
```

- **SHARED**: layout padrão da secretaria (admin configura uma vez).
- **PERSONAL**: cada servidor pode ter a sua composição de widgets.
- Se não houver nenhum widget salvo, usa-se o **layout sugerido automaticamente** (nunca fica vazio).

### Backend
Reusa o motor de query (F2), dashboard (F4), relations (F5), records (UI-3). Novos endpoints só para o CRUD de `DataWidget` e para os dados específicos de alguns widgets (agenda: registros por data; inscritos: por período).

### Frontend
- `DataWorkspace` — orquestra a grade e o seletor de tipo.
- `widgets/` — um componente por tipo de widget (TableWidget, MapWidget, AgendaWidget, EnrollmentWidget, StatsWidget, ChartWidget, FilterWidget, DetailWidget, SavedQueryWidget…).
- **Editor de widget** — modal onde o servidor escolhe tipo, título, filtros, colunas, visualização e salva (SHARED ou PERSONAL).

---

## 5. Fases de implementação

- **W0 — Model `DataWidget` + migration** (aditivo) + endpoints CRUD.
- **W1 — Motor de layout + sugestão automática** (deriva widgets dos metadados; renderiza a grade). Já entrega valor: cada tipo abre com os widgets certos.
- **W2 — Widgets de dados**: Tabela rica, Cards, Ficha/Detalhe, Filtros rápidos + tipados, Busca, Estatísticas. (Recupera e supera a ManagementTab.)
- **W3 — Widgets de análise**: Gráfico (Recharts), Mapa, Linha do tempo.
- **W4 — Ferramentas de trabalho**: Agenda, Lista de inscritos/temporários, Fila de aprovação/prazos, Ações em lote, Relações.
- **W5 — Editor de widget customizável** (SAVED_QUERY): servidor cria/salva o seu widget; layout PERSONAL vs SHARED.
- **W6 — Emissão de documento/carteirinha + anotações/checklist**.

Cada fase é entregável; o módulo nunca fica pior que a ManagementTab (W2 já garante paridade).

---

## 6. O que isso resolve da sua crítica

- **"Muito genérico e simples"** → workspace de widgets ricos, com ferramentas para o servidor *trabalhar* (agenda, inscritos, mapa, ações), não só listar.
- **"Não tem as funções que os módulos tinham"** → W2 recupera e supera a ManagementTab (filtros rápidos, ficha, cards, stats).
- **"Customizar um widget novo"** → W5: o servidor monta e salva seus próprios widgets, pessoais ou da secretaria.
- **Sem módulo por serviço** → tudo dirigido por metadados; serviço novo abre com widgets sugeridos automaticamente.
- **Apps intocados**; **etiquetas** no perfil do cidadão; o módulo Dados trata só o `customData`.

---

## 7. Decisão antes de implementar

Escopo grande — sugiro **começar por W1+W2** (layout inteligente + widgets de dados = paridade e já muito além da aba atual), validar visualmente, e então seguir para as ferramentas de trabalho (W3+) e o editor customizável (W5).
