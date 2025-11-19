# PROPOSTA DE MICROSISTEMAS PARA DIGIURBAN - VERSÃO ENRIQUECIDA
## Análise de Viabilidade e Roadmap de Implementação com Fluxos de Trabalho

**Versão:** 2.0 ENRIQUECIDA
**Data:** 2025-01-17
**Status:** Proposta Expandida com Fluxos Completos

---

## INTRODUÇÃO AO ENRIQUECIMENTO

Esta versão **enriquece** a proposta original com **fluxos de trabalho completos** inspirados no modelo de triagem médica:

### 🔄 **Padrão de Fluxo Implementado:**
```
Recepção/Entrada → Triagem/Análise → Processamento → Aprovação → Conclusão
```

### 📊 **Benefícios dos Fluxos:**
- **Rastreabilidade total:** Status claro em cada etapa
- **Handoff estruturado:** Transferência organizada entre profissionais/setores
- **Filas inteligentes:** Priorização automática baseada em critérios
- **Histórico completo:** Auditoria de todas as transições
- **SLA tracking:** Tempo médio por etapa
- **Dashboards gerenciais:** Visibilidade de gargalos

---

## SUMÁRIO EXECUTIVO

O DigiUrban possui uma base sólida com **25 tabelas auxiliares**, **13 secretarias** e **150+ serviços**. Esta proposta **ENRIQUECIDA** define **78 microsistemas** (6 por secretaria) com **fluxos de trabalho completos**, transformando o sistema em uma plataforma completa de gestão municipal com rastreabilidade total.

### Status Atual
- ✅ **18 tabelas seedadas** e prontas para uso
- ⚠️ **7 tabelas com schema** mas sem dados
- ❌ **Enums não dinâmicos** nos formulários (texto livre/hardcoded)
- ❌ **Sem CRUD admin** para tabelas auxiliares
- ✅ **Sistema de protocolos robusto** com vinculação de cidadãos
- 🆕 **Sistema de fluxos:** A ser implementado

### Viabilidade Técnica
**ALTA** - Toda infraestrutura necessária já existe:
- Models Prisma definidos
- Sistema de rotas modular
- Frontend com componentes reutilizáveis
- API REST padronizada
- Autenticação e autorização implementadas
- **🆕 Sistema de workflows:** Engine de fluxos transversal

---

## ARQUITETURA DE FLUXOS (NOVO)

### 🏗️ **Engine de Workflow Transversal**

Todos os microsistemas com fluxos utilizam uma engine comum:

```prisma
// ============================================================================
// SISTEMA DE WORKFLOW GENÉRICO
// ============================================================================

model WorkflowDefinition {
  id          String   @id @default(cuid())
  name        String   // "Atendimento Saúde", "Licenciamento Obras"
  description String?
  module      String   // "SAUDE", "PLANEJAMENTO"
  version     Int      @default(1)
  isActive    Boolean  @default(true)
  stages      Json     // Array de stages: [{id, name, role, sla}]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  instances   WorkflowInstance[]
}

model WorkflowInstance {
  id             String   @id @default(cuid())
  definitionId   String
  definition     WorkflowDefinition @relation(fields: [definitionId], references: [id])
  entityType     String   // "ConsultaMedica", "LicencaObra"
  entityId       String   // ID da entidade relacionada
  citizenId      String?  // Cidadão vinculado (se aplicável)
  currentStage   String   // ID do stage atual
  status         WorkflowStatus // ACTIVE, PAUSED, COMPLETED, CANCELLED
  priority       Int      @default(0)
  metadata       Json?    // Dados adicionais do contexto
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  completedAt    DateTime?

  history        WorkflowHistory[]

  @@index([entityType, entityId])
  @@index([citizenId])
  @@index([currentStage, status])
}

model WorkflowHistory {
  id           String   @id @default(cuid())
  instanceId   String
  instance     WorkflowInstance @relation(fields: [instanceId], references: [id])
  fromStage    String?
  toStage      String
  action       String   // "CREATED", "ADVANCED", "RETURNED", "COMPLETED"
  userId       String   // Quem executou a ação
  notes        String?
  attachments  Json?    // Array de anexos
  timestamp    DateTime @default(now())
  duration     Int?     // Tempo no stage anterior (minutos)

  @@index([instanceId])
  @@index([timestamp])
}

enum WorkflowStatus {
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
  ERROR
}
```

### 📋 **Benefícios da Engine Comum:**
1. **Reutilização:** Mesmo código para todos os fluxos
2. **Configurabilidade:** Fluxos definidos via JSON/UI
3. **Auditoria automática:** Histórico completo
4. **Métricas unificadas:** Dashboards consistentes
5. **Manutenção centralizada:** Bugs fixados uma vez

---

## MICROSISTEMA TRANSVERSAL (PRIORIDADE CRÍTICA)

### MS-00: GESTOR DE CADASTROS BASE
**Objetivo:** CRUD unificado para todas as 25 tabelas auxiliares

**(SEM MUDANÇAS - conforme proposta original)**

**Esforço:** 2-3 sprints | **ROI:** Alto - desbloqueia todo ecossistema

---

## SECRETARIA DE SAÚDE (6 Microsistemas)

### MS-01: Gestão de Unidades de Saúde
**Objetivo:** Gerenciamento completo de UBS, UPA, Hospitais, Clínicas

**(SEM MUDANÇAS - conforme proposta original)**

**Esforço:** 3 sprints

---

### MS-02: Agenda Médica Inteligente
**Objetivo:** Sistema de agendamento integrado com unidades e profissionais

**(SEM MUDANÇAS - conforme proposta original)**

**Esforço:** 4 sprints

---

### MS-03: Prontuário Eletrônico do Paciente (PEP) - 🆕 **COM FLUXO COMPLETO**
**Objetivo:** Registro digital de atendimentos médicos com fluxo recepção → triagem → consulta → farmácia

#### 🔄 **FLUXO DE ATENDIMENTO MÉDICO**

```
┌─────────────┐     ┌──────────┐     ┌─────────────┐     ┌───────────┐     ┌──────────┐
│  RECEPÇÃO   │ ──> │ TRIAGEM  │ ──> │  EM FILA    │ ──> │  CONSULTA │ ──> │ FARMÁCIA │
│  (Check-in) │     │ (Enferm.)│     │ (Aguardando)│     │ (Médico)  │     │ (Dispens)│
└─────────────┘     └──────────┘     └─────────────┘     └───────────┘     └──────────┘
```

#### **Funcionalidades Expandidas:**

**1. RECEPÇÃO (Check-in)**
- Check-in do paciente (agendado ou demanda espontânea)
- Validação de cadastro e documentos
- Criação de senha de atendimento
- Encaminhamento para triagem

**2. TRIAGEM (Enfermagem)**
- Fila de pacientes aguardando triagem
- Chamada de senha
- Coleta de sinais vitais:
  - Pressão arterial
  - Temperatura
  - Frequência cardíaca
  - SpO2 (saturação)
  - Peso e altura
- Classificação de risco (Protocolo de Manchester)
- Alergias e medicamentos em uso
- Queixa principal
- Prontuário atualizado em tempo real
- Encaminhamento para fila médica

**3. FILA MÉDICA (Aguardando Atendimento)**
- Fila priorizada por:
  - Classificação de risco
  - Horário de chegada
  - Prioridade legal (gestante, idoso, PcD)
- Painel de chamadas (TV)
- Tempo médio de espera
- Médico seleciona próximo paciente

**4. CONSULTA MÉDICA**
- Prontuário pré-preenchido pela triagem
- Anamnese completa
- Exame físico
- Diagnóstico (CID-10)
- Prescrição de medicamentos
- Solicitação de exames
- Encaminhamentos
- Atestados
- Finalização do atendimento

**5. FARMÁCIA (Opcional)**
- Se há prescrição: encaminhamento automático
- Fila de dispensação
- Validação de estoque
- Dispensação de medicamentos
- Orientações farmacêuticas

#### **Novas Tabelas (EXPANDIDAS):**

```prisma
// ============================================================================
// FLUXO DE ATENDIMENTO MÉDICO
// ============================================================================

model AtendimentoMedico {
  id                String   @id @default(cuid())
  workflowId        String   @unique // Vincula ao WorkflowInstance
  protocolId        String?  @unique // Se veio de protocolo
  consultaAgendadaId String? @unique // Se é consulta agendada
  citizenId         String
  unidadeId         String
  dataAtendimento   DateTime @default(now())
  tipo              TipoAtendimento // AGENDADO, DEMANDA_ESPONTANEA, URGENCIA
  status            AtendimentoStatus
  prioridade        Int      @default(0) // 0-5 (Manchester)

  // Recepção
  recepcaoId        String?
  horarioCheckin    DateTime?

  // Triagem
  triagemId         String?
  triagem           TriagemEnfermagem?
  horarioTriagem    DateTime?

  // Consulta
  consultaId        String?
  consulta          ConsultaMedica?
  profissionalId    String?
  horarioConsulta   DateTime?

  // Farmácia
  farmaciaId        String?
  horarioFarmacia   DateTime?
  medicamentosDispensados DispensacaoMedicamento[]

  // Métricas
  tempoTotalMinutos Int?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TipoAtendimento {
  AGENDADO
  DEMANDA_ESPONTANEA
  URGENCIA
  RETORNO
}

enum AtendimentoStatus {
  AGUARDANDO_CHECKIN
  CHECKIN_REALIZADO
  AGUARDANDO_TRIAGEM
  EM_TRIAGEM
  TRIAGEM_CONCLUIDA
  AGUARDANDO_MEDICO
  EM_CONSULTA
  CONSULTA_CONCLUIDA
  AGUARDANDO_FARMACIA
  EM_FARMACIA
  FINALIZADO
  CANCELADO
}

// ============================================================================
// TRIAGEM DE ENFERMAGEM
// ============================================================================

model TriagemEnfermagem {
  id                String   @id @default(cuid())
  atendimentoId     String   @unique
  atendimento       AtendimentoMedico @relation(fields: [atendimentoId], references: [id])
  enfermeiroId      String   // User ID do enfermeiro

  // Sinais Vitais
  pressaoArterial   String?  // "120/80"
  temperatura       Float?   // Celsius
  frequenciaCardiaca Int?    // BPM
  frequenciaRespiratoria Int? // IRPM
  saturacaoO2       Int?     // SpO2 %
  peso              Float?   // Kg
  altura            Float?   // Cm
  glicemia          Float?   // mg/dL

  // Classificação de Risco (Manchester)
  classificacaoRisco ClassificacaoRisco
  corProtocolo      String   // "VERMELHO", "LARANJA", "AMARELO", "VERDE", "AZUL"

  // Anamnese Preliminar
  queixaPrincipal   String
  historiaAtual     String?
  alergias          String?
  medicamentosUso   String?
  comorbidades      String?

  observacoes       String?
  dataHora          DateTime @default(now())
}

enum ClassificacaoRisco {
  EMERGENCIA        // Vermelho - Imediato
  MUITO_URGENTE     // Laranja - 10 min
  URGENTE           // Amarelo - 60 min
  POUCO_URGENTE     // Verde - 120 min
  NAO_URGENTE       // Azul - 240 min
}

// ============================================================================
// CONSULTA MÉDICA
// ============================================================================

model ConsultaMedica {
  id                String   @id @default(cuid())
  atendimentoId     String   @unique
  atendimento       AtendimentoMedico @relation(fields: [atendimentoId], references: [id])
  medicoId          String   // User ID do médico
  profissionalSaudeId String? // Vincula a ProfissionalSaude

  // Anamnese
  queixaPrincipal   String
  historiaDoenca    String?
  historicoFamiliar String?
  antecedentesPessoais String?

  // Exame Físico
  exameFisico       String?

  // Diagnóstico
  hipoteseDiagnostica String?
  diagnosticos      Json     // Array de {cid10, descricao}

  // Conduta
  conduta           String?
  orientacoes       String?

  // Documentos Gerados
  prescricoes       Prescricao[]
  exameSolicitados  ExameSolicitado[]
  atestados         Atestado[]
  encaminhamentos   Encaminhamento[]

  // Retorno
  retornoNecessario Boolean  @default(false)
  prazoRetornoDias  Int?

  observacoes       String?
  dataHora          DateTime @default(now())
}

model Prescricao {
  id             String   @id @default(cuid())
  consultaId     String
  consulta       ConsultaMedica @relation(fields: [consultaId], references: [id])
  medicamentos   Json     // Array de {medicamentoId, nome, dosagem, via, frequencia, duracao, quantidade}
  observacoes    String?
  validade       DateTime // 30 dias padrão
  dispensada     Boolean  @default(false)
  dataHora       DateTime @default(now())
}

model ExameSolicitado {
  id             String   @id @default(cuid())
  consultaId     String
  consulta       ConsultaMedica @relation(fields: [consultaId], references: [id])
  tipoExame      String
  justificativa  String?
  prioridade     PrioridadeExame
  status         StatusExame
  resultado      String?
  dataResultado  DateTime?
  dataHora       DateTime @default(now())
}

enum PrioridadeExame {
  ROTINA
  URGENTE
  EMERGENCIA
}

enum StatusExame {
  SOLICITADO
  AGENDADO
  COLETADO
  PROCESSANDO
  CONCLUIDO
  CANCELADO
}

model Atestado {
  id             String   @id @default(cuid())
  consultaId     String
  consulta       ConsultaMedica @relation(fields: [consultaId], references: [id])
  tipo           TipoAtestado
  cid10          String?
  diasAfastamento Int
  dataInicio     DateTime
  dataFim        DateTime
  observacoes    String?
  dataHora       DateTime @default(now())
}

enum TipoAtestado {
  MEDICO
  COMPARECIMENTO
  ACOMPANHANTE
}

model Encaminhamento {
  id             String   @id @default(cuid())
  consultaId     String
  consulta       ConsultaMedica @relation(fields: [consultaId], references: [id])
  especialidade  String
  motivo         String
  prioridade     PrioridadeEncaminhamento
  status         StatusEncaminhamento
  dataAgendamento DateTime?
  dataHora       DateTime @default(now())
}

enum PrioridadeEncaminhamento {
  ROTINA
  PRIORIDADE
  URGENCIA
}

enum StatusEncaminhamento {
  PENDENTE
  AGENDADO
  REALIZADO
  CANCELADO
}
```

#### **Rotas API:**

```typescript
// Recepção
POST   /api/atendimento/checkin
GET    /api/atendimento/fila-recepcao

// Triagem
GET    /api/atendimento/fila-triagem
POST   /api/atendimento/:id/triagem
PUT    /api/atendimento/:id/triagem

// Fila Médica
GET    /api/atendimento/fila-medica
POST   /api/atendimento/:id/chamar // Médico chama próximo

// Consulta
GET    /api/atendimento/:id/prontuario
POST   /api/atendimento/:id/consulta
POST   /api/atendimento/:id/prescricao
POST   /api/atendimento/:id/exame
POST   /api/atendimento/:id/atestado
POST   /api/atendimento/:id/encaminhamento
POST   /api/atendimento/:id/finalizar

// Farmácia
GET    /api/atendimento/fila-farmacia
POST   /api/atendimento/:id/dispensacao
```

#### **Dashboards:**
1. **Painel de Chamadas:** TV em tempo real
2. **Monitor de Filas:** Tempo de espera por setor
3. **Produtividade:** Atendimentos/hora por profissional
4. **Classificação de Risco:** Distribuição por cor
5. **Tempo Médio:** Por etapa do fluxo
6. **Taxa de No-Show:** Consultas agendadas

**Esforço:** 6 sprints (aumentado de 5 devido ao fluxo completo)

---

### MS-04: Sistema de Filas de Atendimento
**Objetivo:** Gestão de filas presenciais em tempo real

**✅ JÁ INTEGRADO NO MS-03** - As filas agora fazem parte do fluxo de atendimento

**Esforço:** Incluído no MS-03

---

### MS-05: Gestão de Medicamentos e Farmácia
**Objetivo:** Controle de estoque e dispensação de medicamentos

**(SEM MUDANÇAS - conforme proposta original, mas integra com MS-03)**

**Esforço:** 4 sprints

---

### MS-06: TFD - Tratamento Fora do Domicílio - 🆕 **COM FLUXO COMPLETO**
**Objetivo:** Gestão completa de encaminhamentos para tratamento em outras cidades

#### 🔄 **FLUXO TFD**

```
┌───────────┐   ┌──────────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────┐   ┌──────────┐
│SOLICITAÇÃO│──>│ ANÁLISE DOC. │──>│  REGULAÇÃO   │──>│ APROVAÇÃO │──>│AGENDAMENTO│──>│ VIAGEM   │
│ (Protocolo)│   │  (Setor TFD) │   │   MÉDICA     │   │  (Gestor) │   │(Transporte)│   │(Execução)│
└───────────┘   └──────────────┘   └──────────────┘   └───────────┘   └──────────┘   └──────────┘
```

#### **Funcionalidades Expandidas:**

**1. SOLICITAÇÃO (Via Protocolo)**
- Cidadão abre protocolo com documentos:
  - Encaminhamento médico (obrigatório)
  - Exames comprobatórios
  - CPF/RG paciente
  - CPF/RG acompanhante (se aplicável)
  - Comprovante residência
- Sistema cria SolicitacaoTFD vinculada ao protocolo
- Status: `AGUARDANDO_ANALISE_DOCUMENTAL`

**2. ANÁLISE DOCUMENTAL (Setor TFD)**
- Fila de solicitações por ordem de chegada
- Técnico valida documentação:
  - ✅ Documentos completos → Aprova
  - ❌ Documentos incompletos → Solicita complementação
- Se aprovado: Status `AGUARDANDO_REGULACAO_MEDICA`
- Se reprovado: Status `DOCUMENTACAO_PENDENTE` (notifica cidadão)

**3. REGULAÇÃO MÉDICA (Médico Regulador)**
- Fila priorizada por:
  - Gravidade (baseada em CID/procedimento)
  - Prazo máximo (baseado em portarias)
  - Ordem de chegada
- Médico regulador avalia:
  - Pertinência do encaminhamento
  - Classificação de prioridade
  - Especialidade/procedimento corretos
- Decisões:
  - ✅ Aprovar: Status `APROVADO_REGULACAO`
  - ❌ Indeferir: Status `INDEFERIDO` (com justificativa)
  - 🔄 Solicitar complementação: Status `AGUARDANDO_COMPLEMENTACAO`

**4. APROVAÇÃO GESTÃO (Coordenador TFD)**
- Fila de aprovações finais
- Validação orçamentária
- Autorização de despesas (transporte, hospedagem)
- Decisão final:
  - ✅ Aprovar: Status `APROVADO_PARA_AGENDAMENTO`
  - ❌ Suspender: Status `SUSPENSO` (falta de recurso, etc)

**5. AGENDAMENTO (Setor Transporte)**
- Contato com hospital/clínica de destino
- Agendamento da consulta/procedimento
- Definição da data de viagem
- Alocação de veículo e motorista
- Montagem de lista de passageiros (casos com mesma data/destino)
- Status: `AGENDADO`

**6. VIAGEM (Execução)**
- Check-list pré-viagem:
  - Vistoria do veículo
  - Confirmação de passageiros
  - Autorização de viagem assinada
- Durante viagem:
  - Registro de KM, combustível, pedágios
  - Status: `EM_VIAGEM`
- Após retorno:
  - Comprovante de atendimento
  - Prestação de contas
  - Status: `REALIZADO`

**7. ACOMPANHAMENTO E RETORNO**
- Paciente pode ter múltiplas viagens (retornos)
- Sistema agenda retornos automáticos
- Histórico completo de viagens

#### **Novas Tabelas (EXPANDIDAS):**

```prisma
// ============================================================================
// FLUXO TFD COMPLETO
// ============================================================================

model SolicitacaoTFD {
  id              String   @id @default(cuid())
  workflowId      String   @unique // Vincula ao WorkflowInstance
  protocolId      String   @unique
  citizenId       String
  acompanhanteId  String?  // Cidadão do acompanhante

  // Dados Clínicos
  especialidade   String
  procedimento    String
  cid10           String?
  justificativa   String
  encaminhamentoMedicoUrl String // Documento obrigatório
  examesUrls      Json?    // Array de URLs de exames

  // Regulação
  prioridade      PrioridadeTFD
  classificacaoRisco String?
  prazoMaximoDias Int?

  // Destino
  cidadeDestino   String
  estadoDestino   String
  hospitalDestino String?

  // Status e Fila
  status          TFDStatus
  posicaoFila     Int?

  // Análise Documental
  analisadoPor    String?  // UserID
  dataAnalise     DateTime?
  motivoRecusa    String?

  // Regulação Médica
  reguladoPor     String?  // UserID (Médico)
  dataRegulacao   DateTime?
  parecerRegulador String?

  // Aprovação Gestão
  aprovadoPor     String?  // UserID (Gestor)
  dataAprovacao   DateTime?
  valorEstimado   Float?

  // Agendamento
  agendadoPor     String?  // UserID
  dataConsulta    DateTime?
  horarioConsulta String?
  confirmado      Boolean  @default(false)

  // Viagens
  viagens         ViagemTFD[]

  // Auditoria
  observacoes     String?
  historico       Json?    // Array de mudanças de status
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum TFDStatus {
  AGUARDANDO_ANALISE_DOCUMENTAL
  DOCUMENTACAO_PENDENTE
  AGUARDANDO_REGULACAO_MEDICA
  AGUARDANDO_COMPLEMENTACAO
  INDEFERIDO
  APROVADO_REGULACAO
  AGUARDANDO_APROVACAO_GESTAO
  SUSPENSO
  APROVADO_PARA_AGENDAMENTO
  AGENDANDO
  AGENDADO
  AGUARDANDO_VIAGEM
  EM_VIAGEM
  REALIZADO
  CANCELADO
}

enum PrioridadeTFD {
  EMERGENCIA      // 0-7 dias
  ALTA            // 7-30 dias
  MEDIA           // 30-60 dias
  ROTINA          // 60+ dias
}

model ViagemTFD {
  id                String   @id @default(cuid())
  solicitacaoTFDId  String
  solicitacao       SolicitacaoTFD @relation(fields: [solicitacaoTFDId], references: [id])

  // Dados da Viagem
  tipo              TipoViagemTFD // IDA, RETORNO, IDA_E_VOLTA
  dataVia gem         DateTime
  horarioSaida      String
  horarioChegada    String?

  // Transporte
  veiculoId         String?
  motoristaId       String?

  // Passageiros (pode compartilhar veículo)
  passageiros       Json     // Array de {solicitacaoTFDId, citizenId, isAcompanhante}

  // Custos
  kmInicial         Int?
  kmFinal           Int?
  kmTotal           Int?
  combustivel       Float?
  pedagios          Float?
  hospedagem        Float?
  alimentacao       Float?
  outros            Float?
  totalGasto        Float?

  // Comprovantes
  comprovantes      Json?    // Array de URLs

  // Status
  status            StatusViagemTFD

  // Observações
  observacoes       String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TipoViagemTFD {
  IDA
  RETORNO
  IDA_E_VOLTA
}

enum StatusViagemTFD {
  PLANEJADA
  EM_ANDAMENTO
  CONCLUIDA
  CANCELADA
}

// ============================================================================
// VEÍCULOS E MOTORISTAS TFD
// ============================================================================

model VeiculoTFD {
  id              String   @id @default(cuid())
  placa           String   @unique
  modelo          String
  ano             Int
  capacidade      Int      // Número de passageiros
  acessibilidade  Boolean  // Adaptado para PcD
  status          StatusVeiculoTFD
  km              Int      @default(0)
  ultimaRevisao   DateTime?
  proximaRevisao  DateTime?
  observacoes     String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum StatusVeiculoTFD {
  DISPONIVEL
  EM_VIAGEM
  MANUTENCAO
  INATIVO
}

model MotoristaTFD {
  id              String   @id @default(cuid())
  userId          String   @unique // Vincula a User
  nome            String
  cpf             String   @unique
  cnh             String   @unique
  categoriaCNH    String
  validadeCNH     DateTime
  telefone        String
  status          StatusMotoristaTFD
  observacoes     String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum StatusMotoristaTFD {
  DISPONIVEL
  EM_VIAGEM
  FOLGA
  INATIVO
}
```

#### **Rotas API:**

```typescript
// Solicitação
POST   /api/tfd/solicitar
GET    /api/tfd/minhas-solicitacoes

// Análise Documental
GET    /api/tfd/fila-analise-documental
POST   /api/tfd/:id/analisar-documentos
POST   /api/tfd/:id/solicitar-complementacao

// Regulação Médica
GET    /api/tfd/fila-regulacao
POST   /api/tfd/:id/regular
POST   /api/tfd/:id/indeferir

// Aprovação Gestão
GET    /api/tfd/fila-aprovacao-gestao
POST   /api/tfd/:id/aprovar-gestao
POST   /api/tfd/:id/suspender

// Agendamento
GET    /api/tfd/fila-agendamento
POST   /api/tfd/:id/agendar-consulta
POST   /api/tfd/:id/confirmar-agendamento

// Transporte
GET    /api/tfd/viagens-planejadas
POST   /api/tfd/:id/planejar-viagem
POST   /api/tfd/:id/iniciar-viagem
POST   /api/tfd/:id/finalizar-viagem

// Veículos e Motoristas
GET    /api/tfd/veiculos
POST   /api/tfd/veiculos
GET    /api/tfd/motoristas
POST   /api/tfd/motoristas

// Relatórios
GET    /api/tfd/relatorio-gastos
GET    /api/tfd/relatorio-fila
GET    /api/tfd/relatorio-produtividade
```

#### **Dashboards:**
1. **Fila TFD:** Posição, tempo de espera, prioridade
2. **Viagens do Mês:** Planejadas vs Realizadas
3. **Gastos:** Por destino, por especialidade
4. **Tempo Médio:** Por etapa do fluxo
5. **Taxa de Indeferimento:** Motivos
6. **Produtividade:** Viagens/veículo, viagens/motorista

**Esforço:** 7 sprints (aumentado de 5 devido ao fluxo completo)

---

## SECRETARIA DE EDUCAÇÃO (6 Microsistemas)

### MS-07: Gestão de Unidades Educacionais
**Objetivo:** Gerenciamento completo de escolas

**(SEM MUDANÇAS - conforme proposta original)**

**Esforço:** 2 sprints

---

### MS-08: Sistema de Matrículas - 🆕 **COM FLUXO COMPLETO**
**Objetivo:** Sistema de matrículas com fluxo de inscrição → validação → distribuição → confirmação

#### 🔄 **FLUXO DE MATRÍCULA**

```
┌──────────┐   ┌──────────────┐   ┌────────────┐   ┌────────────┐   ┌──────────┐
│INSCRIÇÃO │──>│  VALIDAÇÃO   │──>│DISTRIBUIÇÃO│──>│CONFIRMAÇÃO │──>│MATRÍCULA │
│ (Online) │   │  DOCUMENTOS  │   │   VAGAS    │   │(Responsável)│   │ EFETIVADA│
└──────────┘   └──────────────┘   └────────────┘   └────────────┘   └──────────┘
```

#### **Funcionalidades Expandidas:**

**1. INSCRIÇÃO ONLINE**
- Responsável acessa portal
- Dados do aluno (nome, nascimento, necessidades especiais)
- Dados do responsável
- Endereço residencial (para zoneamento)
- Escola de preferência (até 3 opções)
- Upload de documentos:
  - Certidão de nascimento
  - Comprovante de residência
  - Cartão de vacina (se aplicável)
  - Histórico escolar (transferência)
- Status: `INSCRITO_AGUARDANDO_VALIDACAO`

**2. VALIDAÇÃO DE DOCUMENTOS**
- Fila de inscrições por data
- Servidor valida:
  - Documentos legíveis
  - Endereço no município
  - Idade compatível com série
- Decisões:
  - ✅ Aprovar: Status `DOCUMENTOS_VALIDADOS`
  - ❌ Solicitar correção: Status `DOCUMENTACAO_PENDENTE`
  - ❌ Indeferir: Status `INDEFERIDA` (fora do município, etc)

**3. DISTRIBUIÇÃO DE VAGAS (Automática)**
- Sistema executa algoritmo de distribuição:
  - Zoneamento (prioridade para escola mais próxima)
  - Disponibilidade de vagas por série/turno
  - Critérios de desempate:
    1. Irmãos já matriculados
    2. Renda familiar
    3. Ordem de inscrição
- Resultado:
  - ✅ Vaga disponível: Status `VAGA_ATRIBUIDA` (notifica responsável)
  - ❌ Sem vaga: Status `LISTA_ESPERA` (entra na fila)

**4. CONFIRMAÇÃO (Responsável)**
- Responsável tem prazo (ex: 7 dias) para confirmar
- Ações:
  - ✅ Aceitar: Status `CONFIRMADA`
  - ❌ Recusar: Status `RECUSADA` (vaga liberada)
  - ⏰ Prazo expirou: Status `EXPIRADA` (vaga liberada)

**5. MATRÍCULA EFETIVADA**
- Responsável comparece presencialmente com originais
- Servidor confere documentos
- Assinatura de contrato de matrícula
- Emissão de declaração de matrícula
- Status: `MATRICULADO`

**6. RENOVAÇÃO AUTOMÁTICA**
- No fim do ano letivo: Sistema sugere renovação
- Responsável confirma online
- Validação automática (já matriculado)
- Status: `RENOVADO`

#### **Novas Tabelas (EXPANDIDAS):**

```prisma
// ============================================================================
// FLUXO DE MATRÍCULA
// ============================================================================

model InscricaoMatricula {
  id                String   @id @default(cuid())
  workflowId        String   @unique
  alunoId           String   // Citizen (menor de idade)
  responsavelId     String   // Citizen (responsável)
  anoLetivo         Int
  serie             String
  turno             TurnoPreferencia

  // Endereço (para zoneamento)
  endereco          Json     // {logradouro, numero, bairro, cep, lat, lng}

  // Preferências (até 3 escolas)
  escolaPreferencia1 String?
  escolaPreferencia2 String?
  escolaPreferencia3 String?

  // Documentos
  documentos        Json     // Array de {tipo, url, status}

  // Necessidades Especiais
  necessidadeEspecial Boolean @default(false)
  descricaoNecessidade String?

  // Transferência
  isTransferencia   Boolean  @default(false)
  escolaOrigem      String?
  motivoTransferencia String?

  // Validação
  validadoPor       String?
  dataValidacao     DateTime?
  motivoRecusa      String?

  // Distribuição
  escolaAtribuida   String?
  turmaAtribuida    String?
  dataDistribuicao  DateTime?
  criterioDesempate String?

  // Confirmação
  confirmmadoEm      DateTime?
  recusadoEm        DateTime?
  motivoRecusa      String?

  // Status
  status            MatriculaStatus
  posicaoFilaEspera Int?

  // Matrícula Efetivada
  matriculaId       String?  @unique
  matricula         Matricula?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([serie, turno, status])
  @@index([escolaAtribuida, status])
}

enum TurnoPreferencia {
  MATUTINO
  VESPERTINO
  INTEGRAL
  INDIFERENTE
}

enum MatriculaStatus {
  INSCRITO_AGUARDANDO_VALIDACAO
  DOCUMENTACAO_PENDENTE
  DOCUMENTOS_VALIDADOS
  AGUARDANDO_DISTRIBUICAO
  VAGA_ATRIBUIDA
  LISTA_ESPERA
  CONFIRMADA
  RECUSADA
  EXPIRADA
  MATRICULADO
  INDEFERIDA
  CANCELADA
}

model Matricula {
  id              String   @id @default(cuid())
  inscricaoId     String   @unique
  inscricao       InscricaoMatricula @relation(fields: [inscricaoId], references: [id])
  alunoId         String
  responsavelId   String
  unidadeEducacaoId String
  turmaId         String
  anoLetivo       Int
  numeroMatricula String   @unique
  dataMatricula   DateTime @default(now())
  situacao        SituacaoMatricula
  dataTransferencia DateTime?
  motivoTransferencia String?
  observacoes     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([alunoId, anoLetivo])
  @@index([turmaId, situacao])
}

enum SituacaoMatricula {
  ATIVA
  TRANSFERIDA
  CANCELADA
  CONCLUIDA
}

model Turma {
  id              String   @id @default(cuid())
  unidadeEducacaoId String
  codigo          String   @unique
  serie           String
  turno           Turno
  ano             Int
  professorId     String?
  sala            String?
  capacidade      Int
  vagasOcupadas   Int      @default(0)
  vagasDisponiveis Int     // Calculado: capacidade - vagasOcupadas
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([unidadeEducacaoId, serie, turno, ano])
}

enum Turno {
  MATUTINO
  VESPERTINO
  INTEGRAL
  NOTURNO
}
```

#### **Algoritmo de Distribuição:**

```typescript
// Pseudocódigo do algoritmo de distribuição de vagas

function distribuirVagas(inscricoes: InscricaoMatricula[]) {
  // 1. Filtrar inscrições validadas
  const validadas = inscricoes.filter(i => i.status === 'DOCUMENTOS_VALIDADOS');

  // 2. Ordenar por prioridade
  const ordenadas = validadas.sort((a, b) => {
    // Critério 1: Irmãos já matriculados
    const aPrioridade = temIrmaoMatriculado(a) ? 1000 : 0;
    const bPrioridade = temIrmaoMatriculado(b) ? 1000 : 0;

    // Critério 2: Renda familiar (CadÚnico)
    const aRenda = obterRendaFamiliar(a.responsavelId);
    const bRenda = obterRendaFamiliar(b.responsavelId);
    const rendaPontos = bRenda > aRenda ? 100 : 0; // Menor renda = prioridade

    // Critério 3: Data de inscrição
    const dataP ontos = a.createdAt < b.createdAt ? 10 : 0;

    return (bPrioridade + rendaPontos + dataPontos) - (aPrioridade);
  });

  // 3. Distribuir vagas
  for (const inscricao of ordenadas) {
    // Buscar turmas disponíveis nas escolas de preferência
    const vaga = buscarVagaDisponivel(
      inscricao.escolaPreferencia1,
      inscricao.escolaPreferencia2,
      inscricao.escolaPreferencia3,
      inscricao.serie,
      inscricao.turno,
      inscricao.endereco
    );

    if (vaga) {
      // Atribuir vaga
      inscricao.escolaAtribuida = vaga.unidadeEducacaoId;
      inscricao.turmaAtribuida = vaga.turmaId;
      inscricao.status = 'VAGA_ATRIBUIDA';
      inscricao.dataDistribuicao = new Date();

      // Reservar vaga (decrementa vagasDisponiveis)
      reservarVaga(vaga.turmaId);

      // Notificar responsável
      notificar(inscricao.responsavelId, 'Vaga disponível! Confirme em 7 dias.');
    } else {
      // Sem vaga: lista de espera
      inscricao.status = 'LISTA_ESPERA';
      inscricao.posicaoFilaEspera = obterPosicaoFila(inscricao.serie, inscricao.turno);
    }
  }
}
```

#### **Rotas API:**

```typescript
// Inscrição
POST   /api/matricula/inscrever
GET    /api/matricula/minhas-inscricoes
PUT    /api/matricula/:id/upload-documento

// Validação
GET    /api/matricula/fila-validacao
POST   /api/matricula/:id/validar
POST   /api/matricula/:id/solicitar-correcao

// Distribuição
POST   /api/matricula/executar-distribuicao // Executado pelo sistema/admin
GET    /api/matricula/relatorio-distribuicao

// Confirmação
GET    /api/matricula/:id/detalhes-vaga
POST   /api/matricula/:id/confirmar
POST   /api/matricula/:id/recusar

// Matrícula Efetivada
POST   /api/matricula/:id/efetivar

// Renovação
GET    /api/matricula/renovacoes-disponiveis
POST   /api/matricula/:id/renovar

// Lista de Espera
GET    /api/matricula/lista-espera
POST   /api/matricula/:id/realocar-vaga // Quando vaga libera
```

#### **Dashboards:**
1. **Inscrições:** Total, por status, por escola
2. **Vagas:** Disponíveis vs Ocupadas por escola/série
3. **Fila de Validação:** Tempo médio de validação
4. **Lista de Espera:** Posição, tempo de espera
5. **Taxa de Confirmação:** % de vagas aceitas/recusadas
6. **Zoneamento:** Mapa de inscrições por bairro

**Esforço:** 5 sprints (aumentado de 4 devido ao fluxo completo)

---

### MS-09 a MS-12: Gestão de Transporte, Merenda, Portal Professor, Portal Aluno

**(SEM MUDANÇAS - conforme proposta original)**

**Esforço Total:** 13 sprints (2+4+3+3)

---

## SECRETARIA DE ASSISTÊNCIA SOCIAL (6 Microsistemas)

### MS-13: Gestão de CRAS/CREAS
**(SEM MUDANÇAS - conforme proposta original)**

**Esforço:** 2 sprints

---

### MS-14: CadÚnico Municipal - 🆕 **COM FLUXO COMPLETO**
**Objetivo:** Cadastro de famílias com fluxo de agendamento → entrevista → validação → aprovação

#### 🔄 **FLUXO CADUNICO**

```
┌───────────┐   ┌──────────┐   ┌───────────────┐   ┌──────────┐   ┌──────────┐
│AGENDAMENTO│──>│ENTREVISTA│──>│   VALIDAÇÃO   │──>│ ANÁLISE  │──>│CADASTRADO│
│ (Online)  │   │ (Presen.)│   │   DOCUMENTOS  │   │ TÉCNICA  │   │  (NIS)   │
└───────────┘   └──────────┘   └───────────────┘   └──────────┘   └──────────┘
```

#### **Funcionalidades Expandidas:**

**1. AGENDAMENTO ONLINE**
- Cidadão solicita agendamento via portal
- Seleciona CRAS de preferência
- Sistema sugere datas/horários disponíveis
- Confirmação de agendamento
- Status: `AGENDADO`

**2. ENTREVISTA PRESENCIAL**
- Cidadão comparece no CRAS
- Assistente social realiza entrevista:
  - Composição familiar
  - Renda de cada membro
  - Despesas mensais
  - Condições de moradia
  - Situação de trabalho
- Coleta de documentos originais
- Fotos e assinaturas
- Status: `EM_ENTREVISTA` → `ENTREVISTA_CONCLUIDA`

**3. VALIDAÇÃO DE DOCUMENTOS**
- Técnico valida documentação:
  - CPF de todos os membros
  - Comprovantes de renda
  - Comprovante de residência
  - Certidões de nascimento/casamento
- Cálculo automático de renda per capita
- Status: `DOCUMENTOS_VALIDADOS` ou `DOCUMENTACAO_PENDENTE`

**4. ANÁLISE TÉCNICA**
- Assistente social revisa:
  - Consistência das informações
  - Cruzamento com outras bases (INSS, RAIS)
  - Parecer social
- Decisão:
  - ✅ Aprovar: Status `APROVADO`
  - ❌ Indeferir: Status `INDEFERIDO`
  - 🔄 Complementar: Status `AGUARDANDO_COMPLEMENTACAO`

**5. CADASTRO EFETIVADO**
- Sistema gera NIS (Número de Identificação Social)
- Sincronização com CadÚnico federal (se aplicável)
- Emissão de comprovante de cadastro
- Status: `CADASTRADO`

**6. ATUALIZAÇÃO CADASTRAL (Obrigatório a cada 2 anos)**
- Sistema notifica família sobre prazo de atualização
- Fluxo similar à inscrição inicial
- Valida se houve mudanças significativas

#### **Novas Tabelas (EXPANDIDAS):**

```prisma
// ============================================================================
// FLUXO CADUNICO
// ============================================================================

model CadUnicoFamilia {
  id                String   @id @default(cuid())
  workflowId        String   @unique
  responsavelFamiliarId String // Citizen
  nisResponsavel    String?  @unique

  // Agendamento
  crasId            String?
  dataAgendamento   DateTime?
  horarioAgendamento String?
  agendadoPor       String?  // UserID

  // Entrevista
  entrevistadoPor   String?  // UserID (Assistente Social)
  dataEntrevista    DateTime?
  localEntrevista   String?

  // Composição Familiar
  membros           MembroFamilia[]

  // Renda
  rendaTotalFamiliar Float   @default(0)
  rendaPerCapita    Float    @default(0)
  fontesRenda       Json?    // Array de fontes

  // Despesas
  despesaMoradia    Float?
  despesaAlimentacao Float?
  despesaSaude      Float?
  despesaEducacao   Float?
  despesaOutros     Float?

  // Moradia
  tipoMoradia       TipoMoradia
  situacaoMoradia   SituacaoMoradia // PROPRIA, ALUGADA, CEDIDA
  aguaEncanada      Boolean  @default(false)
  energiaEletrica   Boolean  @default(false)
  esgoto            Boolean  @default(false)
  coletaLixo        Boolean  @default(false)

  // Documentos
  documentos        Json     // Array de {tipo, url, validado}

  // Validação
  validadoPor       String?
  dataValidacao     DateTime?

  // Análise Técnica
  analisadoPor      String?
  dataAnalise       DateTime?
  parecerSocial     String?
  motivoIndeferimento String?

  // Cadastro
  nisFamilia        String?  @unique
  dataCadastro      DateTime?
  dataUltimaAtualizacao DateTime?
  proximaAtualizacao DateTime? // 24 meses após cadastro/atualização

  // Status
  status            CadUnicoStatus

  // Programas Vinculados
  programasVinculados Json?  // Array de programas sociais

  // Observações
  observacoes       String?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([responsavelFamiliarId])
  @@index([nisFamilia])
  @@index([status])
  @@index([proximaAtualizacao])
}

enum CadUnicoStatus {
  AGENDADO
  AGUARDANDO_ENTREVISTA
  EM_ENTREVISTA
  ENTREVISTA_CONCLUIDA
  DOCUMENTACAO_PENDENTE
  DOCUMENTOS_VALIDADOS
  AGUARDANDO_ANALISE
  AGUARDANDO_COMPLEMENTACAO
  APROVADO
  INDEFERIDO
  CADASTRADO
  ATIVO
  DESATUALIZADO
  SUSPENSO
  CANCELADO
}

enum TipoMoradia {
  CASA
  APARTAMENTO
  COMODO
  BARRACO
  OUTRO
}

enum SituacaoMoradia {
  PROPRIA_QUITADA
  PROPRIA_FINANCIADA
  ALUGADA
  CEDIDA
  OCUPACAO
  OUTRO
}

model MembroFamilia {
  id              String   @id @default(cuid())
  familiaId       String
  familia         CadUnicoFamilia @relation(fields: [familiaId], references: [id])
  citizenId       String?  // Vincula a Citizen (se cadastrado)
  nome            String
  cpf             String?
  dataNascimento  DateTime
  parentesco      Parentesco
  sexo            Sexo
  raca            Raca
  escolaridade    Escolaridade
  trabalha        Boolean  @default(false)
  rendaMensal     Float    @default(0)
  fonteRenda      String?
  deficiencia     Boolean  @default(false)
  tipoDeficiencia String?
  frequentaEscola Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([familiaId])
  @@index([cpf])
}

enum Parentesco {
  RESPONSAVEL_FAMILIAR
  CONJUGE_COMPANHEIRO
  FILHO_ENTEADO
  PAI_MAE
  SOGRO_SOGRA
  NETO_BISNETO
  IRMAO_IRMA
  GENRO_NORA
  OUTRO
}

enum Sexo {
  MASCULINO
  FEMININO
  OUTRO
}

enum Raca {
  BRANCA
  PRETA
  PARDA
  AMARELA
  INDIGENA
}

enum Escolaridade {
  SEM_INSTRUCAO
  FUNDAMENTAL_INCOMPLETO
  FUNDAMENTAL_COMPLETO
  MEDIO_INCOMPLETO
  MEDIO_COMPLETO
  SUPERIOR_INCOMPLETO
  SUPERIOR_COMPLETO
}
```

#### **Rotas API:**

```typescript
// Agendamento
POST   /api/cadunico/agendar
GET    /api/cadunico/meus-agendamentos
PUT    /api/cadunico/:id/reagendar
DELETE /api/cadunico/:id/cancelar-agendamento

// Entrevista
GET    /api/cadunico/agenda-entrevistas // Para assistentes sociais
POST   /api/cadunico/:id/iniciar-entrevista
POST   /api/cadunico/:id/adicionar-membro
POST   /api/cadunico/:id/registrar-renda
POST   /api/cadunico/:id/registrar-moradia
POST   /api/cadunico/:id/finalizar-entrevista

// Validação
GET    /api/cadunico/fila-validacao
POST   /api/cadunico/:id/validar-documentos
POST   /api/cadunico/:id/solicitar-complementacao

// Análise Técnica
GET    /api/cadunico/fila-analise
POST   /api/cadunico/:id/analisar
POST   /api/cadunico/:id/aprovar
POST   /api/cadunico/:id/indeferir

// Cadastro
POST   /api/cadunico/:id/efetivar-cadastro
GET    /api/cadunico/:id/comprovante

// Atualização
GET    /api/cadunico/atualizacoes-pendentes
POST   /api/cadunico/:id/iniciar-atualizacao

// Consultas
GET    /api/cadunico/consultar-nis/:nis
GET    /api/cadunico/consultar-cpf/:cpf
```

#### **Dashboards:**
1. **Agendamentos:** Disponíveis vs Ocupados por CRAS
2. **Entrevistas:** Realizadas/dia, tempo médio
3. **Fila de Validação:** Tempo médio de validação
4. **Cadastros Ativos:** Total, por faixa de renda
5. **Atualizações Pendentes:** Prazo vencendo
6. **Vulnerabilidade:** Renda per capita, déficits habitacionais

**Esforço:** 6 sprints (aumentado de 4 devido ao fluxo completo)

---

### MS-15: Gestão de Programas Sociais - 🆕 **COM FLUXO COMPLETO**
**Objetivo:** Inscrição e concessão de benefícios com fluxo completo

#### 🔄 **FLUXO DE PROGRAMA SOCIAL**

```
┌──────────┐   ┌────────────┐   ┌───────────────┐   ┌───────────┐   ┌──────────┐
│INSCRIÇÃO │──>│VERIFICAÇÃO │──>│    ANÁLISE    │──>│  PARECER  │──>│CONCESSÃO │
│ (Portal) │   │  CADUNICO  │   │    TÉCNICA    │   │PSICOLÓGICO│   │(Aprovado)│
└──────────┘   └────────────┘   └───────────────┘   └───────────┘   └──────────┘
```

#### **Funcionalidades Expandidas:**

**1. INSCRIÇÃO**
- Cidadão escolhe programa (Bolsa Família, Cesta Básica, etc)
- Sistema verifica se tem CadÚnico válido
- Preenche formulário específico do programa
- Upload de documentos complementares (se necessário)
- Status: `INSCRITO`

**2. VERIFICAÇÃO CADUNICO**
- Sistema verifica automaticamente:
  - CadÚnico ativo e atualizado
  - Renda per capita dentro do limite
  - Composição familiar compatível
- Resultado:
  - ✅ Apto: Status `VERIFICACAO_APROVADA`
  - ❌ Não apto: Status `NAO_ELEGIVEL` (com motivo)

**3. ANÁLISE TÉCNICA (Assistente Social)**
- Fila priorizada por vulnerabilidade
- Assistente social avalia:
  - Situação socioeconômica
  - Contexto familiar
  - Necessidade real do benefício
- Parecer social:
  - ✅ Favorável: Status `PARECER_FAVORAVEL`
  - ❌ Desfavorável: Status `PARECER_DESFAVORAVEL`
  - 🔄 Visita domiciliar necessária: Status `AGUARDANDO_VISITA`

**4. PARECER PSICOLÓGICO (Se aplicável)**
- Alguns programas exigem avaliação psicológica
- Psicólogo agenda atendimento
- Entrevista e parecer
- Status: `PARECER_PSICOLOGICO_CONCLUIDO`

**5. APROVAÇÃO COORDENAÇÃO**
- Coordenador revisa pareceres
- Decisão final:
  - ✅ Aprovar: Status `APROVADO`
  - ❌ Indeferir: Status `INDEFERIDO`

**6. CONCESSÃO**
- Benefício concedido
- Inclusão em folha de pagamento
- Cadastro bancário
- Emissão de cartão (se aplicável)
- Status: `CONCEDIDO`

**7. ACOMPANHAMENTO**
- Renovação periódica (anual)
- Verificação de condicionalidades (frequência escolar, vacinas)
- Suspensão automática se condicionalidades não cumpridas

#### **Novas Tabelas (EXPANDIDAS):**

```prisma
// ============================================================================
// FLUXO DE PROGRAMAS SOCIAIS
// ============================================================================

model InscricaoProgramaSocial {
  id              String   @id @default(cuid())
  workflowId      String   @unique
  programaId      String
  familiaId       String   // CadUnicoFamilia
  beneficiarioId  String   // Citizen (responsável familiar)

  // Verificação CadÚnico
  cadUnicoValidado Boolean  @default(false)
  rendaPerCapita  Float?
  atendeCriterios Boolean  @default(false)
  motivoNaoElegibilidade String?

  // Análise Técnica (AS)
  analisadoPor    String?  // UserID (Assistente Social)
  dataAnalise     DateTime?
  parecerSocial   String?
  visitaDomiciliar Boolean  @default(false)
  dataVisita      DateTime?
  relatorioVisita String?

  // Parecer Psicológico (se aplicável)
  psicologoId     String?  // UserID
  dataParecer     DateTime?
  parecerPsicologico String?

  // Aprovação
  aprovadoPor     String?  // UserID (Coordenador)
  dataAprovacao   DateTime?
  motivoIndeferimento String?

  // Concessão
  dataConcessao   DateTime?
  numeroBeneficio String?  @unique
  valorMensal     Float?
  diaVencimento   Int?     // Dia do mês
  contaBancaria   Json?    // {banco, agencia, conta}

  // Status
  status          ProgramaSocialStatus

  // Renovação
  dataUltimaRenovacao DateTime?
  proximaRenovacao DateTime?

  // Suspensão
  suspenso        Boolean  @default(false)
  motivoSuspensao String?
  dataSuspensao   DateTime?

  // Observações
  observacoes     String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relacionamentos
  acompanhamentos AcompanhamentoBeneficio[]
  pagamentos      PagamentoBeneficio[]

  @@index([programaId, status])
  @@index([beneficiarioId])
  @@index([numeroBeneficio])
}

enum ProgramaSocialStatus {
  INSCRITO
  VERIFICACAO_CADUNICO
  NAO_ELEGIVEL
  VERIFICACAO_APROVADA
  AGUARDANDO_ANALISE
  AGUARDANDO_VISITA
  PARECER_FAVORAVEL
  PARECER_DESFAVORAVEL
  AGUARDANDO_PARECER_PSICOLOGICO
  PARECER_PSICOLOGICO_CONCLUIDO
  AGUARDANDO_APROVACAO
  APROVADO
  INDEFERIDO
  CONCEDIDO
  ATIVO
  SUSPENSO
  CANCELADO
}

model AcompanhamentoBeneficio {
  id              String   @id @default(cuid())
  inscricaoId     String
  inscricao       InscricaoProgramaSocial @relation(fields: [inscricaoId], references: [id])
  tipo            TipoAcompanhamento
  responsavelId   String   // UserID (AS ou Psicólogo)
  data            DateTime @default(now())
  descricao       String
  observacoes     String?
  proximoAcompanhamento DateTime?

  @@index([inscricaoId])
}

enum TipoAcompanhamento {
  VISITA_DOMICILIAR
  ATENDIMENTO_PSICOSSOCIAL
  VERIFICACAO_CONDICIONALIDADES
  RENOVACAO
  OUTRO
}

model PagamentoBeneficio {
  id              String   @id @default(cuid())
  inscricaoId     String
  inscricao       InscricaoProgramaSocial @relation(fields: [inscricaoId], references: [id])
  competencia     String   // "2025-01"
  valor           Float
  dataPagamento   DateTime?
  status          StatusPagamento
  comprovante     String?  // URL do comprovante bancário
  observacoes     String?

  @@index([inscricaoId, competencia])
}

enum StatusPagamento {
  PENDENTE
  PROCESSANDO
  PAGO
  FALHA
  ESTORNADO
}

model CondicionalidadeBeneficio {
  id              String   @id @default(cuid())
  programaId      String
  tipo            TipoCondicionalidade
  descricao       String
  periodicidade   PeriodicidadeVerificacao
  obrigatoria     Boolean  @default(true)

  @@index([programaId])
}

enum TipoCondicionalidade {
  FREQUENCIA_ESCOLAR      // >= 85%
  VACINACAO               // Cartão atualizado
  ACOMPANHAMENTO_SAUDE    // Gestantes, nutrizes
  ACOMPANHAMENTO_SOCIAL   // Atendimentos mensais
  OUTRO
}

enum PeriodicidadeVerificacao {
  MENSAL
  BIMESTRAL
  TRIMESTRAL
  SEMESTRAL
  ANUAL
}
```

#### **Rotas API:**

```typescript
// Inscrição
GET    /api/programas-sociais/disponiveis
POST   /api/programas-sociais/:programaId/inscrever
GET    /api/programas-sociais/minhas-inscricoes

// Verificação CadÚnico (Automática)
POST   /api/programas-sociais/:id/verificar-elegibilidade

// Análise Técnica
GET    /api/programas-sociais/fila-analise
POST   /api/programas-sociais/:id/analisar
POST   /api/programas-sociais/:id/solicitar-visita
POST   /api/programas-sociais/:id/registrar-visita

// Parecer Psicológico
GET    /api/programas-sociais/fila-parecer-psicologico
POST   /api/programas-sociais/:id/agendar-atendimento
POST   /api/programas-sociais/:id/registrar-parecer

// Aprovação
GET    /api/programas-sociais/fila-aprovacao
POST   /api/programas-sociais/:id/aprovar
POST   /api/programas-sociais/:id/indeferir

// Concessão
POST   /api/programas-sociais/:id/conceder
POST   /api/programas-sociais/:id/cadastrar-conta-bancaria

// Acompanhamento
POST   /api/programas-sociais/:id/registrar-acompanhamento
POST   /api/programas-sociais/:id/verificar-condicionalidades
POST   /api/programas-sociais/:id/suspender
POST   /api/programas-sociais/:id/reativar

// Pagamentos
GET    /api/programas-sociais/:id/extrato-pagamentos
POST   /api/programas-sociais/gerar-folha-pagamento
POST   /api/programas-sociais/processar-pagamentos

// Renovação
GET    /api/programas-sociais/renovacoes-pendentes
POST   /api/programas-sociais/:id/renovar
```

#### **Dashboards:**
1. **Inscrições:** Por programa, por status
2. **Fila de Análise:** Tempo médio, gargalos
3. **Benefícios Ativos:** Total, por programa, valor mensal
4. **Condicionalidades:** % de cumprimento
5. **Pagamentos:** Folha mensal, histórico
6. **Taxa de Indeferimento:** Motivos principais

**Esforço:** 5 sprints (aumentado de 3 devido ao fluxo completo)

---

### MS-16, MS-17, MS-18: Controle de Benefícios, Atendimento Psicossocial, Dashboard

**(MS-16 e MS-17 podem ser parcialmente integrados no MS-15)**

**Esforço Total:** 5 sprints (2+2+1 - alguns já integrados)

---

## SECRETARIA DE AGRICULTURA (6 Microsistemas)

### MS-19: Cadastro de Produtores Rurais
**(SEM MUDANÇAS)**

**Esforço:** 2 sprints

---

### MS-20, MS-21: Gestão de Máquinas e Empréstimos - 🆕 **COM FLUXO COMPLETO**
**Objetivo:** Empréstimo de máquinas com fluxo completo

#### 🔄 **FLUXO DE EMPRÉSTIMO DE MÁQUINA**

```
┌───────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────┐
│SOLICITAÇÃO│──>│VALIDAÇÃO │──>│  APROVAÇÃO   │──>│ VISTORIA │──>│EMPRÉSTIMO│
│ (Portal)  │   │CADASTRO  │   │   TÉCNICA    │   │ RETIRADA │   │  ATIVO   │
└───────────┘   └──────────┘   └──────────────┘   └──────────┘   └──────────┘
                                                                         │
                                                                         ▼
                                                                  ┌──────────┐
                                                                  │ VISTORIA │
                                                                  │ DEVOLUÇÃO│
                                                                  └──────────┘
```

#### **Funcionalidades Expandidas:**

**1. SOLICITAÇÃO**
- Produtor rural seleciona máquina e período
- Sistema verifica disponibilidade
- Preenche justificativa (preparo solo, plantio, colheita)
- Status: `SOLICITADO`

**2. VALIDAÇÃO CADASTRO**
- Técnico verifica:
  - Cadastro de produtor ativo
  - Propriedade rural registrada
  - Não tem pendências (devoluções atrasadas)
- Decisão:
  - ✅ Validado: Status `CADASTRO_VALIDADO`
  - ❌ Pendências: Status `CADASTRO_PENDENTE`

**3. APROVAÇÃO TÉCNICA**
- Engenheiro agrônomo analisa:
  - Máquina adequada para o serviço
  - Área compatível com a máquina
  - Período de uso razoável
- Decisão:
  - ✅ Aprovar: Status `APROVADO`
  - ❌ Indeferir: Status `INDEFERIDO`
  - 🔄 Sugerir máquina alternativa

**4. AGENDAMENTO**
- Sistema agenda data/hora de retirada
- Notifica produtor
- Status: `AGENDADO`

**5. VISTORIA DE RETIRADA**
- Produtor comparece na data agendada
- Checklist de vistoria:
  - Conferência visual (amassados, riscos)
  - Nível de combustível/óleo
  - Equipamentos de segurança
  - Fotos do estado da máquina
- Assinatura de termo de responsabilidade
- Horímetro/Odômetro inicial
- Status: `EMPRESTIMO_ATIVO`

**6. EMPRÉSTIMO ATIVO**
- Produtor usa máquina
- Sistema monitora prazo de devolução
- Envia lembretes (3 dias antes, 1 dia antes)
- Se atraso: notifica automaticamente

**7. VISTORIA DE DEVOLUÇÃO**
- Produtor devolve máquina
- Checklist de devolução:
  - Estado geral (comparar com fotos retirada)
  - Nível de combustível (deve devolver cheio)
  - Horímetro/Odômetro final
  - Cálculo de horas de uso
- Cobrança (se aplicável):
  - R$/hora ou valor fixo
  - Multa por atraso
  - Multa por danos
- Status: `DEVOLVIDO` ou `DEVOLVIDO_COM_PENDENCIA`

**8. MANUTENÇÃO (Se necessário)**
- Se dano detectado: máquina vai para manutenção
- Status da máquina: `EM_MANUTENCAO`
- Produtor é responsabilizado (se dano causado por má utilização)

#### **Novas Tabelas (EXPANDIDAS):**

```prisma
// ============================================================================
// FLUXO DE EMPRÉSTIMO DE MÁQUINAS
// ============================================================================

model SolicitacaoEmprestimoMaquina {
  id              String   @id @default(cuid())
  workflowId      String   @unique
  produtorRuralId String
  maquinaId       String

  // Período Solicitado
  dataInicio      DateTime
  dataFim         DateTime
  diasSolicitados Int      // Calculado
  horasEstimadas  Int?     // Estimativa de uso

  // Justificativa
  finalidade      FinalidadeUsoMaquina
  areaUtilizacao  String   // Propriedade/localização
  tamanhoArea     Float?   // Hectares
  justificativa   String

  // Validação Cadastro
  validadoPor     String?
  dataValidacao   DateTime?
  motivoPendencia String?

  // Aprovação Técnica
  aprovadoPor     String?  // UserID (Engenheiro Agrônomo)
  dataAprovacao   DateTime?
  parecerTecnico  String?
  maquinaAlternativaSugerida String?
  motivoIndeferimento String?

  // Agendamento
  dataRetirada    DateTime?
  horarioRetirada String?

  // Vistoria Retirada
  vistoriadoPor   String?  // UserID
  dataVistoriaRetirada DateTime?
  checklistRetirada Json?  // Array de itens vistoriados
  fotosRetirada   Json?    // Array de URLs
  odometroInicial Int?
  horimetroInicial Int?
  nivelCombustivelInicial String?
  termoAssinado   Boolean  @default(false)

  // Empréstimo
  dataInicioReal  DateTime?

  // Vistoria Devolução
  dataDevolucao   DateTime?
  vistoriaDevolucaoPor String?
  checklistDevolucao Json?
  fotosDevolucao  Json?
  odometroFinal   Int?
  horimetroFinal  Int?
  horasUsadas     Int?     // Calculado
  nivelCombustivelFinal String?
  danosDetectados Boolean  @default(false)
  descricaoDanos  String?

  // Cobrança
  valorBase       Float?
  valorHoraExtra  Float?
  multaAtraso     Float?
  multaDanos      Float?
  totalCobrado    Float?
  statusPagamento StatusPagamentoMaquina
  dataPagamento   DateTime?

  // Status
  status          EmprestimoMaquinaStatus

  // Observações
  observacoes     String?

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([produtorRuralId, status])
  @@index([maquinaId, dataInicio, dataFim])
}

enum FinalidadeUsoMaquina {
  PREPARO_SOLO
  PLANTIO
  PULVERIZACAO
  COLHEITA
  TRANSPORTE
  OUTRO
}

enum EmprestimoMaquinaStatus {
  SOLICITADO
  CADASTRO_PENDENTE
  CADASTRO_VALIDADO
  AGUARDANDO_APROVACAO
  INDEFERIDO
  APROVADO
  AGENDADO
  AGUARDANDO_RETIRADA
  EMPRESTIMO_ATIVO
  ATRASADO
  AGUARDANDO_DEVOLUCAO
  DEVOLVIDO
  DEVOLVIDO_COM_PENDENCIA
  FINALIZADO
  CANCELADO
}

enum StatusPagamentoMaquina {
  NAO_APLICAVEL
  PENDENTE
  PAGO
  ISENTO
}

model MaquinaAgricola {
  id              String   @id @default(cuid())
  tipo            TipoMaquinaAgricola
  marca           String
  modelo          String
  ano             Int?
  placa           String?  @unique
  patrimonio      String   @unique
  capacidade      String?  // Ex: "100 HP", "20 hectares/dia"

  // Controle de Uso
  odometro        Int      @default(0)
  horimetro       Int      @default(0)

  // Manutenção
  ultimaManutencao DateTime?
  proximaManutencao DateTime?
  historicoManutencao Json? // Array de manutenções

  // Disponibilidade
  status          StatusMaquina
  disponivel      Boolean  @default(true)
  motivoIndisponibilidade String?

  // Custos
  valorHora       Float?   // Custo por hora de uso
  valorDiaria     Float?   // Custo por dia (alternativa)

  // Segurança
  certificados    Json?    // Certificados/inspeções obrigatórias

  // Observações
  observacoes     String?

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([tipo, status])
}

enum TipoMaquinaAgricola {
  TRATOR
  GRADE_ARADORA
  PLANTADEIRA
  PULVERIZADOR
  COLHEITADEIRA
  CARRETA
  ROÇADEIRA
  DISTRIBU IDOR_CALCARIO
  OUTRO
}

enum StatusMaquina {
  DISPONIVEL
  EMPRESTADA
  MANUTENCAO
  QUEBRADA
  INATIVA
}

model ProdutorRural {
  id              String   @id @default(cuid())
  citizenId       String   @unique
  cpf             String   @unique
  nome            String

  // Propriedade
  nomePropriedade String?
  endereco        Json
  areaTotal       Float?   // Hectares
  georreferenciamento Json? // {lat, lng, polygon}

  // Produção
  tiposProducao   Json?    // Array de tipos (café, milho, etc)

  // Cadastros
  car             String?  // Cadastro Ambiental Rural
  dap             String?  // Declaração de Aptidão ao Pronaf

  // Histórico
  emprestimosRealizados Int @default(0)
  pendencias      Boolean  @default(false)
  motivoPendencia String?

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([cpf])
}
```

#### **Rotas API:**

```typescript
// Solicitação
POST   /api/maquinas/solicitar-emprestimo
GET    /api/maquinas/minhas-solicitacoes
GET    /api/maquinas/disponiveis

// Validação
GET    /api/maquinas/fila-validacao
POST   /api/maquinas/:id/validar-cadastro

// Aprovação
GET    /api/maquinas/fila-aprovacao
POST   /api/maquinas/:id/aprovar
POST   /api/maquinas/:id/indeferir
POST   /api/maquinas/:id/sugerir-alternativa

// Agendamento
POST   /api/maquinas/:id/agendar-retirada

// Vistoria Retirada
POST   /api/maquinas/:id/vistoria-retirada
POST   /api/maquinas/:id/upload-fotos-retirada
POST   /api/maquinas/:id/assinar-termo
POST   /api/maquinas/:id/liberar-maquina

// Empréstimo Ativo
GET    /api/maquinas/emprestimos-ativos
POST   /api/maquinas/:id/registrar-ocorrencia

// Devolução
POST   /api/maquinas/:id/vistoria-devolucao
POST   /api/maquinas/:id/calcular-cobranca
POST   /api/maquinas/:id/finalizar-emprestimo

// Máquinas
GET    /api/maquinas
POST   /api/maquinas
GET    /api/maquinas/:id/historico-uso
POST   /api/maquinas/:id/registrar-manutencao

// Produtores
GET    /api/produtores-rurais
POST   /api/produtores-rurais
GET    /api/produtores-rurais/:id/historico-emprestimos
```

#### **Dashboards:**
1. **Disponibilidade:** Máquinas disponíveis vs Emprestadas
2. **Fila de Solicitações:** Tempo médio de aprovação
3. **Utilização:** Horas de uso por máquina/mês
4. **Manutenção:** Máquinas em manutenção, custos
5. **Atrasos:** Devoluções atrasadas, multas aplicadas
6. **Produtores:** Mais ativos, pendências

**Esforço:** 5 sprints (MS-20 + MS-21 combinados com fluxo completo)

---

### MS-22, MS-23, MS-24: Assistência Técnica, Controle de Produção, Feiras

**(SEM MUDANÇAS - conforme proposta original)**

**Esforço Total:** 7 sprints (3+2+2)

---

## SECRETARIA DE CULTURA (6 Microsistemas)

### MS-25, MS-26: Gestão de Espaços e Reservas - 🆕 **COM FLUXO SIMPLIFICADO**

#### 🔄 **FLUXO DE RESERVA DE ESPAÇO**

```
┌───────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│SOLICITAÇÃO│──>│ ANÁLISE  │──>│ APROVAÇÃO│──>│RESERVADO │
│ (Portal)  │   │ TÉCNICA  │   │  (Gestor)│   │ (Ativo)  │
└───────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Funcionalidades:** Solicitação → Validação de disponibilidade → Análise de adequação → Aprovação → Uso → Vistoria pós-evento

**Esforço:** 4 sprints (MS-25 + MS-26 combinados com fluxo)

---

### MS-27 a MS-30: Artistas, Eventos, Agenda, Editais

**(MS-30 Edital de Fomento deve ter fluxo completo similar ao Licenciamento)**

**Esforço Total:** 9 sprints (2+3+2+4 com MS-30 enriquecido)

---

## SECRETARIA DE ESPORTES (6 Microsistemas)

### MS-31, MS-32: Gestão de Equipamentos e Reservas

**(Similar à Cultura - fluxo de reserva)**

**Esforço:** 4 sprints

---

### MS-33 a MS-36: Atletas, Campeonatos, Escolinha, Dashboard

**(SEM MUDANÇAS)**

**Esforço Total:** 7 sprints

---

## SECRETARIA DE HABITAÇÃO (6 Microsistemas)

### MS-37, MS-38, MS-39: Conjuntos, Inscrição, Distribuição - 🆕 **COM FLUXO COMPLETO**

#### 🔄 **FLUXO HABITACIONAL**

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│INSCRIÇÃO │──>│VALIDAÇÃO │──>│PONTUAÇÃO │──>│CHAMAMENTO│──>│ ENTREGA  │
│ (Portal) │   │   DOC    │   │  (Auto)  │   │(Presencial)│   │ CHAVES   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Funcionalidades:** Inscrição em programas → Validação documental → Pontuação automática (renda, composição, situação moradia) → Fila de espera → Chamamento → Seleção de unidade → Assinatura de contrato → Entrega de chaves

**Esforço:** 8 sprints (MS-37+MS-38+MS-39 combinados com fluxo completo)

---

### MS-40, MS-41, MS-42: Obras, Regularização, Dashboard

**(MS-41 Regularização deve ter fluxo completo)**

**Esforço Total:** 7 sprints

---

## SECRETARIA DE MEIO AMBIENTE (6 Microsistemas)

### MS-43 a MS-45: Arborização, Parques, Coleta Seletiva

**(SEM MUDANÇAS)**

**Esforço:** 8 sprints

---

### MS-46: Licenciamento Ambiental - 🆕 **COM FLUXO COMPLETO**

#### 🔄 **FLUXO LICENCIAMENTO AMBIENTAL**

```
┌───────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│SOLICITAÇÃO│──>│ ANÁLISE  │──>│ VISTORIA │──>│  PARECER │──>│  LICENÇA │
│ (Portal)  │   │ TÉCNICA  │   │ (Campo)  │   │  FINAL   │   │ EMITIDA  │
└───────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Funcionalidades:** Solicitação → Protocolo → Análise documental → Vistoria técnica in loco → Parecer ambiental → Aprovação → Emissão de licença → Renovação periódica

**Esforço:** 5 sprints (aumentado de 4)

---

### MS-47, MS-48: Programas Ambientais, Denúncias

**(MS-48 deve ter fluxo: Denúncia → Triagem → Atribuição fiscal → Vistoria → Laudo → Autuação)**

**Esforço Total:** 5 sprints

---

## SECRETARIA DE OBRAS PÚBLICAS (6 Microsistemas)

### MS-49, MS-50: Tipos de Obra e Solicitações - 🆕 **COM FLUXO COMPLETO**

#### 🔄 **FLUXO TAPA-BURACO**

```
┌───────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│SOLICITAÇÃO│──>│ TRIAGEM  │──>│ VISTORIA │──>│ EXECUÇÃO │──>│VERIFICAÇÃO│
│(Protocolo)│   │(Prioriza)│   │ TÉCNICA  │   │  (Equipe)│   │ (Antes/   │
└───────────┘   └──────────┘   └──────────┘   └──────────┘   │  Depois)  │
                                                               └──────────┘
```

**Funcionalidades:** Cidadão solicita via protocolo → Triagem automática (prioridade por gravidade/localização) → Vistoria técnica (tamanho, materiais) → Ordem de serviço → Execução → Registro fotográfico antes/depois → Finalização

**Esforço:** 4 sprints (MS-49 + MS-50 combinados)

---

### MS-51 a MS-54: Obras, Equipamentos, Iluminação, Dashboard

**(SEM MUDANÇAS)**

**Esforço Total:** 8 sprints

---

## SECRETARIA DE SEGURANÇA PÚBLICA (6 Microsistemas)

### MS-55, MS-56: Viaturas e Ocorrências - 🆕 **COM FLUXO COMPLETO**

#### 🔄 **FLUXO DE OCORRÊNCIA**

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ REGISTRO │──>│CLASSIFICAÇÃO│──>│ DESPACHO │──>│ATENDIMENTO│──>│RESOLUÇÃO │
│ (Portal/ │   │(Gravidade)│   │  (Viatura│   │  (Campo)  │   │(Encerrado)│
│  Telefone)   │           │   │   Disp.) │   │           │   │           │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Funcionalidades:** Registro de ocorrência → Classificação de gravidade → Despacho de viatura disponível → Atendimento no local → Registro de ações → Encaminhamentos (delegacia, hospital) → Encerramento

**Esforço:** 4 sprints (MS-55 + MS-56 combinados)

---

### MS-57 a MS-60: Patrulhamento, Videomonitoramento, Guarda, Dashboard

**(SEM MUDANÇAS)**

**Esforço Total:** 8 sprints

---

## SECRETARIA DE TURISMO (6 Microsistemas)

### MS-61 a MS-66: Estabelecimentos, Guias, Pontos, Eventos, Portal, Dashboard

**(SEM MUDANÇAS - sem necessidade de fluxos complexos)**

**Esforço Total:** 14 sprints

---

## SECRETARIA DE PLANEJAMENTO URBANO (6 Microsistemas)

### MS-67, MS-68: Zoneamento e Licenciamento Obras - 🆕 **COM FLUXO COMPLETO**

#### 🔄 **FLUXO LICENCIAMENTO OBRAS PRIVADAS**

```
┌──────────┐   ┌──────────┐   ┌──────────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│PROTOCOLO │──>│ ANÁLISE  │──>│   ANÁLISE    │──>│ VISTORIA │──>│  ALVARÁ  │──>│ HABITE-SE│
│ (Docs)   │   │DOCUMENTAL│   │ URBANÍSTICA  │   │  PRÉVIA  │   │ EMITIDO  │   │  (Obra   │
└──────────┘   └──────────┘   │(Zoneamento)  │   │           │   │          │   │Concluída)│
                              └──────────────┘   └──────────┘   └──────────┘   └──────────┘
```

**Funcionalidades:** Protocolamento com projetos → Análise documental → Análise de conformidade urbanística (zoneamento, recuos, taxa ocupação) → Análise técnica (engenharia) → Vistoria prévia (terreno) → Aprovação → Emissão de alvará → Acompanhamento de obra → Vistoria final → Habite-se

**Esforço:** 6 sprints (aumentado de 4 - MS-68 com fluxo completo)

---

### MS-69 a MS-72: Cadastro Imobiliário, Loteamentos, Plano Diretor, Dashboard

**(SEM MUDANÇAS)**

**Esforço Total:** 9 sprints

---

## SECRETARIA DE SERVIÇOS PÚBLICOS (6 Microsistemas)

### MS-73 a MS-78: Coleta Lixo, Manutenção, Poda, Cemitérios, Feiras, Dashboard

**(MS-75 Poda deve ter fluxo: Solicitação → Análise técnica (avaliar necessidade) → Agendamento → Execução → Verificação)**

**Esforço Total:** 14 sprints

---

## ROADMAP DE IMPLEMENTAÇÃO ENRIQUECIDO

### FASE 0: Fundação (Sprints 1-5) - PRIORIDADE CRÍTICA
- [ ] **MS-00: Gestor de Cadastros Base** (3 sprints)
- [ ] **Engine de Workflow Transversal** (2 sprints)
- [ ] Completar seeds de todas as 25 tabelas
- [ ] Implementar tipo `enum` nos formSchemas
- [ ] Componente `EnumField` no frontend

**Entrega:** Base para todos os microsistemas + Engine de fluxos

---

### FASE 1: Saúde (Sprints 6-16) - 11 sprints
- [ ] MS-01: Gestão de Unidades de Saúde (3)
- [ ] MS-02: Agenda Médica Inteligente (4)
- [ ] **MS-03: Prontuário Eletrônico COM FLUXO COMPLETO** (6 - MS-04 integrado)
- [ ] MS-05: Gestão de Medicamentos (4)
- [ ] **MS-06: TFD COM FLUXO COMPLETO** (7)

**Total FASE 1:** 24 sprints (aumentou de 19)

**Entrega:** Saúde 100% digitalizada com fluxos completos

---

### FASE 2: Educação (Sprints 17-29) - 13 sprints
- [ ] MS-07: Gestão de Unidades Educacionais (2)
- [ ] **MS-08: Sistema de Matrículas COM FLUXO** (5)
- [ ] MS-09: Gestão de Transporte Escolar (4)
- [ ] MS-10: Gestão de Merenda Escolar (3)
- [ ] MS-11: Portal do Professor (3)
- [ ] MS-12: Portal do Aluno/Pais (3)

**Total FASE 2:** 20 sprints (aumentou de 17)

**Entrega:** Educação 100% digitalizada

---

### FASE 3: Assistência Social (Sprints 30-42) - 13 sprints
- [ ] MS-13: Gestão de CRAS/CREAS (2)
- [ ] **MS-14: CadÚnico COM FLUXO COMPLETO** (6)
- [ ] **MS-15: Gestão de Programas Sociais COM FLUXO** (5)
- [ ] MS-16: Controle de Benefícios (2 - integrado ao MS-15)
- [ ] MS-17: Atendimento Psicossocial (2 - integrado ao MS-15)
- [ ] MS-18: Dashboard de Vulnerabilidade (1)

**Total FASE 3:** 18 sprints (aumentou de 15)

**Entrega:** CadÚnico e programas sociais automatizados

---

### FASE 4: Agricultura e Cultura (Sprints 43-61) - 19 sprints
**Agricultura:**
- [ ] MS-19: Cadastro de Produtores Rurais (2)
- [ ] **MS-20+MS-21: Máquinas e Empréstimos COM FLUXO** (5)
- [ ] MS-22: Assistência Técnica Rural (3)
- [ ] MS-23: Controle de Produção (2)
- [ ] MS-24: Feiras e Mercados (2)

**Cultura:**
- [ ] **MS-25+MS-26: Espaços e Reservas COM FLUXO** (4)
- [ ] MS-27: Cadastro de Artistas (2)
- [ ] MS-28: Gestão de Eventos (3)
- [ ] MS-29: Agenda Cultural (2)
- [ ] MS-30: Edital de Fomento (4)

**Total FASE 4:** 29 sprints (aumentou de 25)

---

### FASE 5: Esportes e Habitação (Sprints 62-84) - 23 sprints
**Esportes:**
- [ ] MS-31+MS-32: Equipamentos e Reservas (4)
- [ ] MS-33: Cadastro de Atletas (2)
- [ ] MS-34: Gestão de Campeonatos (4)
- [ ] MS-35: Escolinha de Esportes (3)
- [ ] MS-36: Dashboard Esportivo (2)

**Habitação:**
- [ ] **MS-37+MS-38+MS-39: Conjuntos, Inscrição, Distribuição COM FLUXO** (8)
- [ ] MS-40: Gestão de Obras Habitacionais (3)
- [ ] MS-41: Regularização Fundiária COM FLUXO (4)
- [ ] MS-42: Dashboard Habitacional (2)

**Total FASE 5:** 32 sprints (aumentou de 27)

---

### FASE 6: Meio Ambiente e Obras (Sprints 85-110) - 26 sprints
**Meio Ambiente:**
- [ ] MS-43: Gestão de Arborização (3)
- [ ] MS-44: Gestão de Parques (2)
- [ ] MS-45: Coleta Seletiva (3)
- [ ] **MS-46: Licenciamento Ambiental COM FLUXO** (5)
- [ ] MS-47: Programas Ambientais (2)
- [ ] **MS-48: Denúncias COM FLUXO** (3)

**Obras Públicas:**
- [ ] **MS-49+MS-50: Tipos e Solicitações COM FLUXO** (4)
- [ ] MS-51: Gestão de Obras (4)
- [ ] MS-52: Controle de Equipamentos (3)
- [ ] MS-53: Iluminação Pública (3)
- [ ] MS-54: Dashboard de Demandas (2)

**Total FASE 6:** 34 sprints (aumentou de 30)

---

### FASE 7: Segurança e Turismo (Sprints 111-136) - 26 sprints
**Segurança:**
- [ ] **MS-55+MS-56: Viaturas e Ocorrências COM FLUXO** (4)
- [ ] MS-57: Gestão de Patrulhamento (3)
- [ ] MS-58: Central de Videomonitoramento (4)
- [ ] MS-59: Gestão de Guarda (3)
- [ ] MS-60: Dashboard de Segurança (2)

**Turismo:**
- [ ] MS-61: Cadastro de Estabelecimentos (2)
- [ ] MS-62: Registro de Guias (2)
- [ ] MS-63: Gestão de Pontos Turísticos (3)
- [ ] MS-64: Agenda de Eventos Turísticos (2)
- [ ] MS-65: Portal do Turista (3)
- [ ] MS-66: Dashboard Turístico (2)

**Total FASE 7:** 30 sprints (aumentou de 28)

---

### FASE 8: Planejamento e Serviços (Sprints 137-167) - 31 sprints
**Planejamento Urbano:**
- [ ] MS-67: Gestão de Zoneamento (3)
- [ ] **MS-68: Licenciamento Obras COM FLUXO COMPLETO** (6)
- [ ] MS-69: Cadastro Imobiliário (4)
- [ ] MS-70: Gestão de Loteamentos (3)
- [ ] MS-71: Plano Diretor Digital (3)
- [ ] MS-72: Dashboard Urbanístico (2)

**Serviços Públicos:**
- [ ] MS-73: Gestão de Coleta de Lixo (3)
- [ ] MS-74: Manutenção de Logradouros (3)
- [ ] MS-75: Poda de Árvores COM FLUXO (2)
- [ ] MS-76: Cemitérios Municipais (3)
- [ ] MS-77: Feiras Livres (2)
- [ ] MS-78: Dashboard de Serviços (2)

**Total FASE 8:** 36 sprints (aumentou de 32)

---

## ESTIMATIVA TOTAL ENRIQUECIDA

### 📊 **Comparação Original vs Enriquecida:**

| Métrica | Original | Enriquecida | Diferença |
|---------|----------|-------------|-----------|
| **Microsistemas** | 78 | 78 | 0 |
| **Sprints Totais** | ~220 | **~228** | +8 sprints (+4%) |
| **Com 1 time** | ~8,5 anos | ~8,8 anos | +3 meses |
| **Com 4 times** | ~2 anos | ~2,1 anos | +1 mês |
| **Com 8 times** | ~1 ano | ~1,05 anos | +15 dias |

### 🎯 **Microsistemas com Fluxos Completos (18):**

1. ✅ MS-03: Prontuário Eletrônico (Recepção → Triagem → Consulta → Farmácia)
2. ✅ MS-06: TFD (Solicitação → Análise → Regulação → Aprovação → Viagem)
3. ✅ MS-08: Matrículas (Inscrição → Validação → Distribuição → Confirmação)
4. ✅ MS-14: CadÚnico (Agendamento → Entrevista → Validação → Análise → Cadastro)
5. ✅ MS-15: Programas Sociais (Inscrição → Verificação → Análise → Parecer → Concessão)
6. ✅ MS-20+21: Empréstimo Máquinas (Solicitação → Validação → Aprovação → Vistoria → Empréstimo)
7. ✅ MS-25+26: Reservas Culturais (Solicitação → Análise → Aprovação → Uso)
8. ✅ MS-31+32: Reservas Esportivas (Similar à Cultura)
9. ✅ MS-37+38+39: Habitação (Inscrição → Validação → Pontuação → Chamamento → Entrega)
10. ✅ MS-41: Regularização Fundiária (Cadastro → Topografia → Análise → Regularização)
11. ✅ MS-46: Licenciamento Ambiental (Solicitação → Análise → Vistoria → Parecer → Licença)
12. ✅ MS-48: Denúncias Ambientais (Denúncia → Triagem → Atribuição → Vistoria → Autuação)
13. ✅ MS-49+50: Tapa-Buraco (Solicitação → Triagem → Vistoria → Execução → Verificação)
14. ✅ MS-55+56: Ocorrências Segurança (Registro → Classificação → Despacho → Atendimento)
15. ✅ MS-68: Licenciamento Obras (Protocolo → Análise Doc → Análise Urbanística → Vistoria → Alvará → Habite-se)
16. ✅ MS-75: Poda de Árvores (Solicitação → Análise → Agendamento → Execução)

---

## CONCLUSÃO ENRIQUECIDA

### ✅ **Viabilidade:**
A proposta enriquecida é **ALTAMENTE VIÁVEL** por:

1. ✅ Engine de workflow **transversal e reutilizável**
2. ✅ Acréscimo de apenas **8 sprints** (4%)
3. ✅ **Rastreabilidade total** em processos críticos
4. ✅ **Redução de retrabalho** (fluxos padronizados)
5. ✅ **Experiência do usuário** melhorada (transparência)
6. ✅ **Gestão otimizada** (dashboards com SLA)

### 🎯 **Benefícios dos Fluxos:**

1. **Cidadão:**
   - Transparência: sabe em que etapa está seu pedido
   - Rastreabilidade: histórico completo
   - Previsibilidade: tempo estimado de conclusão

2. **Servidor:**
   - Clareza: sabe exatamente o que fazer em cada etapa
   - Priorização: filas organizadas automaticamente
   - Eficiência: menos tempo procurando informações

3. **Gestor:**
   - Visibilidade: dashboards de gargalos
   - SLA: monitoramento de prazos
   - Métricas: produtividade por setor/profissional
   - Auditoria: histórico completo de decisões

### 🚀 **PRIORIDADE IMEDIATA:**

1. **Implementar MS-00** (Gestor de Cadastros Base)
2. **Implementar Engine de Workflow** (transversal)
3. **Pilotos:**
   - MS-03 (Prontuário Médico) - Saúde
   - MS-08 (Matrículas) - Educação
   - MS-50 (Tapa-Buraco) - Obras
4. **Refinar e replicar** fluxos para outros microsistemas

### 📋 **PRÓXIMOS PASSOS:**

1. ✅ Aprovação da proposta enriquecida
2. ✅ Priorização de microsistemas piloto
3. ✅ Implementação da engine de workflow
4. ✅ Desenvolvimento dos 3 pilotos
5. ✅ Avaliação e ajustes
6. ✅ Rollout gradual para outros microsistemas

---

**Documento gerado em:** 2025-01-17
**Versão:** 2.0 ENRIQUECIDA
**Status:** Proposta Expandida com Fluxos Completos
**Autor:** Claude (IA)
**Aprovação:** Aguardando cliente

---

## APÊNDICE A: EXEMPLOS DE INTERFACE

### Exemplo 1: Fila de Triagem (MS-03)

```typescript
// Tela da enfermeira - Fila de triagem

┌─────────────────────────────────────────────────────────────┐
│  TRIAGEM DE ENFERMAGEM - UBS Central                        │
├─────────────────────────────────────────────────────────────┤
│  Fila de Espera: 8 pacientes                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ SENHA 015 - João Silva (45 anos)                     │  │
│  │ Check-in: 08:15  |  Tempo espera: 12 min             │  │
│  │ Queixa: Dor no peito                                 │  │
│  │ [CHAMAR PRÓXIMO]                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ SENHA 016 - Maria Santos (32 anos) 👶 GESTANTE       │  │
│  │ Check-in: 08:20  |  Tempo espera: 7 min              │  │
│  │ Queixa: Enjoo matinal                                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Ver Fila Completa (6 restantes)]                         │
└─────────────────────────────────────────────────────────────┘
```

### Exemplo 2: Status de Solicitação TFD (MS-06)

```typescript
// Portal do cidadão - Acompanhamento TFD

┌─────────────────────────────────────────────────────────────┐
│  Minha Solicitação TFD - Protocolo #2025-000456            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ● SOLICITAÇÃO ENVIADA          ✅ Concluído - 10/01/2025  │
│  ● ANÁLISE DOCUMENTAL           ✅ Aprovado  - 12/01/2025  │
│  ● REGULAÇÃO MÉDICA             ✅ Aprovado  - 15/01/2025  │
│  ● APROVAÇÃO GESTÃO             ⏳ Em andamento            │
│  ● AGENDAMENTO CONSULTA         ⏸️ Aguardando               │
│  ● VIAGEM                       ⏸️ Aguardando               │
│                                                              │
│  📍 Status Atual: Aguardando aprovação do coordenador       │
│  📅 Última atualização: 16/01/2025 às 14:30                │
│                                                              │
│  ℹ️ Estimativa: Resposta em até 3 dias úteis                │
│                                                              │
│  [Ver Histórico Completo] [Enviar Mensagem]                │
└─────────────────────────────────────────────────────────────┘
```

---

## APÊNDICE B: MÉTRICAS DE SUCESSO

### KPIs por Microsistema com Fluxo:

#### MS-03 (Prontuário Médico):
- ⏱️ Tempo médio de espera por etapa
- 📊 Taxa de ocupação de consultórios
- 🎯 % atendimentos dentro do SLA (Manchester)
- 📈 Produtividade: atendimentos/profissional/dia

#### MS-06 (TFD):
- ⏱️ Tempo médio do protocolo até viagem
- 📊 Taxa de indeferimento por motivo
- 💰 Custo médio por viagem
- 🎯 % de solicitações atendidas em 30 dias

#### MS-08 (Matrículas):
- ⏱️ Tempo médio de confirmação de vaga
- 📊 Taxa de vagas ociosas por escola
- 🎯 % de alocação na escola de 1ª preferência
- 📈 Taxa de efetivação de matrícula

#### MS-14 (CadÚnico):
- ⏱️ Tempo médio de cadastro completo
- 📊 Taxa de indeferimento por motivo
- 🎯 % de cadastros atualizados no prazo
- 📈 Famílias cadastradas/mês

#### MS-15 (Programas Sociais):
- ⏱️ Tempo médio de concessão
- 📊 Taxa de cumprimento de condicionalidades
- 💰 Valor médio de benefício/família
- 🎯 % de renovações automáticas

---

**FIM DA PROPOSTA ENRIQUECIDA**