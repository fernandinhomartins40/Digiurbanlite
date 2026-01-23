/**
 * ActionHandlers
 * Handlers que executam ações reais via API do DigiUrban
 */

import { ActionHandler } from '../types';
import { getDigiUrbanIntegration } from '../DigiUrbanIntegration';

const integration = getDigiUrbanIntegration();

const ensureArray = (data: any) => (Array.isArray(data) ? data : []);

const buildServiceOptions = (services: any[]) =>
  services.map((service: any) => ({
    id: service.id,
    label: service.name,
    description: service.description || service.category || 'Serviço',
    metadata: { service },
  }));

const buildCategoryOptions = (categories: string[]) =>
  categories.map((category) => ({
    id: category,
    label: category,
    description: 'Categoria',
  }));

const buildProtocolOptions = (protocols: any[]) =>
  protocols.map((protocol: any) => ({
    id: protocol.id,
    label: `#${protocol.number} - ${protocol.title}`,
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

/**
 * Busca serviços disponíveis
 */
export const searchServices: ActionHandler = async (params, _context) => {
  console.log('[ActionHandlers.searchServices] Iniciando busca:', params);

  const { query, category, limit = 10 } = params;

  try {
    const result = ensureArray(await integration.searchServices(query, category, limit));
    return {
      count: result.length,
      services: buildServiceOptions(result),
      raw: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.searchServices] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao buscar serviços',
    };
  }
};

/**
 * Lista todos os serviços
 */
export const listServices: ActionHandler = async (params, _context) => {
  const { limit = 50 } = params;

  try {
    const result = ensureArray(await integration.listServices(limit));
    return {
      count: result.length,
      services: buildServiceOptions(result),
      raw: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.listServices] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao listar serviços',
    };
  }
};

/**
 * Lista categorias de serviços
 */
export const listServiceCategories: ActionHandler = async (_params, _context) => {
  try {
    const result = ensureArray(await integration.listServiceCategories());
    return {
      count: result.length,
      categories: buildCategoryOptions(result),
      raw: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.listServiceCategories] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao listar categorias',
    };
  }
};

/**
 * Obtém detalhes de um serviço
 */
export const getService: ActionHandler = async (params, _context) => {
  const { serviceId } = params;

  if (!serviceId) {
    return {
      success: false,
      error: 'ID do serviço não fornecido',
    };
  }

  try {
    const result = await integration.getService(serviceId);
    return {
      service: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getService] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao obter serviço',
    };
  }
};

/**
 * Cria protocolo
 */
export const createProtocol: ActionHandler = async (params, context) => {
  console.log('[ActionHandlers.createProtocol] Criando protocolo:', {
    citizenId: context.citizenId,
    params,
  });

  const {
    serviceId,
    description,
    customData,
    formData,
    documents,
    uploadedDocuments,
  } = params;

  if (!serviceId) {
    return {
      success: false,
      error: 'ID do serviço não fornecido',
    };
  }

  try {
    const resolvedDescription =
      description ||
      formData?.description ||
      formData?.descricao ||
      '';
    const resolvedCustomData = customData || formData || {};
    const resolvedDocuments = documents || uploadedDocuments || [];

    const result = await integration.createProtocol({
      citizenId: context.citizenId,
      serviceId,
      description: resolvedDescription,
      customData: resolvedCustomData,
      documents: resolvedDocuments,
    });

    console.log('[ActionHandlers.createProtocol] Protocolo criado:', result);

    return {
      protocol: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.createProtocol] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar protocolo',
    };
  }
};

/**
 * Lista protocolos do cidadão
 */
export const getProtocols: ActionHandler = async (params, context) => {
  const { limit = 10 } = params;

  try {
    const result = ensureArray(await integration.getProtocols(context.citizenId, limit));
    return {
      count: result.length,
      protocols: buildProtocolOptions(result),
      raw: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getProtocols] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao listar protocolos',
    };
  }
};

/**
 * Busca protocolo por número
 */
export const getProtocolByNumber: ActionHandler = async (params, context) => {
  const { protocolNumber } = params;

  if (!protocolNumber) {
    return {
      success: false,
      error: 'Número do protocolo não fornecido',
    };
  }

  try {
    const result = await integration.getProtocolByNumber(protocolNumber, context.citizenId);

    return {
      protocol: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getProtocolByNumber] Erro:', error);
    return {
      success: false,
      error: error.message || 'Protocolo não encontrado',
    };
  }
};

/**
 * Adiciona comentário ao protocolo
 */
export const addProtocolComment: ActionHandler = async (params, context) => {
  const { protocolId, comment, message } = params;
  const resolvedComment = comment || message;

  if (!protocolId || !resolvedComment) {
    return {
      success: false,
      error: 'Dados incompletos para adicionar comentário',
    };
  }

  try {
    const result = await integration.addProtocolComment(
      protocolId,
      context.citizenId,
      resolvedComment
    );

    return {
      comment: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.addProtocolComment] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao adicionar comentário',
    };
  }
};

/**
 * Obtém perfil do cidadão
 */
export const getCitizenProfile: ActionHandler = async (_params, context) => {
  try {
    const result = await integration.getCitizen(context.citizenId);

    return {
      profile: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getCitizenProfile] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao obter perfil',
    };
  }
};

/**
 * Atualiza perfil do cidadão
 */
export const updateCitizenProfile: ActionHandler = async (params, context) => {
  const updates = params;

  try {
    const result = await integration.updateCitizenProfile(context.citizenId, updates);

    return {
      profile: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.updateCitizenProfile] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao atualizar perfil',
    };
  }
};

/**
 * Obtém composição familiar
 */
export const getFamilyMembers: ActionHandler = async (_params, context) => {
  try {
    const result = ensureArray(await integration.getFamilyMembers(context.citizenId));
    const uniqueMembers = Array.from(
      new Map(
        result.map((item: any) => [item.member?.id || item.id, item])
      ).values()
    );

    return {
      count: uniqueMembers.length,
      members: buildFamilyOptions(uniqueMembers),
      raw: uniqueMembers,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getFamilyMembers] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao obter composição familiar',
    };
  }
};

/**
 * Lista notificações
 */
export const getNotifications: ActionHandler = async (params, context) => {
  const { unreadOnly = false, limit = 20 } = params;

  try {
    const result = ensureArray(
      await integration.getNotifications(context.citizenId, unreadOnly, limit)
    );

    return {
      count: result.length,
      notifications: buildNotificationOptions(result),
      raw: result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.getNotifications] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao listar notificações',
    };
  }
};

/**
 * Marca notificações como lidas
 */
export const markNotificationsAsRead: ActionHandler = async (params, context) => {
  const { notificationIds } = params;

  try {
    const result = await integration.markNotificationsAsRead(context.citizenId, notificationIds);

    return {
      result,
    };
  } catch (error: any) {
    console.error('[ActionHandlers.markNotificationsAsRead] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao marcar notificações',
    };
  }
};

/**
 * Formata dados do protocolo para revisão
 */
export const formatProtocolReview: ActionHandler = async (_params, context) => {
  try {
    const reviewText = integration.formatProtocolReview(context.state);

    return {
      success: true,
      data: {
        reviewText,
      },
    };
  } catch (error: any) {
    console.error('[ActionHandlers.formatProtocolReview] Erro:', error);
    return {
      success: false,
      error: error.message || 'Erro ao formatar revisão',
    };
  }
};

/**
 * Mapa de handlers disponíveis
 */
export const actionHandlers: Record<string, ActionHandler> = {
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
};

export default actionHandlers;
