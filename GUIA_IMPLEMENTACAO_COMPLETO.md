# GUIA DE IMPLEMENTAÇÃO COMPLETO
## 78 Microsistemas DigiUrban - Blueprint Técnico

**Versão:** 1.0
**Data:** 2025-01-17
**Status:** Pronto para Execução

---

## 📚 ÍNDICE

1. [Introdução](#introdução)
2. [Arquitetura Geral](#arquitetura-geral)
3. [FASE 0: Fundação](#fase-0-fundação)
4. [FASE 1-8: Microsistemas por Secretaria](#fases-1-8)
5. [Padrões de Código](#padrões-de-código)
6. [Checklist de Implementação](#checklist)
7. [Troubleshooting](#troubleshooting)

---

## 📖 INTRODUÇÃO

Este guia fornece a **estrutura completa** para implementação dos 78 microsistemas.

### ✅ O que está incluído:
- Schemas Prisma completos
- Estrutura de diretórios
- Templates de código
- Rotas API padronizadas
- Componentes Frontend
- Scripts de migração

### 🎯 Como usar este guia:
1. Escolha uma FASE (0-8)
2. Escolha um Microsistema (MS-01 a MS-78)
3. Siga o checklist passo a passo
4. Execute os comandos fornecidos
5. Copie/ajuste os templates de código

---

## 🏗️ ARQUITETURA GERAL

### Stack Tecnológico
- **Backend:** Node.js + TypeScript + Express
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Frontend:** Next.js + React + TypeScript + Tailwind
- **Engine de Workflow:** Sistema proprietário (implementado na FASE 0)

### Estrutura de Diretórios

```
digiurban/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Schema principal
│   │   ├── migrations/                 # Migrações SQL
│   │   └── seed/                       # Seeds de dados
│   ├── src/
│   │   ├── routes/
│   │   │   ├── admin/                  # Rotas admin
│   │   │   ├── citizen/                # Rotas cidadão
│   │   │   └── microsistemas/          # 🆕 Rotas dos 78 MS
│   │   │       ├── saude/
│   │   │       │   ├── unidades.routes.ts (MS-01)
│   │   │       │   ├── agenda.routes.ts (MS-02)
│   │   │       │   ├── prontuario.routes.ts (MS-03)
│   │   │       │   ├── medicamentos.routes.ts (MS-05)
│   │   │       │   └── tfd.routes.ts (MS-06)
│   │   │       ├── educacao/
│   │   │       ├── assistencia-social/
│   │   │       ├── agricultura/
│   │   │       ├── cultura/
│   │   │       ├── esportes/
│   │   │       ├── habitacao/
│   │   │       ├── meio-ambiente/
│   │   │       ├── obras-publicas/
│   │   │       ├── seguranca-publica/
│   │   │       ├── turismo/
│   │   │       ├── planejamento-urbano/
│   │   │       └── servicos-publicos/
│   │   ├── services/
│   │   │   ├── workflow/               # Engine de Workflow
│   │   │   │   ├── workflow-definition.service.ts
│   │   │   │   ├── workflow-instance.service.ts
│   │   │   │   ├── workflow-engine.service.ts
│   │   │   │   └── workflow-queue.service.ts
│   │   │   └── microsistemas/          # Serviços dos MS
│   │   │       ├── saude/
│   │   │       ├── educacao/
│   │   │       └── ... (13 secretarias)
│   │   └── types/
│   │       ├── workflow.types.ts
│   │       └── microsistemas/
│   │           ├── saude.types.ts
│   │           ├── educacao.types.ts
│   │           └── ... (13 arquivos)
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── admin/
    │   │   └── microsistemas/           # 🆕 Páginas dos 78 MS
    │   │       ├── cadastros-base/      # MS-00
    │   │       ├── saude/
    │   │       │   ├── unidades/        # MS-01
    │   │       │   ├── agenda/          # MS-02
    │   │       │   ├── prontuario/      # MS-03
    │   │       │   ├── medicamentos/    # MS-05
    │   │       │   └── tfd/             # MS-06
    │   │       ├── educacao/
    │   │       └── ... (13 secretarias)
    │   └── cidadao/
    │       └── microsistemas/
    │           ├── saude/
    │           ├── educacao/
    │           └── ...
    ├── components/
    │   ├── workflow/                    # Componentes de Workflow
    │   │   ├── WorkflowViewer.tsx
    │   │   ├── WorkflowTimeline.tsx
    │   │   ├── WorkflowQueue.tsx
    │   │   └── WorkflowStageActions.tsx
    │   └── microsistemas/               # Componentes específicos
    │       ├── saude/
    │       ├── educacao/
    │       └── ...
    └── lib/
        └── types/
            └── microsistemas/
                ├── saude.types.ts
                ├── educacao.types.ts
                └── ...
```

---

## 🔧 FASE 0: FUNDAÇÃO

**Status atual:** ✅ Engine de Workflow criada (parcial)

### Checklist FASE 0

#### ✅ 0.1. Engine de Workflow - Schema Prisma
- [x] WorkflowDefinition model
- [x] WorkflowInstance model
- [x] WorkflowHistory model
- [x] WorkflowStatus enum
- [x] Migration criada e aplicada

#### ⏸️ 0.2. Engine de Workflow - Backend

**Criar Tipos:**
```bash
# Arquivo já criado:
# backend/src/types/workflow.types.ts
```

**Criar Serviços:**
```bash
# Criar diretório
mkdir -p backend/src/services/workflow

# Arquivos a criar:
# 1. backend/src/services/workflow/workflow-definition.service.ts ✅ CRIADO
# 2. backend/src/services/workflow/workflow-instance.service.ts
# 3. backend/src/services/workflow/workflow-engine.service.ts
# 4. backend/src/services/workflow/workflow-queue.service.ts
```

<details>
<summary><b>📄 Template: workflow-instance.service.ts</b></summary>

```typescript
import { PrismaClient, WorkflowStatus } from '@prisma/client';
import {
  CreateWorkflowInstanceDto,
  AdvanceWorkflowDto,
  ReturnWorkflowDto,
  CancelWorkflowDto,
  WorkflowInstanceData,
  WorkflowInstanceFilters,
} from '../../types/workflow.types';

const prisma = new PrismaClient();

export class WorkflowInstanceService {
  /**
   * Criar nova instância de workflow
   */
  async create(data: CreateWorkflowInstanceDto): Promise<WorkflowInstanceData> {
    // Buscar definição
    const definition = await prisma.workflowDefinition.findUnique({
      where: { id: data.definitionId },
    });

    if (!definition) {
      throw new Error('Workflow definition not found');
    }

    const stages = definition.stages as any[];
    const initialStage = stages.find(s => s.isInitial) || stages[0];

    // Criar instância
    const instance = await prisma.workflowInstance.create({
      data: {
        definitionId: data.definitionId,
        entityType: data.entityType,
        entityId: data.entityId,
        citizenId: data.citizenId,
        currentStage: initialStage.id,
        status: WorkflowStatus.ACTIVE,
        priority: data.priority || 0,
        metadata: data.metadata as any,
      },
    });

    // Criar histórico inicial
    await prisma.workflowHistory.create({
      data: {
        instanceId: instance.id,
        toStage: initialStage.id,
        action: 'CREATED',
        userId: 'SYSTEM',
      },
    });

    return instance;
  }

  /**
   * Buscar instância por ID
   */
  async findById(id: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id },
      include: {
        definition: true,
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return instance;
  }

  /**
   * Buscar instância por entidade
   */
  async findByEntity(entityType: string, entityId: string) {
    const instance = await prisma.workflowInstance.findFirst({
      where: {
        entityType,
        entityId,
      },
      include: {
        definition: true,
        history: true,
      },
    });

    return instance;
  }

  /**
   * Listar instâncias com filtros
   */
  async findMany(filters: WorkflowInstanceFilters) {
    const where: any = {};

    if (filters.definitionId) where.definitionId = filters.definitionId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.citizenId) where.citizenId = filters.citizenId;
    if (filters.currentStage) where.currentStage = filters.currentStage;
    if (filters.status) where.status = filters.status;

    const instances = await prisma.workflowInstance.findMany({
      where,
      include: {
        definition: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return instances;
  }

  /**
   * Avançar workflow
   */
  async advance(instanceId: string, data: AdvanceWorkflowDto) {
    const instance = await this.findById(instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    // Calcular duração na etapa anterior
    const lastHistory = instance.history[0];
    const duration = lastHistory
      ? Math.floor((Date.now() - lastHistory.timestamp.getTime()) / 60000)
      : 0;

    // Atualizar instância
    const updated = await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        currentStage: data.targetStage!,
        updatedAt: new Date(),
      },
    });

    // Criar histórico
    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage: instance.currentStage,
        toStage: data.targetStage!,
        action: data.action,
        userId: data.userId,
        userName: data.userName,
        notes: data.notes,
        attachments: data.attachments as any,
        duration,
      },
    });

    return updated;
  }

  /**
   * Retornar workflow
   */
  async return(instanceId: string, data: ReturnWorkflowDto) {
    return this.advance(instanceId, {
      action: 'RETURNED',
      targetStage: data.targetStage,
      userId: data.userId,
      userName: data.userName,
      notes: data.reason,
    });
  }

  /**
   * Cancelar workflow
   */
  async cancel(instanceId: string, data: CancelWorkflowDto) {
    const instance = await this.findById(instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    const updated = await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: WorkflowStatus.CANCELLED,
        completedAt: new Date(),
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage: instance.currentStage,
        toStage: instance.currentStage,
        action: 'CANCELLED',
        userId: data.userId,
        userName: data.userName,
        notes: data.reason,
      },
    });

    return updated;
  }

  /**
   * Completar workflow
   */
  async complete(instanceId: string, userId: string, userName?: string) {
    const instance = await this.findById(instanceId);
    if (!instance) {
      throw new Error('Workflow instance not found');
    }

    const updated = await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: WorkflowStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage: instance.currentStage,
        toStage: instance.currentStage,
        action: 'COMPLETED',
        userId,
        userName,
      },
    });

    return updated;
  }
}

export const workflowInstanceService = new WorkflowInstanceService();
```
</details>

<details>
<summary><b>📄 Template: workflow-queue.service.ts</b></summary>

```typescript
import { PrismaClient, WorkflowStatus } from '@prisma/client';
import {
  WorkflowQueueFilters,
  WorkflowQueueItem,
} from '../../types/workflow.types';

const prisma = new PrismaClient();

export class WorkflowQueueService {
  /**
   * Buscar fila de trabalho para um stage específico
   */
  async getQueue(filters: WorkflowQueueFilters): Promise<WorkflowQueueItem[]> {
    const where: any = {
      currentStage: filters.stage,
      status: filters.status || WorkflowStatus.ACTIVE,
    };

    if (filters.definitionId) {
      where.definitionId = filters.definitionId;
    }

    const instances = await prisma.workflowInstance.findMany({
      where,
      include: {
        definition: true,
        history: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy:
        filters.orderBy === 'priority'
          ? { priority: filters.orderDirection || 'desc' }
          : { createdAt: filters.orderDirection || 'asc' },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    // Transformar em QueueItems
    const queueItems: WorkflowQueueItem[] = instances.map((instance) => {
      const lastHistory = instance.history[0];
      const waitingTime = lastHistory
        ? Math.floor((Date.now() - lastHistory.timestamp.getTime()) / 60000)
        : 0;

      return {
        instance: instance as any,
        waitingTime,
        isUrgent: instance.priority >= 8,
        isOverdue: false, // TODO: calcular com SLA
      };
    });

    return queueItems;
  }

  /**
   * Contar itens na fila
   */
  async countQueue(filters: Pick<WorkflowQueueFilters, 'definitionId' | 'stage' | 'status'>): Promise<number> {
    const count = await prisma.workflowInstance.count({
      where: {
        definitionId: filters.definitionId,
        currentStage: filters.stage,
        status: filters.status || WorkflowStatus.ACTIVE,
      },
    });

    return count;
  }

  /**
   * Próximo item da fila (para atribuição automática)
   */
  async getNext(filters: WorkflowQueueFilters): Promise<WorkflowQueueItem | null> {
    const queue = await this.getQueue({
      ...filters,
      limit: 1,
    });

    return queue[0] || null;
  }
}

export const workflowQueueService = new WorkflowQueueService();
```
</details>

**Criar Rotas API:**
```bash
# Arquivo: backend/src/routes/workflows.routes.ts
```

<details>
<summary><b>📄 Template: workflows.routes.ts</b></summary>

```typescript
import express from 'express';
import { workflowDefinitionService } from '../services/workflow/workflow-definition.service';
import { workflowInstanceService } from '../services/workflow/workflow-instance.service';
import { workflowQueueService } from '../services/workflow/workflow-queue.service';

const router = express.Router();

// ============================================================================
// WORKFLOW DEFINITIONS
// ============================================================================

// Listar definições
router.get('/definitions', async (req, res) => {
  try {
    const { module } = req.query;

    const definitions = module
      ? await workflowDefinitionService.findByModule(module as string)
      : await workflowDefinitionService.findAll();

    res.json(definitions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar definição por ID
router.get('/definitions/:id', async (req, res) => {
  try {
    const definition = await workflowDefinitionService.findById(req.params.id);

    if (!definition) {
      return res.status(404).json({ error: 'Definition not found' });
    }

    res.json(definition);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar definição
router.post('/definitions', async (req, res) => {
  try {
    const definition = await workflowDefinitionService.create(req.body);
    res.status(201).json(definition);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Atualizar definição
router.put('/definitions/:id', async (req, res) => {
  try {
    const definition = await workflowDefinitionService.update(req.params.id, req.body);
    res.json(definition);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WORKFLOW INSTANCES
// ============================================================================

// Listar instâncias
router.get('/instances', async (req, res) => {
  try {
    const instances = await workflowInstanceService.findMany(req.query as any);
    res.json(instances);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar instância por ID
router.get('/instances/:id', async (req, res) => {
  try {
    const instance = await workflowInstanceService.findById(req.params.id);

    if (!instance) {
      return res.status(404).json({ error: 'Instance not found' });
    }

    res.json(instance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Criar instância
router.post('/instances', async (req, res) => {
  try {
    const instance = await workflowInstanceService.create(req.body);
    res.status(201).json(instance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Avançar instância
router.post('/instances/:id/advance', async (req, res) => {
  try {
    const instance = await workflowInstanceService.advance(req.params.id, req.body);
    res.json(instance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Retornar instância
router.post('/instances/:id/return', async (req, res) => {
  try {
    const instance = await workflowInstanceService.return(req.params.id, req.body);
    res.json(instance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Cancelar instância
router.post('/instances/:id/cancel', async (req, res) => {
  try {
    const instance = await workflowInstanceService.cancel(req.params.id, req.body);
    res.json(instance);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// WORKFLOW QUEUE
// ============================================================================

// Buscar fila
router.get('/queue', async (req, res) => {
  try {
    const queue = await workflowQueueService.getQueue(req.query as any);
    res.json(queue);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Contar fila
router.get('/queue/count', async (req, res) => {
  try {
    const count = await workflowQueueService.countQueue(req.query as any);
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```
</details>

#### ⏸️ 0.3. Engine de Workflow - Frontend

**Criar Componentes:**
```bash
mkdir -p frontend/components/workflow
```

<details>
<summary><b>📄 Template: WorkflowViewer.tsx</b></summary>

```typescript
'use client';

import { useState, useEffect } from 'react';

interface Stage {
  id: string;
  name: string;
  isInitial?: boolean;
  isFinal?: boolean;
}

interface WorkflowViewerProps {
  workflowId: string;
  currentStage: string;
}

export function WorkflowViewer({ workflowId, currentStage }: WorkflowViewerProps) {
  const [stages, setStages] = useState<Stage[]>([]);

  useEffect(() => {
    // Buscar definição do workflow
    fetch(`/api/workflows/definitions/${workflowId}`)
      .then(res => res.json())
      .then(data => {
        setStages(data.stages || []);
      });
  }, [workflowId]);

  return (
    <div className="flex items-center space-x-4 overflow-x-auto py-4">
      {stages.map((stage, index) => {
        const isCurrent = stage.id === currentStage;
        const isPast = stages.findIndex(s => s.id === currentStage) > index;

        return (
          <div key={stage.id} className="flex items-center">
            {/* Stage Circle */}
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2
              ${isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                isPast ? 'bg-green-500 border-green-500 text-white' :
                'bg-gray-200 border-gray-300 text-gray-500'}
            `}>
              {isPast ? '✓' : index + 1}
            </div>

            {/* Stage Name */}
            <div className="ml-2 mr-4">
              <div className={`text-sm font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-700'}`}>
                {stage.name}
              </div>
            </div>

            {/* Connector */}
            {index < stages.length - 1 && (
              <div className={`h-0.5 w-8 ${isPast ? 'bg-green-500' : 'bg-gray-300'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
```
</details>

#### ⏸️ 0.4. MS-00: Gestor de Cadastros Base

**Schema Prisma:** Tabelas auxiliares já existem

**Backend:**
```bash
# Criar: backend/src/services/admin/generic-table.service.ts
# Criar: backend/src/routes/admin/cadastros-base.routes.ts
```

**Frontend:**
```bash
# Criar: frontend/app/admin/microsistemas/cadastros-base/page.tsx
# Criar: frontend/components/admin/CRUDTable.tsx
```

---

## 📋 FASE 1: SAÚDE (6 Microsistemas)

### MS-03: Prontuário Eletrônico (Exemplo Completo)

Este é o microsistema **mais complexo** da saúde, com fluxo completo. Use-o como **template** para os demais.

#### 1. Schema Prisma

<details>
<summary><b>📄 Adicionar ao schema.prisma (final do arquivo)</b></summary>

```prisma
// ============================================================================
// MS-03: PRONTUÁRIO ELETRÔNICO DO PACIENTE (PEP)
// ============================================================================

model AtendimentoMedico {
  id                String   @id @default(cuid())
  workflowId        String   @unique
  protocolId        String?  @unique
  consultaAgendadaId String? @unique
  citizenId         String
  unidadeId         String
  dataAtendimento   DateTime @default(now())
  tipo              TipoAtendimento
  status            AtendimentoStatus
  prioridade        Int      @default(0)

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

  // Métricas
  tempoTotalMinutos Int?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([citizenId])
  @@index([unidadeId, dataAtendimento])
  @@index([status])
  @@map("atendimentos_medicos")
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

model TriagemEnfermagem {
  id                String   @id @default(cuid())
  atendimentoId     String   @unique
  atendimento       AtendimentoMedico @relation(fields: [atendimentoId], references: [id])
  enfermeiroId      String

  // Sinais Vitais
  pressaoArterial   String?
  temperatura       Float?
  frequenciaCardiaca Int?
  frequenciaRespiratoria Int?
  saturacaoO2       Int?
  peso              Float?
  altura            Float?
  glicemia          Float?

  // Classificação de Risco
  classificacaoRisco ClassificacaoRisco
  corProtocolo      String

  // Anamnese Preliminar
  queixaPrincipal   String
  historiaAtual     String?
  alergias          String?
  medicamentosUso   String?
  comorbidades      String?

  observacoes       String?
  dataHora          DateTime @default(now())

  @@map("triagem_enfermagem")
}

enum ClassificacaoRisco {
  EMERGENCIA
  MUITO_URGENTE
  URGENTE
  POUCO_URGENTE
  NAO_URGENTE
}

model ConsultaMedica {
  id                String   @id @default(cuid())
  atendimentoId     String   @unique
  atendimento       AtendimentoMedico @relation(fields: [atendimentoId], references: [id])
  medicoId          String
  profissionalSaudeId String?

  // Anamnese
  queixaPrincipal   String
  historiaDoenca    String?
  historicoFamiliar String?
  antecedentesPessoais String?

  // Exame Físico
  exameFisico       String?

  // Diagnóstico
  hipoteseDiagnostica String?
  diagnosticos      Json

  // Conduta
  conduta           String?
  orientacoes       String?

  // Retorno
  retornoNecessario Boolean  @default(false)
  prazoRetornoDias  Int?

  observacoes       String?
  dataHora          DateTime @default(now())

  // Relacionamentos
  prescricoes       Prescricao[]
  exameSolicitados  ExameSolicitado[]
  atestados         Atestado[]
  encaminhamentos   Encaminhamento[]

  @@map("consultas_medicas")
}

model Prescricao {
  id             String   @id @default(cuid())
  consultaId     String
  consulta       ConsultaMedica @relation(fields: [consultaId], references: [id])
  medicamentos   Json
  observacoes    String?
  validade       DateTime
  dispensada     Boolean  @default(false)
  dataHora       DateTime @default(now())

  @@index([consultaId])
  @@map("prescricoes")
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

  @@index([consultaId])
  @@map("exames_solicitados")
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

  @@index([consultaId])
  @@map("atestados")
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

  @@index([consultaId])
  @@map("encaminhamentos")
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
</details>

#### 2. Migration SQL

```bash
# Executar:
npx prisma migrate dev --name add-ms03-prontuario

# Ou criar migration manual como fizemos com workflow
```

#### 3. Tipos TypeScript

<details>
<summary><b>📄 backend/src/types/microsistemas/saude.types.ts</b></summary>

```typescript
import {
  TipoAtendimento,
  AtendimentoStatus,
  ClassificacaoRisco,
  PrioridadeExame,
  StatusExame,
  TipoAtestado,
} from '@prisma/client';

export interface AtendimentoMedicoData {
  id?: string;
  workflowId?: string;
  citizenId: string;
  unidadeId: string;
  tipo: TipoAtendimento;
  status: AtendimentoStatus;
  prioridade?: number;
}

export interface TriagemEnfermagemData {
  atendimentoId: string;
  enfermeiroId: string;
  pressaoArterial?: string;
  temperatura?: number;
  frequenciaCardiaca?: number;
  saturacaoO2?: number;
  peso?: number;
  altura?: number;
  classificacaoRisco: ClassificacaoRisco;
  queixaPrincipal: string;
  alergias?: string;
  medicamentosUso?: string;
}

export interface ConsultaMedicaData {
  atendimentoId: string;
  medicoId: string;
  queixaPrincipal: string;
  historiaDoenca?: string;
  exameFisico?: string;
  diagnosticos: Array<{
    cid10: string;
    descricao: string;
  }>;
  conduta?: string;
}

// DTOs
export interface CreateAtendimentoDto {
  citizenId: string;
  unidadeId: string;
  tipo: TipoAtendimento;
}

export interface CreateTriagemDto extends TriagemEnfermagemData {}
export interface CreateConsultaDto extends ConsultaMedicaData {}
```
</details>

#### 4. Serviços

<details>
<summary><b>📄 backend/src/services/microsistemas/saude/atendimento.service.ts</b></summary>

```typescript
import { PrismaClient } from '@prisma/client';
import { workflowInstanceService } from '../../workflow/workflow-instance.service';
import { CreateAtendimentoDto } from '../../../types/microsistemas/saude.types';

const prisma = new PrismaClient();

// ID da definição do workflow "Atendimento Médico" (deve ser criada previamente)
const WORKFLOW_ATENDIMENTO_ID = 'workflow-atendimento-medico';

export class AtendimentoService {
  /**
   * Criar novo atendimento médico (inicia workflow)
   */
  async create(data: CreateAtendimentoDto) {
    // 1. Criar atendimento
    const atendimento = await prisma.atendimentoMedico.create({
      data: {
        citizenId: data.citizenId,
        unidadeId: data.unidadeId,
        tipo: data.tipo,
        status: 'AGUARDANDO_CHECKIN',
        prioridade: 0,
        workflowId: '', // Será preenchido após criar workflow
      },
    });

    // 2. Criar instância de workflow
    const workflow = await workflowInstanceService.create({
      definitionId: WORKFLOW_ATENDIMENTO_ID,
      entityType: 'AtendimentoMedico',
      entityId: atendimento.id,
      citizenId: data.citizenId,
      priority: 0,
    });

    // 3. Atualizar atendimento com workflowId
    const updated = await prisma.atendimentoMedico.update({
      where: { id: atendimento.id },
      data: { workflowId: workflow.id },
    });

    return updated;
  }

  /**
   * Realizar check-in
   */
  async checkin(atendimentoId: string, userId: string) {
    const atendimento = await prisma.atendimentoMedico.update({
      where: { id: atendimentoId },
      data: {
        status: 'CHECKIN_REALIZADO',
        horarioCheckin: new Date(),
        recepcaoId: userId,
      },
    });

    // Avançar workflow
    await workflowInstanceService.advance(atendimento.workflowId, {
      action: 'CHECKIN',
      targetStage: 'triagem',
      userId,
    });

    return atendimento;
  }

  /**
   * Buscar atendimento por ID
   */
  async findById(id: string) {
    return await prisma.atendimentoMedico.findUnique({
      where: { id },
      include: {
        triagem: true,
        consulta: {
          include: {
            prescricoes: true,
            exameSolicitados: true,
            atestados: true,
            encaminhamentos: true,
          },
        },
      },
    });
  }

  /**
   * Listar fila de triagem
   */
  async getFilaTriagem(unidadeId: string) {
    return await prisma.atendimentoMedico.findMany({
      where: {
        unidadeId,
        status: {
          in: ['AGUARDANDO_TRIAGEM', 'EM_TRIAGEM'],
        },
      },
      orderBy: [
        { prioridade: 'desc' },
        { horarioCheckin: 'asc' },
      ],
    });
  }

  // TODO: Implementar outros métodos
  // - getFilaMedica()
  // - criarTriagem()
  // - criarConsulta()
  // - finalizarAtendimento()
}

export const atendimentoService = new AtendimentoService();
```
</details>

#### 5. Rotas API

<details>
<summary><b>📄 backend/src/routes/microsistemas/saude/atendimento.routes.ts</b></summary>

```typescript
import express from 'express';
import { atendimentoService } from '../../../services/microsistemas/saude/atendimento.service';

const router = express.Router();

// Criar novo atendimento
router.post('/', async (req, res) => {
  try {
    const atendimento = await atendimentoService.create(req.body);
    res.status(201).json(atendimento);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Check-in
router.post('/:id/checkin', async (req, res) => {
  try {
    const atendimento = await atendimentoService.checkin(
      req.params.id,
      req.body.userId
    );
    res.json(atendimento);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Buscar atendimento
router.get('/:id', async (req, res) => {
  try {
    const atendimento = await atendimentoService.findById(req.params.id);
    res.json(atendimento);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Fila de triagem
router.get('/fila/triagem', async (req, res) => {
  try {
    const fila = await atendimentoService.getFilaTriagem(req.query.unidadeId as string);
    res.json(fila);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```
</details>

#### 6. Frontend - Componente de Triagem

<details>
<summary><b>📄 frontend/components/microsistemas/saude/FilaTriagem.tsx</b></summary>

```typescript
'use client';

import { useState, useEffect } from 'react';
import { WorkflowViewer } from '@/components/workflow/WorkflowViewer';

interface Atendimento {
  id: string;
  citizenId: string;
  status: string;
  prioridade: number;
  horarioCheckin: string;
}

export function FilaTriagem({ unidadeId }: { unidadeId: string }) {
  const [fila, setFila] = useState<Atendimento[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchFila();
    const interval = setInterval(fetchFila, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, [unidadeId]);

  const fetchFila = async () => {
    const res = await fetch(`/api/microsistemas/saude/atendimento/fila/triagem?unidadeId=${unidadeId}`);
    const data = await res.json();
    setFila(data);
  };

  const chamarProximo = () => {
    if (fila.length > 0) {
      setSelectedId(fila[0].id);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fila de Triagem</h2>
        <button
          onClick={chamarProximo}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Chamar Próximo
        </button>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600">
          Aguardando: <span className="font-bold">{fila.length}</span>
        </div>
      </div>

      {selectedId && (
        <div className="mb-6 p-4 border border-blue-300 rounded bg-blue-50">
          <h3 className="font-bold mb-2">Atendimento Atual</h3>
          <WorkflowViewer
            workflowId="workflow-atendimento-medico"
            currentStage="triagem"
          />
          {/* TODO: Formulário de triagem */}
        </div>
      )}

      <div className="space-y-2">
        {fila.map((atendimento, index) => (
          <div
            key={atendimento.id}
            className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
            onClick={() => setSelectedId(atendimento.id)}
          >
            <div className="flex justify-between">
              <div>
                <span className="font-bold">#{index + 1}</span> - ID: {atendimento.id}
              </div>
              <div className="text-sm text-gray-600">
                Chegada: {new Date(atendimento.horarioCheckin).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```
</details>

---

## 🔄 TEMPLATE PARA TODOS OS MICROSISTEMAS

Use o MS-03 como template. Para cada microsistema:

### Checklist de Implementação:

#### 1. Schema Prisma
- [ ] Criar models no schema.prisma
- [ ] Adicionar enums necessários
- [ ] Criar índices para performance
- [ ] Definir relacionamentos
- [ ] Executar `npx prisma migrate dev`

#### 2. Tipos TypeScript (Backend)
- [ ] Criar arquivo types/microsistemas/{secretaria}.types.ts
- [ ] Definir interfaces de dados
- [ ] Definir DTOs (Create, Update)
- [ ] Exportar enums do Prisma

#### 3. Serviços (Backend)
- [ ] Criar services/microsistemas/{secretaria}/{nome}.service.ts
- [ ] Implementar CRUD básico
- [ ] Implementar lógica de negócio
- [ ] Se tem fluxo: integrar com workflow-instance.service

#### 4. Rotas API (Backend)
- [ ] Criar routes/microsistemas/{secretaria}/{nome}.routes.ts
- [ ] Definir endpoints REST
- [ ] Adicionar validações
- [ ] Registrar rotas no app principal

#### 5. Tipos TypeScript (Frontend)
- [ ] Criar frontend/lib/types/microsistemas/{secretaria}.types.ts
- [ ] Espelhar tipos do backend

#### 6. Componentes (Frontend)
- [ ] Criar components/microsistemas/{secretaria}/{Nome}.tsx
- [ ] Formulários
- [ ] Listagens/Tabelas
- [ ] Dashboards

#### 7. Páginas (Frontend)
- [ ] Criar app/admin/microsistemas/{secretaria}/{nome}/page.tsx
- [ ] Criar app/cidadao/microsistemas/{secretaria}/{nome}/page.tsx (se aplicável)

#### 8. Testes
- [ ] Testes unitários dos serviços
- [ ] Testes de integração das APIs
- [ ] Testes E2E das páginas

---

## 📑 SCHEMAS PRISMA COMPLETOS

Devido ao tamanho, os schemas de todos os 78 microsistemas estão disponíveis em:
📄 **`SCHEMAS_PRISMA_COMPLETOS.md`** (arquivo separado - a ser criado)

Para cada microsistema, você encontrará:
- Models completos
- Enums
- Índices
- Relacionamentos

---

## 🎨 PADRÕES DE CÓDIGO

### Nomenclatura
- **Models Prisma:** PascalCase (ex: `AtendimentoMedico`)
- **Tabelas DB:** snake_case (ex: `atendimentos_medicos`)
- **Serviços:** {nome}.service.ts
- **Rotas:** {nome}.routes.ts
- **Componentes:** PascalCase.tsx

### Estrutura de Serviços
```typescript
export class NomeService {
  async create(data: CreateDto) { }
  async findById(id: string) { }
  async findMany(filters: Filters) { }
  async update(id: string, data: UpdateDto) { }
  async delete(id: string) { }
}

export const nomeService = new NomeService();
```

### Estrutura de Rotas
```typescript
const router = express.Router();

router.get('/', async (req, res) => { }); // Listar
router.get('/:id', async (req, res) => { }); // Buscar
router.post('/', async (req, res) => { }); // Criar
router.put('/:id', async (req, res) => { }); // Atualizar
router.delete('/:id', async (req, res) => { }); // Deletar

export default router;
```

---

## ✅ CHECKLIST FINAL

### Por Microsistema:
- [ ] Schema Prisma criado
- [ ] Migration executada
- [ ] Tipos TypeScript (backend)
- [ ] Serviço implementado
- [ ] Rotas API criadas
- [ ] Tipos TypeScript (frontend)
- [ ] Componentes criados
- [ ] Páginas criadas
- [ ] Testado manualmente

### Por Secretaria (13x):
- [ ] 6 microsistemas implementados
- [ ] Integração entre microsistemas testada
- [ ] Dashboard da secretaria criado
- [ ] Documentação atualizada

---

## 🔧 TROUBLESHOOTING

### Erro: Migration failed
```bash
# Resetar database (CUIDADO: apaga dados!)
npx prisma migrate reset

# Ou aplicar manualmente:
npx prisma db push
```

### Erro: Prisma Client out of sync
```bash
npx prisma generate
```

### Erro: TypeScript não reconhece tipos Prisma
```bash
# Reinstalar dependências
rm -rf node_modules
npm install
npx prisma generate
```

---

## 📊 PRÓXIMOS PASSOS

1. **Fase 0:** Completar Engine de Workflow + MS-00
2. **Fase 1 (Piloto):** MS-03 (Prontuário) completo
3. **Fase 1:** Restante da Saúde (MS-01, MS-02, MS-05, MS-06)
4. **Fases 2-8:** Replicar padrão para outras secretarias

---

**Última atualização:** 2025-01-17
**Versão do Guia:** 1.0
**Status:** Documento vivo (atualizar conforme implementação avança)
