import { PrismaClient, WorkflowStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateWorkflowInstanceDTO {
  definitionId: string;
  entityType: string;
  entityId: string;
  citizenId?: string;
  currentStage: string;
  priority?: number;
  metadata?: any;
}

export interface UpdateWorkflowInstanceDTO {
  entityId?: string;
  currentStage?: string;
  status?: WorkflowStatus;
  priority?: number;
  metadata?: any;
}

export interface TransitionWorkflowDTO {
  toStage: string;
  action: string;
  userId: string;
  userName?: string;
  notes?: string;
  attachments?: any;
}

export class WorkflowInstanceService {
  /**
   * Criar nova instância de workflow
   */
  async create(data: CreateWorkflowInstanceDTO) {
    // Verificar se a definição existe
    const definition = await prisma.workflowDefinition.findUnique({
      where: { id: data.definitionId },
    });

    if (!definition) {
      throw new Error('Definição de workflow não encontrada');
    }

    if (!definition.isActive) {
      throw new Error('Definição de workflow está inativa');
    }

    return await prisma.workflowInstance.create({
      data: {
        definitionId: data.definitionId,
        entityType: data.entityType,
        entityId: data.entityId,
        citizenId: data.citizenId,
        currentStage: data.currentStage,
        status: 'ACTIVE',
        priority: data.priority || 0,
        metadata: data.metadata || {},
      },
    });
  }

  /**
   * Buscar instância por ID
   */
  async findById(id: string) {
    return await prisma.workflowInstance.findUnique({
      where: { id },
      include: {
        definition: true,
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }

  /**
   * Buscar instâncias por entidade
   */
  async findByEntity(entityType: string, entityId: string) {
    return await prisma.workflowInstance.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        definition: true,
        history: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Buscar instâncias por cidadão
   */
  async findByCitizen(citizenId: string, status?: WorkflowStatus) {
    return await prisma.workflowInstance.findMany({
      where: {
        citizenId,
        ...(status && { status }),
      },
      include: {
        definition: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Buscar instâncias por estágio atual
   */
  async findByStage(definitionId: string, currentStage: string) {
    return await prisma.workflowInstance.findMany({
      where: {
        definitionId,
        currentStage,
        status: 'ACTIVE',
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Atualizar instância de workflow
   */
  async update(id: string, data: UpdateWorkflowInstanceDTO) {
    return await prisma.workflowInstance.update({
      where: { id },
      data,
    });
  }

  /**
   * Fazer transição de estágio
   */
  async transition(
    instanceId: string,
    toStage: string,
    action: string,
    userId: string,
    userName?: string,
    notes?: string,
    attachments?: any
  ) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
      include: { definition: true },
    });

    if (!instance) {
      throw new Error('Instância de workflow não encontrada');
    }

    if (instance.status !== 'ACTIVE') {
      throw new Error(`Workflow não está ativo. Status atual: ${instance.status}`);
    }

    // Validar se a transição é permitida
    const stages = instance.definition.stages as any[];
    const currentStageObj = stages.find((s) => s.id === instance.currentStage);
    const toStageObj = stages.find((s) => s.id === toStage);

    if (!toStageObj) {
      throw new Error(`Estágio de destino '${toStage}' não existe na definição do workflow`);
    }

    // Verificar se a transição é permitida
    if (currentStageObj && currentStageObj.allowedTransitions) {
      if (!currentStageObj.allowedTransitions.includes(toStage)) {
        throw new Error(
          `Transição de '${instance.currentStage}' para '${toStage}' não é permitida`
        );
      }
    }

    const fromStage = instance.currentStage;
    const transitionTime = new Date();
    const lastHistoryEntry = await prisma.workflowHistory.findFirst({
      where: { instanceId },
      orderBy: { timestamp: 'desc' },
    });

    let duration: number | undefined;
    if (lastHistoryEntry) {
      duration = Math.round(
        (transitionTime.getTime() - lastHistoryEntry.timestamp.getTime()) / 1000
      ); // em segundos
    }

    // Criar entrada no histórico
    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage,
        toStage,
        action,
        userId,
        userName,
        notes,
        attachments,
        duration,
      },
    });

    // Atualizar instância
    return await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        currentStage: toStage,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Pausar workflow
   */
  async pause(instanceId: string, userId: string, userName?: string, reason?: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Instância de workflow não encontrada');
    }

    if (instance.status !== 'ACTIVE') {
      throw new Error('Workflow não está ativo');
    }

    // Criar entrada no histórico
    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage: instance.currentStage,
        toStage: instance.currentStage,
        action: 'PAUSE',
        userId,
        userName,
        notes: reason || 'Workflow pausado',
      },
    });

    return await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'PAUSED',
      },
    });
  }

  /**
   * Retomar workflow pausado
   */
  async resume(instanceId: string, userId: string, userName?: string, notes?: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Instância de workflow não encontrada');
    }

    if (instance.status !== 'PAUSED') {
      throw new Error('Workflow não está pausado');
    }

    // Criar entrada no histórico
    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage: instance.currentStage,
        toStage: instance.currentStage,
        action: 'RESUME',
        userId,
        userName,
        notes: notes || 'Workflow retomado',
      },
    });

    return await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  /**
   * Completar workflow
   */
  async complete(instanceId: string, userId: string, userName?: string, notes?: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Instância de workflow não encontrada');
    }

    if (instance.status === 'COMPLETED') {
      throw new Error('Workflow já foi completado');
    }

    // Criar entrada no histórico
    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage: instance.currentStage,
        toStage: 'COMPLETED',
        action: 'COMPLETE',
        userId,
        userName,
        notes: notes || 'Workflow completado',
      },
    });

    return await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  /**
   * Cancelar workflow
   */
  async cancel(instanceId: string, userId: string, userName?: string, reason?: string) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Instância de workflow não encontrada');
    }

    if (['COMPLETED', 'CANCELLED'].includes(instance.status)) {
      throw new Error(`Workflow não pode ser cancelado. Status atual: ${instance.status}`);
    }

    // Criar entrada no histórico
    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage: instance.currentStage,
        toStage: 'CANCELLED',
        action: 'CANCEL',
        userId,
        userName,
        notes: reason || 'Workflow cancelado',
      },
    });

    return await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Registrar erro no workflow
   */
  async registerError(
    instanceId: string,
    userId: string,
    userName?: string,
    errorMessage?: string
  ) {
    const instance = await prisma.workflowInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance) {
      throw new Error('Instância de workflow não encontrada');
    }

    // Criar entrada no histórico
    await prisma.workflowHistory.create({
      data: {
        instanceId,
        fromStage: instance.currentStage,
        toStage: instance.currentStage,
        action: 'ERROR',
        userId,
        userName,
        notes: errorMessage || 'Erro no workflow',
      },
    });

    return await prisma.workflowInstance.update({
      where: { id: instanceId },
      data: {
        status: 'ERROR',
      },
    });
  }

  /**
   * Buscar histórico de uma instância
   */
  async getHistory(instanceId: string) {
    return await prisma.workflowHistory.findMany({
      where: { instanceId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Estatísticas de workflow
   */
  async getStatistics(definitionId: string, dataInicio?: Date, dataFim?: Date) {
    const whereClause: any = { definitionId };

    if (dataInicio && dataFim) {
      whereClause.createdAt = {
        gte: dataInicio,
        lte: dataFim,
      };
    }

    const instances = await prisma.workflowInstance.findMany({
      where: whereClause,
      include: {
        history: true,
      },
    });

    const total = instances.length;
    const active = instances.filter((i: any) => i.status === 'ACTIVE').length;
    const completed = instances.filter((i: any) => i.status === 'COMPLETED').length;
    const cancelled = instances.filter((i: any) => i.status === 'CANCELLED').length;
    const paused = instances.filter((i: any) => i.status === 'PAUSED').length;
    const error = instances.filter((i: any) => i.status === 'ERROR').length;

    // Tempo médio de conclusão
    const completedInstances = instances.filter(
      (i: any) => i.status === 'COMPLETED' && i.completedAt
    );

    let tempoMedioMinutos = 0;
    if (completedInstances.length > 0) {
      const totalMinutos = completedInstances.reduce((acc: number, i: any) => {
        const diff = i.completedAt!.getTime() - i.createdAt.getTime();
        return acc + diff / 1000 / 60; // converter para minutos
      }, 0);
      tempoMedioMinutos = Math.round(totalMinutos / completedInstances.length);
    }

    // Distribuição por estágio atual
    const porEstagio: Record<string, number> = {};
    instances
      .filter((i: any) => i.status === 'ACTIVE')
      .forEach((i: any) => {
        porEstagio[i.currentStage] = (porEstagio[i.currentStage] || 0) + 1;
      });

    return {
      total,
      porStatus: {
        active,
        completed,
        cancelled,
        paused,
        error,
      },
      tempoMedioMinutos,
      porEstagio,
      periodo: dataInicio &&
        dataFim && {
          inicio: dataInicio,
          fim: dataFim,
        },
    };
  }

  /**
   * Buscar workflows ativos por tempo de permanência no estágio
   */
  async findStaleWorkflows(definitionId: string, tempoLimiteMinutos: number) {
    const tempoLimite = new Date();
    tempoLimite.setMinutes(tempoLimite.getMinutes() - tempoLimiteMinutos);

    return await (prisma as any).workflowInstance.findMany({
      where: {
        definitionId,
        status: 'ACTIVE',
        updatedAt: {
          lte: tempoLimite,
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }
}

export default new WorkflowInstanceService();
