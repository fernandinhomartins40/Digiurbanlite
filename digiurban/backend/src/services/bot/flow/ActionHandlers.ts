/**
 * ActionHandlers
 * Handlers que executam ações reais no backend (criar protocolo, buscar serviços, etc)
 */

import { PrismaClient } from '@prisma/client';
import { ActionHandler, ExecutionContext } from '../../../types/flow.types';

const prisma = new PrismaClient();

/**
 * Busca serviços disponíveis
 */
export const searchServices: ActionHandler = async (params, context) => {
  const { query, category, limit = 10 } = params;

  const where: any = {
    isActive: true,
  };

  if (query) {
    where.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      { keywords: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = category;
  }

  const services = await prisma.serviceSimplified.findMany({
    where,
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      estimatedDays: true,
      formSchema: true,
    },
  });

  return {
    services: services.map((s) => ({
      id: s.id,
      label: s.name,
      description: s.description,
      metadata: {
        category: s.category,
        estimatedDays: s.estimatedDays,
        formSchema: s.formSchema,
      },
    })),
    count: services.length,
  };
};

/**
 * Lista todos os serviços
 */
export const listServices: ActionHandler = async (params, context) => {
  const { limit = 20 } = params;

  const services = await prisma.serviceSimplified.findMany({
    where: { isActive: true },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      estimatedDays: true,
    },
    orderBy: { name: 'asc' },
  });

  return {
    services: services.map((s) => ({
      id: s.id,
      label: s.name,
      description: s.description,
      metadata: {
        category: s.category,
        estimatedDays: s.estimatedDays,
      },
    })),
    count: services.length,
  };
};

/**
 * Lista categorias de serviços
 */
export const listServiceCategories: ActionHandler = async (params, context) => {
  const categories = await prisma.serviceSimplified.findMany({
    where: { isActive: true },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' },
  });

  return {
    categories: categories
      .filter((c) => c.category)
      .map((c, index) => ({
        id: c.category!,
        label: c.category!,
      })),
  };
};

/**
 * Obtém detalhes de um serviço
 */
export const getService: ActionHandler = async (params, context) => {
  const { serviceId } = params;

  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    include: { department: true },
  });

  if (!service) {
    throw new Error('Serviço não encontrado');
  }

  return {
    service: {
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      estimatedDays: service.estimatedDays,
      formSchema: service.formSchema,
      department: service.department
        ? {
            id: service.department.id,
            name: service.department.name,
          }
        : null,
    },
  };
};

/**
 * Cria novo protocolo
 */
export const createProtocol: ActionHandler = async (params, context) => {
  const { serviceId, formData, documents } = params;

  // Busca serviço
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    include: { department: true },
  });

  if (!service) {
    throw new Error('Serviço não encontrado');
  }

  // Busca cidadão
  const citizen = await prisma.citizen.findUnique({
    where: { id: context.citizenId },
  });

  if (!citizen) {
    throw new Error('Cidadão não encontrado');
  }

  // Gera número do protocolo
  const protocolNumber = await generateProtocolNumber(citizen.municipioId || 'default');

  // Cria protocolo
  const protocol = await prisma.protocolSimplified.create({
    data: {
      number: protocolNumber,
      title: service.name,
      description: formData?.description || `Solicitação de ${service.name}`,
      serviceId: service.id,
      departmentId: service.departmentId,
      citizenId: context.citizenId,
      moduleType: service.moduleType || 'GENERAL',
      status: 'VINCULADO',
      priority: 3,
      customData: formData || {},
    },
  });

  // Cria histórico inicial
  await prisma.protocolHistorySimplified.create({
    data: {
      protocolId: protocol.id,
      action: 'Protocolo criado via DigiBot',
      userId: null,
      metadata: { origin: 'bot', flowId: context.flow.id, userName: 'DigiBot' },
    },
  });

  // Cria interação inicial
  await prisma.protocolInteraction.create({
    data: {
      protocolId: protocol.id,
      type: 'MESSAGE',
      authorType: 'SYSTEM',
      authorName: 'DigiBot',
      message: `Protocolo criado automaticamente via DigiBot.\n\nServiço: ${service.name}`,
      isInternal: false,
      isRead: false,
    },
  });

  // Processa documentos se houver
  if (documents && Array.isArray(documents) && documents.length > 0) {
    for (const doc of documents) {
      await prisma.protocolDocument.create({
        data: {
          protocolId: protocol.id,
          documentType: doc.documentType || 'OTHER',
          isRequired: false,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          status: 'UPLOADED',
          uploadedBy: context.citizenId,
        },
      });
    }
  }

  return {
    protocol: {
      id: protocol.id,
      number: protocol.number,
      title: protocol.title,
      status: protocol.status,
      createdAt: protocol.createdAt,
      estimatedDays: service.estimatedDays,
    },
  };
};

/**
 * Gera número único de protocolo
 */
async function generateProtocolNumber(municipioId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${year}`;

  const lastProtocol = await prisma.protocolSimplified.findFirst({
    where: {
      number: { startsWith: prefix },
    },
    orderBy: { createdAt: 'desc' },
  });

  let sequence = 1;
  if (lastProtocol) {
    const lastNumber = parseInt(lastProtocol.number.split('-').pop() || '0');
    sequence = lastNumber + 1;
  }

  return `${prefix}-${sequence.toString().padStart(6, '0')}`;
}

/**
 * Busca protocolos do cidadão
 */
export const getProtocols: ActionHandler = async (params, context) => {
  const { status, limit = 10 } = params;

  const where: any = {
    citizenId: context.citizenId,
  };

  if (status) {
    where.status = status;
  }

  const protocols = await prisma.protocolSimplified.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      service: {
        select: {
          name: true,
          category: true,
        },
      },
      department: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    protocols: protocols.map((p) => ({
      id: p.id,
      label: `${p.number} - ${p.title}`,
      description: `Status: ${p.status} | ${p.service?.name || ''}`,
      metadata: {
        number: p.number,
        status: p.status,
        createdAt: p.createdAt,
        service: p.service?.name,
        department: p.department?.name,
      },
    })),
    count: protocols.length,
  };
};

/**
 * Busca protocolo por número
 */
export const getProtocolByNumber: ActionHandler = async (params, context) => {
  const { protocolNumber } = params;

  const protocol = await prisma.protocolSimplified.findFirst({
    where: {
      number: protocolNumber,
      citizenId: context.citizenId,
    },
    include: {
      service: true,
      department: true,
    },
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado ou você não tem permissão para acessá-lo');
  }

  return {
    protocol: {
      id: protocol.id,
      number: protocol.number,
      title: protocol.title,
      description: protocol.description,
      status: protocol.status,
      priority: protocol.priority,
      createdAt: protocol.createdAt,
      updatedAt: protocol.updatedAt,
      service: protocol.service
        ? {
            name: protocol.service.name,
            estimatedDays: protocol.service.estimatedDays,
          }
        : null,
      department: protocol.department
        ? {
            name: protocol.department.name,
          }
        : null,
    },
  };
};

/**
 * Adiciona comentário ao protocolo
 */
export const addProtocolComment: ActionHandler = async (params, context) => {
  const { protocolId, message } = params;

  // Valida que o protocolo pertence ao cidadão
  const protocol = await prisma.protocolSimplified.findFirst({
    where: {
      id: protocolId,
      citizenId: context.citizenId,
    },
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // Busca nome do cidadão
  const citizen = await prisma.citizen.findUnique({
    where: { id: context.citizenId },
    select: { name: true },
  });

  // Cria interação
  await prisma.protocolInteraction.create({
    data: {
      protocolId,
      type: 'MESSAGE',
      authorType: 'CITIZEN',
      authorId: context.citizenId,
      authorName: citizen?.name || 'Cidadão',
      message,
      isInternal: false,
      isRead: false,
    },
  });

  return {
    success: true,
    message: 'Comentário adicionado com sucesso',
  };
};

/**
 * Obtém dados do perfil do cidadão
 */
export const getCitizenProfile: ActionHandler = async (params, context) => {
  const citizen = await prisma.citizen.findUnique({
    where: { id: context.citizenId },
  });

  if (!citizen) {
    throw new Error('Cidadão não encontrado');
  }

  return {
    profile: {
      name: citizen.name,
      cpf: citizen.cpf,
      email: citizen.email,
      phone: citizen.phone,
      phoneSecondary: citizen.phoneSecondary,
      birthDate: citizen.birthDate,
      address: citizen.address,
    },
  };
};

/**
 * Atualiza perfil do cidadão
 */
export const updateCitizenProfile: ActionHandler = async (params, context) => {
  const { name, email, phone, phoneSecondary, birthDate, address } = params;

  const updateData: any = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (phone) updateData.phone = phone;
  if (phoneSecondary !== undefined) updateData.phoneSecondary = phoneSecondary;
  if (birthDate) updateData.birthDate = new Date(birthDate);
  if (address) updateData.address = address;

  await prisma.citizen.update({
    where: { id: context.citizenId },
    data: updateData,
  });

  return {
    success: true,
    message: 'Perfil atualizado com sucesso',
  };
};

/**
 * Lista membros da família
 */
export const getFamilyMembers: ActionHandler = async (params, context) => {
  const members = await prisma.familyComposition.findMany({
    where: {
      headId: context.citizenId,
    },
    include: {
      member: {
        select: {
          id: true,
          name: true,
          cpf: true,
          birthDate: true,
          phone: true,
        },
      },
    },
  });

  return {
    members: members.map((m) => ({
      id: m.id,
      label: m.member.name,
      description: `${m.relationship} ${m.isDependent ? '(Dependente)' : ''}`,
      metadata: {
        memberId: m.member.id,
        relationship: m.relationship,
        isDependent: m.isDependent,
        cpf: m.member.cpf,
        birthDate: m.member.birthDate,
      },
    })),
    count: members.length,
  };
};

/**
 * Lista notificações do cidadão
 */
export const getNotifications: ActionHandler = async (params, context) => {
  const { unreadOnly = false, limit = 10 } = params;

  const where: any = {
    citizenId: context.citizenId,
  };

  if (unreadOnly) {
    where.isRead = false;
  }

  const notifications = await prisma.notification.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return {
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      isRead: n.isRead,
      createdAt: n.createdAt,
    })),
    count: notifications.length,
  };
};

/**
 * Marca notificações como lidas
 */
export const markNotificationsAsRead: ActionHandler = async (params, context) => {
  const { notificationIds } = params;

  if (notificationIds && Array.isArray(notificationIds)) {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        citizenId: context.citizenId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  } else {
    // Marca todas como lidas
    await prisma.notification.updateMany({
      where: {
        citizenId: context.citizenId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  return {
    success: true,
    message: 'Notificações marcadas como lidas',
  };
};

/**
 * Formata dados para revisão antes de criar protocolo
 */
export const formatProtocolReview: ActionHandler = async (params, context) => {
  const { serviceId, formData, documents } = params;

  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
  });

  const lines: string[] = [];
  lines.push(`**Serviço:** ${service?.name || 'N/A'}`);
  lines.push(`**Prazo Estimado:** ${service?.estimatedDays || 0} dias úteis`);
  lines.push('');
  lines.push('**Dados Informados:**');

  if (formData) {
    for (const [key, value] of Object.entries(formData)) {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
      lines.push(`- ${label}: ${value}`);
    }
  }

  if (documents && Array.isArray(documents) && documents.length > 0) {
    lines.push('');
    lines.push(`**Documentos:** ${documents.length} arquivo(s)`);
  }

  return {
    reviewText: lines.join('\n'),
  };
};

/**
 * Handler especial para iniciar outro fluxo
 * NOTA: Este handler não pode ser usado diretamente, deve ser tratado pelo FlowEngine
 */
export const startFlow: ActionHandler = async (params, context) => {
  throw new Error(
    'startFlow action must be handled by FlowEngine, not executed directly'
  );
};

/**
 * Mapa de todos os handlers disponíveis
 */
export const actionHandlers = {
  searchServices,
  listServices,
  listServiceCategories,
  getService,
  createProtocol,
  getProtocols,
  getProtocolByNumber,
  addProtocolComment,
  getCitizenProfile,
  updateCitizenProfile,
  getFamilyMembers,
  getNotifications,
  markNotificationsAsRead,
  formatProtocolReview,
  startFlow, // Handler especial
};
