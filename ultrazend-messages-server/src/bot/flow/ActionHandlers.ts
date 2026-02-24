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
  const { notificationIds } = params;
  try {
    const result = await integration.markNotificationsAsRead(context.citizenId, notificationIds);
    return { result };
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
    const result = await integration.submitEvaluation(protocolId, context.citizenId, rating, comment);
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
    const reviewText = integration.formatProtocolReview(context.state);
    return { reviewText };
  } catch (error: any) {
    console.error('[ActionHandlers.formatProtocolReview] Erro:', error?.message);
    return { success: false, error: formatFriendlyError(error, 'Não foi possível formatar a revisão.') };
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
};

export default actionHandlers;
