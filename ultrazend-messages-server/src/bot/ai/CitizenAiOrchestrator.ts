import { FlowExecution } from '@prisma/client';
import { FlowStateManager } from '../flow/FlowStateManager';
import { actionHandlers } from '../flow/ActionHandlers';
import { BotResponse, ExecutionContext, FlowNode, MenuOption } from '../types';
import { citizenAiClient } from './CitizenAiClient';
import { getDigiUrbanIntegration } from '../DigiUrbanIntegration';
import { CitizenAiDecision, CitizenAiSessionState, CitizenAiStage } from './types';
import { detectReservedAction, RESERVED_RESPONSES } from '../ReservedKeywords';

const QUICK_ACTIONS: MenuOption[] = [
  { id: 'solicitar_servico', label: 'Solicitar servico', description: 'Abrir uma nova solicitacao guiada' },
  { id: 'explorar_secretarias', label: 'Explorar por secretaria', description: 'Ver servicos por secretaria' },
  { id: 'consultar_protocolo', label: 'Consultar protocolo', description: 'Acompanhar andamento' },
  { id: 'meu_perfil', label: 'Meu perfil', description: 'Ver e atualizar dados' },
  { id: 'documentos', label: 'Meus documentos', description: 'Consultar arquivos enviados' },
  { id: 'ajuda', label: 'Ajuda', description: 'Tirar duvidas' },
];

const CONTEXTUAL_ACTIONS: MenuOption[] = [
  ...QUICK_ACTIONS,
  { id: 'minha_familia', label: 'Minha familia', description: 'Ver dependentes e composicao familiar' },
  { id: 'notificacoes', label: 'Notificacoes', description: 'Ver avisos e comunicados' },
  { id: 'avaliacao', label: 'Avaliar atendimento', description: 'Registrar uma avaliacao' },
];

const SERVICE_ENTRY_ACTIONS: MenuOption[] = [
  { id: 'descrever_solicitacao', label: 'Descrever com minhas palavras', description: 'Eu digo o que preciso e o bot sugere o servico' },
  { id: 'explorar_secretarias', label: 'Explorar por secretaria', description: 'Escolher primeiro a secretaria responsavel' },
  { id: 'consultar_protocolo', label: 'Consultar protocolo', description: 'Acompanhar uma solicitacao existente' },
  { id: 'voltar_menu', label: 'Voltar ao menu', description: 'Retornar para as opcoes iniciais' },
];

const PROTOCOL_ENTRY_ACTIONS: MenuOption[] = [
  { id: 'informar_numero', label: 'Informar numero do protocolo', description: 'Digitar o numero exato para consultar' },
  { id: 'listar_protocolos', label: 'Meus protocolos', description: 'Ver seus protocolos recentes' },
  { id: 'ultimo_protocolo', label: 'Ultimo protocolo', description: 'Abrir o protocolo mais recente' },
  { id: 'voltar_menu', label: 'Voltar ao menu', description: 'Retornar para as opcoes iniciais' },
];

const LEGACY_FLOW_BY_INTENT: Record<string, string> = {
  meu_perfil: 'meu_perfil',
  documentos: 'documentos',
  minha_familia: 'minha_familia',
  notificacoes: 'notificacoes',
  avaliacao: 'avaliacao',
  ajuda: 'ajuda',
};

const HUMAN_PATTERNS = [
  'humano',
  'atendente',
  'servidor',
  'pessoa real',
  'falar com alguem',
  'falar com humano',
  'falar com atendente',
  'quero falar com humano',
  'quero falar com atendente',
  'suporte humano',
];
const MENU_PATTERNS = [
  'menu',
  'menu principal',
  'voltar menu',
  'voltar ao menu',
  'inicio',
  'inicial',
  'pagina inicial',
  'tela inicial',
  'reiniciar',
  'recomecar',
  'comecar de novo',
  'novo atendimento',
];
const HELP_PATTERNS = ['ajuda', 'preciso de ajuda', 'duvida', 'duvidas', 'como funciona'];
const PROFILE_PATTERNS = ['meu perfil', 'perfil', 'meus dados', 'meus dados cadastrais', 'cadastro', 'cpf', 'telefone', 'endereco'];
const DOCUMENT_PATTERNS = ['documentos', 'documento', 'meus documentos', 'meus arquivos', 'arquivos', 'anexos', '2 via', 'segunda via', 'certidao', 'carteira'];
const PENDING_PATTERNS = ['pendencias', 'pendencia', 'minhas pendencias', 'pendencia do protocolo', 'pendencias do protocolo', 'resolver pendencia'];
const SERVICE_PATTERNS = ['solicitar servico', 'servico', 'servicos', 'abrir solicitacao', 'nova solicitacao', 'novo protocolo', 'quero solicitar', 'pedido', 'solicitacao', 'chamado', 'criar chamado'];
const DEPARTMENT_PATTERNS = ['secretaria', 'secretarias', 'explorar secretaria', 'explorar por secretaria', 'navegar por secretaria'];
const FAMILY_PATTERNS = ['familia', 'minha familia', 'dependentes', 'composicao familiar'];
const NOTIFICATION_PATTERNS = ['notificacoes', 'notificacao', 'avisos', 'comunicados', 'alertas'];
const EVALUATION_PATTERNS = ['avaliacao', 'avaliar', 'avaliar atendimento', 'nota do atendimento', 'nota', 'satisfacao'];
const YES_PATTERNS = ['sim', 'confirmar', 'confirmo', 'ok', 'pode enviar', 'prosseguir'];
const NO_PATTERNS = ['nao', 'não', 'cancelar', 'corrigir', 'voltar', 'outro'];

const CORRECTION_PATTERNS = ['corrigir', 'corrija', 'alterar', 'altere', 'mudar', 'trocar', 'na verdade', 'o correto', 'esta errado', 'está errado', 'errei'];

const CONTINUE_PATTERNS = ['continuar', 'continue', 'seguir', 'prosseguir', 'manter atendimento'];

type ExecutionLike = FlowExecution & { flow?: { id: string; name: string } | null };
type FieldDef = { id: string; label: string; type?: string; required?: boolean; options?: Array<{ id?: string; label?: string; value?: string }> };

export class CitizenAiOrchestrator {
  private readonly stateManager = new FlowStateManager();
  private readonly integration = getDigiUrbanIntegration();
  private readonly stats = { sessionsStarted: 0, aiTurns: 0, lowConfidenceFallbacks: 0, legacyRedirects: 0, protocolsCreated: 0, protocolLookups: 0, humanHandoverRequests: 0 };

  async startSession(params: { citizenId: string; flowId: string; conversationId: string; existingExecution?: ExecutionLike | null }): Promise<{ execution: FlowExecution; response: BotResponse }> {
    const execution = await this.ensureExecution(params);
    const session = this.getSessionState(execution);
    this.stats.sessionsStarted += 1;
    if (params.existingExecution && session.stage !== 'triage') {
      return { execution, response: this.buildResumeResponse(execution, session) };
    }
    return { execution, response: this.buildWelcomeResponse(execution, session) };
  }

  async processText(params: { citizenId: string; flowId: string; conversationId: string; message: string; existingExecution?: ExecutionLike | null; recentMessages: string[] }): Promise<CitizenAiDecision> {
    const execution = await this.ensureExecution(params);
    const session = this.getSessionState(execution);
    const message = params.message.trim();

    // ── Palavras reservadas globais (prioridade máxima) ──────────────────────
    const reservedAction = detectReservedAction(message);

    if (reservedAction === 'cancel') {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return {
        session: next,
        response: {
          message: RESERVED_RESPONSES.cancel + '\n\nO que você gostaria de fazer?',
          messageType: 'menu',
          data: { options: QUICK_ACTIONS },
          metadata: this.meta(execution, next, true),
        },
      };
    }

    if (reservedAction === 'human') {
      this.stats.humanHandoverRequests += 1;
      const next = this.withStage(session, 'paused_human');
      await this.persistSession(execution.id, next);
      return {
        session: next,
        requestHumanHandover: true,
        handoverReason: 'citizen_request',
        response: {
          message: RESERVED_RESPONSES.human,
          messageType: 'text',
          metadata: this.meta(execution, next, false),
        },
      };
    }

    if (reservedAction === 'menu') {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    if (reservedAction === 'help') {
      const next = { ...session, lastIntent: 'ajuda' as const };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return {
        session: next,
        redirectToFlowName: LEGACY_FLOW_BY_INTENT.ajuda,
        response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) },
      };
    }

    if (reservedAction === 'back') {
      // Volta ao menu quando não há etapa anterior definida
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }
    // ─────────────────────────────────────────────────────────────────────────

    const globalShortcut = this.isFlowLockedStage(session.stage)
      ? await this.handleLockedFlowShortcut(execution, session, message)
      : await this.handleGlobalShortcut(execution, session, message);
    if (globalShortcut) return globalShortcut;

    if (session.stage === 'awaiting_request_mode') return this.handleRequestMode(execution, session, message);
    if (session.stage === 'awaiting_department_selection') return this.handleDepartmentSelection(execution, session, message);
    if (session.stage === 'awaiting_service_selection') return this.handleServiceSelection(execution, session, message);
    if (session.stage === 'awaiting_protocol_lookup_mode') return this.handleProtocolLookupMode(execution, session, message);
    if (session.stage === 'awaiting_protocol_number') return this.handleProtocolLookup(execution, session, message);
    if (session.stage === 'awaiting_protocol_selection') return this.handleProtocolSelection(execution, session, message);
    if (session.stage === 'awaiting_protocol_pending_selection') return this.handleProtocolPendingSelection(execution, session, message);
    if (session.stage === 'awaiting_protocol_pending_text_resolution') return this.handleProtocolPendingTextResolution(execution, session, message);
    if (session.stage === 'awaiting_protocol_pending_document_upload') {
      return { session, response: { message: 'Estou aguardando o envio do documento solicitado para resolver a pendencia.', messageType: 'text', metadata: this.meta(execution, session, true) } };
    }
    if (session.stage === 'collecting_fields') return this.handleFieldCollection(execution, session, message);
    if (session.stage === 'awaiting_review_confirmation') return this.handleReviewConfirmation(execution, session, message);
    if (session.stage === 'awaiting_correction_field') return this.handleCorrectionFieldSelection(execution, session, message);
    if (session.stage === 'awaiting_documents') return { session, response: { message: 'Ainda estou aguardando o envio dos documentos obrigatorios.', messageType: 'text', metadata: this.meta(execution, session, true) } };
    if (session.stage === 'paused_human') return { session, response: { message: 'Sua conversa esta pausada para atendimento humano. Aguarde um servidor assumir.', messageType: 'text', metadata: this.meta(execution, session, false, { paused: true }) } };

    return this.handleTriage(execution, session, message, params.recentMessages);
  }

  async processUpload(params: { citizenId: string; flowId: string; conversationId: string; files: Array<Record<string, unknown>>; existingExecution?: ExecutionLike | null }): Promise<CitizenAiDecision> {
    const execution = await this.ensureExecution(params);
    const session = this.getSessionState(execution);
    if (session.stage === 'awaiting_protocol_pending_document_upload') {
      return this.handleProtocolPendingDocumentUpload(execution, session, params.files);
    }
    if (session.stage !== 'awaiting_documents') {
      return { session, response: { message: 'Arquivos recebidos, mas eu nao estava aguardando documentos neste momento.', messageType: 'text', metadata: this.meta(execution, session, true) } };
    }

    const requiredDocuments = this.getRequiredDocuments(session);
    const uploadedDocuments = [...(session.uploadedDocuments || []), ...params.files];

    if (requiredDocuments.length > 0) {
      const missingDocuments = requiredDocuments
        .filter((doc) => doc.required !== false)
        .filter((doc) => !uploadedDocuments.some((file) => this.matchesRequiredDocument(file, doc)));

      if (missingDocuments.length > 0) {
        const uploadConfig = this.getUploadConfig();
        return {
          session,
          response: {
            message: `Ainda faltam documentos obrigatorios: ${missingDocuments.map((doc) => doc.name || doc.id).join(', ')}. Envie todos os itens solicitados para continuar.`,
            messageType: 'upload',
            data: {
              uploadConfig,
              requiredDocuments,
            } as any,
            metadata: this.meta(execution, session, true, {
              uploadConfig,
              requiredDocuments,
            }),
          },
        };
      }
    }

    const next: CitizenAiSessionState = { ...session, uploadedDocuments, stage: 'awaiting_review_confirmation' };
    next.reviewText = await this.buildReviewText(execution, next);
    await this.persistSession(execution.id, next);
    return { session: next, response: this.buildReviewResponse(execution, next) };
  }

  getStats() { return { ...this.stats, aiAvailable: citizenAiClient.available() }; }

  private async handleTriage(execution: FlowExecution, session: CitizenAiSessionState, message: string, recentMessages: string[]): Promise<CitizenAiDecision> {
    const normalized = this.normalize(message);
    const protocolNumber = this.extractProtocolNumber(message);
    const explicitIntent = this.matchExplicitIntent(normalized);
    const protocolMode = this.detectProtocolMode(message);

    if (this.isGreeting(message) || !normalized) {
      const next: CitizenAiSessionState = { ...session, stage: 'triage', lastIntent: 'greeting' };
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    if (explicitIntent === 'solicitar_servico') {
      const next: CitizenAiSessionState = { ...session, stage: 'awaiting_request_mode', lastIntent: 'solicitar_servico' };
      await this.persistSession(execution.id, next);
      return this.buildGuidedServiceEntry(execution, next);
    }

    if (explicitIntent === 'explorar_secretarias') {
      const next: CitizenAiSessionState = { ...session, lastIntent: 'solicitar_servico' };
      await this.persistSession(execution.id, next);
      return this.presentDepartments(execution, next);
    }

    if (explicitIntent === 'consultar_protocolo' || protocolNumber || protocolMode) {
      const next: CitizenAiSessionState = { ...session, lastIntent: 'consultar_protocolo' };
      return this.handleProtocolIntent(execution, next, message);
    }

    if (explicitIntent && LEGACY_FLOW_BY_INTENT[explicitIntent]) {
      const next = { ...session, lastIntent: explicitIntent as CitizenAiSessionState['lastIntent'] };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return { session: next, redirectToFlowName: LEGACY_FLOW_BY_INTENT[explicitIntent], response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) } };
    }

    const departmentDecision = await this.tryDepartmentShortcut(execution, { ...session, lastIntent: 'solicitar_servico' }, message);
    if (departmentDecision) return departmentDecision;

    if (this.shouldTryDirectServiceSearch(message)) {
      const serviceDecision = await this.beginServiceRequest(execution, { ...session, lastIntent: 'solicitar_servico' }, message, message, true);
      if (serviceDecision.session.stage !== 'awaiting_request_mode') {
        return serviceDecision;
      }
    }

    this.stats.aiTurns += 1;
    const analysis = (await citizenAiClient.analyzeTurn({
      citizenId: execution.citizenId,
      message,
      recentMessages,
      sessionContext: this.buildSessionContext(session),
    })) || { intent: 'unknown', confidence: 0.25, protocolNumber };
    const next: CitizenAiSessionState = { ...session, lastIntent: analysis.intent as CitizenAiSessionState['lastIntent'] };

    if (analysis.intent === 'consultar_protocolo') {
      return this.handleProtocolIntent(execution, next, analysis.protocolNumber || message);
    }

    if (analysis.intent === 'solicitar_servico') return this.beginServiceRequest(execution, next, message, analysis.serviceQuery || message, true);
    if (analysis.intent === 'corrigir_dados') return this.buildContextualCorrectionFallback(execution, next);
    if (analysis.intent === 'atendimento_humano') {
      this.stats.humanHandoverRequests += 1;
      const paused = this.withStage(next, 'paused_human');
      await this.persistSession(execution.id, paused);
      return { session: paused, requestHumanHandover: true, handoverReason: 'citizen_request', response: { message: 'Entendi. Vou registrar que voce deseja atendimento humano.', messageType: 'text', metadata: this.meta(execution, paused, false) } };
    }

    const legacyFlowName = LEGACY_FLOW_BY_INTENT[String(analysis.intent || '')];
    if (legacyFlowName) {
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return { session: next, redirectToFlowName: legacyFlowName, response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) } };
    }

    if (Number(analysis.confidence || 0) < 0.45) this.stats.lowConfidenceFallbacks += 1;
    return this.buildAiGuidedFallback(execution, next, message, recentMessages, 'Nenhum servico ou protocolo foi identificado com seguranca.');
  }

  private async handleRequestMode(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const intent = this.matchExplicitIntent(this.normalize(userMessage));
    const protocolMode = this.detectProtocolMode(userMessage);
    if (intent === 'descrever_solicitacao') {
      await this.persistSession(execution.id, session);
      return {
        session,
        response: {
          message: 'Perfeito. Descreva com suas palavras o servico ou problema que voce quer resolver.',
          messageType: 'text',
          metadata: this.meta(execution, session, true),
        },
      };
    }
    if (intent === 'explorar_secretarias') return this.presentDepartments(execution, session);
    if (intent === 'consultar_protocolo' || protocolMode) return this.handleProtocolIntent(execution, { ...session, lastIntent: 'consultar_protocolo' }, userMessage);
    if (intent === 'voltar_menu') {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    if (this.matchesAny(this.normalize(userMessage), CONTINUE_PATTERNS)) {
      return this.buildGuidedServiceEntry(execution, session);
    }

    return this.beginServiceRequest(execution, { ...session, lastIntent: 'solicitar_servico' }, userMessage, userMessage, true);
  }

  private async presentDepartments(execution: FlowExecution, session: CitizenAiSessionState): Promise<CitizenAiDecision> {
    const departmentsResult = await this.runAction('getDepartments', {}, execution, session);
    const departments = Array.isArray(departmentsResult.departments) ? departmentsResult.departments as MenuOption[] : [];
    if (!departments.length) {
      const next = this.withStage(session, 'awaiting_request_mode');
      await this.persistSession(execution.id, next);
      return { session: next, response: { message: 'Nao encontrei secretarias com servicos ativos agora. Descreva sua necessidade e eu tento localizar o servico por texto.', messageType: 'menu', data: { options: SERVICE_ENTRY_ACTIONS }, metadata: this.meta(execution, next, true) } };
    }

    const next: CitizenAiSessionState = { ...session, stage: 'awaiting_department_selection', departmentCandidates: departments };
    await this.persistSession(execution.id, next);
    return {
      session: next,
      response: {
        message: 'Escolha a secretaria para eu listar os servicos disponiveis.',
        messageType: 'menu',
        data: { options: departments, displayMode: 'department_carousel' } as any,
        metadata: this.meta(execution, next, true, { displayMode: 'department_carousel' }),
      },
    };
  }

  private async handleDepartmentSelection(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const departments = Array.isArray(session.departmentCandidates) ? session.departmentCandidates : [];
    const selectedDepartment = this.findOptionByInput(userMessage, departments);
    if (!selectedDepartment) {
      return {
        session,
        response: {
          message: 'Nao consegui identificar a secretaria. Selecione uma opcao da lista.',
          messageType: 'menu',
          data: { options: departments, displayMode: 'department_carousel' } as any,
          metadata: this.meta(execution, session, true, { displayMode: 'department_carousel' }),
        },
      };
    }

    const result = await this.runAction('getServicesByDepartment', { departmentId: selectedDepartment.id }, execution, session);
    const services = Array.isArray(result.services) ? result.services as MenuOption[] : [];
    if (!services.length) {
      const next: CitizenAiSessionState = {
        ...session,
        stage: 'awaiting_request_mode',
        selectedDepartmentId: selectedDepartment.id,
        selectedDepartmentName: selectedDepartment.label,
      };
      await this.persistSession(execution.id, next);
      return {
        session: next,
        response: {
          message: `A ${selectedDepartment.label} nao possui servicos ativos para selecao agora. Descreva sua necessidade com mais detalhes ou escolha outra secretaria.`,
          messageType: 'menu',
          data: { options: SERVICE_ENTRY_ACTIONS },
          metadata: this.meta(execution, next, true),
        },
      };
    }

    const next: CitizenAiSessionState = {
      ...session,
      stage: 'awaiting_service_selection',
      selectedDepartmentId: selectedDepartment.id,
      selectedDepartmentName: result.department?.name || selectedDepartment.label,
      serviceCandidates: services,
    };
    await this.persistSession(execution.id, next);
    return {
      session: next,
      response: {
        message: `Servicos disponiveis em ${next.selectedDepartmentName || 'secretaria selecionada'}. Escolha uma opcao para continuar.`,
        messageType: 'menu',
        data: {
          options: services,
          categories: Array.isArray(result.categories) ? result.categories : undefined,
          departmentName: String(result.department?.name || selectedDepartment.label),
          displayMode: 'service_carousel',
        } as any,
        metadata: this.meta(execution, next, true, {
          categories: Array.isArray(result.categories) ? result.categories : undefined,
          departmentName: String(result.department?.name || selectedDepartment.label),
          displayMode: 'service_carousel',
        }),
      },
    };
  }

  private async beginServiceRequest(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string, searchQuery: string, guidedFallback: boolean = false): Promise<CitizenAiDecision> {
    const searchResult = await this.runAction('searchServices', { query: searchQuery, limit: 6 }, execution, session);
    const services = Array.isArray(searchResult.services) ? searchResult.services as MenuOption[] : [];
    if (!services.length) {
      const next = { ...session, stage: guidedFallback ? 'awaiting_request_mode' as const : session.stage, serviceSearchQuery: searchQuery, lowConfidenceFallbacks: (session.lowConfidenceFallbacks || 0) + 1 };
      await this.persistSession(execution.id, next);
      if (guidedFallback) {
        return this.buildAiGuidedFallback(
          execution,
          next,
          userMessage,
          [],
          `A busca interna por servicos para "${searchQuery}" nao retornou resultado exato.`
        );
      }
      return {
        session: next,
        response: {
          message: 'Nao encontrei um servico claro para essa solicitacao. Descreva com mais detalhes o que precisa.',
          messageType: 'text',
          metadata: this.meta(execution, next, true),
        },
      };
    }

    if (services.length === 1) return this.selectServiceById(execution, session, userMessage, services[0].id, services);
    const wait: CitizenAiSessionState = { ...session, stage: 'awaiting_service_selection', serviceSearchQuery: searchQuery, serviceCandidates: services };
    await this.persistSession(execution.id, wait);
    return {
      session: wait,
      response: {
        message: 'Encontrei estes servicos mais proximos. Escolha o que melhor representa sua necessidade.',
        messageType: 'menu',
        data: {
          options: services,
          displayMode: 'service_carousel',
          departmentName: 'Servicos sugeridos',
        } as any,
        metadata: this.meta(execution, wait, true, {
          displayMode: 'service_carousel',
          departmentName: 'Servicos sugeridos',
        }),
      },
    };
  }

  private async handleServiceSelection(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const candidates = Array.isArray(session.serviceCandidates) ? session.serviceCandidates : [];
    if (!candidates.length) {
      const reset = this.withStage(session, 'triage');
      await this.persistSession(execution.id, reset);
      return { session: reset, response: this.buildWelcomeResponse(execution, reset) };
    }

    let selectedId = this.findOptionByInput(userMessage, candidates)?.id;
    if (!selectedId && citizenAiClient.available()) {
      this.stats.aiTurns += 1;
      const selection = await citizenAiClient.selectService({ citizenId: execution.citizenId, message: userMessage, candidates: candidates.map((c) => ({ id: c.id, label: c.label, description: c.description })) });
      if (selection?.selectedId && selection.confidence >= 0.55) selectedId = selection.selectedId;
    }

    if (!selectedId) {
      return {
        session,
        response: {
          message: 'Nao consegui identificar o servico correto. Selecione uma opcao da lista.',
          messageType: 'menu',
          data: {
            options: candidates,
            displayMode: 'service_carousel',
            departmentName: session.selectedDepartmentName || 'Servicos sugeridos',
          } as any,
          metadata: this.meta(execution, session, true, {
            displayMode: 'service_carousel',
            departmentName: session.selectedDepartmentName || 'Servicos sugeridos',
          }),
        },
      };
    }
    return this.selectServiceById(execution, session, userMessage, selectedId, candidates);
  }
  private async selectServiceById(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string, selectedServiceId: string, candidates: MenuOption[]): Promise<CitizenAiDecision> {
    const schemaResult = await this.runAction('processFormSchema', { serviceId: selectedServiceId }, execution, session);
    if (schemaResult.success === false) {
      const reset = this.withStage(session, 'triage');
      await this.persistSession(execution.id, reset);
      return { session: reset, response: { message: typeof schemaResult.error === 'string' ? schemaResult.error : 'Nao foi possivel preparar o servico selecionado.', messageType: 'text', metadata: this.meta(execution, reset, true) } };
    }

    const questions = Array.isArray(schemaResult.questions) ? schemaResult.questions as FieldDef[] : [];
    if (questions.length) this.stats.aiTurns += 1;
    const extraction = questions.length ? await citizenAiClient.extractFields({
      citizenId: execution.citizenId,
      message: userMessage,
      serviceName: String(schemaResult.service?.name || 'servico'),
      fields: questions,
      sessionContext: this.buildSessionContext(session),
    }) : null;
    const collectedFormData = extraction?.values || {};
    const pendingFieldIds = questions.filter((f) => f.required !== false).map((f) => f.id).filter((id) => collectedFormData[id] === undefined);

    const next: CitizenAiSessionState = {
      ...session,
      stage: 'collecting_fields',
      serviceCandidates: [],
      selectedServiceId,
      selectedServiceName: String(schemaResult.service?.name || candidates.find((item) => item.id === selectedServiceId)?.label || 'Servico'),
      selectedServiceData: schemaResult.service && typeof schemaResult.service === 'object' ? schemaResult.service as Record<string, unknown> : undefined,
      formSchemaData: schemaResult as Record<string, unknown>,
      collectedFormData,
      pendingFieldIds,
      description: extraction?.description || (questions.length === 0 && userMessage.length >= 10 ? userMessage : session.description),
      uploadedDocuments: session.uploadedDocuments || [],
    };

    if (pendingFieldIds.length > 0) {
      const field = questions.find((item) => item.id === pendingFieldIds[0]);
      next.currentFieldId = field?.id;
      next.currentFieldLabel = field?.label;
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildFieldPrompt(execution, next, field) };
    }

    if (!questions.length && (!next.description || String(next.description).trim().length < 10)) {
      next.currentFieldId = 'description';
      next.currentFieldLabel = 'Descricao da solicitacao';
      next.pendingFieldIds = ['description'];
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildDescriptionPrompt(execution, next) };
    }

    if (schemaResult.requiresDocuments) {
      const docsSession = this.withStage(next, 'awaiting_documents');
      await this.persistSession(execution.id, docsSession);
      return { session: docsSession, response: this.buildUploadPrompt(execution, docsSession) };
    }

    const reviewSession = this.withStage(next, 'awaiting_review_confirmation');
    reviewSession.reviewText = await this.buildReviewText(execution, reviewSession);
    await this.persistSession(execution.id, reviewSession);
    return { session: reviewSession, response: this.buildReviewResponse(execution, reviewSession) };
  }

  private async handleFieldCollection(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const questions = Array.isArray(session.formSchemaData?.questions) ? session.formSchemaData?.questions as FieldDef[] : [];
    const currentFieldId = session.currentFieldId || session.pendingFieldIds?.[0];
    const currentField = currentFieldId === 'description' ? { id: 'description', label: 'Descricao da solicitacao', type: 'textarea', required: true } : questions.find((field) => field.id === currentFieldId);
    if (!currentField) {
      const reset = this.withStage(session, 'triage');
      await this.persistSession(execution.id, reset);
      return { session: reset, response: this.buildWelcomeResponse(execution, reset) };
    }

    if (this.isCorrectionRequest(userMessage)) {
      const corrected = await this.applyInlineCorrection(execution, session, userMessage, currentField.id);
      if (corrected) return corrected;
    }

    if (this.isCompetingGlobalIntent(userMessage)) {
      return {
        session,
        response: {
          message: this.buildLockedHelpMessage(session),
          messageType: 'menu',
          data: { options: [{ id: 'continuar', label: 'Continuar', description: `Informar ${currentField.label}` }, { id: 'corrigir', label: 'Corrigir dados', description: 'Alterar informacoes coletadas' }, { id: 'voltar_menu', label: 'Voltar ao menu', description: 'Encerrar este fluxo e voltar ao inicio' }] },
          metadata: this.meta(execution, session, true),
        },
      };
    }

    if (currentField.id === 'description') {
      const description = userMessage.trim();
      if (description.length < 10) return { session, response: this.buildDescriptionPrompt(execution, session, 'Descreva com um pouco mais de detalhes para eu registrar corretamente.') };
      const next: CitizenAiSessionState = { ...session, description, currentFieldId: undefined, currentFieldLabel: undefined, pendingFieldIds: (session.pendingFieldIds || []).filter((fieldId) => fieldId !== 'description') };
      return this.finishCollectionStep(execution, next);
    }

    const parsedValue = this.parseFieldValue(currentField, userMessage);
    if (parsedValue === undefined) this.stats.aiTurns += 1;
    const extraction = parsedValue === undefined ? await citizenAiClient.extractFields({
      citizenId: execution.citizenId,
      message: userMessage,
      serviceName: session.selectedServiceName || 'servico',
      fields: [currentField],
      sessionContext: this.buildSessionContext(session),
    }) : null;
    const value = parsedValue !== undefined ? parsedValue : extraction?.values?.[currentField.id];
    if (value === undefined || value === null || value === '') return { session, response: this.buildFieldPrompt(execution, session, currentField, 'Nao consegui preencher esse dado com seguranca.') };

    const next: CitizenAiSessionState = { ...session, collectedFormData: { ...(session.collectedFormData || {}), [currentField.id]: value }, currentFieldId: undefined, currentFieldLabel: undefined, pendingFieldIds: (session.pendingFieldIds || []).filter((fieldId) => fieldId !== currentField.id) };
    return this.finishCollectionStep(execution, next);
  }

  private async finishCollectionStep(execution: FlowExecution, session: CitizenAiSessionState): Promise<CitizenAiDecision> {
    const questions = Array.isArray(session.formSchemaData?.questions) ? session.formSchemaData?.questions as FieldDef[] : [];
    if (session.pendingFieldIds && session.pendingFieldIds.length > 0) {
      const nextFieldId = session.pendingFieldIds[0];
      const nextField = nextFieldId === 'description' ? { id: 'description', label: 'Descricao da solicitacao', type: 'textarea', required: true } : questions.find((field) => field.id === nextFieldId);
      const next: CitizenAiSessionState = { ...session, stage: 'collecting_fields', currentFieldId: nextField?.id, currentFieldLabel: nextField?.label };
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildFieldPrompt(execution, next, nextField) };
    }

    if (session.formSchemaData?.requiresDocuments) {
      const docsSession = this.withStage(session, 'awaiting_documents');
      await this.persistSession(execution.id, docsSession);
      return { session: docsSession, response: this.buildUploadPrompt(execution, docsSession) };
    }

    const reviewSession = this.withStage(session, 'awaiting_review_confirmation');
    reviewSession.reviewText = await this.buildReviewText(execution, reviewSession);
    await this.persistSession(execution.id, reviewSession);
    return { session: reviewSession, response: this.buildReviewResponse(execution, reviewSession) };
  }

  private async handleReviewConfirmation(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const normalized = this.normalize(userMessage);
    if (this.isCorrectionRequest(userMessage)) {
      const corrected = await this.applyInlineCorrection(execution, session, userMessage);
      if (corrected) return corrected;
      const waitCorrection = this.withStage(session, 'awaiting_correction_field');
      await this.persistSession(execution.id, waitCorrection);
      return { session: waitCorrection, response: this.buildCorrectionMenu(execution, waitCorrection, 'Qual informacao voce quer corrigir?') };
    }

    if (this.matchesAny(normalized, NO_PATTERNS)) {
      const waitCorrection = this.withStage(session, 'awaiting_correction_field');
      await this.persistSession(execution.id, waitCorrection);
      return { session: waitCorrection, response: this.buildCorrectionMenu(execution, waitCorrection, 'Sem problema. Escolha qual dado deseja revisar.') };
    }

    if (!this.matchesAny(normalized, YES_PATTERNS)) return { session, response: { message: 'Responda com confirmar para enviar ou corrigir para revisar os dados.', messageType: 'menu', data: { options: [{ id: 'confirmar', label: 'Confirmar e enviar', description: 'Criar protocolo agora' }, { id: 'corrigir', label: 'Corrigir dados', description: 'Revisar informacoes antes do envio' }] }, metadata: this.meta(execution, session, true) } };

    const fingerprint = this.buildProtocolFingerprint(session);
    if (session.createdProtocolFingerprint === fingerprint && (session.createdProtocolId || session.createdProtocolNumber)) {
      const finished = this.withStage(session, 'triage');
      await this.persistSession(execution.id, finished);
      return this.buildDuplicateProtocolResponse(execution, finished);
    }

    const createResult = await this.runAction('createProtocol', { serviceId: session.selectedServiceId, description: session.description, formData: session.collectedFormData, documents: session.uploadedDocuments }, execution, session);
    if (createResult.success === false || !createResult.protocol) return { session, response: { message: typeof createResult.error === 'string' ? createResult.error : 'Nao foi possivel criar o protocolo agora.', messageType: 'text', metadata: this.meta(execution, session, true) } };

    this.stats.protocolsCreated += 1;
    const protocol = createResult.protocol as Record<string, any>;
    const protocolNumber = String(protocol.number || protocol.protocolNumber || '');
    const finished = this.withStage({
      ...session,
      createdProtocolId: String(protocol.id || ''),
      createdProtocolNumber: protocolNumber,
      createdProtocolFingerprint: fingerprint,
      createdProtocolAt: new Date().toISOString(),
    }, 'triage');
    await this.persistSession(execution.id, finished);
    return { session: finished, response: { message: `Solicitacao enviada com sucesso.\n\nNumero do protocolo: ${protocolNumber || 'gerado com sucesso'}\nServico: ${session.selectedServiceName || 'Solicitacao registrada'}\n\nSe quiser, tambem posso consultar esse protocolo depois para voce.`, messageType: 'card', data: { cards: [{ id: String(protocol.id || protocolNumber || Date.now()), title: `Protocolo ${protocolNumber || 'criado'}`, description: String(protocol.title || session.selectedServiceName || 'Solicitacao registrada'), metadata: { protocolNumber, status: protocol.status || 'ABERTO' } }] }, metadata: this.meta(execution, finished, true) } };
  }

  private async handleProtocolIntent(execution: FlowExecution, session: CitizenAiSessionState, rawInput: string): Promise<CitizenAiDecision> {
    const protocolMode = this.detectProtocolMode(rawInput);
    const protocolNumber = this.extractProtocolNumber(rawInput);

    if (protocolMode === 'list') return this.listCitizenProtocols(execution, session);
    if (protocolMode === 'latest') return this.openLatestProtocol(execution, session);
    if (protocolNumber) return this.handleProtocolLookup(execution, session, protocolNumber);

    const waiting = this.withStage(session, 'awaiting_protocol_lookup_mode');
    await this.persistSession(execution.id, waiting);
    return { session: waiting, response: this.buildProtocolLookupEntry(execution, waiting) };
  }

  private async handleProtocolLookupMode(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const normalized = this.normalize(userMessage);
    const explicitIntent = this.matchExplicitIntent(normalized);
    if (explicitIntent === 'voltar_menu') {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    if (this.isUnknownProtocolReply(userMessage)) {
      const waiting = this.withStage(session, 'awaiting_protocol_lookup_mode');
      await this.persistSession(execution.id, waiting);
      return {
        session: waiting,
        response: this.buildProtocolLookupEntry(
          execution,
          waiting,
          'Sem problema. Posso listar seus protocolos recentes ou abrir um pelo numero.'
        ),
      };
    }

    return this.handleProtocolIntent(execution, session, userMessage);
  }

  private async listCitizenProtocols(execution: FlowExecution, session: CitizenAiSessionState): Promise<CitizenAiDecision> {
    const result = await this.runAction('getProtocols', { limit: 8 }, execution, session);
    if (result.success === false) {
      const waiting = this.withStage(session, 'awaiting_protocol_lookup_mode');
      await this.persistSession(execution.id, waiting);
      return {
        session: waiting,
        response: this.buildProtocolLookupEntry(
          execution,
          waiting,
          typeof result.error === 'string' ? result.error : 'Nao foi possivel listar seus protocolos agora.'
        ),
      };
    }

    const protocols = Array.isArray(result.protocols) ? result.protocols as MenuOption[] : [];
    if (!protocols.length) {
      const next = this.withStage(session, 'triage');
      await this.persistSession(execution.id, next);
      return {
        session: next,
        response: {
          message: 'Voce ainda nao possui protocolos cadastrados. Se quiser, posso te ajudar a abrir uma solicitacao agora.',
          messageType: 'menu',
          data: { options: QUICK_ACTIONS },
          metadata: this.meta(execution, next, true),
        },
      };
    }

    const waiting: CitizenAiSessionState = {
      ...session,
      stage: 'awaiting_protocol_selection',
      protocolCandidates: protocols,
    };
    await this.persistSession(execution.id, waiting);
    return {
      session: waiting,
      response: {
        message: 'Estes sao os seus protocolos recentes. Escolha um para ver os detalhes.',
        messageType: 'menu',
        data: { options: protocols },
        metadata: this.meta(execution, waiting, true),
      },
    };
  }

  private async openLatestProtocol(execution: FlowExecution, session: CitizenAiSessionState): Promise<CitizenAiDecision> {
    const result = await this.runAction('getProtocols', { limit: 1 }, execution, session);
    if (result.success === false) {
      const waiting = this.withStage(session, 'awaiting_protocol_lookup_mode');
      await this.persistSession(execution.id, waiting);
      return {
        session: waiting,
        response: this.buildProtocolLookupEntry(
          execution,
          waiting,
          typeof result.error === 'string' ? result.error : 'Nao foi possivel localizar seu ultimo protocolo.'
        ),
      };
    }

    const latest = Array.isArray(result.protocols) ? result.protocols[0] as MenuOption | undefined : undefined;
    const protocolNumber = this.getProtocolNumberFromOption(latest);
    if (!protocolNumber) {
      const next = this.withStage(session, 'triage');
      await this.persistSession(execution.id, next);
      return {
        session: next,
        response: {
          message: 'Voce ainda nao possui protocolos cadastrados. Se quiser, posso te ajudar a abrir uma solicitacao agora.',
          messageType: 'menu',
          data: { options: QUICK_ACTIONS },
          metadata: this.meta(execution, next, true),
        },
      };
    }

    return this.handleProtocolLookup(execution, session, protocolNumber);
  }

  private async handleProtocolSelection(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const normalized = this.normalize(userMessage);
    const explicitIntent = this.matchExplicitIntent(normalized);
    if (explicitIntent === 'voltar_menu') {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    const protocolMode = this.detectProtocolMode(userMessage);
    if (protocolMode === 'list') return this.listCitizenProtocols(execution, session);
    if (protocolMode === 'latest') return this.openLatestProtocol(execution, session);

    const candidates = Array.isArray(session.protocolCandidates) ? session.protocolCandidates : [];
    const selected = this.findOptionByInput(userMessage, candidates);
    const protocolNumber = this.getProtocolNumberFromOption(selected) || this.extractProtocolNumber(userMessage);
    if (!protocolNumber) {
      const waiting = this.withStage(session, 'awaiting_protocol_selection');
      await this.persistSession(execution.id, waiting);
      return {
        session: waiting,
        response: {
          message: 'Selecione um protocolo da lista ou informe o numero exato.',
          messageType: 'menu',
          data: { options: candidates },
          metadata: this.meta(execution, waiting, true),
        },
      };
    }

    return this.handleProtocolLookup(execution, session, protocolNumber);
  }

  private async handleProtocolLookup(execution: FlowExecution, session: CitizenAiSessionState, rawInput: string): Promise<CitizenAiDecision> {
    if (this.isUnknownProtocolReply(rawInput)) {
      const waiting = this.withStage(session, 'awaiting_protocol_lookup_mode');
      await this.persistSession(execution.id, waiting);
      return {
        session: waiting,
        response: this.buildProtocolLookupEntry(
          execution,
          waiting,
          'Sem problema. Posso listar seus protocolos recentes ou consultar outro numero.'
        ),
      };
    }

    const protocolMode = this.detectProtocolMode(rawInput);
    if (protocolMode === 'list') return this.listCitizenProtocols(execution, session);
    if (protocolMode === 'latest') return this.openLatestProtocol(execution, session);

    const protocolNumber = this.extractProtocolNumber(rawInput);
    if (!protocolNumber) {
      const waiting = this.withStage(session, 'awaiting_protocol_lookup_mode');
      await this.persistSession(execution.id, waiting);
      return { session: waiting, response: this.buildProtocolLookupEntry(execution, waiting, 'Informe o numero do protocolo para eu consultar.') };
    }

    const details = await this.runAction('getProtocolDetails', { protocolNumber }, execution, session);
    if (details.success === false) {
      const waiting: CitizenAiSessionState = { ...session, stage: 'awaiting_protocol_lookup_mode', protocolNumber: undefined };
      await this.persistSession(execution.id, waiting);
      return {
        session: waiting,
        response: this.buildProtocolLookupEntry(
          execution,
          waiting,
          typeof details.error === 'string' ? details.error : `Nao consegui localizar o protocolo ${protocolNumber}.`
        ),
      };
    }

    this.stats.protocolLookups += 1;

    const next: CitizenAiSessionState = {
      ...session,
      stage: 'triage',
      protocolNumber,
      currentProtocolId: String(details.protocol?.id || ''),
      currentProtocolTitle: String(details.protocol?.title || details.protocol?.service?.name || ''),
    };
    await this.persistSession(execution.id, next);

    const openPendingsCount = Number(details.protocolDetailCard?.openPendingsCount || details.protocol?._count?.pendings || 0);
    const explicitPendingLookup = this.matchesAny(this.normalize(rawInput), PENDING_PATTERNS);
    if (next.currentProtocolId && (openPendingsCount > 0 || explicitPendingLookup)) {
      return this.presentProtocolPendings(execution, next, details.protocolDetailCard);
    }

    return {
      session: next,
      response: {
        message: typeof details.summary === 'string' && details.summary.trim()
          ? details.summary.trim()
          : `Consulta concluida para o protocolo ${protocolNumber}.`,
        messageType: 'text',
        data: details.protocolDetailCard ? { protocolDetailCard: details.protocolDetailCard } : undefined,
        metadata: this.meta(execution, next, true, details.protocolDetailCard ? { protocolDetailCard: details.protocolDetailCard } : {}),
      },
    };
  }

  private async presentProtocolPendings(
    execution: FlowExecution,
    session: CitizenAiSessionState,
    protocolDetailCard?: Record<string, unknown>
  ): Promise<CitizenAiDecision> {
    if (!session.currentProtocolId) {
      const fallback = this.withStage(session, 'triage');
      await this.persistSession(execution.id, fallback);
      return { session: fallback, response: this.buildWelcomeResponse(execution, fallback) };
    }

    const result = await this.integration.getProtocolPendings(session.currentProtocolId, execution.citizenId);
    const actionablePendings = Array.isArray(result?.pendings)
      ? result.pendings.filter((pending: any) => ['OPEN', 'IN_PROGRESS'].includes(pending.status) && pending.requiresCitizenAction === true)
      : [];
    const underReviewPendings = Array.isArray(result?.pendings)
      ? result.pendings.filter((pending: any) => pending.status === 'UNDER_REVIEW' && pending.requiresCitizenAction === true)
      : [];

    if (!actionablePendings.length) {
      const next = this.withStage(session, 'triage');
      await this.persistSession(execution.id, next);
      return {
        session: next,
        response: {
          message: underReviewPendings.length > 0
            ? `Nao ha novas pendencias abertas neste protocolo. Voce ja enviou ${underReviewPendings.length} resposta(s) e elas aguardam analise da equipe.`
            : 'Nao ha pendencias abertas para voce neste protocolo no momento.',
          messageType: 'text',
          data: protocolDetailCard ? { protocolDetailCard } : undefined,
          metadata: this.meta(execution, next, true, protocolDetailCard ? { protocolDetailCard } : {}),
        },
      };
    }

    const pendingOptions: MenuOption[] = actionablePendings.map((pending: any) => ({
      id: String(pending.id),
      label: String(pending.title || pending.description || 'Pendencia'),
      description: String(pending.description || pending.type || 'Acao necessaria'),
      metadata: pending,
    }));

    const next: CitizenAiSessionState = {
      ...session,
      stage: 'awaiting_protocol_pending_selection',
      pendingCandidates: pendingOptions,
    };
    await this.persistSession(execution.id, next);

    return {
      session: next,
      response: {
        message: `O protocolo ${session.protocolNumber || ''} possui ${pendingOptions.length} pendencia(s) para resolver.${underReviewPendings.length > 0 ? ` Alem disso, ${underReviewPendings.length} resposta(s) sua(s) aguardam analise.` : ''} Escolha uma opcao abaixo para continuar.`,
        messageType: 'menu',
        data: {
          options: [
            ...pendingOptions,
            { id: 'voltar_menu', label: 'Voltar ao menu', description: 'Retornar para as opcoes iniciais' },
          ],
          ...(protocolDetailCard ? { protocolDetailCard } : {}),
        },
        metadata: this.meta(execution, next, true, protocolDetailCard ? { protocolDetailCard } : {}),
      },
    };
  }

  private async handleProtocolPendingSelection(
    execution: FlowExecution,
    session: CitizenAiSessionState,
    userMessage: string
  ): Promise<CitizenAiDecision> {
    const explicitIntent = this.matchExplicitIntent(this.normalize(userMessage));
    if (explicitIntent === 'voltar_menu') {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    const options = Array.isArray(session.pendingCandidates) ? session.pendingCandidates : [];
    const selected = this.findOptionByInput(userMessage, options);
    const selectedPending = selected?.metadata;

    if (!selected || !selectedPending) {
      await this.persistSession(execution.id, session);
      return {
        session,
        response: {
          message: 'Selecione uma pendencia da lista para eu te orientar na resolucao.',
          messageType: 'menu',
          data: { options: [...options, { id: 'voltar_menu', label: 'Voltar ao menu', description: 'Retornar para as opcoes iniciais' }] },
          metadata: this.meta(execution, session, true),
        },
      };
    }

    const pendingDocumentRequests = this.getPendingDocumentRequests(selectedPending);
    const pendingFieldRequests = this.getPendingFieldRequests(selectedPending);
    const next: CitizenAiSessionState = {
      ...session,
      currentPendingId: String(selectedPending.id),
      currentPendingTitle: String(selectedPending.title || selected.label),
      currentPendingType: String(selectedPending.type || selectedPending.pendingType || 'INFORMATION'),
      currentPendingDocumentRequests: pendingDocumentRequests,
      currentPendingFieldRequests: pendingFieldRequests,
    };

    if (next.currentPendingType === 'DOCUMENT') {
      const waiting = this.withStage(next, 'awaiting_protocol_pending_document_upload');
      const requiredDocuments = pendingDocumentRequests.map((document, index) => ({
        id: String(document.id || document.documentId || `pending-doc-${index}`),
        name: String(document.label || document.documentType || document.id || `Documento ${index + 1}`),
        required: document.required !== false,
      }));
      await this.persistSession(execution.id, waiting);
      return {
        session: waiting,
        response: {
          message: `${next.currentPendingTitle}. Envie os documentos solicitados para eu registrar a resposta no protocolo.`,
          messageType: 'upload',
          data: {
            uploadConfig: {
              text: 'Envie os documentos solicitados',
              multiple: true,
              maxFiles: Math.max(requiredDocuments.length, 1),
              maxFileSize: 10,
              allowSkip: false,
              allowedTypes: ['application/pdf', 'image/*'],
              saveAs: 'pendingDocument',
            },
            requiredDocuments,
          } as any,
          metadata: this.meta(execution, waiting, true),
        },
      };
    }

    const waiting = this.withStage(next, 'awaiting_protocol_pending_text_resolution');
    await this.persistSession(execution.id, waiting);
    return {
      session: waiting,
      response: {
        message: `${next.currentPendingTitle}. Responda com a informacao solicitada para eu enviar sua correcao.`,
        messageType: 'text',
        metadata: this.meta(execution, waiting, true),
      },
    };
  }

  private async handleProtocolPendingTextResolution(
    execution: FlowExecution,
    session: CitizenAiSessionState,
    userMessage: string
  ): Promise<CitizenAiDecision> {
    if (!session.currentProtocolId || !session.currentPendingId) {
      const next = this.withStage(session, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    const result = await this.integration.resolveProtocolPending(
      session.currentProtocolId,
      session.currentPendingId,
      execution.citizenId,
      userMessage
    );

    const refreshed: CitizenAiSessionState = {
      ...session,
      stage: 'triage',
      currentPendingId: undefined,
      currentPendingTitle: undefined,
      currentPendingType: undefined,
      currentPendingDocumentRequests: undefined,
      currentPendingFieldRequests: undefined,
    };
    await this.persistSession(execution.id, refreshed);

    const pendingTitle = String(result?.pending?.title || session.currentPendingTitle || 'Pendencia');
    const followUp = await this.presentProtocolPendings(execution, refreshed).catch(() => null);
    if (followUp && followUp.session.stage === 'awaiting_protocol_pending_selection') {
      return {
        session: followUp.session,
        response: {
          ...followUp.response,
          message: `${pendingTitle} enviada para analise com sucesso.\n\n${followUp.response.message}`,
        },
      };
    }

    return {
      session: refreshed,
      response: {
        message: `${pendingTitle} enviada para analise com sucesso. Se precisar, posso consultar outro protocolo ou voltar ao menu.`,
        messageType: 'menu',
        data: { options: QUICK_ACTIONS },
        metadata: this.meta(execution, refreshed, true),
      },
    };
  }

  private async handleProtocolPendingDocumentUpload(
    execution: FlowExecution,
    session: CitizenAiSessionState,
    files: Array<Record<string, unknown>>
  ): Promise<CitizenAiDecision> {
    if (!session.currentProtocolId || !session.currentPendingId) {
      const next = this.withStage(session, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    const validFiles = files.filter((file) => typeof file?.filePath === 'string' && file.filePath);
    const requiredDocuments = Array.isArray(session.currentPendingDocumentRequests)
      ? session.currentPendingDocumentRequests
      : [];

    if (!validFiles.length) {
      return {
        session,
        response: {
          message: 'Nao consegui identificar os arquivos enviados. Tente anexar os documentos novamente.',
          messageType: 'upload',
          data: {
            uploadConfig: {
              text: 'Envie os documentos solicitados',
              multiple: true,
              maxFiles: Math.max(requiredDocuments.length, 1),
              maxFileSize: 10,
              allowSkip: false,
              allowedTypes: ['application/pdf', 'image/*'],
              saveAs: 'pendingDocument',
            },
            requiredDocuments,
          } as any,
          metadata: this.meta(execution, session, true),
        },
      };
    }

    const missingDocuments = requiredDocuments.filter((document) =>
      document?.required !== false &&
      !validFiles.some((file) => this.matchesRequiredDocument(file, document))
    );

    if (missingDocuments.length > 0) {
      return {
        session,
        response: {
          message: `Ainda faltam documentos obrigatorios: ${missingDocuments.map((document) => String(document.label || document.documentType || document.id)).join(', ')}.`,
          messageType: 'upload',
          data: {
            uploadConfig: {
              text: 'Envie os documentos solicitados',
              multiple: true,
              maxFiles: Math.max(requiredDocuments.length, 1),
              maxFileSize: 10,
              allowSkip: false,
              allowedTypes: ['application/pdf', 'image/*'],
              saveAs: 'pendingDocument',
            },
            requiredDocuments,
          } as any,
          metadata: this.meta(execution, session, true),
        },
      };
    }

    const result = await (this.integration as any).resolveProtocolPendingWithDocuments({
      protocolId: session.currentProtocolId,
      pendingId: session.currentPendingId,
      citizenId: execution.citizenId,
      files: validFiles.map((file) => ({
        filePath: String(file.filePath),
        fileName: typeof file?.fileName === 'string' ? file.fileName : undefined,
        mimeType: typeof file?.mimeType === 'string' ? file.mimeType : undefined,
        documentId: typeof file?.documentId === 'string' ? file.documentId : undefined,
        documentType: typeof file?.documentType === 'string' ? file.documentType : undefined,
        required: file?.required !== false,
      })),
    });

    const refreshed: CitizenAiSessionState = {
      ...session,
      stage: 'triage',
      currentPendingId: undefined,
      currentPendingTitle: undefined,
      currentPendingType: undefined,
      currentPendingDocumentRequests: undefined,
      currentPendingFieldRequests: undefined,
    };
    await this.persistSession(execution.id, refreshed);

    const pendingTitle = String(result?.pending?.title || session.currentPendingTitle || 'Pendencia');
    const followUp = await this.presentProtocolPendings(execution, refreshed).catch(() => null);
    if (followUp && followUp.session.stage === 'awaiting_protocol_pending_selection') {
      return {
        session: followUp.session,
        response: {
          ...followUp.response,
          message: `${pendingTitle} enviada para analise com sucesso.\n\n${followUp.response.message}`,
        },
      };
    }

    return {
      session: refreshed,
      response: {
        message: `${pendingTitle} enviada para analise com sucesso. Se precisar, posso consultar outro protocolo ou voltar ao menu.`,
        messageType: 'menu',
        data: { options: QUICK_ACTIONS },
        metadata: this.meta(execution, refreshed, true),
      },
    };
  }

  private async handleCorrectionFieldSelection(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const normalized = this.normalize(userMessage);
    if (this.matchesAny(normalized, YES_PATTERNS)) {
      const reviewSession = this.withStage(session, 'awaiting_review_confirmation');
      reviewSession.reviewText = await this.buildReviewText(execution, reviewSession);
      await this.persistSession(execution.id, reviewSession);
      return { session: reviewSession, response: this.buildReviewResponse(execution, reviewSession) };
    }

    const correction = await this.applyInlineCorrection(execution, session, userMessage);
    if (correction) return correction;

    const field = this.findCorrectableField(session, userMessage);
    if (!field) {
      return { session, response: this.buildCorrectionMenu(execution, session, 'Nao identifiquei qual dado deve mudar. Escolha uma opcao ou escreva, por exemplo: corrigir endereco para Rua Brasil, 100.') };
    }

    const next: CitizenAiSessionState = {
      ...session,
      stage: 'collecting_fields',
      currentFieldId: field.id,
      currentFieldLabel: field.label,
      pendingFieldIds: [field.id],
      awaitingCorrectionFieldId: undefined,
      awaitingCorrectionFieldLabel: undefined,
    };
    await this.persistSession(execution.id, next);
    return { session: next, response: this.buildFieldPrompt(execution, next, field, `Certo, vamos corrigir ${field.label}.`) };
  }

  private async applyInlineCorrection(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string, fallbackFieldId?: string): Promise<CitizenAiDecision | null> {
    const questions = this.getFormQuestions(session);
    const correctableFields = this.getCorrectableFields(session);
    const matchedField = this.findCorrectableField(session, userMessage) || correctableFields.find((field) => field.id === fallbackFieldId);

    let fieldId = matchedField?.id;
    let value: string | number | boolean | undefined;
    let description: string | undefined;

    const explicitValue = this.extractCorrectionValue(userMessage);
    if (matchedField && explicitValue) {
      value = matchedField.id === 'description'
        ? explicitValue
        : this.parseFieldValue(matchedField, explicitValue) ?? explicitValue;
    }

    if ((!fieldId || value === undefined) && citizenAiClient.available()) {
      this.stats.aiTurns += 1;
      const aiCorrection = await citizenAiClient.extractCorrection({
        citizenId: execution.citizenId,
        message: userMessage,
        serviceName: session.selectedServiceName || 'servico',
        fields: correctableFields,
        sessionContext: this.buildSessionContext(session),
      });
      if (aiCorrection && aiCorrection.confidence >= 0.55) {
        fieldId = fieldId || aiCorrection.fieldId;
        value = value ?? aiCorrection.value;
        description = aiCorrection.description;
      }
    }

    if ((!fieldId || value === undefined) && description) {
      fieldId = 'description';
      value = description;
    }

    const targetField = correctableFields.find((field) => field.id === fieldId);
    if (!targetField || value === undefined || value === null || value === '') return null;

    const normalizedValue = targetField.id === 'description'
      ? String(value).trim()
      : this.parseFieldValue(targetField, String(value)) ?? value;

    const updated: CitizenAiSessionState = targetField.id === 'description'
      ? { ...session, description: String(normalizedValue).trim(), awaitingCorrectionFieldId: undefined, awaitingCorrectionFieldLabel: undefined }
      : {
          ...session,
          collectedFormData: { ...(session.collectedFormData || {}), [targetField.id]: normalizedValue },
          pendingFieldIds: (session.pendingFieldIds || []).filter((id) => id !== targetField.id),
          currentFieldId: undefined,
          currentFieldLabel: undefined,
          awaitingCorrectionFieldId: undefined,
          awaitingCorrectionFieldLabel: undefined,
        };

    const reviewSession = this.withStage(updated, this.buildRequiredPendingFieldIds(updated).length > 0 ? 'collecting_fields' : 'awaiting_review_confirmation');
    if (reviewSession.stage === 'collecting_fields') {
      const nextFieldId = this.buildRequiredPendingFieldIds(reviewSession)[0];
      const nextField = nextFieldId === 'description'
        ? { id: 'description', label: 'Descricao da solicitacao', type: 'textarea', required: true }
        : questions.find((field) => field.id === nextFieldId);
      reviewSession.pendingFieldIds = this.buildRequiredPendingFieldIds(reviewSession);
      reviewSession.currentFieldId = nextField?.id;
      reviewSession.currentFieldLabel = nextField?.label;
      await this.persistSession(execution.id, reviewSession);
      return { session: reviewSession, response: this.buildFieldPrompt(execution, reviewSession, nextField, `${targetField.label} atualizado.`) };
    }

    reviewSession.reviewText = await this.buildReviewText(execution, reviewSession);
    await this.persistSession(execution.id, reviewSession);
    return {
      session: reviewSession,
      response: this.buildReviewResponse(execution, reviewSession, `${targetField.label} atualizado. Revise novamente antes de enviar.`),
    };
  }

  private async buildReviewText(execution: FlowExecution, session: CitizenAiSessionState): Promise<string> {
    const formatted = await this.runAction('formatProtocolReview', { serviceId: session.selectedServiceId, formData: session.collectedFormData, description: session.description, documents: session.uploadedDocuments }, execution, session);
    if (typeof formatted.reviewText === 'string' && formatted.reviewText.trim()) return formatted.reviewText.trim();

    const collectedEntries = Object.entries(session.collectedFormData || {}).map(([key, value]) => `- ${key}: ${String(value)}`).join('\n');
    return [
      `Servico: ${session.selectedServiceName || 'nao identificado'}`,
      session.description ? `Descricao: ${session.description}` : undefined,
      collectedEntries ? `Dados coletados:\n${collectedEntries}` : undefined,
      session.uploadedDocuments?.length ? `Documentos anexados: ${session.uploadedDocuments.length}` : undefined,
    ].filter(Boolean).join('\n\n');
  }

  private buildReviewResponse(execution: FlowExecution, session: CitizenAiSessionState, prefix?: string): BotResponse {
    return { message: `${prefix ? `${prefix}\n\n` : ''}${session.reviewText || 'Revise os dados coletados abaixo.'}\n\nConfirma o envio da solicitacao?`, messageType: 'menu', data: { options: [{ id: 'confirmar', label: 'Confirmar e enviar', description: 'Criar o protocolo agora' }, { id: 'corrigir', label: 'Corrigir dados', description: 'Alterar uma informacao sem reiniciar' }] }, metadata: this.meta(execution, session, true) };
  }

  private buildUploadPrompt(execution: FlowExecution, session: CitizenAiSessionState): BotResponse {
    const uploadConfig = this.getUploadConfig();
    const requiredDocuments = this.getRequiredDocuments(session);
    return { message: 'Este servico exige documentos obrigatorios. Envie os arquivos para concluir a abertura do protocolo.', messageType: 'upload', data: { uploadConfig, requiredDocuments } as any, metadata: this.meta(execution, session, true, { uploadConfig, requiredDocuments }) };
  }

  private buildFieldPrompt(execution: FlowExecution, session: CitizenAiSessionState, field?: FieldDef, prefix?: string): BotResponse {
    if (!field) return { message: 'Preciso de mais uma informacao para concluir a solicitacao.', messageType: 'text', metadata: this.meta(execution, session, true) };
    if (Array.isArray(field.options) && field.options.length > 0) {
      return { message: `${prefix ? `${prefix}\n\n` : ''}Informe ${field.label}. Se preferir, selecione uma das opcoes abaixo.`, messageType: 'menu', data: { options: field.options.map((option) => ({ id: String(option.id || option.value || option.label), label: String(option.label || option.value || option.id), description: field.label })) }, metadata: this.meta(execution, session, true) };
    }
    return { message: `${prefix ? `${prefix}\n\n` : ''}Informe ${field.label}${field.required === false ? ' (opcional)' : ''}.`, messageType: 'text', metadata: this.meta(execution, session, true) };
  }

  private buildDescriptionPrompt(execution: FlowExecution, session: CitizenAiSessionState, prefix?: string): BotResponse {
    return { message: `${prefix ? `${prefix}\n\n` : ''}Descreva sua solicitacao com detalhes suficientes para abertura do protocolo.`, messageType: 'text', metadata: this.meta(execution, session, true) };
  }

  private buildGuidedServiceEntry(execution: FlowExecution, session: CitizenAiSessionState): CitizenAiDecision {
    return {
      session,
      response: {
        message: 'Vamos abrir sua solicitacao. Voce pode descrever o que precisa com suas palavras ou escolher a secretaria para navegar pelos servicos.',
        messageType: 'menu',
        data: { options: SERVICE_ENTRY_ACTIONS },
        metadata: this.meta(execution, session, true),
      },
    };
  }

  private buildWelcomeResponse(execution: FlowExecution, session: CitizenAiSessionState): BotResponse {
    return {
      message: 'Ola. Posso te ajudar com uma solicitacao, consultar protocolo ou navegar por secretaria. Escolha uma opcao ou escreva com suas palavras o que precisa.',
      messageType: 'menu',
      data: { options: QUICK_ACTIONS },
      metadata: this.meta(execution, session, true),
    };
  }

  private buildResumeResponse(execution: FlowExecution, session: CitizenAiSessionState): BotResponse {
    if (session.stage === 'collecting_fields') {
      const questions = this.getFormQuestions(session);
      const currentFieldId = session.currentFieldId || session.pendingFieldIds?.[0];
      const currentField = currentFieldId === 'description'
        ? { id: 'description', label: 'Descricao da solicitacao', type: 'textarea', required: true }
        : questions.find((field) => field.id === currentFieldId);
      return this.buildFieldPrompt(execution, session, currentField, `Vamos continuar ${session.selectedServiceName || 'sua solicitacao'} de onde paramos.`);
    }

    if (session.stage === 'awaiting_review_confirmation') {
      return this.buildReviewResponse(execution, session, 'Ja tenho os dados desta solicitacao. Revise antes de enviar.');
    }

    if (session.stage === 'awaiting_documents') {
      return this.buildUploadPrompt(execution, session);
    }

    if (session.stage === 'awaiting_correction_field') {
      return this.buildCorrectionMenu(execution, session, 'Estamos corrigindo os dados desta solicitacao.');
    }

    return {
      message: this.buildLockedHelpMessage(session),
      messageType: 'menu',
      data: { options: [{ id: 'continuar', label: 'Continuar', description: 'Seguir no fluxo atual' }, { id: 'voltar_menu', label: 'Voltar ao menu', description: 'Reiniciar atendimento' }] },
      metadata: this.meta(execution, session, true),
    };
  }

  private async ensureExecution(params: { citizenId: string; flowId: string; conversationId: string; existingExecution?: ExecutionLike | null }): Promise<FlowExecution> {
    if (params.existingExecution && this.isAiExecution(params.existingExecution)) return params.existingExecution;
    const created = await this.stateManager.createExecution(params.citizenId, params.flowId, params.conversationId);
    const initial = this.getSessionState(created);
    await this.persistSession(created.id, initial);
    return await this.stateManager.getExecution(created.id) as FlowExecution;
  }

  private isAiExecution(execution: ExecutionLike): boolean {
    const metadata = execution.metadata as Record<string, unknown> | undefined;
    return String(metadata?.engine || '') === 'ai_assistant' || execution.flow?.name === 'ai_assistant';
  }

  private getSessionState(execution: Pick<FlowExecution, 'state'>): CitizenAiSessionState {
    const state = execution.state as Record<string, any>;
    const persisted = state?.aiAssistant;
    return { engine: 'ai_assistant', stage: 'triage', collectedFormData: {}, pendingFieldIds: [], uploadedDocuments: [], lowConfidenceFallbacks: 0, legacyFallbackCount: 0, ...(persisted && typeof persisted === 'object' ? persisted : {}) };
  }

  private async persistSession(executionId: string, session: CitizenAiSessionState): Promise<void> {
    await this.stateManager.updateExecution(executionId, { currentNodeId: session.stage, stateUpdates: { aiAssistant: session }, metadata: { engine: 'ai_assistant', stage: session.stage, lastIntent: session.lastIntent } });
  }

  private withStage(session: CitizenAiSessionState, stage: CitizenAiStage): CitizenAiSessionState { return { ...session, stage }; }

  private meta(execution: FlowExecution, session: CitizenAiSessionState, waitingForInput: boolean, extra: Record<string, unknown> = {}): BotResponse['metadata'] {
    return { flowId: execution.flowId, executionId: execution.id, nodeId: session.stage, waitingForInput, aiEngine: 'llamacpp-qwen3-1.7b-routing', aiStage: session.stage, ...extra };
  }

  private async runAction(actionName: keyof typeof actionHandlers, params: Record<string, unknown>, execution: FlowExecution, session: CitizenAiSessionState): Promise<Record<string, any>> {
    const currentNode: FlowNode = { id: session.stage, type: 'action', config: { action: actionName, params }, transitions: [] };
    const context: ExecutionContext = {
      execution: execution as any,
      flow: { id: execution.flowId, name: 'ai_assistant', version: '1.0.0', isActive: true, isDefault: false, nodes: [currentNode], createdAt: new Date(), updatedAt: new Date() },
      currentNode,
      citizenId: execution.citizenId,
      state: {
        selectedServiceId: session.selectedServiceId,
        selectedService: session.selectedServiceData ? { service: session.selectedServiceData } : undefined,
        serviceDetails: session.selectedServiceData,
        selectedDept_data: session.selectedDepartmentName
          ? { name: session.selectedDepartmentName, label: session.selectedDepartmentName }
          : undefined,
        formData: session.collectedFormData || {},
        collectedFormData: session.collectedFormData || {},
        description: session.description,
        uploadedDocuments: session.uploadedDocuments || [],
        protocolNumber: session.protocolNumber,
        formSchemaData: session.formSchemaData || {},
        aiAssistant: session,
      },
    };
    const result = await actionHandlers[actionName](params, context);
    return result && typeof result === 'object' ? result as Record<string, any> : {};
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/_/g, ' ')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private matchExplicitIntent(normalized: string): string | undefined {
    if (!normalized) return undefined;
    if (this.matchesAny(normalized, SERVICE_PATTERNS)) return 'solicitar_servico';
    if (this.matchesAny(normalized, DEPARTMENT_PATTERNS)) return 'explorar_secretarias';
    if (normalized === 'consultar protocolo' || normalized === 'consultar_protocolo') return 'consultar_protocolo';
    if (this.matchesAny(normalized, PROFILE_PATTERNS)) return 'meu_perfil';
    if (this.matchesAny(normalized, DOCUMENT_PATTERNS)) return 'documentos';
    if (this.matchesAny(normalized, PENDING_PATTERNS)) return 'consultar_protocolo';
    if (this.matchesAny(normalized, HELP_PATTERNS)) return 'ajuda';
    if (this.matchesAny(normalized, MENU_PATTERNS)) return 'voltar_menu';
    if (normalized === 'descrever solicitacao' || normalized === 'descrever com minhas palavras' || normalized === 'descrever_solicitacao') return 'descrever_solicitacao';
    return undefined;
  }

  private shouldTryDirectServiceSearch(message: string): boolean {
    const normalized = this.normalize(message);
    if (normalized.length < 3) return false;
    if (this.isGreeting(message)) return false;
    if (this.extractProtocolNumber(message)) return false;
    if (this.detectProtocolMode(message)) return false;
    if (this.matchExplicitIntent(normalized)) return false;
    if (this.isHumanRequest(message)) return false;
    if (this.isAmbiguousTinyMessage(normalized)) return false;
    return true;
  }

  private matchesAny(value: string, patterns: string[]): boolean { return patterns.some((pattern) => value.includes(this.normalize(pattern))); }
  private isGreeting(message: string): boolean { const normalized = this.normalize(message); return ['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite'].some((pattern) => normalized.includes(pattern)); }
  private isHumanRequest(message: string): boolean { return this.matchesAny(this.normalize(message), HUMAN_PATTERNS); }
  private isAmbiguousTinyMessage(normalized: string): boolean { return ['sim', 'nao', 'ok', 'oi', 'ola', 'bom', 'boa', 'e', 'a', 'o'].includes(normalized); }
  private isUnknownProtocolReply(message: string): boolean { return this.matchesAny(this.normalize(message), ['nao sei', 'nao lembro', 'esqueci', 'nao tenho', 'nao lembro do numero']); }
  private extractProtocolNumber(message: string): string | undefined {
    const formatted = message.match(/\b\d{4}[-/]\d{4,}\b/);
    if (formatted?.[0]) return formatted[0].replace('/', '-');
    return message.match(/\b\d{4,}\b/)?.[0];
  }

  private detectProtocolMode(message: string): 'number' | 'list' | 'latest' | undefined {
    const normalized = this.normalize(message);
    if (!normalized) return undefined;
    if (this.extractProtocolNumber(message)) return 'number';
    if (
      normalized === 'consultar protocolo' ||
      normalized === 'consultar protocolos' ||
      normalized === 'acompanhar protocolo' ||
      normalized === 'acompanhar protocolos' ||
      normalized === 'buscar protocolo'
    ) {
      return 'number';
    }
    if (
      normalized === 'informar numero do protocolo' ||
      normalized === 'informar numero' ||
      normalized === 'por numero'
    ) {
      return 'number';
    }
    if (
      (normalized.includes('ultimo') || normalized.includes('ultima') || normalized.includes('mais recente')) &&
      normalized.includes('protocolo')
    ) {
      return 'latest';
    }
    if (
      this.matchesAny(normalized, PENDING_PATTERNS) ||
      (
        normalized.includes('pendencia') &&
        (normalized.includes('protocolo') || normalized.includes('minha') || normalized.includes('minhas'))
      )
    ) {
      return 'list';
    }
    if (
      normalized === 'protocolo' ||
      normalized === 'protocolos' ||
      normalized === 'andamento' ||
      normalized === 'status' ||
      normalized === 'situacao' ||
      normalized === 'minhas solicitacoes' ||
      normalized === 'meus protocolos' ||
      normalized === 'listar meus protocolos' ||
      normalized === 'mostrar meus protocolos' ||
      normalized === 'me mostre meus protocolos'
    ) {
      return 'list';
    }
    if (
      (normalized.includes('protocolo') || normalized.includes('protocolos')) &&
      (normalized.includes('listar') || normalized.includes('mostrar') || normalized.includes('mostre') || normalized.includes('meus') || normalized.includes('quais'))
    ) {
      return 'list';
    }
    return undefined;
  }

  private getProtocolNumberFromOption(option?: MenuOption): string | undefined {
    const metadataNumber = option?.metadata?.number;
    if (typeof metadataNumber === 'string' && metadataNumber.trim()) return metadataNumber.trim();
    if (option?.label) return this.extractProtocolNumber(option.label);
    return undefined;
  }

  private getUploadConfig() {
    return {
      text: 'Envie os documentos obrigatorios',
      multiple: true,
      maxFiles: 5,
      maxFileSize: 10,
      allowSkip: false,
      allowedTypes: ['application/pdf', 'image/*'],
      saveAs: 'uploadedDocuments',
    };
  }

  private getRequiredDocuments(session: CitizenAiSessionState): Array<Record<string, any>> {
    const requiredDocuments = Array.isArray(session.formSchemaData?.requiredDocuments)
      ? (session.formSchemaData?.requiredDocuments as any[])
      : [];

    return requiredDocuments.map((doc: any, index: number) => {
      if (typeof doc === 'string') {
        return {
          id: `doc-${index}`,
          name: doc,
          required: true,
        };
      }

      const id = String(doc?.id || doc?.documentType || doc?.name || `doc-${index}`);
      return {
        ...doc,
        id,
        name: String(doc?.name || doc?.documentType || id),
        required: doc?.required !== false,
      };
    });
  }

  private getPendingDocumentRequests(pending: Record<string, any>): Array<Record<string, any>> {
    const metadata = pending?.metadata && typeof pending.metadata === 'object'
      ? pending.metadata
      : {};

    const documentRequests = Array.isArray(metadata.documentRequests) && metadata.documentRequests.length > 0
      ? metadata.documentRequests
      : [{
          id: metadata.documentId || metadata.documentType || pending.id,
          documentId: metadata.documentId,
          documentType: metadata.documentType || pending.title,
          label: metadata.documentLabel || metadata.documentType || pending.title || 'Documento solicitado',
          required: true,
        }];

    return documentRequests.map((document: any, index: number) => ({
      id: String(document?.id || document?.documentId || document?.documentType || `pending-doc-${index}`),
      documentId: typeof document?.documentId === 'string' ? document.documentId : undefined,
      documentType: String(document?.documentType || document?.name || document?.label || `Documento ${index + 1}`),
      label: String(document?.label || document?.name || document?.documentType || `Documento ${index + 1}`),
      required: document?.required !== false,
    }));
  }

  private getPendingFieldRequests(pending: Record<string, any>): Array<Record<string, any>> {
    const metadata = pending?.metadata && typeof pending.metadata === 'object'
      ? pending.metadata
      : {};

    if (Array.isArray(metadata.fields) && metadata.fields.length > 0) {
      return metadata.fields;
    }

    if (metadata.fieldId || metadata.fieldKey || metadata.fieldLabel) {
      return [{
        id: metadata.fieldId,
        key: metadata.fieldKey,
        label: metadata.fieldLabel || metadata.fieldKey || pending.title || 'Informacao',
        type: metadata.fieldType || 'text',
        required: true,
      }];
    }

    return [];
  }

  private matchesRequiredDocument(file: Record<string, unknown>, requiredDoc: Record<string, any>): boolean {
    const documentId = String(file?.documentId || file?.docId || '').trim();
    const requiredId = String(requiredDoc.id || '').trim();
    if (documentId && requiredId && documentId === requiredId) {
      return true;
    }

    const fileType = this.normalize(String(file?.documentType || file?.fileName || ''));
    const requiredName = this.normalize(String(requiredDoc.name || ''));
    const normalizedRequiredId = this.normalize(requiredId);

    return Boolean(
      fileType &&
      (fileType === requiredName ||
        fileType === normalizedRequiredId ||
        requiredName.includes(fileType) ||
        fileType.includes(requiredName))
    );
  }

  private buildProtocolLookupEntry(execution: FlowExecution, session: CitizenAiSessionState, prefix?: string): BotResponse {
    return {
      message: `${prefix ? `${prefix}\n\n` : ''}Posso consultar pelo numero, listar seus protocolos ou abrir o mais recente.`,
      messageType: 'menu',
      data: { options: PROTOCOL_ENTRY_ACTIONS },
      metadata: this.meta(execution, session, true),
    };
  }

  private async tryDepartmentShortcut(execution: FlowExecution, session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const normalized = this.normalize(message);
    if (normalized.length < 3 || normalized.split(' ').length > 4) return null;
    if (this.isAmbiguousTinyMessage(normalized)) return null;

    const departmentsResult = await this.runAction('getDepartments', {}, execution, session);
    const departments = Array.isArray(departmentsResult.departments) ? departmentsResult.departments as MenuOption[] : [];
    if (!departments.length) return null;

    const selected = departments.find((department) => {
      const label = this.normalize(String(department.label || ''));
      const name = this.normalize(String((department as any).name || department.label || ''));
      const cleanLabel = label.replace(/\bsecretaria\b|\bmunicipal\b|\bde\b|\bda\b|\bdo\b|\bdos\b|\bdas\b/g, ' ').replace(/\s+/g, ' ').trim();
      const cleanName = name.replace(/\bsecretaria\b|\bmunicipal\b|\bde\b|\bda\b|\bdo\b|\bdos\b|\bdas\b/g, ' ').replace(/\s+/g, ' ').trim();
      return normalized === cleanLabel ||
        normalized === cleanName ||
        cleanLabel.includes(normalized) ||
        cleanName.includes(normalized) ||
        normalized.includes(cleanName);
    });

    if (!selected) return null;

    const next: CitizenAiSessionState = {
      ...session,
      stage: 'awaiting_department_selection',
      departmentCandidates: departments,
      lastIntent: 'solicitar_servico',
    };
    return this.handleDepartmentSelection(execution, next, selected.id);
  }

  private findOptionByInput(input: string, options: MenuOption[]): MenuOption | undefined {
    const normalized = this.normalize(input);
    return options.find((option) => {
      const optionId = this.normalize(String(option.id));
      const optionLabel = this.normalize(String(option.label));
      return normalized === optionId || normalized === optionLabel || optionLabel.includes(normalized) || normalized.includes(optionLabel);
    });
  }

  private parseFieldValue(field: FieldDef, input: string): string | number | boolean | undefined {
    const normalized = this.normalize(input);
    if (Array.isArray(field.options) && field.options.length > 0) {
      const matched = field.options.find((option) => {
        const optionId = this.normalize(String(option.id || option.value || option.label || ''));
        const optionLabel = this.normalize(String(option.label || option.value || option.id || ''));
        return normalized === optionId || normalized === optionLabel || optionLabel.includes(normalized) || normalized.includes(optionLabel);
      });
      if (matched) return String(matched.id || matched.value || matched.label);
    }
    if (field.type === 'boolean' || field.type === 'checkbox') { if (this.matchesAny(normalized, YES_PATTERNS)) return true; if (this.matchesAny(normalized, NO_PATTERNS)) return false; }
    if (field.type === 'number') { const match = input.match(/\d+(?:[.,]\d+)?/); return match ? Number.parseFloat(match[0].replace(',', '.')) : undefined; }
    if (field.type === 'date') return input.match(/\b\d{2}\/\d{2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/)?.[0];
    return input.trim() || undefined;
  }

  private buildRequiredPendingFieldIds(session: CitizenAiSessionState): string[] {
    const questions = Array.isArray(session.formSchemaData?.questions) ? session.formSchemaData?.questions as FieldDef[] : [];
    const collected = session.collectedFormData || {};
    const required = questions.filter((field) => field.required !== false).map((field) => field.id).filter((fieldId) => collected[fieldId] === undefined);
    if ((!session.description || String(session.description).trim().length < 10) && questions.length === 0) required.unshift('description');
    return required;
  }

  private getFormQuestions(session: CitizenAiSessionState): FieldDef[] {
    return Array.isArray(session.formSchemaData?.questions) ? session.formSchemaData?.questions as FieldDef[] : [];
  }

  private getCorrectableFields(session: CitizenAiSessionState): FieldDef[] {
    const fields = this.getFormQuestions(session);
    const hasDescription = Boolean(session.description || fields.length === 0);
    return hasDescription
      ? [{ id: 'description', label: 'Descricao da solicitacao', type: 'textarea', required: true }, ...fields]
      : fields;
  }

  private findCorrectableField(session: CitizenAiSessionState, input: string): FieldDef | undefined {
    const normalized = this.normalize(input);
    if (!normalized) return undefined;
    return this.getCorrectableFields(session).find((field) => {
      const fieldId = this.normalize(field.id);
      const fieldLabel = this.normalize(field.label);
      return normalized === fieldId ||
        normalized === fieldLabel ||
        normalized.includes(fieldLabel) ||
        normalized.includes(fieldId);
    });
  }

  private extractCorrectionValue(input: string): string | undefined {
    const trimmed = input.trim();
    const direct = trimmed.match(/\b(?:para|por|como|correto e|correto eh|correto é)\s+(.+)$/i)?.[1];
    if (direct?.trim()) return direct.trim();
    const actually = trimmed.match(/\b(?:na verdade|o correto)\s+(?:e|eh|é)?\s*(.+)$/i)?.[1];
    if (actually?.trim()) return actually.trim();
    const colon = trimmed.match(/:\s*(.+)$/)?.[1];
    if (colon?.trim()) return colon.trim();
    return undefined;
  }

  private isCorrectionRequest(message: string): boolean {
    return this.matchesAny(this.normalize(message), CORRECTION_PATTERNS);
  }

  private isCompetingGlobalIntent(message: string): boolean {
    const normalized = this.normalize(message);
    const intent = this.matchExplicitIntent(normalized);
    return Boolean(
      intent &&
      !['descrever_solicitacao', 'voltar_menu'].includes(intent) &&
      !this.matchesAny(normalized, YES_PATTERNS) &&
      !this.matchesAny(normalized, NO_PATTERNS)
    );
  }

  private isFlowLockedStage(stage: CitizenAiStage): boolean {
    return [
      'collecting_fields',
      'awaiting_documents',
      'awaiting_review_confirmation',
      'awaiting_correction_field',
      'awaiting_protocol_pending_selection',
      'awaiting_protocol_pending_text_resolution',
      'awaiting_protocol_pending_document_upload',
    ].includes(stage);
  }

  private async handleLockedFlowShortcut(execution: FlowExecution, session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const normalized = this.normalize(message);
    if (!normalized) return null;

    if (this.matchesAny(normalized, MENU_PATTERNS)) {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    if (this.matchesAny(normalized, CONTINUE_PATTERNS)) {
      return {
        session,
        response: this.buildResumeResponse(execution, session),
      };
    }

    if (this.matchesAny(normalized, HELP_PATTERNS)) {
      return {
        session,
        response: {
          message: this.buildLockedHelpMessage(session),
          messageType: 'menu',
          data: { options: [{ id: 'continuar', label: 'Continuar', description: 'Permanecer neste atendimento' }, { id: 'corrigir', label: 'Corrigir dados', description: 'Alterar informacoes coletadas' }, { id: 'voltar_menu', label: 'Voltar ao menu', description: 'Encerrar este fluxo e voltar ao inicio' }] },
          metadata: this.meta(execution, session, true),
        },
      };
    }

    return null;
  }

  private buildLockedHelpMessage(session: CitizenAiSessionState): string {
    if (session.stage === 'awaiting_review_confirmation') return 'Estamos revisando esta solicitacao. Voce pode confirmar o envio ou corrigir uma informacao sem reiniciar.';
    if (session.stage === 'collecting_fields') return `Ainda estou coletando dados para ${session.selectedServiceName || 'sua solicitacao'}. Informe o dado solicitado ou diga corrigir para ajustar algo.`;
    if (session.stage === 'awaiting_documents') return 'Este atendimento esta aguardando documentos obrigatorios. Envie os anexos solicitados para continuar.';
    if (session.stage.startsWith('awaiting_protocol_pending')) return 'Estamos resolvendo uma pendencia deste protocolo. Conclua esta etapa ou volte ao menu para encerrar o fluxo atual.';
    return 'Estamos no meio de um atendimento. Posso continuar, corrigir dados ou voltar ao menu.';
  }

  private buildCorrectionMenu(execution: FlowExecution, session: CitizenAiSessionState, prefix?: string): BotResponse {
    const options = this.getCorrectableFields(session).map((field) => ({
      id: field.id,
      label: field.label,
      description: field.id === 'description' ? 'Texto principal da solicitacao' : 'Dado informado no formulario',
    }));

    return {
      message: `${prefix ? `${prefix}\n\n` : ''}Tambem pode escrever direto, por exemplo: corrigir endereco para Rua Brasil, 100.`,
      messageType: 'menu',
      data: { options: [...options, { id: 'confirmar', label: 'Voltar para revisao', description: 'Revisar e confirmar envio' }] },
      metadata: this.meta(execution, session, true),
    };
  }

  private async buildAiGuidedFallback(
    execution: FlowExecution,
    session: CitizenAiSessionState,
    message: string,
    recentMessages: string[],
    serviceSearchSummary?: string
  ): Promise<CitizenAiDecision> {
    const availableActions = session.stage === 'awaiting_request_mode'
      ? SERVICE_ENTRY_ACTIONS
      : CONTEXTUAL_ACTIONS;

    let responseMessage = session.stage === 'awaiting_request_mode'
      ? 'Entendi sua necessidade, mas ainda preciso ligar isso a um servico correto. Posso buscar por secretaria ou voce pode descrever de outro jeito.'
      : 'Entendi sua mensagem, mas preciso escolher o melhor caminho para continuar. Posso abrir uma solicitacao, consultar protocolo ou navegar por secretaria.';
    let options = availableActions;

    if (citizenAiClient.available()) {
      this.stats.aiTurns += 1;
      const guidance = await citizenAiClient.generateGuidance({
        citizenId: execution.citizenId,
        message,
        recentMessages,
        sessionContext: this.buildSessionContext(session),
        availableActions,
        serviceSearchSummary,
      });

      if (guidance?.message && guidance.confidence >= 0.45) {
        responseMessage = guidance.message;
        if (guidance.suggestedActionIds.length > 0) {
          const suggested = availableActions.filter((action) => guidance.suggestedActionIds.includes(action.id));
          const remaining = availableActions.filter((action) => !guidance.suggestedActionIds.includes(action.id));
          options = [...suggested, ...remaining].slice(0, Math.max(3, suggested.length));
        }
      }
    }

    await this.persistSession(execution.id, session);
    return {
      session,
      response: {
        message: responseMessage,
        messageType: 'menu',
        data: { options },
        metadata: this.meta(execution, session, true),
      },
    };
  }

  private async buildContextualCorrectionFallback(execution: FlowExecution, session: CitizenAiSessionState): Promise<CitizenAiDecision> {
    const next = this.withStage(session, 'awaiting_correction_field');
    await this.persistSession(execution.id, next);
    return { session: next, response: this.buildCorrectionMenu(execution, next, 'Posso corrigir dados quando existe uma solicitacao em andamento.') };
  }

  private buildSessionContext(session: CitizenAiSessionState): string {
    const pendingLabels = this.getCorrectableFields(session)
      .filter((field) => (session.pendingFieldIds || []).includes(field.id))
      .map((field) => field.label);
    const collected = Object.entries(session.collectedFormData || {})
      .slice(0, 8)
      .map(([key, value]) => `${key}=${String(value)}`)
      .join('; ');

    return [
      `stage=${session.stage}`,
      session.selectedServiceName ? `servico=${session.selectedServiceName}` : undefined,
      session.currentFieldLabel ? `pergunta_atual=${session.currentFieldLabel}` : undefined,
      pendingLabels.length ? `pendentes=${pendingLabels.join(', ')}` : undefined,
      session.description ? `descricao=${session.description}` : undefined,
      collected ? `dados=${collected}` : undefined,
      session.protocolNumber ? `protocolo=${session.protocolNumber}` : undefined,
    ].filter(Boolean).join(' | ');
  }

  private buildProtocolFingerprint(session: CitizenAiSessionState): string {
    return JSON.stringify({
      serviceId: session.selectedServiceId || '',
      description: session.description || '',
      formData: Object.keys(session.collectedFormData || {}).sort().reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = session.collectedFormData?.[key];
        return acc;
      }, {}),
      documents: (session.uploadedDocuments || []).map((doc) => String(doc.filePath || doc.fileName || doc.id || '')).sort(),
    });
  }

  private buildDuplicateProtocolResponse(execution: FlowExecution, session: CitizenAiSessionState): CitizenAiDecision {
    const protocolNumber = session.createdProtocolNumber || '';
    return {
      session,
      response: {
        message: `Esta solicitacao ja foi enviada e nao vou criar outro protocolo duplicado.\n\nNumero do protocolo: ${protocolNumber || 'gerado anteriormente'}`,
        messageType: 'card',
        data: { cards: [{ id: session.createdProtocolId || protocolNumber || 'created-protocol', title: `Protocolo ${protocolNumber || 'criado'}`, description: session.selectedServiceName || 'Solicitacao registrada', metadata: { protocolNumber, status: 'ABERTO' } }] },
        metadata: this.meta(execution, session, true),
      },
    };
  }

  private async handleGlobalShortcut(execution: FlowExecution, session: CitizenAiSessionState, message: string): Promise<CitizenAiDecision | null> {
    const normalized = this.normalize(message);
    if (!normalized) return null;
    const protocolMode = this.detectProtocolMode(message);

    if (this.matchesAny(normalized, MENU_PATTERNS)) {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
    }

    if (this.matchesAny(normalized, SERVICE_PATTERNS)) {
      const next: CitizenAiSessionState = {
        ...session,
        stage: 'awaiting_request_mode',
        lastIntent: 'solicitar_servico',
      };
      await this.persistSession(execution.id, next);
      return this.buildGuidedServiceEntry(execution, next);
    }

    if (normalized === 'consultar protocolo' || normalized === 'consultar_protocolo' || protocolMode) {
      const next: CitizenAiSessionState = {
        ...session,
        lastIntent: 'consultar_protocolo',
      };
      return this.handleProtocolIntent(execution, next, message);
    }

    if (this.matchesAny(normalized, HELP_PATTERNS)) {
      const next = { ...session, lastIntent: 'ajuda' as const };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return {
        session: next,
        redirectToFlowName: LEGACY_FLOW_BY_INTENT.ajuda,
        response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) },
      };
    }

    if (this.matchesAny(normalized, PROFILE_PATTERNS)) {
      const next = { ...session, lastIntent: 'meu_perfil' as const };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return {
        session: next,
        redirectToFlowName: LEGACY_FLOW_BY_INTENT.meu_perfil,
        response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) },
      };
    }

    if (this.matchesAny(normalized, DOCUMENT_PATTERNS)) {
      const next = { ...session, lastIntent: 'documentos' as const };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return {
        session: next,
        redirectToFlowName: LEGACY_FLOW_BY_INTENT.documentos,
        response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) },
      };
    }

    if (this.matchesAny(normalized, FAMILY_PATTERNS)) {
      const next = { ...session, lastIntent: 'minha_familia' as const };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return {
        session: next,
        redirectToFlowName: LEGACY_FLOW_BY_INTENT.minha_familia,
        response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) },
      };
    }

    if (this.matchesAny(normalized, NOTIFICATION_PATTERNS)) {
      const next = { ...session, lastIntent: 'notificacoes' as const };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return {
        session: next,
        redirectToFlowName: LEGACY_FLOW_BY_INTENT.notificacoes,
        response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) },
      };
    }

    if (this.matchesAny(normalized, EVALUATION_PATTERNS)) {
      const next = { ...session, lastIntent: 'avaliacao' as const };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return {
        session: next,
        redirectToFlowName: LEGACY_FLOW_BY_INTENT.avaliacao,
        response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) },
      };
    }

    if (this.matchesAny(normalized, DEPARTMENT_PATTERNS)) {
      const next: CitizenAiSessionState = { ...session, lastIntent: 'solicitar_servico' };
      await this.persistSession(execution.id, next);
      return this.presentDepartments(execution, next);
    }

    return null;
  }
}

export const citizenAiOrchestrator = new CitizenAiOrchestrator();
