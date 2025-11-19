/**
 * ============================================================================
 * WORKFLOW DEFINITION SERVICE
 * ============================================================================
 *
 * Gerencia definições de workflows (templates de fluxos).
 * CRUD completo de WorkflowDefinition.
 */

import { PrismaClient } from '@prisma/client';
import {
  CreateWorkflowDefinitionDto,
  UpdateWorkflowDefinitionDto,
  WorkflowDefinitionData,
} from '../../types/workflow.types';

const prisma = new PrismaClient();

export class WorkflowDefinitionService {
  /**
   * Criar nova definição de workflow
   */
  async create(data: CreateWorkflowDefinitionDto): Promise<WorkflowDefinitionData> {
    const definition = await prisma.workflowDefinition.create({
      data: {
        name: data.name,
        description: data.description,
        module: data.module,
        stages: data.stages as any, // JSON
      },
    });

    return definition;
  }

  /**
   * Buscar definição por ID
   */
  async findById(id: string): Promise<WorkflowDefinitionData | null> {
    const definition = await prisma.workflowDefinition.findUnique({
      where: { id },
    });

    return definition;
  }

  /**
   * Buscar por módulo
   */
  async findByModule(module: string): Promise<WorkflowDefinitionData[]> {
    const definitions = await prisma.workflowDefinition.findMany({
      where: {
        module,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return definitions;
  }

  /**
   * Listar todas as definições ativas
   */
  async findAll(): Promise<WorkflowDefinitionData[]> {
    const definitions = await prisma.workflowDefinition.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        module: 'asc',
      },
    });

    return definitions;
  }

  /**
   * Atualizar definição
   */
  async update(
    id: string,
    data: UpdateWorkflowDefinitionDto
  ): Promise<WorkflowDefinitionData> {
    const definition = await prisma.workflowDefinition.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        stages: data.stages as any,
      },
    });

    return definition;
  }

  /**
   * Desativar definição
   */
  async deactivate(id: string): Promise<void> {
    await prisma.workflowDefinition.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  /**
   * Deletar definição (soft delete - apenas desativa)
   */
  async delete(id: string): Promise<void> {
    await this.deactivate(id);
  }

  /**
   * Criar versão nova de uma definição
   */
  async createNewVersion(id: string): Promise<WorkflowDefinitionData> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error('Workflow definition not found');
    }

    const newDefinition = await prisma.workflowDefinition.create({
      data: {
        name: original.name,
        description: original.description,
        module: original.module,
        version: (original.version || 1) + 1,
        stages: original.stages as any,
      },
    });

    // Desativar versão antiga
    await this.deactivate(id);

    return newDefinition;
  }
}

export const workflowDefinitionService = new WorkflowDefinitionService();
