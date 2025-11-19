# ACOMPANHAMENTO DA IMPLEMENTAÇÃO - PROPOSTA ENRIQUECIDA
## Digiurban - 78 Microsistemas

**Início:** 2025-01-17
**Status:** Em Andamento

---

## 📊 PROGRESSO GERAL

| Fase | Microsistemas | Sprints | Status |
|------|---------------|---------|--------|
| **FASE 0** | Fundação | 5 | 🔄 **EM ANDAMENTO** |
| **FASE 1** | Saúde (6) | 24 | ⏸️ Pendente |
| **FASE 2** | Educação (6) | 20 | ⏸️ Pendente |
| **FASE 3** | Assist. Social (6) | 18 | ⏸️ Pendente |
| **FASE 4** | Agricultura (6) | 14 | ⏸️ Pendente |
| **FASE 4** | Cultura (6) | 15 | ⏸️ Pendente |
| **FASE 5** | Esportes (6) | 15 | ⏸️ Pendente |
| **FASE 5** | Habitação (6) | 17 | ⏸️ Pendente |
| **FASE 6** | Meio Ambiente (6) | 18 | ⏸️ Pendente |
| **FASE 6** | Obras Públicas (6) | 16 | ⏸️ Pendente |
| **FASE 7** | Segurança (6) | 16 | ⏸️ Pendente |
| **FASE 7** | Turismo (6) | 14 | ⏸️ Pendente |
| **FASE 8** | Planejamento (6) | 21 | ⏸️ Pendente |
| **FASE 8** | Serv. Públicos (6) | 15 | ⏸️ Pendente |
| **TOTAL** | **78 MS** | **228** | **1% Completo** |

---

## ✅ FASE 0: FUNDAÇÃO (5 sprints)

### 🔧 **Engine de Workflow Transversal** (2 sprints)

#### ✅ Backend - Schema Prisma
- [x] WorkflowDefinition model
- [x] WorkflowInstance model
- [x] WorkflowHistory model
- [x] WorkflowStatus enum
- [ ] Migration criada e executada
- [ ] Prisma Client gerado

#### ⏸️ Backend - Tipos TypeScript
- [ ] workflow.types.ts
- [ ] workflow-definition.types.ts
- [ ] workflow-stage.types.ts

#### ⏸️ Backend - Serviços
- [ ] workflow.service.ts (CRUD de definições)
- [ ] workflow-instance.service.ts (gerenciamento de instâncias)
- [ ] workflow-engine.service.ts (motor de execução)
- [ ] workflow-queue.service.ts (filas inteligentes)

#### ⏸️ Backend - Rotas API
- [ ] GET /api/workflows (listar definições)
- [ ] POST /api/workflows (criar definição)
- [ ] GET /api/workflows/:id/instances (instâncias de um fluxo)
- [ ] POST /api/workflows/:id/instances (criar instância)
- [ ] POST /api/workflows/instances/:id/advance (avançar etapa)
- [ ] POST /api/workflows/instances/:id/return (retornar etapa)
- [ ] POST /api/workflows/instances/:id/cancel (cancelar)
- [ ] GET /api/workflows/instances/:id/history (histórico)

#### ⏸️ Frontend - Tipos
- [ ] workflow.types.ts (espelhado do backend)

#### ⏸️ Frontend - Componentes
- [ ] WorkflowViewer.tsx (visualiza fluxo e etapa atual)
- [ ] WorkflowTimeline.tsx (linha do tempo)
- [ ] WorkflowQueue.tsx (fila de itens por etapa)
- [ ] WorkflowStageActions.tsx (ações disponíveis)

#### ⏸️ Frontend - Páginas Admin
- [ ] /admin/workflows (gerenciar definições)
- [ ] /admin/workflows/new (criar nova definição)
- [ ] /admin/workflows/:id (editar definição)

---

### 🗂️ **MS-00: Gestor de Cadastros Base** (3 sprints)

#### ⏸️ Backend - CRUD Genérico
- [ ] generic-table.service.ts
- [ ] Rotas dinâmicas: GET/POST/PUT/DELETE /api/admin/cadastros/:tableName
- [ ] Validações automáticas baseadas em schema

#### ⏸️ Frontend - Interface Genérica
- [ ] CRUDTable.tsx (componente genérico)
- [ ] CRUDForm.tsx (formulário dinâmico)
- [ ] /admin/microsistemas/cadastros-base/ (página index)
- [ ] /admin/microsistemas/cadastros-base/:tableName (CRUD específico)

#### ⏸️ Seeds - Completar Tabelas Faltantes
- [ ] Identificar 7 tabelas sem seeds
- [ ] Criar seeds para todas as 25 tabelas

#### ⏸️ Enums Dinâmicos nos Forms
- [ ] Componente EnumField
- [ ] Integração com formSchemas
- [ ] Refatorar serviços existentes

---

## ⏸️ FASE 1: SAÚDE (24 sprints)

### MS-01: Gestão de Unidades de Saúde (3 sprints)
- [ ] Schema Prisma
- [ ] Backend API
- [ ] Frontend Admin
- [ ] Seeds iniciais

### MS-02: Agenda Médica Inteligente (4 sprints)
- [ ] Schema: AgendaMedica, ConsultaAgendada
- [ ] Backend API
- [ ] Frontend cidadão (agendamento)
- [ ] Frontend profissional (agenda)

### MS-03: Prontuário Eletrônico COM FLUXO (6 sprints)
- [ ] Schema: AtendimentoMedico, TriagemEnfermagem, ConsultaMedica, etc
- [ ] Workflow Definition: "Atendimento Médico"
- [ ] Backend: Fluxo completo (Recepção → Triagem → Fila → Consulta → Farmácia)
- [ ] Frontend: Tela Recepção
- [ ] Frontend: Tela Triagem (Enfermeira)
- [ ] Frontend: Fila Médica (Painel)
- [ ] Frontend: Consulta Médica
- [ ] Frontend: Farmácia

### MS-04: Sistema de Filas (integrado no MS-03)
- [x] Integrado no MS-03

### MS-05: Gestão de Medicamentos e Farmácia (4 sprints)
- [ ] Schema: Medicamento, EstoqueMedicamento, DispensacaoMedicamento
- [ ] Backend API
- [ ] Frontend Admin (estoque)
- [ ] Frontend Farmácia (dispensação)

### MS-06: TFD COM FLUXO COMPLETO (7 sprints)
- [ ] Schema: SolicitacaoTFD, ViagemTFD, VeiculoTFD, MotoristaTFD
- [ ] Workflow Definition: "TFD"
- [ ] Backend: Fluxo (Solicitação → Análise → Regulação → Aprovação → Agendamento → Viagem)
- [ ] Frontend: Portal Cidadão (solicitação)
- [ ] Frontend: Análise Documental
- [ ] Frontend: Regulação Médica
- [ ] Frontend: Aprovação Gestão
- [ ] Frontend: Agendamento/Transporte
- [ ] Frontend: Dashboard TFD

---

## ⏸️ FASE 2: EDUCAÇÃO (20 sprints)

### MS-07: Gestão de Unidades Educacionais (2 sprints)
- [ ] Schema (já existe UnidadeEducacao)
- [ ] Backend API
- [ ] Frontend Admin

### MS-08: Sistema de Matrículas COM FLUXO (5 sprints)
- [ ] Schema: InscricaoMatricula, Matricula, Turma
- [ ] Workflow Definition: "Matrícula"
- [ ] Algoritmo de distribuição de vagas
- [ ] Backend API completa
- [ ] Frontend: Inscrição (pais)
- [ ] Frontend: Validação (admin)
- [ ] Frontend: Confirmação (pais)
- [ ] Frontend: Dashboard vagas

### MS-09: Gestão de Transporte Escolar (4 sprints)
- [ ] Schema: VeiculoEscolar, RotaEscolar, AlunoRota
- [ ] Backend API
- [ ] Frontend Admin (rotas)
- [ ] Frontend: Inscrição transporte

### MS-10: Gestão de Merenda Escolar (3 sprints)
- [ ] Schema: CardapioSemanal, EstoqueAlimentos
- [ ] Backend API
- [ ] Frontend Admin

### MS-11: Portal do Professor (3 sprints)
- [ ] Schema: Professor (já existe), Turma, Aula, Nota, Frequencia
- [ ] Backend API
- [ ] Frontend Professor

### MS-12: Portal do Aluno/Pais (3 sprints)
- [ ] Backend API (consultas)
- [ ] Frontend Aluno/Pais

---

## ⏸️ FASE 3: ASSISTÊNCIA SOCIAL (18 sprints)

### MS-13: Gestão de CRAS/CREAS (2 sprints)
- [ ] Schema (já existe UnidadeCRAS)
- [ ] Backend API
- [ ] Frontend Admin

### MS-14: CadÚnico Municipal COM FLUXO (6 sprints)
- [ ] Schema: CadUnicoFamilia, MembroFamilia
- [ ] Workflow Definition: "CadÚnico"
- [ ] Backend: Fluxo (Agendamento → Entrevista → Validação → Análise → Cadastro)
- [ ] Frontend: Agendamento (cidadão)
- [ ] Frontend: Entrevista (AS)
- [ ] Frontend: Validação
- [ ] Frontend: Análise Técnica
- [ ] Frontend: Dashboard vulnerabilidade

### MS-15: Gestão de Programas Sociais COM FLUXO (5 sprints)
- [ ] Schema: InscricaoProgramaSocial, AcompanhamentoBeneficio, PagamentoBeneficio
- [ ] Workflow Definition: "Programa Social"
- [ ] Backend: Fluxo (Inscrição → Verificação → Análise → Parecer → Concessão)
- [ ] Frontend: Inscrição (cidadão)
- [ ] Frontend: Análise (AS)
- [ ] Frontend: Parecer Psicológico
- [ ] Frontend: Acompanhamento
- [ ] Frontend: Folha de pagamento

### MS-16: Controle de Benefícios (2 sprints - integrado MS-15)
- [x] Integrado no MS-15

### MS-17: Atendimento Psicossocial (2 sprints - integrado MS-15)
- [x] Integrado no MS-15

### MS-18: Dashboard de Vulnerabilidade (1 sprint)
- [ ] Dashboard com métricas

---

## ⏸️ FASE 4: AGRICULTURA (14 sprints)

### MS-19 a MS-24
- [ ] Implementação pendente (detalhes na proposta)

---

## ⏸️ FASE 5: ESPORTES E HABITAÇÃO (32 sprints)

### MS-31 a MS-42
- [ ] Implementação pendente

---

## ⏸️ FASE 6: MEIO AMBIENTE E OBRAS (34 sprints)

### MS-43 a MS-54
- [ ] Implementação pendente

---

## ⏸️ FASE 7: SEGURANÇA E TURISMO (30 sprints)

### MS-55 a MS-66
- [ ] Implementação pendente

---

## ⏸️ FASE 8: PLANEJAMENTO E SERVIÇOS (36 sprints)

### MS-67 a MS-78
- [ ] Implementação pendente

---

## 📈 MÉTRICAS

- **Modelos Prisma criados:** 3/~250 (1%)
- **Rotas API criadas:** 0/~600 (0%)
- **Páginas Frontend criadas:** 0/~350 (0%)
- **Componentes criados:** 0/~200 (0%)

---

## 🗓️ HISTÓRICO DE UPDATES

### 2025-01-17 15:00
- ✅ Criado schema da Engine de Workflow Transversal
- ✅ Adicionados 3 models: WorkflowDefinition, WorkflowInstance, WorkflowHistory
- ✅ Adicionado enum WorkflowStatus
- ⏳ Próximo: Executar migration e criar serviços TypeScript

---

**Última atualização:** 2025-01-17 15:00
**Tempo estimado restante:** ~228 sprints (~114 semanas com 2 times, ~57 semanas com 4 times)
