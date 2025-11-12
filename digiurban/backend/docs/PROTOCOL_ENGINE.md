# 📋 MOTOR DE PROTOCOLOS - Documentação Técnica

## 📚 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Fluxo Completo](#fluxo-completo)
4. [Banco de Dados](#banco-de-dados)
5. [Serviços](#serviços)
6. [Geração de Números](#geração-de-números)
7. [Sistemas Auxiliares](#sistemas-auxiliares)
8. [API Endpoints](#api-endpoints)
9. [Workflows](#workflows)
10. [Integração com Módulos](#integração-com-módulos)
11. [Performance e Escalabilidade](#performance-e-escalabilidade)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O **Motor de Protocolos** é o núcleo do sistema DigiUrban, responsável por:

- ✅ Criar e gerenciar protocolos de atendimento ao cidadão
- ✅ Rotear dados para módulos específicos (Saúde, Educação, etc.)
- ✅ Aplicar workflows automáticos
- ✅ Gerenciar SLA (prazos de atendimento)
- ✅ Controlar documentos, pendências e interações
- ✅ Registrar histórico completo de ações

### Estatísticas

- **108 serviços** cadastrados em 13 secretarias
- **106 entity handlers** implementados
- **111 workflows** configurados
- **95 módulos COM_DADOS** (com formulários)
- **12 módulos INFORMATIVOS** (sem dados estruturados)

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                     CIDADÃO / PORTAL                      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API - ROTAS DE PROTOCOLOS                   │
│  POST /api/protocols-simplified (Criar)                  │
│  GET  /api/protocols-simplified (Listar)                 │
│  PUT  /api/protocols-simplified/:id/approve (Aprovar)    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           PROTOCOL-MODULE.SERVICE                        │
│  • createProtocolWithModule()                            │
│  • approveProtocol() / rejectProtocol()                  │
│  • getPendingProtocolsByModule()                         │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
┌──────────────┐ ┌────────┐ ┌──────────────┐
│ PROTOCOL     │ │ ENTITY │ │ WORKFLOW     │
│ SIMPLIFIED   │ │ HANDLER│ │ SERVICE      │
│ SERVICE      │ │        │ │              │
└──────────────┘ └────────┘ └──────────────┘
         │           │           │
         └───────────┼───────────┘
                     ▼
         ┌───────────────────────┐
         │  BANCO DE DADOS       │
         │  • ProtocolSimplified │
         │  • Módulos Específicos│
         │  • ProtocolStage      │
         │  • ProtocolSLA        │
         └───────────────────────┘
```

---

## 🔄 Fluxo Completo

### 1️⃣ **FASE 1: Criação do Protocolo**

```typescript
// Cidadão acessa portal e solicita serviço
POST /api/protocols-simplified
{
  serviceId: "srv_123",
  citizenData: { cpf: "12345678900", name: "João Silva" },
  formData: { ... } // Dados específicos do serviço
}

↓

// Sistema verifica/cria cidadão
Citizen.findOrCreate(cpf)

↓

// Gera número único com proteção contra concorrência
generateProtocolNumberSafe() → "PROT-20251107-00001"

↓

// Cria registro do protocolo
ProtocolSimplified.create({
  number: "PROT-20251107-00001",
  citizenId, serviceId, departmentId,
  status: "VINCULADO",
  moduleType: "ATENDIMENTOS_SAUDE",
  customData: formData
})

↓

// Se serviço COM_DADOS: roteia para módulo
entityHandlers['HealthAttendance']({
  protocolId, protocolNumber, formData
}) → Cria HealthAttendance

↓

// Aplica workflow automático
applyWorkflowToProtocol() → Cria ProtocolStage[]

↓

// Cria SLA automático
createSLA({ protocolId, workingDays: 10 })

↓

// Registra no histórico
ProtocolHistorySimplified.create({
  action: "CRIADO",
  newStatus: "VINCULADO"
})
```

### 2️⃣ **FASE 2: Tramitação**

```typescript
// Servidor visualiza protocolos pendentes
GET /api/protocols-simplified/module/ATENDIMENTOS_SAUDE/pending

↓

// Servidor atribui protocolo para si
PATCH /api/protocols-simplified/:id/assign
{ assignedUserId: "user_123" }

↓

// Servidor executa etapas do workflow
PUT /api/protocol-stages/:stageId/start
PUT /api/protocol-stages/:stageId/complete

↓

// Solicita documentos ao cidadão
POST /api/protocol-documents
{ protocolId, documentType: "RG_CPF", isRequired: true }

↓

// Cria pendências
POST /api/protocol-pendings
{ protocolId, type: "DOCUMENT", title: "Enviar RG" }

↓

// Adiciona interações
POST /api/protocol-interactions
{ protocolId, type: "MESSAGE", message: "Aguardando..." }

↓

// SLA monitora prazo automaticamente
updateSLAStatus() → Verifica se está em atraso
```

### 3️⃣ **FASE 3: Finalização**

```typescript
// Gerente aprova o protocolo
PUT /api/protocols-simplified/:id/approve
{ comment: "Atendimento concluído com sucesso" }

↓

// Sistema atualiza status
ProtocolSimplified.update({
  status: "CONCLUIDO",
  concludedAt: new Date()
})

↓

// Ativa entidade do módulo
activateModuleEntity() → HealthAttendance.status = "COMPLETED"

↓

// Finaliza SLA
completeSLA() → Calcula se houve atraso

↓

// Cidadão avalia serviço
POST /api/protocols-simplified/:id/evaluate
{ rating: 5, comment: "Excelente atendimento" }
```

---

## 🗄️ Banco de Dados

### Modelo Central: `ProtocolSimplified`

```prisma
model ProtocolSimplified {
  id          String   @id @default(cuid())
  number      String   @unique // PROT-20251107-00001
  title       String
  description String?
  status      ProtocolStatus // VINCULADO, EM_ANDAMENTO, CONCLUIDO, CANCELADO
  priority    Int      @default(3)

  // Relacionamentos principais
  citizenId    String
  serviceId    String
  departmentId String

  // Dados capturados (se COM_DADOS)
  customData Json?
  moduleType String? // ATENDIMENTOS_SAUDE, MATRICULA_ALUNO, etc

  // Geolocalização
  latitude  Float?
  longitude Float?
  address   String?

  // Gestão
  assignedUserId String?
  createdById    String?

  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  dueDate     DateTime?
  concludedAt DateTime?

  // Relacionamentos 1:N
  history       ProtocolHistorySimplified[]
  evaluations   ProtocolEvaluationSimplified[]
  interactions  ProtocolInteraction[]
  documentFiles ProtocolDocument[]
  pendings      ProtocolPending[]
  stages        ProtocolStage[]
  sla           ProtocolSLA? // 1:1

  @@map("protocols_simplified")
}
```

### Status do Protocolo

```typescript
enum ProtocolStatus {
  VINCULADO    // Criado, aguardando atribuição
  EM_ANDAMENTO // Em tramitação
  CONCLUIDO    // Finalizado com sucesso
  CANCELADO    // Cancelado/rejeitado
}
```

### Integridade Referencial

✅ **Todos os relacionamentos** usam `onDelete: Cascade`:
- Ao deletar um protocolo, **todos os dados relacionados** são removidos automaticamente
- Garante consistência do banco de dados
- Evita dados órfãos

---

## 🔧 Serviços

### 1. `protocol-simplified.service.ts`

**Serviço principal** para operações básicas de protocolos.

**Métodos**:

```typescript
class ProtocolServiceSimplified {
  // Criar protocolo simples (sem módulo)
  async createProtocol(data: CreateProtocolInput)

  // Atualizar status com histórico
  async updateStatus(input: UpdateProtocolStatusInput)

  // Atribuir a servidor
  async assignProtocol(protocolId: string, assignedUserId: string)

  // Adicionar comentário
  async addComment(protocolId: string, comment: string)

  // Buscar por número
  async findByNumber(number: string)

  // Listar por cidadão
  async listByCitizen(citizenId: string)

  // Listar por departamento
  async listByDepartment(departmentId: string, filters?: ProtocolFilters)

  // Listar por módulo
  async listByModule(departmentId: string, moduleType: string)

  // Avaliar protocolo
  async evaluateProtocol(protocolId: string, rating: number, comment?: string)

  // Obter histórico
  async getHistory(protocolId: string)

  // Estatísticas por departamento
  async getDepartmentStats(departmentId: string, startDate?: Date, endDate?: Date)
}
```

### 2. `protocol-module.service.ts`

**Serviço de integração** com módulos específicos.

**Métodos**:

```typescript
class ProtocolModuleService {
  // Criar protocolo + entidade do módulo em transação
  async createProtocolWithModule(input: CreateProtocolWithModuleInput)

  // Aprovar protocolo (ativa entidade do módulo)
  async approveProtocol(input: ApproveProtocolInput)

  // Rejeitar protocolo
  async rejectProtocol(input: RejectProtocolInput)

  // Buscar protocolos pendentes por módulo
  async getPendingProtocolsByModule(moduleType: string, page: number, limit: number)
}
```

### 3. `protocol-number-generator-safe.ts` ✨ **NOVO**

**Gerador de números** com proteção contra concorrência.

**Métodos**:

```typescript
// Geração com lock pessimista (recomendado)
async function generateProtocolNumberSafe(): Promise<string>

// Geração com retry automático (alternativa)
async function generateProtocolNumberWithRetry(maxRetries: number = 3): Promise<string>

// Validar formato
function isValidProtocolNumber(protocolNumber: string): boolean

// Extrair data
function extractDateFromProtocol(protocolNumber: string): Date | null
```

---

## 🔢 Geração de Números

### Formato

```
PROT-YYYYMMDD-XXXXX
└─┬─┘└───┬───┘└──┬─┘
  │      │       └── Sequência (00001-99999)
  │      └────────── Data (20251107)
  └───────────────── Prefixo fixo
```

**Exemplos**:
- `PROT-20251107-00001` - Primeiro protocolo de 07/11/2025
- `PROT-20251107-00234` - Protocolo 234 do dia
- `PROT-20251108-00001` - Primeiro protocolo do dia seguinte (sequência reinicia)

### Proteção Contra Concorrência ✨

#### ❌ Problema (versão antiga)

```typescript
// RACE CONDITION POSSÍVEL:
// 1. Request A busca último: 00001
// 2. Request B busca último: 00001 (ainda não foi criado)
// 3. Request A cria: 00002 ✅
// 4. Request B cria: 00002 ❌ ERRO: duplicate key
```

#### ✅ Solução (versão nova)

```typescript
// LOCK PESSIMISTA:
await prisma.$transaction(async (tx) => {
  // FOR UPDATE: bloqueia registros durante a leitura
  const lastProtocol = await tx.$queryRaw`
    SELECT number FROM protocols_simplified
    WHERE number LIKE 'PROT-20251107%'
    ORDER BY number DESC
    LIMIT 1
    FOR UPDATE  -- 🔒 LOCK!
  `

  // Apenas UMA transação por vez pode executar este bloco
  // Outras aguardam na fila
  const sequence = lastProtocol ? parseInt(...) + 1 : 1
  return `PROT-${datePrefix}-${sequence.padStart(5, '0')}`
})
```

**Características**:
- ✅ **Serialização garantida**: Uma transação por vez
- ✅ **Sem duplicatas**: Números sempre únicos
- ✅ **Performance**: Lock apenas nos registros necessários
- ✅ **Timeout**: 10 segundos para evitar deadlocks
- ✅ **Isolation Level**: `Serializable` para máxima consistência

---

## 🛠️ Sistemas Auxiliares

### 1. Sistema de Interações

**Arquivo**: `protocol-interaction.service.ts`

Gerencia comunicação entre cidadão e servidor.

**Tipos de Interação**:
- `MESSAGE` - Mensagem de texto
- `DOCUMENT_REQUEST` - Solicitação de documento
- `DOCUMENT_UPLOAD` - Upload de documento
- `PENDING_CREATED` - Pendência criada
- `PENDING_RESOLVED` - Pendência resolvida
- `STATUS_CHANGED` - Status alterado
- `ASSIGNED` - Protocolo atribuído
- `INSPECTION_SCHEDULED` - Vistoria agendada
- `INSPECTION_COMPLETED` - Vistoria concluída
- `APPROVAL` - Aprovação
- `REJECTION` - Rejeição
- `CANCELLATION` - Cancelamento
- `NOTE` - Nota interna

**Métodos principais**:
```typescript
createInteraction(data: CreateInteractionData)
getProtocolInteractions(protocolId: string, includeInternal: boolean)
markInteractionAsRead(interactionId: string)
countUnreadInteractions(protocolId: string)
```

### 2. Sistema de Documentos

**Arquivo**: `protocol-document.service.ts`

Gerencia documentos obrigatórios e opcionais.

**Status de Documento**:
- `PENDING` - Aguardando upload
- `UPLOADED` - Enviado pelo cidadão
- `UNDER_REVIEW` - Em análise
- `APPROVED` - Aprovado
- `REJECTED` - Rejeitado
- `EXPIRED` - Vencido

**Métodos principais**:
```typescript
createProtocolDocument(data: CreateDocumentData)
uploadDocument(documentId: string, fileData: FileData)
approveDocument(documentId: string, validatedBy: string)
rejectDocument(documentId: string, validatedBy: string, reason: string)
checkRequiredDocuments(protocolId: string)
checkAllDocumentsApproved(protocolId: string)
```

### 3. Sistema de Pendências

**Arquivo**: `protocol-pending.service.ts`

Gerencia pendências que bloqueiam o andamento.

**Tipos de Pendência**:
- `DOCUMENT` - Documento faltante
- `INFORMATION` - Informação faltante
- `CORRECTION` - Correção necessária
- `VALIDATION` - Validação necessária
- `PAYMENT` - Pagamento necessário
- `INSPECTION` - Vistoria necessária
- `APPROVAL` - Aprovação necessária
- `OTHER` - Outros

**Status de Pendência**:
- `OPEN` - Aberta
- `IN_PROGRESS` - Em progresso
- `RESOLVED` - Resolvida
- `CANCELLED` - Cancelada
- `EXPIRED` - Expirada

**Métodos principais**:
```typescript
createPending(data: CreatePendingData)
resolvePending(pendingId: string, resolvedBy: string, resolution: string)
hasBlockingPendings(protocolId: string)
checkExpiredPendings(protocolId: string)
```

### 4. Sistema de Etapas (Workflow)

**Arquivo**: `protocol-stage.service.ts`

Gerencia etapas do workflow.

**Status de Etapa**:
- `PENDING` - Pendente
- `IN_PROGRESS` - Em progresso
- `COMPLETED` - Concluída
- `SKIPPED` - Pulada
- `FAILED` - Falhou

**Métodos principais**:
```typescript
createStage(data: CreateStageData)
startStage(stageId: string, userId?: string)
completeStage(stageId: string, userId: string, result?: string)
skipStage(stageId: string, userId: string, reason?: string)
failStage(stageId: string, userId: string, reason: string)
getCurrentStage(protocolId: string)
allStagesCompleted(protocolId: string)
```

### 5. Sistema de SLA

**Arquivo**: `protocol-sla.service.ts`

Gerencia prazos e alertas de vencimento.

**Métodos principais**:
```typescript
createSLA(data: CreateSLAData)
pauseSLA(protocolId: string, reason: string)
resumeSLA(protocolId: string)
completeSLA(protocolId: string)
updateSLAStatus(protocolId: string)
getOverdueSLAs()
getSLAsNearDue(days: number)
calculateSLAStats()
```

---

## 🌐 API Endpoints

### Criar Protocolo

```http
POST /api/protocols-simplified
Authorization: Bearer {token}

{
  "serviceId": "srv_123",
  "citizenData": {
    "cpf": "12345678900",
    "name": "João Silva",
    "email": "joao@email.com",
    "phone": "11999999999"
  },
  "formData": {
    "symptoms": "Dor de cabeça",
    "urgency": "NORMAL"
  },
  "latitude": -23.550520,
  "longitude": -46.633308,
  "address": "Rua Exemplo, 123"
}
```

### Listar Protocolos

```http
GET /api/protocols-simplified?status=VINCULADO&priority=1&page=1&limit=50
Authorization: Bearer {token}
```

### Buscar por Número

```http
GET /api/protocols-simplified/PROT-20251107-00001
Authorization: Bearer {token}
```

### Aprovar Protocolo

```http
PUT /api/protocols-simplified/:id/approve
Authorization: Bearer {token}

{
  "comment": "Atendimento concluído com sucesso"
}
```

### Rejeitar Protocolo

```http
PUT /api/protocols-simplified/:id/reject
Authorization: Bearer {token}

{
  "reason": "Documentação incompleta"
}
```

### Avaliar Protocolo

```http
POST /api/protocols-simplified/:id/evaluate
Authorization: Bearer {token}

{
  "rating": 5,
  "comment": "Excelente atendimento",
  "wouldRecommend": true
}
```

---

## ⚙️ Workflows

### Configuração de Workflow

```typescript
{
  moduleType: 'CADASTRO_PRODUTOR',
  name: 'Cadastro de Produtor Rural',
  defaultSLA: 15, // dias úteis
  stages: [
    {
      name: 'Análise Documental',
      order: 1,
      slaDays: 3,
      requiredDocuments: ['RG_CPF', 'COMPROVANTE_RESIDENCIA'],
      requiredActions: ['validate_documents'],
      canSkip: false
    },
    {
      name: 'Vistoria de Propriedade',
      order: 2,
      slaDays: 7,
      requiredActions: ['schedule_inspection', 'complete_inspection'],
      canSkip: true,
      skipCondition: 'property_already_registered'
    },
    {
      name: 'Análise Técnica',
      order: 3,
      slaDays: 5,
      requiredActions: ['technical_review', 'approve_or_reject'],
      canSkip: false
    }
  ]
}
```

### Aplicar Workflow

```typescript
// Aplicado automaticamente na criação do protocolo
await applyWorkflowToProtocol(protocolId, moduleType)

// Cria todas as etapas definidas no workflow
// Cada etapa tem prazo individual e requisitos específicos
```

---

## 🔌 Integração com Módulos

### Mapeamento de Módulos

**Arquivo**: `module-mapping.ts`

```typescript
export const MODULE_MAPPING: Record<string, string | null> = {
  // Módulos COM_DADOS (geram entidade no banco)
  ATENDIMENTOS_SAUDE: 'HealthAttendance',
  MATRICULA_ALUNO: 'Student',
  CADASTRO_PRODUTOR: 'RuralProducer',

  // Módulos INFORMATIVOS (não geram entidade)
  CALENDARIO_ESCOLAR: null,
  MAPA_TURISTICO: null
}
```

### Entity Handlers

**Arquivo**: `entity-handlers.ts`

```typescript
export const entityHandlers = {
  HealthAttendance: async (ctx) => {
    return ctx.tx.healthAttendance.create({
      data: {
        protocolId: ctx.protocolId,
        protocol: ctx.protocolNumber,
        citizenName: ctx.formData.patientName,
        citizenCPF: ctx.formData.cpf,
        type: ctx.formData.type,
        symptoms: ctx.formData.symptoms,
        status: 'PENDING'
      }
    })
  },

  Student: async (ctx) => {
    return ctx.tx.student.create({
      data: {
        protocolId: ctx.protocolId,
        name: ctx.formData.studentName,
        cpf: ctx.formData.cpf,
        birthDate: new Date(ctx.formData.birthDate),
        guardianName: ctx.formData.guardianName,
        isActive: false // Ativa apenas após aprovação
      }
    })
  }

  // ... 106 handlers no total
}
```

---

## 📈 Performance e Escalabilidade

### Testes de Carga

**Arquivo**: `__tests__/load/protocol-concurrency.test.ts`

#### Teste 1: Concorrência (100 requisições simultâneas)
```typescript
// Gera 100 números simultaneamente
// ✅ PASSA: Todos únicos, sem duplicatas
// ⏱️ Tempo: ~2-3 segundos
```

#### Teste 2: Criação em Massa (50 protocolos)
```typescript
// Cria 50 protocolos completos simultaneamente
// ✅ PASSA: Todos criados, números únicos
// ⏱️ Tempo: ~5-8 segundos
```

#### Teste 3: Performance (1000 números)
```typescript
// Gera 1000 números em batches de 100
// ✅ META: < 5 segundos
// ⏱️ Tempo típico: ~3-4 segundos
```

#### Teste 4: Stress (500 requisições)
```typescript
// 500 requisições simultâneas
// ✅ PASSA: Mantém consistência
// ⏱️ Tempo: ~8-12 segundos
```

### Recomendações de Escalabilidade

#### Para tráfego normal (< 100 usuários simultâneos)
✅ **Configuração atual é suficiente**

#### Para tráfego médio (100-500 usuários)
- Considerar cache Redis para consultas frequentes
- Monitorar uso de conexões do banco
- Implementar rate limiting por IP

#### Para tráfego alto (500-2000 usuários)
- Implementar read replicas do banco de dados
- Usar cache distribuído (Redis Cluster)
- Load balancer com múltiplas instâncias da API
- Queue para criação de protocolos (RabbitMQ/SQS)

#### Para tráfego muito alto (> 2000 usuários)
- Arquitetura de microserviços
- CQRS (separar leitura e escrita)
- Event sourcing para histórico
- Sharding do banco de dados

---

## 🔍 Troubleshooting

### Problema: Números duplicados

**Sintoma**: Erro `P2002: Unique constraint failed on the fields: (number)`

**Causa**: Alta concorrência sem proteção adequada

**Solução**: ✅ **Já implementado**
- Usar `generateProtocolNumberSafe()` com lock pessimista
- Verificar se migration foi aplicada corretamente

### Problema: Timeout na geração de números

**Sintoma**: Erro `Transaction timeout (10000ms exceeded)`

**Causa**: Deadlock ou carga extrema

**Solução**:
```typescript
// Aumentar timeout se necessário
await prisma.$transaction(async (tx) => {
  // ... código
}, {
  timeout: 30000 // 30 segundos
})
```

### Problema: Protocolo criado mas módulo não

**Sintoma**: `ProtocolSimplified` existe mas `HealthAttendance` não

**Causa**: Erro no entity handler ou falta de transaction

**Solução**:
- Verificar logs do entity handler
- Verificar se dados obrigatórios foram fornecidos
- Conferir se `protocolModuleService.createProtocolWithModule()` está sendo usado

### Problema: Workflow não aplicado

**Sintoma**: Protocolo criado mas sem etapas (`ProtocolStage[]` vazio)

**Causa**: Workflow não configurado para o módulo

**Solução**:
```typescript
// Verificar se workflow existe
const workflow = await getWorkflowByModuleType('ATENDIMENTOS_SAUDE')

// Se não existir, criar workflow padrão
await createDefaultWorkflows()
```

### Problema: SLA não atualiza

**Sintoma**: `isOverdue` sempre false mesmo com protocolo atrasado

**Causa**: Job de atualização não está rodando

**Solução**:
```typescript
// Executar manualmente update de SLAs
const protocols = await prisma.protocolSimplified.findMany({
  where: { status: { in: ['VINCULADO', 'EM_ANDAMENTO'] } }
})

for (const protocol of protocols) {
  await updateSLAStatus(protocol.id)
}
```

### Problema: Performance ruim em consultas

**Sintoma**: Listagem de protocolos lenta (> 2 segundos)

**Causa**: Falta de índices ou consultas ineficientes

**Solução**:
```prisma
// Adicionar índices no schema.prisma
@@index([status, departmentId])
@@index([citizenId, createdAt])
@@index([number]) // já existe como @unique
@@index([assignedUserId, status])
```

---

## 📝 Changelog

### v2.0.0 (2025-11-07) ✨ **ATUAL**

- ✅ Implementada proteção contra concorrência na geração de números
- ✅ Criado `generateProtocolNumberSafe()` com lock pessimista
- ✅ Adicionados testes de carga e concorrência
- ✅ Documentação técnica completa
- ✅ 106 entity handlers implementados
- ✅ 111 workflows configurados

### v1.0.0 (2025-10-20)

- ✅ Motor de protocolos simplificado
- ✅ Integração com módulos
- ✅ Sistemas auxiliares (interações, documentos, pendências, SLA)
- ✅ 108 serviços cadastrados

---

## 📞 Suporte

Para dúvidas ou problemas:

1. Consultar esta documentação
2. Verificar logs do servidor
3. Executar testes de carga
4. Analisar queries lentas no banco

---

**Última atualização**: 07/11/2025
**Versão**: 2.0.0
**Autor**: Equipe DigiUrban
