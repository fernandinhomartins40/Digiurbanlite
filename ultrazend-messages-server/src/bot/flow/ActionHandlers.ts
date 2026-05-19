/**
 * ActionHandlers
 * Handlers que executam ações reais via API do DigiUrban
 */

import { ActionHandler } from '../types';
import { getDigiUrbanIntegration } from '../DigiUrbanIntegration';

const integration = getDigiUrbanIntegration();

const ensureArray = (data: any) => (Array.isArray(data) ? data : []);

/**
 * Formata erros de forma amigável para o cidadão
 */
const formatFriendlyError = (error: any, fallback: string): string => {
  if (error?.response?.status === 404) {
    return '🔍 Não encontrado. Verifique os dados informados e tente novamente.';
  }
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return '🔒 Acesso não autorizado. Tente fazer login novamente.';
  }
  if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
    return '⚠️ Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
  }
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return '⏱️ A operação demorou muito. Tente novamente em instantes.';
  }
  const msg = error?.response?.data?.error || error?.message;
  if (msg && typeof msg === 'string' && msg.length < 200) {
    return `❌ ${msg}`;
  }
  return `❌ ${fallback}`;
};

const buildServiceOptions = (services: any[]) =>
  services
    .filter((service: any) => {
      // ✅ CRÍTICO: Validar se o serviço tem dados mínimos necessários
      if (!service?.id || !service?.name) {
        console.warn('[ActionHandlers] Serviço inválido ignorado:', service);
        return false;
      }
      return true;
    })
    .map((service: any) => ({
      id: service.id,
      label: service.name,
      description: service.description || service.category || 'Serviço municipal',
      metadata: { service },
    }));

const buildCategoryOptions = (categories: string[]) =>
  categories.map((category) => ({
    id: category,
    label: category,
    description: 'Categoria',
  }));

const buildProtocolOptions = (protocols: any[]) =>
  protocols
    .filter((protocol: any) => {
      // ✅ CRÍTICO: Validar se o protocolo tem dados mínimos necessários
      if (!protocol?.id || !protocol?.number) {
        console.warn('[ActionHandlers] Protocolo inválido ignorado:', protocol);
        return false;
      }
      return true;
    })
    .map((protocol: any) => ({
      id: protocol.id,
      label: `#${protocol.number} - ${protocol.title || 'Sem título'}`,
      description: protocol.status || 'Protocolo',
      metadata: {
        number: protocol.number,
        status: protocol.status,
        service: protocol.service,
        department: protocol.department,
      },
    }));

const buildFamilyOptions = (members: any[]) =>
  members.map((member: any) => ({
    id: member.member?.id || member.id,
    label: member.member?.name || member.name || 'Membro',
    description: member.relationship || 'Parentesco',
    metadata: {
      relationship: member.relationship,
      cpf: member.member?.cpf || member.cpf,
      birthDate: member.member?.birthDate || member.birthDate,
      isDependent: member.isDependent,
    },
  }));

const buildNotificationOptions = (notifications: any[]) =>
  notifications.map((notification: any) => ({
    id: notification.id,
    label: notification.title || notification.subject || 'Notificação',
    description: notification.message || notification.content || '',
    metadata: {
      title: notification.title || notification.subject,
      message: notification.message || notification.content,
      createdAt: notification.createdAt,
      type: notification.type,
      isRead: notification.isRead,
    },
  }));

const buildDocumentOptions = (documents: any[]) =>
  documents
    .filter((doc: any) => {
      // ✅ CRÍTICO: Validar se o documento tem dados mínimos necessários
      if (!doc?.id) {
        console.warn('[ActionHandlers] Documento inválido ignorado:', doc);
        return false;
      }
      return true;
    })
    .map((doc: any) => ({
      id: doc.id,
      label: doc.documentType || doc.name || doc.fileName || 'Documento',
      description: doc.fileName || doc.mimeType || doc.type || doc.category || 'Arquivo',
      metadata: {
        documentType: doc.documentType,
        name: doc.name || doc.fileName,
        type: doc.mimeType || doc.type,
        size: doc.size || doc.fileSize,
        uploadedAt: doc.uploadedAt || doc.createdAt,
        url: doc.fileUrl || doc.url || doc.filePath,
        protocolNumber: doc.protocol?.number,
      },
    }));

const buildInteractionOptions = (interactions: any[]) =>
  interactions.map((interaction: any, index: number) => ({
    id: interaction.id,
    label: `${index + 1}. ${interaction.type === 'MESSAGE' ? '💬' : interaction.type === 'STATUS_CHANGE' ? '🔄' : '📋'} ${interaction.authorName || 'Sistema'}`,
    description: (interaction.message || '').substring(0, 80),
    metadata: {
      type: interaction.type,
      authorType: interaction.authorType,
      authorName: interaction.authorName,
      message: interaction.message,
      createdAt: interaction.createdAt,
      isInternal: interaction.isInternal,
    },
  }));

// ====================================================
// SERVIÇOS
// ====================================================

export const searchServices: ActionHandler = async (params, _context) => {
  const { query, category, limit = 10 } = params;
  try {
    console.log('[ActionHandlers.searchServices] Buscando serviços, query:', query, 'category:', category, 'limit:', limit);
    const result = ensureArray(await integration.searchServices(query, category, limit));
    console.log('[ActionHandlers.searchServices] Serviços retornados:', result.length);

    const options = buildServiceOptions(result);
    console.log('[ActionHandlers.searchServices] Opções construídas:', options.length);

    // ✅ CRÍTICO: Sempre retornar count/services, mesmo vazio
    // Deixar o nodo condition validar se count === 0
    return { count: options.length, services: options, raw: result };
  } catch (error: any) {
    console.error('[ActionHandlers.searchServices] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível buscar serviços. Tente novamente.') };
  }
};

export const listServices: ActionHandler = async (params, _context) => {
  const { limit = 50 } = params;
  try {
    console.log('[ActionHandlers.listServices] Buscando serviços, limit:', limit);
    const result = ensureArray(await integration.listServices(limit));
    console.log('[ActionHandlers.listServices] Serviços retornados:', result.length);

    // ✅ CRÍTICO: NÃO retornar success=false quando não há dados
    // Deixar o nodo condition fazer a validação de count === 0
    if (result.length === 0) {
      console.warn('[ActionHandlers.listServices] Nenhum serviço ativo encontrado no banco');
      return { count: 0, services: [], raw: [] };
    }

    const options = buildServiceOptions(result);
    console.log('[ActionHandlers.listServices] Opções construídas:', options.length);

    // ✅ CRÍTICO: Se buildServiceOptions filtrou tudo, retornar array vazio
    if (options.length === 0) {
      console.error('[ActionHandlers.listServices] CRÍTICO: buildServiceOptions retornou array vazio!');
      return { count: 0, services: [], raw: result };
    }

    return { count: options.length, services: options, raw: result };
  } catch (error: any) {
    console.error('[ActionHandlers.listServices] Erro:', error?.message, error?.response?.data);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível listar serviços. Tente novamente.') };
  }
};

export const listServiceCategories: ActionHandler = async (_params, _context) => {
  try {
    const result = ensureArray(await integration.listServiceCategories());
    return { count: result.length, categories: buildCategoryOptions(result), raw: result };
  } catch (error: any) {
    console.error('[ActionHandlers.listServiceCategories] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível listar categorias. Tente novamente.') };
  }
};

export const getService: ActionHandler = async (params, _context) => {
  const { serviceId } = params;
  if (!serviceId) {
    return { success: false, error: '❌ ID do serviço não fornecido. Selecione um serviço da lista.' };
  }
  try {
    const result = await integration.getService(serviceId);
    return { service: result };
  } catch (error: any) {
    console.error('[ActionHandlers.getService] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível obter os detalhes do serviço.') };
  }
};

// ====================================================
// PROTOCOLOS
// ====================================================

export const createProtocol: ActionHandler = async (params, context) => {
  const { serviceId, description, customData, formData, documents, uploadedDocuments } = params;
  if (!serviceId) {
    return { success: false, error: '❌ Serviço não selecionado. Volte e escolha um serviço.' };
  }
  try {
    const resolvedDescription = description || formData?.description || formData?.descricao || '';
    const resolvedCustomData = customData || formData || {};
    const resolvedDocuments = documents || uploadedDocuments || [];

    const result = await integration.createProtocol({
      citizenId: context.citizenId,
      serviceId,
      description: resolvedDescription,
      customData: resolvedCustomData,
      documents: resolvedDocuments,
    });

    return { protocol: result?.protocol || result, warnings: result?.warnings };
  } catch (error: any) {
    console.error('[ActionHandlers.createProtocol] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível criar o protocolo. Verifique os dados e tente novamente.') };
  }
};

export const getProtocols: ActionHandler = async (params, context) => {
  const { limit = 10 } = params;
  try {
    console.log('[ActionHandlers.getProtocols] Buscando protocolos, citizenId:', context.citizenId, 'limit:', limit);
    const result = ensureArray(await integration.getProtocols(context.citizenId, limit));
    console.log('[ActionHandlers.getProtocols] Protocolos retornados:', result.length);

    // ✅ CRÍTICO: NÃO retornar success=false quando não há dados
    // Deixar o nodo condition fazer a validação de count === 0
    if (result.length === 0) {
      console.warn('[ActionHandlers.getProtocols] Nenhum protocolo encontrado para o cidadão');
      return { count: 0, protocols: [], raw: [] };
    }

    const options = buildProtocolOptions(result);
    console.log('[ActionHandlers.getProtocols] Opções construídas:', options.length);

    // ✅ CRÍTICO: Se buildProtocolOptions filtrou tudo, retornar array vazio
    if (options.length === 0) {
      console.error('[ActionHandlers.getProtocols] CRÍTICO: buildProtocolOptions retornou array vazio!');
      return { count: 0, protocols: [], raw: result };
    }

    return { count: options.length, protocols: options, raw: result };
  } catch (error: any) {
    console.error('[ActionHandlers.getProtocols] Erro:', error?.message, error?.response?.data);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível listar seus protocolos.') };
  }
};

export const getProtocolByNumber: ActionHandler = async (params, context) => {
  const { protocolNumber } = params;
  if (!protocolNumber) {
    return { success: false, error: '❌ Número do protocolo não fornecido. Digite o número do protocolo.' };
  }
  try {
    const result = await integration.getProtocolByNumber(protocolNumber, context.citizenId);
    return { protocol: result };
  } catch (error: any) {
    console.error('[ActionHandlers.getProtocolByNumber] Erro:', error?.message);
    if (error?.response?.status === 404) {
      return { success: false, error: `🔍 Protocolo "${protocolNumber}" não encontrado. Verifique o número e tente novamente.` };
    }
    return { success: false, error: formatFriendlyError(error, 'Não foi possível buscar o protocolo.') };
  }
};

export const getProtocolDetails: ActionHandler = async (params, context) => {
  const { protocolNumber } = params;
  if (!protocolNumber) {
    return { success: false, error: '❌ Número do protocolo não fornecido. Digite o número do protocolo.' };
  }
  try {
    const result = await integration.getProtocolByNumber(protocolNumber, context.citizenId);

    // Estruturar stages para o card
    const stages = (result.stages || []).map((stage: any) => ({
      id: stage.id,
      name: stage.stageName,
      order: stage.stageOrder,
      status: stage.status,
      startedAt: stage.startedAt,
      completedAt: stage.completedAt,
    }));

    const completedStages = stages.filter((s: any) => s.status === 'COMPLETED').length;
    const totalStages = stages.length;
    const isProtocolCompleted = result.status === 'CONCLUIDO';
    const progressPercent = isProtocolCompleted
      ? 100
      : totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    const protocolDetailCard = {
      type: 'protocol_detail',
      protocol: {
        id: result.id,
        number: result.number,
        title: result.title,
        status: result.status,
        priority: result.priority,
        createdAt: result.createdAt,
        concludedAt: result.concludedAt,
      },
      service: {
        name: result.service?.name,
        estimatedDays: result.service?.estimatedDays,
        category: result.service?.category,
      },
      department: {
        name: result.department?.name,
      },
      stages: isProtocolCompleted
        ? stages.map((s: any) => ({ ...s, status: 'COMPLETED' }))
        : stages,
      progress: {
        completed: isProtocolCompleted ? totalStages : completedStages,
        total: totalStages,
        percent: progressPercent,
      },
      sla: result.sla ? {
        expectedEndDate: result.sla.expectedEndDate,
        isOverdue: result.sla.isOverdue,
        daysOverdue: result.sla.daysOverdue,
      } : null,
      openPendingsCount: result._count?.pendings || 0,
    };

    return { protocol: result, protocolDetailCard };
  } catch (error: any) {
    console.error('[ActionHandlers.getProtocolDetails] Erro:', error?.message);
    if (error?.response?.status === 404) {
      return { success: false, error: `🔍 Protocolo "${protocolNumber}" não encontrado. Verifique o número e tente novamente.` };
    }
    return { success: false, error: formatFriendlyError(error, 'Não foi possível buscar o protocolo.') };
  }
};

export const addProtocolComment: ActionHandler = async (params, context) => {
  const { protocolId, comment, message } = params;
  const resolvedComment = comment || message;
  if (!protocolId || !resolvedComment) {
    return { success: false, error: '❌ Dados incompletos. Forneça o protocolo e o comentário.' };
  }
  try {
    const result = await integration.addProtocolComment(protocolId, context.citizenId, resolvedComment);
    return { comment: result };
  } catch (error: any) {
    console.error('[ActionHandlers.addProtocolComment] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível adicionar o comentário.') };
  }
};

/**
 * Lista interações/histórico de um protocolo
 */
export const getProtocolInteractions: ActionHandler = async (params, context) => {
  const { protocolId } = params;
  if (!protocolId) {
    return { success: false, error: '❌ ID do protocolo não fornecido.' };
  }
  try {
    const result = ensureArray(await integration.getProtocolInteractions(protocolId, context.citizenId));
    return {
      count: result.length,
      interactions: buildInteractionOptions(result),
      raw: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getProtocolInteractions] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível obter o histórico do protocolo.') };
  }
};

// ====================================================
// PERFIL
// ====================================================

export const getCitizenProfile: ActionHandler = async (_params, context) => {
  try {
    const result = await integration.getCitizen(context.citizenId);
    return { profile: result };
  } catch (error: any) {
    console.error('[ActionHandlers.getCitizenProfile] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível obter seu perfil.') };
  }
};

export const updateCitizenProfile: ActionHandler = async (params, context) => {
  // Filtrar apenas campos válidos para envio
  const allowedFields = ['name', 'email', 'phone', 'phoneSecondary', 'address', 'birthDate'];
  const updates: Record<string, any> = {};
  for (const field of allowedFields) {
    if (params[field] !== undefined && params[field] !== null && params[field] !== '') {
      updates[field] = params[field];
    }
  }

  // Fluxos usam "pular" como sentinela para não definir complemento de endereço.
  if (updates.address && typeof updates.address === 'object' && !Array.isArray(updates.address)) {
    const address = { ...(updates.address as any) };
    if (typeof address.complemento === 'string' && address.complemento.trim().toLowerCase() === 'pular') {
      delete address.complemento;
    }
    updates.address = address;
  }

  if (Object.keys(updates).length === 0) {
    return { success: false, error: '❌ Nenhum dado para atualizar.' };
  }

  try {
    const result = await integration.updateCitizenProfile(context.citizenId, updates);
    return { profile: result };
  } catch (error: any) {
    console.error('[ActionHandlers.updateCitizenProfile] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível atualizar seu perfil.') };
  }
};

// ====================================================
// FAMÍLIA
// ====================================================

export const getFamilyMembers: ActionHandler = async (_params, context) => {
  try {
    const result = ensureArray(await integration.getFamilyMembers(context.citizenId));
    const uniqueMembers = Array.from(
      new Map(result.map((item: any) => [item.member?.id || item.id, item])).values()
    );
    return { count: uniqueMembers.length, members: buildFamilyOptions(uniqueMembers), raw: uniqueMembers };
  } catch (error: any) {
    console.error('[ActionHandlers.getFamilyMembers] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível obter a composição familiar.') };
  }
};

// ====================================================
// NOTIFICAÇÕES
// ====================================================

export const getNotifications: ActionHandler = async (params, context) => {
  const { unreadOnly = false, limit = 20 } = params;
  try {
    const result = ensureArray(await integration.getNotifications(context.citizenId, unreadOnly, limit));
    return { count: result.length, notifications: buildNotificationOptions(result), raw: result };
  } catch (error: any) {
    console.error('[ActionHandlers.getNotifications] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível listar suas notificações.') };
  }
};

export const markNotificationsAsRead: ActionHandler = async (params, context) => {
  const { notificationIds, markAll } = params;
  try {
    // Se markAll=true, passa undefined para notificationIds (backend marca todas)
    const idsToMark = markAll ? undefined : notificationIds;
    const result = await integration.markNotificationsAsRead(context.citizenId, idsToMark);
    return { marked: true, result };
  } catch (error: any) {
    console.error('[ActionHandlers.markNotificationsAsRead] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível marcar as notificações como lidas.') };
  }
};

// ====================================================
// DOCUMENTOS
// ====================================================

/**
 * Lista documentos do cidadão
 */
export const getDocuments: ActionHandler = async (params, context) => {
  const { limit = 20 } = params;
  try {
    console.log('[ActionHandlers.getDocuments] Buscando documentos, citizenId:', context.citizenId, 'limit:', limit);
    const result = ensureArray(await integration.getDocuments(context.citizenId, limit));
    console.log('[ActionHandlers.getDocuments] Documentos retornados:', result.length);

    // ✅ CRÍTICO: NÃO retornar success=false quando não há dados
    // Deixar o nodo condition fazer a validação de count === 0
    if (result.length === 0) {
      console.warn('[ActionHandlers.getDocuments] Nenhum documento encontrado para o cidadão');
      return { count: 0, documents: [], raw: [] };
    }

    const options = buildDocumentOptions(result);
    console.log('[ActionHandlers.getDocuments] Opções construídas:', options.length);

    // ✅ CRÍTICO: Se buildDocumentOptions filtrou tudo, retornar array vazio
    if (options.length === 0) {
      console.error('[ActionHandlers.getDocuments] CRÍTICO: buildDocumentOptions retornou array vazio!');
      return { count: 0, documents: [], raw: result };
    }

    return { count: options.length, documents: options, raw: result };
  } catch (error: any) {
    console.error('[ActionHandlers.getDocuments] Erro:', error?.message, error?.response?.data);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível listar seus documentos.') };
  }
};

/**
 * Busca documentos de um protocolo específico
 */
export const getProtocolDocuments: ActionHandler = async (params, context) => {
  const { protocolId } = params;
  if (!protocolId) {
    return { success: false, error: '❌ ID do protocolo não fornecido.' };
  }
  try {
    const result = ensureArray(await integration.getProtocolDocuments(protocolId, context.citizenId));
    return { count: result.length, documents: buildDocumentOptions(result), raw: result };
  } catch (error: any) {
    console.error('[ActionHandlers.getProtocolDocuments] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível listar os documentos do protocolo.') };
  }
};

// ====================================================
// AVALIAÇÃO
// ====================================================

/**
 * Busca protocolos concluídos sem avaliação
 */
export const getPendingEvaluations: ActionHandler = async (_params, context) => {
  try {
    const result = ensureArray(await integration.getPendingEvaluations(context.citizenId));
    return {
      count: result.length,
      protocols: result.map((p: any) => ({
        id: p.id,
        label: `#${p.number} - ${p.title}`,
        description: `Concluído em ${p.concludedAt ? new Date(p.concludedAt).toLocaleDateString('pt-BR') : 'N/A'}`,
        metadata: { number: p.number, service: p.service, department: p.department },
      })),
      raw: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getPendingEvaluations] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível buscar avaliações pendentes.') };
  }
};

/**
 * Submete avaliação de protocolo
 */
export const submitEvaluation: ActionHandler = async (params, context) => {
  const { protocolId, rating, comment } = params;
  if (!protocolId || rating === undefined) {
    return { success: false, error: '❌ Protocolo e nota são obrigatórios para a avaliação.' };
  }
  try {
    // ✅ CRÍTICO: Converter rating para número inteiro
    // Menu nodes salvam o id como string ("1", "2", etc.)
    // mas a API espera Int
    const numericRating = typeof rating === 'string' ? parseInt(rating, 10) : Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return { success: false, error: '❌ Nota inválida. A nota deve ser um número entre 1 e 5.' };
    }
    const result = await integration.submitEvaluation(protocolId, context.citizenId, numericRating, comment);
    return { evaluation: result };
  } catch (error: any) {
    console.error('[ActionHandlers.submitEvaluation] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível enviar sua avaliação.') };
  }
};

// ====================================================
// REVISÃO
// ====================================================

export const formatProtocolReview: ActionHandler = async (_params, context) => {
  try {
    const { reviewText, reviewCard } = integration.formatProtocolReview(context.state);
    return { reviewText, reviewCard };
  } catch (error: any) {
    console.error('[ActionHandlers.formatProtocolReview] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível formatar a revisão.') };
  }
};

// ====================================================
// DEPARTAMENTOS E SERVIÇOS POR SECRETARIA
// ====================================================

/**
 * Lista departamentos que têm serviços ativos (para menu de secretarias)
 */
export const getDepartments: ActionHandler = async (_params, _context) => {
  try {
    const result = ensureArray(await integration.getDepartments());

    if (result.length === 0) {
      return { count: 0, departments: [], raw: [] };
    }

    const options = result.map((dept: any) => ({
      id: dept.id,
      label: `🏢 ${dept.name}`,
      name: dept.name,
      description: dept._count?.servicesSimplified
        ? `${dept._count.servicesSimplified} serviço(s)`
        : dept.description || 'Secretaria',
      serviceCount: dept._count?.servicesSimplified || 0,
    }));

    return { count: options.length, departments: options, raw: result };
  } catch (error: any) {
    console.error('[ActionHandlers.getDepartments] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível listar as secretarias.') };
  }
};

/**
 * Lista serviços de um departamento agrupados por categoria
 * Retorna texto formatado com subcategorias + opções para menu
 */
export const getServicesByDepartment: ActionHandler = async (params, _context) => {
  const { departmentId } = params;
  if (!departmentId) {
    return { success: false, error: '❌ Departamento não selecionado.' };
  }
  try {
    const result = await integration.getServicesByDepartment(departmentId);

    if (!result || result.totalServices === 0) {
      return { count: 0, services: [], categories: [], department: result?.department, raw: [] };
    }

    // Montar opções planas de serviços + categorias formatadas para carrossel
    const allServices: any[] = [];
    const formattedCategories: any[] = [];

    for (const cat of result.categories || []) {
      const catServices: any[] = [];
      for (const svc of cat.services || []) {
        const formatted = {
          id: svc.id,
          label: svc.name,
          description: `${cat.name} • ${svc.estimatedDays ? svc.estimatedDays + ' dias' : 'Prazo variável'}`,
          metadata: {
            category: cat.name,
            estimatedDays: svc.estimatedDays,
            requiresDocuments: svc.requiresDocuments,
            serviceType: svc.serviceType,
            requiresSpecificLocation: svc.requiresSpecificLocation,
          },
        };
        allServices.push(formatted);
        catServices.push(formatted);
      }
      formattedCategories.push({
        name: cat.name,
        count: cat.count,
        services: catServices,
      });
    }

    // Montar texto descritivo com categorias
    let catalogText = `🏢 **${result.department.name}**\n`;
    catalogText += `📋 ${result.totalServices} serviço(s) disponível(is)\n\n`;
    for (const cat of result.categories || []) {
      catalogText += `📁 **${cat.name}** (${cat.count})\n`;
      for (const svc of cat.services || []) {
        catalogText += `  • ${svc.name}\n`;
      }
      catalogText += `\n`;
    }

    return {
      count: allServices.length,
      services: allServices,
      categories: formattedCategories,
      catalogText,
      department: result.department,
      raw: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getServicesByDepartment] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível listar os serviços desta secretaria.') };
  }
};

/**
 * Processa o formSchema de um serviço e retorna as perguntas que o bot deve fazer
 * Filtra campos citizen_* (preenchidos automaticamente pelo backend)
 * Retorna array de perguntas para o FlowEngine processar campo por campo
 */
export const processFormSchema: ActionHandler = async (params, _context) => {
  const { serviceId } = params;
  if (!serviceId) {
    return { success: false, error: '❌ Serviço não selecionado.' };
  }
  try {
    const service = await integration.getService(serviceId);
    if (!service) {
      return { success: false, error: '❌ Serviço não encontrado.' };
    }

    const formSchema = service.formSchema;
    const questions: any[] = [];

    if (!formSchema) {
      // Serviço sem formulário — apenas descrição
      return {
        hasForm: false,
        questions: [],
        service,
        requiresDocuments: service.requiresDocuments,
        requiredDocuments: service.requiredDocuments,
      };
    }

    // JSON Schema format (properties)
    if (formSchema.properties && typeof formSchema.properties === 'object') {
      const requiredFields = Array.isArray(formSchema.required) ? formSchema.required : [];

      for (const [fieldId, schema] of Object.entries(formSchema.properties) as [string, any][]) {
        // Pular campos citizen_* (preenchidos pelo backend via JWT)
        if (fieldId.startsWith('citizen_')) continue;

        const question: any = {
          id: fieldId,
          label: schema.title || fieldId,
          required: requiredFields.includes(fieldId),
          type: 'text',
        };

        if (schema.description) {
          question.placeholder = schema.description;
        }

        // Determinar tipo
        if (schema.enum && Array.isArray(schema.enum)) {
          question.type = 'select';
          question.options = schema.enum.map((val: any) => ({
            id: String(val),
            label: String(val),
          }));
        } else if (schema.format === 'date') {
          question.type = 'date';
          question.validation = { type: 'text', minLength: 8, maxLength: 10, errorMessage: 'Data inválida. Use o formato DD/MM/AAAA' };
        } else if (schema.format === 'email') {
          question.type = 'email';
          question.validation = { type: 'email', errorMessage: 'Email inválido' };
        } else if (schema.type === 'integer' || schema.type === 'number') {
          question.type = 'number';
          question.validation = { type: 'number', errorMessage: 'Número inválido' };
        } else if (schema.type === 'boolean') {
          question.type = 'boolean';
          question.options = [
            { id: 'true', label: 'Sim' },
            { id: 'false', label: 'Não' },
          ];
        } else {
          // text com validações
          if (schema.minLength || schema.maxLength) {
            question.validation = {
              type: 'text',
              minLength: schema.minLength,
              maxLength: schema.maxLength,
            };
          }
        }

        questions.push(question);
      }
    }
    // Formato legado (fields array)
    else if (formSchema.fields && Array.isArray(formSchema.fields)) {
      for (const field of formSchema.fields) {
        if (field.id?.startsWith('citizen_')) continue;

        const question: any = {
          id: field.id || field.name,
          label: field.label || field.title || field.id,
          required: field.required || false,
          type: field.type || 'text',
        };

        if (field.placeholder) question.placeholder = field.placeholder;

        if (field.options && Array.isArray(field.options)) {
          question.type = 'select';
          question.options = field.options.map((opt: any) =>
            typeof opt === 'string' ? { id: opt, label: opt } : opt
          );
        }

        if (field.validation) {
          question.validation = field.validation;
        }

        questions.push(question);
      }
    }

    // Preparar info de documentos obrigatórios
    let requiredDocs: any[] = [];
    if (service.requiresDocuments && service.requiredDocuments) {
      const docs = typeof service.requiredDocuments === 'string'
        ? JSON.parse(service.requiredDocuments)
        : service.requiredDocuments;
      if (Array.isArray(docs)) {
        requiredDocs = docs;
      }
    }

    // Verificar se há documentos marcados como obrigatórios
    const hasRequiredDocuments = requiredDocs.some((doc: any) => doc.required !== false);

    return {
      hasForm: questions.length > 0,
      questions,
      totalQuestions: questions.length,
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        estimatedDays: service.estimatedDays,
        requiresDocuments: service.requiresDocuments,
        requiresSpecificLocation: service.requiresSpecificLocation,
        locationLabel: service.locationLabel,
        department: service.department,
      },
      requiresDocuments: service.requiresDocuments,
      requiredDocuments: requiredDocs,
      hasRequiredDocuments,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.processFormSchema] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível carregar o formulário do serviço.') };
  }
};

// ====================================================
// MAPA DE HANDLERS
// ====================================================

export const actionHandlers: Record<string, ActionHandler> = {
  searchServices,
  listServices,
  listServiceCategories,
  getService,
  createProtocol,
  getProtocols,
  getProtocolByNumber,
  getProtocolDetails,
  addProtocolComment,
  getProtocolInteractions,
  getCitizenProfile,
  updateCitizenProfile,
  getFamilyMembers,
  getNotifications,
  markNotificationsAsRead,
  getDocuments,
  getProtocolDocuments,
  getPendingEvaluations,
  submitEvaluation,
  formatProtocolReview,
  getDepartments,
  getServicesByDepartment,
  processFormSchema,
};

export default actionHandlers;
