/**
 * ActionHandlers
 * Handlers que executam ações reais via API do DigiUrban
 */

import { ActionHandler } from '../types';
import { getDigiUrbanIntegration } from '../DigiUrbanIntegration';

const integration = getDigiUrbanIntegration();

/**
 * Busca serviços disponíveis
 */
export const searchServices: ActionHandler = async (params, _context) => {
  console.log('[ActionHandlers.searchServices] Iniciando busca:', params);

  const { query, category, limit = 10 } = params;

  try {
    const result = await integration.searchServices(query, category, limit);

    return {
      success: true,
      data: result,
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
    const result = await integration.listServices(limit);

    return {
      success: true,
      data: result,
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
    const result = await integration.listServiceCategories();

    return {
      success: true,
      data: result,
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
      success: true,
      data: result,
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
    documents,
  } = params;

  if (!serviceId) {
    return {
      success: false,
      error: 'ID do serviço não fornecido',
    };
  }

  try {
    const result = await integration.createProtocol({
      citizenId: context.citizenId,
      serviceId,
      description,
      customData,
      documents,
    });

    console.log('[ActionHandlers.createProtocol] Protocolo criado:', result);

    return {
      success: true,
      data: result,
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
    const result = await integration.getProtocols(context.citizenId, limit);

    return {
      success: true,
      data: result,
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
      success: true,
      data: result,
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
  const { protocolId, comment } = params;

  if (!protocolId || !comment) {
    return {
      success: false,
      error: 'Dados incompletos para adicionar comentário',
    };
  }

  try {
    const result = await integration.addProtocolComment(protocolId, context.citizenId, comment);

    return {
      success: true,
      data: result,
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
      success: true,
      data: result,
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
      success: true,
      data: result,
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
    const result = await integration.getFamilyMembers(context.citizenId);

    return {
      success: true,
      data: result,
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
    const result = await integration.getNotifications(context.citizenId, unreadOnly, limit);

    return {
      success: true,
      data: result,
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
      success: true,
      data: result,
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
