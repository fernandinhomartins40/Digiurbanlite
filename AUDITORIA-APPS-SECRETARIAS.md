# Auditoria — Apps das Secretarias (pilotos de Saúde + 21 secretarias)

> Data: 2026-07-16 · Escopo: **APPS** (sistemas operacionais com tabelas dedicadas), conforme a distinção definitiva dos três conceitos:
> 1. **Etiqueta** do cidadão → `CitizenCategory` (fora do escopo desta auditoria)
> 2. **Dado coletado** por serviço COM_DADOS → `customData` do protocolo, coberto pelo **Registry** (fora do escopo)
> 3. **App** → aplicação com tabelas dedicadas, workflow próprio e UI em `app/admin/apps/**` — **este é o escopo**

---

## 1. Sumário executivo

| Área | Estado | Nota |
|------|--------|------|
| Saúde — TFD | ✅ Completo (referência) | 90 endpoints, workflow ponta a ponta, frota, prestação de contas |
| Saúde — Cadastros | ✅ Completo | 49 endpoints, UI completa (unidades, equipes, microáreas, salas, turnos, agendas, vínculos) |
| Saúde — Atendimento (PEC) | 🟡 Núcleo funcional, periferia órfã | 50 endpoints (fila→escuta→triagem→consulta→prontuário) OK; ~13 grupos de models sem rota/UI |
| Saúde — Farmácia | 🟡 Backend rico, UI incompleta | 48 endpoints (lotes, transferências, alertas) vs apenas 4 páginas; link quebrado p/ relatórios |
| Segurança Escolar | ✅ Funcional | Reconhecimento facial, backend `face-platform.routes.ts` |
| Educação | 🔴 Backend semi-pronto SEM UI | 8 models + 4 services **órfãos** (nenhuma rota importa); só dashboard read-only |
| Assistência Social | 🔴 Backend semi-pronto SEM UI | 7 models + 3 services **órfãos**; só dashboard read-only |
| Agricultura | 🔴 UI fantasma SEM backend | 5 páginas + hook chamando `/agricultura/*` que não existe; sem models |
| Demais 17 secretarias | ⚪ Sem apps | Só serviços/protocolos (cobertos pelo Registry) + alguns models de catálogo órfãos |

**Achado transversal crítico:** 5 arquivos de rota instanciam `new PrismaClient()` direto, **contornando a tenant extension** (isolamento multi-tenant fica dependendo só do RLS): `saude-cadastros.routes.ts`, `saude-unified-adapter.routes.ts`, `secretarias-saude.ts`, `secretarias-educacao.ts`, `secretarias-assistencia-social.ts`.

---

## 2. Método

- Fonte de verdade: `digiurban/backend/prisma/schema.prisma` (213 models), rotas em `src/routes/`, services em `src/services/`, páginas em `digiurban/frontend/app/admin/`.
- Contagem de endpoints por `router.get|post|put|patch|delete`.
- "Órfão" = model existe no schema mas **nenhuma rota** o expõe (verificado por grep em `src/routes/`), ou service existe mas nenhuma rota o importa.
- Catálogo de serviços das 21 secretarias extraído de `backend/prisma/seeds/services/*.seed.ts` (~404 serviços).

---

## 3. Apps de Saúde — auditoria detalhada (pilotos)

### 3.1 TFD — Tratamento Fora do Domicílio ✅ (o app mais completo — usar como GABARITO)

- **Rotas:** `saude-tfd.routes.ts` — **90 endpoints** em `/api/saude/tfd`.
- **Models (12):** `SolicitacaoTFD` (com `protocolId @unique` — nasce de protocolo), `DocumentoTFD`, `ParecerRegulacaoTFD`, `AprovacaoGestaoTFD`, `AgendamentoExternoTFD`, `ViagemTFD`, `PassageiroViagemTFD`, `PrestacaoContasTFD`, `VeiculoTFD`, `MotoristaTFD`, `EspecialidadeTFD`, `DestinoTFD`.
- **Services:** `services/tfd/` (6 arquivos, incl. `protocol-to-tfd.service.ts` que converte protocolo→solicitação).
- **Frontend:** 14 páginas cobrindo todas as etapas: solicitações (+nova), análise documental, regulação médica, aprovação, viagens (+montar lista), frota (veículos, motoristas), configurações (destinos, especialidades).
- **Workflow completo:** Solicitação → Análise documental → Parecer de regulação → Aprovação de gestão → Agendamento externo → Viagem (montagem de lista de passageiros) → Prestação de contas.

**O que o torna o padrão-ouro:** nasce de protocolo mas mantém estado próprio; cadastros de apoio (frota, destinos); múltiplos papéis (analista, regulador médico, gestor, motorista); upload de documentos; estatísticas por etapa.

**Gaps menores:**
- Rotas duplicadas singular/plural (`/solicitacao` e `/solicitacoes`, `/veiculos` em dois blocos, aliases `/regulacao/*`) — dívida de nomenclatura, dificulta manutenção.
- Sem visão do cidadão (portal) para acompanhar etapas do TFD além do protocolo genérico.

### 3.2 Cadastros de Saúde ✅

- **Rotas:** `saude-cadastros.routes.ts` — **49 endpoints** em `/api/apps/saude/cadastros` + adapter `saude-unified-adapter.routes.ts` (8 endpoints: servidores, vínculos com unidades/equipes via Sistema Unificado V2.0).
- **Models:** `UnidadeSaude`, `EquipeSaude`, `ProfissionalEquipe`, `Microarea`, `SalaConsultorio`, `TurnoTrabalho`, `ConfiguracaoAgenda`, `ConfiguracaoAtendimento`, `EspecialidadeMedica`, `IndisponibilidadeProfissional`, `HealthProfessionalData`.
- **Frontend:** 24 páginas (unidades, equipes+microáreas, especialidades, salas, turnos, agendas, servidores-saude, vínculos).

**É a "fundação" do domínio** — os outros apps de saúde dependem dele. Estado: completo e funcional.

**Gaps:**
- ⚠️ `saude-cadastros.routes.ts:8` e `saude-unified-adapter.routes.ts:14` usam `new PrismaClient()` → **contornam a tenant extension**.
- `IndisponibilidadeAgenda` (model) sem rota dedicada visível.

### 3.3 Atendimento / PEC e-SUS 🟡

- **Rotas:** `routes/saude/` — **50 endpoints**: `fila-atendimento` (8), `escuta-inicial` (3), `triagem` (4), `consulta-medica` (18, incl. prontuário e timeline), `agenda` (4), `equipes` (7), `atividades-coletivas` (6).
- **Models ativos:** `FilaAtendimento`, `EscutaInicial`, `TriagemEnfermagem`, `ConsultaMedica`, `Prescricao`, `ExameSolicitado`, `Atestado`, `Encaminhamento`, `ProblemaCondicao`, `AlergiaReacao`, `AtividadeColetiva` (+participantes/profissionais).
- **Frontend:** fila, adicionar à fila, acolhimento, classificação de risco, enfermagem (triagem), consulta, prontuário (usa `GET /api/saude/consulta-medica/prontuario/:citizenId` + `/timeline` — funciona).
- Fluxo núcleo (recepção → acolhimento → classificação de risco → triagem → consulta → prescrição/exame/atestado/encaminhamento → prontuário) **está de pé**.

**Models ÓRFÃOS (existem no schema, ZERO rotas e ZERO UI):**

| Grupo | Models | Situação |
|-------|--------|----------|
| Odontologia | `AtendimentoOdontologico`, `ProcedimentoOdonto` | Sem rota, sem página |
| Pré-natal | `AcompanhamentoPreNatal`, `ConsultaPreNatal`, `ExamePreNatal` | Sem rota, sem página |
| Visita domiciliar (ACS) | `VisitaDomiciliar` | Sem rota, sem página |
| Imunização | `ImunizacaoCidadao` | Sem rota, sem página (e o catálogo tem "Agendamento de Vacinação" e "Carteira Digital de Vacinação") |
| Prontuário — anexos | `AnexoProntuario` | Sem rota |
| Cidadão — condições | `AlergiasCidadao`, `ComorbidadesCidadao` | Sem rota (a consulta usa `AlergiaReacao`/`ProblemaCondicao`) — possível duplicação conceitual |
| Painel de chamadas | `ChamadaPainel` | Sem rota, sem página (painel de TV da recepção) |
| e-SUS / transmissão | `ConfiguracaoESUS`, `TransmissaoESUS` | Sem rota — a integração com o Ministério da Saúde nunca foi ligada |
| Agendamento de consultas | `AgendaMedica`, `ConsultaAgendada`, `IndisponibilidadeAgenda` | Services existem (`agenda-medica/`), rotas `saude/agenda` são só 4 endpoints; ciclo completo de marcação pelo cidadão não fecha |

**Outros achados:**
- `src/_deprecated/atendimento/` — 10 services antigos (prontuário, atestado, agenda, fila…) ainda no repo; risco de confusão/import acidental. Remover.
- `secretarias-saude.ts:10` usa `new PrismaClient()` (bypass da tenant extension).
- Registro morto de `saude-atendimento.routes` já foi removido do `index.ts` (ok).

### 3.4 Farmácia 🟡

- **Rotas:** `saude-farmacia.routes.ts` — **48 endpoints** em `/api/saude/farmacia` (e alias `/api/apps/saude/farmacia`): medicamentos (busca/rename), **lotes** (validade, vencidos, baixa), estoque (por unidade, disponibilidade, estatísticas), **transferências entre unidades** (aprovar/confirmar/recusar/cancelar), **alertas** (ativos, verificação automática), dispensação (por prescrição, por cidadão, cancelamento, auditoria).
- **Models:** `Medicamento`, `LoteMedicamento`, `EstoqueMedicamento`, `TransferenciaEstoque`, `AlertaEstoque`, `DispensacaoMedicamento`.
- ✅ Usa `import { prisma } from '../lib/prisma'` (tenant-safe).
- **Frontend: só 4 páginas** — dashboard, dispensação (+nova), estoque (+novo).

**Gaps de UI (backend pronto, tela inexistente):**
1. **Lotes e validade** — sem tela de lotes, próximos ao vencimento, vencidos (endpoints prontos).
2. **Transferências entre unidades** — workflow completo no backend, zero UI.
3. **Alertas de estoque** — endpoints prontos (incl. verificação automática), zero UI.
4. **Relatórios** — o dashboard tem link `Ações Rápidas → /admin/apps/saude/farmacia/relatorios` ([farmacia/page.tsx:342](digiurban/frontend/app/admin/apps/saude/farmacia/page.tsx#L342)) e a **página não existe → 404**.
5. Catálogo de medicamentos (CRUD de `Medicamento`) sem tela dedicada — só autocomplete/rename.
6. Integração dispensação ↔ prescrição da consulta médica existe no backend (`/dispensacao/prescricao/:id`, `/prescricoes/pendentes`), mas a UI de dispensação não puxa a fila de prescrições pendentes.

### 3.5 Servidores de Saúde / Vínculos ✅

Adapter (8 endpoints) liga `HealthProfessionalData` ao Sistema Unificado V2.0 (`EmployeeAssignment`, `TeamMember`). UI em `apps/saude/servidores` e `cadastros/vinculos`. Funcional. Único problema: `new PrismaClient()` (bypass).

---

## 4. Apps fora da Saúde

### 4.1 Segurança Escolar (Educação) ✅

- `app/admin/apps/seguranca-escolar/` — 1 página rica (abas: leitura facial, cadastro de biometria, teste multi-face, configuração de notificação a responsáveis).
- Backend: `face-platform.routes.ts` + `face-platform-client.service.ts`; models `FaceRecognitionIdentity`, `FaceEnrollment`, `FaceEmbedding`, `FaceDevice`, `FaceZone`, `FaceRecognitionEvent`, `SchoolSecurityConfiguration`.
- Estado: funcional. É o único app fora da saúde concluído.

### 4.2 Educação 🔴 — backend semi-pronto, SEM frontend

- **Models prontos (8):** `UnidadeEducacao`, `InscricaoMatricula`, `Matricula` (com `inscricaoId @unique` — mesmo padrão protocolo→app do TFD), `Turma`, `Professor`, `VeiculoEscolar`, `RotaEscolar`, `AlunoRota`, + `EducationProfessionalData`.
- **Services ÓRFÃOS (nenhuma rota importa):** `services/matricula/matricula.service.ts`, `services/transporte-escolar/transporte-escolar.service.ts`, `services/unidade-educacao/unidade-educacao.service.ts`.
- **Rota existente:** `secretarias-educacao.ts` — **5 endpoints somente-leitura** (dashboard com counts, mapeamento de unidades). `new PrismaClient()` (bypass).
- **Frontend:** NÃO existe `app/admin/apps/educacao/`.
- Catálogo da secretaria tem 22 serviços, vários pedindo app: Matrícula Escolar, Transferência, Inscrição em Creche, Transporte Escolar, EJA, AEE.

**Conclusão: é o app de maior ROI — ~60–70% do backend já existe e está parado.**

### 4.3 Assistência Social 🔴 — backend semi-pronto, SEM frontend

- **Models prontos (7):** `UnidadeCRAS`, `CadUnicoFamilia` (com `workflowId @unique`), `MembroFamilia`, `ProgramaSocial`, `InscricaoProgramaSocial`, `AcompanhamentoBeneficio`, `PagamentoBeneficio`, + `SocialAssistanceProfessionalData`.
- **Services ÓRFÃOS:** `services/cadunico/`, `services/programa-social/`, `services/unidade-cras/`.
- **Rota existente:** `secretarias-assistencia-social.ts` — 5 endpoints dashboard. `new PrismaClient()` (bypass).
- **Frontend:** NÃO existe app.
- Catálogo: 23 serviços (CadÚnico, benefícios, cestas, aluguel social, CRAS, acompanhamento familiar).

### 4.4 Agricultura 🔴 — UI fantasma, SEM backend (já documentado em memória)

- **Frontend existe:** `app/admin/agricultura/{produtores, propriedades, sementes, assistencia-tecnica, mecanizacao}` + `lib/hooks/use-agricultura-api.ts` chamando `/agricultura/produtores|propriedades|estoque-sementes|distribuicoes-sementes|tecnicos|solicitacoes-assistencia`.
- **Backend NÃO existe:** nenhuma rota `/api/agricultura/*`; não há models `Produtor`/`PropriedadeRural` no schema. Todas as páginas quebram em runtime.
- Models de catálogo relacionados existem soltos: `TipoProducaoAgricola`, `MaquinaAgricola`.
- **Decisão pendente**: ou construir o backend (o desenho da UI já define o contrato), ou aposentar a UI e deixar o Registry cobrir (Cadastro de Produtor Rural já é serviço COM_DADOS materializável). Recomendação na seção 7.

### 4.5 Models de catálogo órfãos (sem app, sem rota)

Modelos criados numa leva antiga de "cadastros de apoio", hoje sem uso operacional: `EspacoPublico`, `ConjuntoHabitacional`, `ViaturaSeguranca`, `ParquePraca`, `EstabelecimentoTuristico`, `TipoEstabelecimentoTuristico`, `GuiaTuristico`, `TipoObraServico`, `EspecieArvore`, `ModalidadeEsportiva`, `TipoAtividadeCultural`, `TipoOcorrencia`, `CursoProfissionalizante`, `ProgramaHabitacional`, `ProgramaAmbiental`, `TipoProducaoAgricola`, `MaquinaAgricola`, `TipoDocumento`.

→ São matéria-prima útil para os apps propostos (seção 7); não apagar sem checar o plano.

---

## 5. Achados transversais (dívidas que afetam qualquer app novo)

1. **Tenant bypass (`new PrismaClient()`)** — 5 rotas de secretaria/saúde citadas no sumário + ~30 outras rotas gerais no repo. Todo app novo DEVE importar `prisma` de `lib/prisma.ts`. Os 5 arquivos de domínio devem ser corrigidos (baixo risco, alta prioridade).
2. **Nomenclatura de rotas inconsistente** — TFD mistura singular/plural e aliases; convenção recomendada para novos apps: `/api/apps/<secretaria>/<app>/<recurso-plural>`.
3. **Código morto** — `src/_deprecated/atendimento/` (10 arquivos) deve ser removido.
4. **Link quebrado** — farmácia → relatórios (404).
5. **Feature flags** — o mecanismo existe e funciona (`requireFeature('<slug>')` comparando com `tenant.features`); todo app novo deve nascer atrás da flag da sua secretaria.
6. **Padrão protocolo→app consolidado** — `SolicitacaoTFD.protocolId @unique` + `protocol-to-tfd.service.ts` e `materializeOnApproval` do Registry mostram os dois ganchos disponíveis na aprovação do protocolo. Apps novos devem usar o mesmo desenho (tabela própria referenciando o protocolo de origem).
7. **Duplicação conceitual em saúde** — `AlergiasCidadao`/`ComorbidadesCidadao` vs `AlergiaReacao`/`ProblemaCondicao`: consolidar antes de expor.

---

## 6. Critério de decisão: quando é APP e quando é Registry

Um serviço vira **app** apenas quando tem pelo menos um destes traços (todos presentes nos pilotos de saúde):

| Traço | Exemplo piloto |
|-------|----------------|
| Máquina de estados própria além do protocolo | TFD: análise → regulação → aprovação → viagem → contas |
| Estoque/inventário com movimentação | Farmácia: lotes, transferências, alertas |
| Fila operacional em tempo real | PEC: FilaAtendimento, classificação de risco |
| Agenda com capacidade/conflito | Agendas médicas, salas, turnos |
| Recorrência financeira/pagamentos | (Assistência: `PagamentoBeneficio`) |
| Frota/logística | TFD: veículos, motoristas, viagens |
| Sigilo reforçado/prontuário | PEC: prontuário; (Mulheres: casos) |
| Turmas/frequência | (Educação: `Turma`, `Matricula`) |

Se o serviço é só **coletar dados + aprovar + consultar** → fica no Registry (EntityType/EntityRecord + widgets), **não** se cria app. Isso elimina app para a maioria dos 404 serviços do catálogo.

---

## 7. Matriz das 21 secretarias — estado atual e proposta de app

Colunas: **Tem app hoje?** · **Material existente** (models/services/UI aproveitáveis) · **Proposta** (detalhada no PLANO) · **Prioridade** (P0 = consolidar, P1 = alta, P2 = média, P3 = baixa, — = não criar app).

| # | Secretaria | Tem app? | Material existente | Proposta de app | Prio |
|---|-----------|----------|--------------------|-----------------|------|
| 1 | **Saúde** | ✅ 4 apps | Tudo da seção 3 | Consolidar: UI de farmácia, agendamento de consultas, imunização, odonto/pré-natal/visitas (ou cortar models), painel de chamadas | **P0** |
| 2 | **Educação** | 🔴 semi (só Seg. Escolar) | 8 models + 3 services órfãos, `EducationProfessionalData` | **App Gestão Escolar** (matrícula, turmas, vagas) + **App Transporte Escolar** (rotas, veículos, alunos) | **P1** |
| 3 | **Assistência Social** | 🔴 semi | 7 models + 3 services órfãos | **App CRAS/CadÚnico + Benefícios** (famílias, programas, concessões, pagamentos, visitas) | **P1** |
| 4 | **Agricultura** | 🔴 UI sem backend | 5 páginas + hook prontos; `MaquinaAgricola`, `TipoProducaoAgricola` | **App Produtor Rural** (produtores, propriedades, assistência técnica, mecanização/agenda de máquinas, banco de sementes) — construir o backend que a UI já espera | **P1** |
| 5 | **Serviços Públicos** | ⚪ | 23 serviços de altíssimo volume (iluminação, capina, bueiro…) | **App Ordens de Serviço (OS)**: protocolo→OS, equipes de campo, priorização, mapa, materiais | **P1** |
| 6 | **Meio Ambiente** | ⚪ | `ProgramaAmbiental`, `EspecieArvore`; 20 serviços (licenças, podas, denúncias) | **App Licenciamento & Fiscalização Ambiental**: processos de licença (etapas, validade, renovação), vistorias, autos de infração | **P2** |
| 7 | **Obras Públicas** | ⚪ | `TipoObraServico`; 20 serviços (licença de obra, habite-se, vistorias) | **App Licenciamento de Obras** (compartilhado com Planejamento): projeto→análise→licença→vistorias→habite-se | **P2** |
| 8 | **Planejamento Urbano** | ⚪ | 20 serviços (viabilidade, alvarás, zoneamento) | Mesmo **App Licenciamento Urbano** da linha 7 + consulta de zoneamento (Registry cobre certidões) | **P2** |
| 9 | **Habitação** | ⚪ | `ConjuntoHabitacional`, `ProgramaHabitacional`; 20 serviços | **App Programas Habitacionais**: inscrição→pontuação/fila→seleção→contrato; aluguel social (pagamentos recorrentes, padrão `PagamentoBeneficio`) | **P2** |
| 10 | **Esportes** | ⚪ | `ModalidadeEsportiva`, `EspacoPublico`; 20 serviços (escolinhas, reservas, competições) | **App Escolinhas & Espaços**: turmas+frequência (padrão Matrícula), reserva de espaços (padrão Agenda), competições/inscrições, empréstimo de material (padrão Estoque-lite) | **P2** |
| 11 | **Cultura** | ⚪ | `TipoAtividadeCultural`, `EspacoPublico`; 20 serviços | **App Espaços & Oficinas Culturais**: reservas (Agenda), oficinas (Turmas), editais/projetos (workflow TFD-lite), empréstimo de equipamento | **P3** |
| 12 | **Defesa Civil** | ⚪ | 15 serviços (vistorias de risco, abrigos, desabrigados) | **App Ocorrências & Áreas de Risco**: ocorrências georreferenciadas, vistorias/interdições, abrigos (capacidade/ocupação), famílias atingidas | **P2** |
| 13 | **Segurança Pública** | ⚪ (Seg. Escolar é da Educação) | `ViaturaSeguranca`, `TipoOcorrencia`; 20 serviços | **App Ocorrências & Patrulhamento**: registro de ocorrências, viaturas, rondas, pontos críticos/câmeras em mapa | **P3** |
| 14 | **Políticas p/ Mulheres** | ⚪ | 15 serviços (denúncias, acolhimento, medidas protetivas) | **App Rede de Atendimento à Mulher**: casos sigilosos com acompanhamento (padrão Prontuário: acesso restrito, trilha de auditoria), abrigamento | **P2** |
| 15 | **Transportes/Trânsito** | ⚪ | 20 serviços (táxi, mototáxi, vistorias, defesa de autuação) | **App Credenciamentos & Vistorias**: credenciais com validade/renovação, vistorias veiculares, pontos de táxi; defesa de autuação (workflow parecer, padrão TFD-regulação) | **P3** |
| 16 | **Mobilidade Urbana** | ⚪ | 15 serviços (cartões, gratuidades, passe) | **App Carteiras & Gratuidades**: emissão de carteiras (estudante/idoso/PcD) com validade e 2ª via — padrão "carteirinha" (gancho já previsto no módulo Dados) | **P3** |
| 17 | **Desenvolvimento Econômico** | ⚪ | `CursoProfissionalizante`; 20 serviços | **App Balcão de Empregos & Qualificação**: vagas×candidatos, encaminhamentos; cursos (Turmas). Alvará fica no Licenciamento Urbano | **P3** |
| 18 | **Turismo** | ⚪ | `EstabelecimentoTuristico`, `GuiaTuristico`, `TipoEstabelecimentoTuristico` | App leve **Cadastur Municipal** (credenciamento de guias/estabelecimentos com carteirinha) — grande parte cabe no Registry | **P3** |
| 19 | **Administração** | ⚪ | `/admin/atendimento-presencial`, `/admin/chamados` já existem | **Não criar app novo** — Ouvidoria/SIC são protocolos (Registry); atendimento presencial já tem página. Avaliar só evolução do existente | — |
| 20 | **Finanças** | ⚪ | 20 serviços (IPTU, ISS, certidões) | **Não criar app** — tributário é sistema especializado/integração externa (ERP fiscal). Registry cobre os requerimentos; certidões via templates de documento | — |
| 21 | **Tecnologia & Inovação** | ⚪ | `/admin/chamados` (AdminTicket) cobre service desk | **Não criar app novo** — suporte já coberto por Chamados; demais serviços são informativos/Registry | — |

---

## 8. Recomendações prioritárias (resumo)

1. **P0 — Consolidar Saúde** antes de replicar o padrão: corrigir tenant bypass, link 404, UI da farmácia (lotes/transferências/alertas/relatórios), fechar agendamento de consultas, e **decidir o destino** dos models órfãos (implementar odonto/pré-natal/visitas/imunização/painel/e-SUS ou removê-los do schema — hoje são promessa não cumprida ocupando o schema).
2. **P1 — Destravar o que está 60% pronto**: Educação e Assistência Social (backend órfão + zero UI) e Agricultura (UI órfã + zero backend). São os três com maior desperdício de trabalho já feito.
3. **P1 — Serviços Públicos (OS)**: maior volume operacional do município; o padrão fila+mapa já existe nos pilotos.
4. **P2/P3 — Ondas seguintes** conforme plano de implementação (documento irmão).
5. **Nunca criar app para o que o Registry cobre** — a régua da seção 6 deve ser aplicada em todo pedido novo.

> Documento irmão: [PLANO-IMPLEMENTACAO-APPS-SECRETARIAS.md](PLANO-IMPLEMENTACAO-APPS-SECRETARIAS.md)
