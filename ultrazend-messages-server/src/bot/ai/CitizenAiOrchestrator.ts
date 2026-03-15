import { FlowExecution } from '@prisma/client';
import { FlowStateManager } from '../flow/FlowStateManager';
import { actionHandlers } from '../flow/ActionHandlers';
import { BotResponse, ExecutionContext, FlowNode, MenuOption } from '../types';
import { citizenAiClient } from './CitizenAiClient';
import { CitizenAiDecision, CitizenAiSessionState, CitizenAiStage } from './types';

const QUICK_ACTIONS: MenuOption[] = [
  { id: 'solicitar_servico', label: 'Solicitar servico', description: 'Abrir uma nova solicitacao guiada' },
  { id: 'explorar_secretarias', label: 'Explorar por secretaria', description: 'Ver servicos por secretaria' },
  { id: 'consultar_protocolo', label: 'Consultar protocolo', description: 'Acompanhar andamento' },
  { id: 'meu_perfil', label: 'Meu perfil', description: 'Ver e atualizar dados' },
  { id: 'documentos', label: 'Meus documentos', description: 'Consultar arquivos enviados' },
  { id: 'ajuda', label: 'Ajuda', description: 'Tirar duvidas' },
];

const SERVICE_ENTRY_ACTIONS: MenuOption[] = [
  { id: 'descrever_solicitacao', label: 'Descrever com minhas palavras', description: 'Eu digo o que preciso e o bot sugere o servico' },
  { id: 'explorar_secretarias', label: 'Explorar por secretaria', description: 'Escolher primeiro a secretaria responsavel' },
  { id: 'consultar_protocolo', label: 'Consultar protocolo', description: 'Acompanhar uma solicitacao existente' },
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

const HUMAN_PATTERNS = ['humano', 'atendente', 'servidor', 'pessoa real', 'falar com alguem'];
const YES_PATTERNS = ['sim', 'confirmar', 'confirmo', 'ok', 'pode enviar', 'prosseguir'];
const NO_PATTERNS = ['nao', 'não', 'cancelar', 'corrigir', 'voltar', 'outro'];

type ExecutionLike = FlowExecution & { flow?: { id: string; name: string } | null };
type FieldDef = { id: string; label: string; type?: string; required?: boolean; options?: Array<{ id?: string; label?: string; value?: string }> };

export class CitizenAiOrchestrator {
  private readonly stateManager = new FlowStateManager();
  private readonly stats = { sessionsStarted: 0, aiTurns: 0, lowConfidenceFallbacks: 0, legacyRedirects: 0, protocolsCreated: 0, protocolLookups: 0, humanHandoverRequests: 0 };

  async startSession(params: { citizenId: string; flowId: string; conversationId: string; existingExecution?: ExecutionLike | null }): Promise<{ execution: FlowExecution; response: BotResponse }> {
    const execution = await this.ensureExecution(params);
    const session = this.getSessionState(execution);
    this.stats.sessionsStarted += 1;
    return { execution, response: this.buildWelcomeResponse(execution, session) };
  }

  async processText(params: { citizenId: string; flowId: string; conversationId: string; message: string; existingExecution?: ExecutionLike | null; recentMessages: string[] }): Promise<CitizenAiDecision> {
    const execution = await this.ensureExecution(params);
    const session = this.getSessionState(execution);
    const message = params.message.trim();

    if (this.isHumanRequest(message)) {
      this.stats.humanHandoverRequests += 1;
      const next = this.withStage(session, 'paused_human');
      await this.persistSession(execution.id, next);
      return { session: next, requestHumanHandover: true, handoverReason: 'citizen_request', response: { message: 'Certo. Vou sinalizar que voce deseja atendimento humano.', messageType: 'text', metadata: this.meta(execution, next, false) } };
    }

    if (session.stage === 'awaiting_request_mode') return this.handleRequestMode(execution, session, message);
    if (session.stage === 'awaiting_department_selection') return this.handleDepartmentSelection(execution, session, message);
    if (session.stage === 'awaiting_service_selection') return this.handleServiceSelection(execution, session, message);
    if (session.stage === 'awaiting_protocol_number') return this.handleProtocolLookup(execution, session, message);
    if (session.stage === 'collecting_fields') return this.handleFieldCollection(execution, session, message);
    if (session.stage === 'awaiting_review_confirmation') return this.handleReviewConfirmation(execution, session, message);
    if (session.stage === 'awaiting_documents') return { session, response: { message: 'Ainda estou aguardando o envio dos documentos obrigatorios.', messageType: 'text', metadata: this.meta(execution, session, true) } };
    if (session.stage === 'paused_human') return { session, response: { message: 'Sua conversa esta pausada para atendimento humano. Aguarde um servidor assumir.', messageType: 'text', metadata: this.meta(execution, session, false, { paused: true }) } };

    return this.handleTriage(execution, session, message, params.recentMessages);
  }

  async processUpload(params: { citizenId: string; flowId: string; conversationId: string; files: Array<Record<string, unknown>>; existingExecution?: ExecutionLike | null }): Promise<CitizenAiDecision> {
    const execution = await this.ensureExecution(params);
    const session = this.getSessionState(execution);
    if (session.stage !== 'awaiting_documents') {
      return { session, response: { message: 'Arquivos recebidos, mas eu nao estava aguardando documentos neste momento.', messageType: 'text', metadata: this.meta(execution, session, true) } };
    }

    const next: CitizenAiSessionState = { ...session, uploadedDocuments: [...(session.uploadedDocuments || []), ...params.files], stage: 'awaiting_review_confirmation' };
    next.reviewText = await this.buildReviewText(execution, next);
    await this.persistSession(execution.id, next);
    return { session: next, response: this.buildReviewResponse(execution, next) };
  }

  getStats() { return { ...this.stats, aiAvailable: citizenAiClient.available() }; }

  private async handleTriage(execution: FlowExecution, session: CitizenAiSessionState, message: string, recentMessages: string[]): Promise<CitizenAiDecision> {
    const normalized = this.normalize(message);
    const protocolNumber = this.extractProtocolNumber(message);
    const explicitIntent = this.matchExplicitIntent(normalized);

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

    if (explicitIntent === 'consultar_protocolo' || protocolNumber) {
      const next: CitizenAiSessionState = { ...session, lastIntent: 'consultar_protocolo' };
      const number = protocolNumber;
      if (!number) {
        const wait = this.withStage(next, 'awaiting_protocol_number');
        await this.persistSession(execution.id, wait);
        return { session: wait, response: { message: 'Informe o numero do protocolo que voce deseja consultar.', messageType: 'text', metadata: this.meta(execution, wait, true) } };
      }
      return this.handleProtocolLookup(execution, next, number);
    }

    if (explicitIntent && LEGACY_FLOW_BY_INTENT[explicitIntent]) {
      const next = { ...session, lastIntent: explicitIntent as CitizenAiSessionState['lastIntent'] };
      this.stats.legacyRedirects += 1;
      await this.persistSession(execution.id, next);
      return { session: next, redirectToFlowName: LEGACY_FLOW_BY_INTENT[explicitIntent], response: { message: '', messageType: 'text', metadata: this.meta(execution, next, false) } };
    }

    if (this.shouldTryDirectServiceSearch(message)) {
      const serviceDecision = await this.beginServiceRequest(execution, { ...session, lastIntent: 'solicitar_servico' }, message, message, true);
      if (serviceDecision.session.stage !== 'awaiting_request_mode') {
        return serviceDecision;
      }
    }

    this.stats.aiTurns += 1;
    const analysis = (await citizenAiClient.analyzeTurn({ citizenId: execution.citizenId, message, recentMessages })) || { intent: 'unknown', confidence: 0.25, protocolNumber };
    const next: CitizenAiSessionState = { ...session, lastIntent: analysis.intent as CitizenAiSessionState['lastIntent'] };

    if (analysis.intent === 'consultar_protocolo') {
      const number = analysis.protocolNumber || protocolNumber;
      if (!number) {
        const wait = this.withStage(next, 'awaiting_protocol_number');
        await this.persistSession(execution.id, wait);
        return { session: wait, response: { message: 'Informe o numero do protocolo que voce deseja consultar.', messageType: 'text', metadata: this.meta(execution, wait, true) } };
      }
      return this.handleProtocolLookup(execution, next, number);
    }

    if (analysis.intent === 'solicitar_servico') return this.beginServiceRequest(execution, next, message, analysis.serviceQuery || message, true);
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
    await this.persistSession(execution.id, next);
    return { session: next, response: { message: 'Posso te guiar por menus ou entender sua necessidade em linguagem natural. Escolha uma opcao ou descreva o que precisa.', messageType: 'menu', data: { options: QUICK_ACTIONS }, metadata: this.meta(execution, next, true) } };
  }

  private async handleRequestMode(execution: FlowExecution, session: CitizenAiSessionState, userMessage: string): Promise<CitizenAiDecision> {
    const intent = this.matchExplicitIntent(this.normalize(userMessage));
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
    if (intent === 'consultar_protocolo') {
      const next = this.withStage({ ...session, lastIntent: 'consultar_protocolo' }, 'awaiting_protocol_number');
      await this.persistSession(execution.id, next);
      return { session: next, response: { message: 'Informe o numero do protocolo que voce deseja consultar.', messageType: 'text', metadata: this.meta(execution, next, true) } };
    }
    if (intent === 'voltar_menu') {
      const next = this.withStage({ ...session, lastIntent: 'greeting' }, 'triage');
      await this.persistSession(execution.id, next);
      return { session: next, response: this.buildWelcomeResponse(execution, next) };
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
        data: { options: departments },
        metadata: this.meta(execution, next, true),
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
          data: { options: departments },
          metadata: this.meta(execution, session, true),
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
          displayMode: 'categories',
        } as any,
        metadata: this.meta(execution, next, true, {
          categories: Array.isArray(result.categories) ? result.categories : undefined,
          departmentName: String(result.department?.name || selectedDepartment.label),
          displayMode: 'categories',
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
      return {
        session: next,
        response: {
          message: guidedFallback
            ? 'Nao identifiquei um servico com seguranca. Posso continuar por descricao livre ou te guiar por secretaria.'
            : 'Nao encontrei um servico claro para essa solicitacao. Descreva com mais detalhes o que precisa.',
          messageType: guidedFallback ? 'menu' : 'text',
          data: guidedFallback ? { options: SERVICE_ENTRY_ACTIONS } : undefined,
          metadata: this.meta(execution, next, true),
        },
      };
    }

    if (services.length === 1) return this.selectServiceById(execution, session, userMessage, services[0].id, services);
    const wait: CitizenAiSessionState = { ...session, stage: 'awaiting_service_selection', serviceSearchQuery: searchQuery, serviceCandidates: services };
    await this.persistSession(execution.id, wait);
    return { session: wait, response: { message: 'Encontrei estes servicos mais proximos. Escolha o que melhor representa sua necessidade.', messageType: 'menu', data: { options: services }, metadata: this.meta(execution, wait, true) } };
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

    if (!selectedId) return { session, response: { message: 'Nao consegui identificar o servico correto. Selecione uma opcao da lista.', messageType: 'menu', data: { options: candidates }, metadata: this.meta(execution, session, true) } };
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
    const extraction = questions.length ? await citizenAiClient.extractFields({ citizenId: execution.citizenId, message: userMessage, serviceName: String(schemaResult.service?.name || 'servico'), fields: questions }) : null;
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

    if (currentField.id === 'description') {
      const description = userMessage.trim();
      if (description.length < 10) return { session, response: this.buildDescriptionPrompt(execution, session, 'Descreva com um pouco mais de detalhes para eu registrar corretamente.') };
      const next: CitizenAiSessionState = { ...session, description, currentFieldId: undefined, currentFieldLabel: undefined, pendingFieldIds: (session.pendingFieldIds || []).filter((fieldId) => fieldId !== 'description') };
      return this.finishCollectionStep(execution, next);
    }

    const parsedValue = this.parseFieldValue(currentField, userMessage);
    if (parsedValue === undefined) this.stats.aiTurns += 1;
    const extraction = parsedValue === undefined ? await citizenAiClient.extractFields({ citizenId: execution.citizenId, message: userMessage, serviceName: session.selectedServiceName || 'servico', fields: [currentField] }) : null;
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
    if (this.matchesAny(normalized, NO_PATTERNS)) {
      const pendingFieldIds = this.buildRequiredPendingFieldIds(session);
      const restart: CitizenAiSessionState = { ...session, stage: 'collecting_fields', pendingFieldIds, currentFieldId: pendingFieldIds[0] };
      await this.persistSession(execution.id, restart);
      return { session: restart, response: { message: 'Sem problema. Vamos revisar os dados novamente desde o inicio.', messageType: 'text', metadata: this.meta(execution, restart, true) } };
    }

    if (!this.matchesAny(normalized, YES_PATTERNS)) return { session, response: { message: 'Responda com confirmar para enviar ou corrigir para revisar os dados.', messageType: 'menu', data: { options: [{ id: 'confirmar', label: 'Confirmar e enviar', description: 'Criar protocolo agora' }, { id: 'corrigir', label: 'Corrigir dados', description: 'Revisar informacoes antes do envio' }] }, metadata: this.meta(execution, session, true) } };

    const createResult = await this.runAction('createProtocol', { serviceId: session.selectedServiceId, description: session.description, formData: session.collectedFormData, documents: session.uploadedDocuments }, execution, session);
    if (createResult.success === false || !createResult.protocol) return { session, response: { message: typeof createResult.error === 'string' ? createResult.error : 'Nao foi possivel criar o protocolo agora.', messageType: 'text', metadata: this.meta(execution, session, true) } };

    this.stats.protocolsCreated += 1;
    const finished = this.withStage(session, 'triage');
    await this.persistSession(execution.id, finished);
    const protocol = createResult.protocol as Record<string, any>;
    const protocolNumber = String(protocol.number || protocol.protocolNumber || '');
    return { session: finished, response: { message: `Solicitacao enviada com sucesso.\n\nNumero do protocolo: ${protocolNumber || 'gerado com sucesso'}\nServico: ${session.selectedServiceName || 'Solicitacao registrada'}\n\nSe quiser, tambem posso consultar esse protocolo depois para voce.`, messageType: 'card', data: { cards: [{ id: String(protocol.id || protocolNumber || Date.now()), title: `Protocolo ${protocolNumber || 'criado'}`, description: String(protocol.title || session.selectedServiceName || 'Solicitacao registrada'), metadata: { protocolNumber, status: protocol.status || 'ABERTO' } }] }, metadata: this.meta(execution, finished, true) } };
  }

  private async handleProtocolLookup(execution: FlowExecution, session: CitizenAiSessionState, rawInput: string): Promise<CitizenAiDecision> {
    const protocolNumber = this.extractProtocolNumber(rawInput) || rawInput.trim();
    if (!protocolNumber) {
      const waiting = this.withStage(session, 'awaiting_protocol_number');
      await this.persistSession(execution.id, waiting);
      return { session: waiting, response: { message: 'Informe o numero do protocolo para eu consultar.', messageType: 'text', metadata: this.meta(execution, waiting, true) } };
    }

    const details = await this.runAction('getProtocolDetails', { protocolNumber }, execution, session);
    const next: CitizenAiSessionState = { ...session, stage: 'triage', protocolNumber };
    await this.persistSession(execution.id, next);
    if (details.success === false) return { session: next, response: { message: typeof details.error === 'string' ? details.error : `Nao consegui localizar o protocolo ${protocolNumber}.`, messageType: 'text', metadata: this.meta(execution, next, true) } };

    this.stats.protocolLookups += 1;
    return { session: next, response: { message: typeof details.summary === 'string' && details.summary.trim() ? details.summary.trim() : `Consulta concluida para o protocolo ${protocolNumber}.`, messageType: 'text', data: details.protocolDetailCard ? { protocolDetailCard: details.protocolDetailCard } : undefined, metadata: this.meta(execution, next, true, details.protocolDetailCard ? { protocolDetailCard: details.protocolDetailCard } : {}) } };
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

  private buildReviewResponse(execution: FlowExecution, session: CitizenAiSessionState): BotResponse {
    return { message: `${session.reviewText || 'Revise os dados coletados abaixo.'}\n\nConfirma o envio da solicitacao?`, messageType: 'menu', data: { options: [{ id: 'confirmar', label: 'Confirmar e enviar', description: 'Criar o protocolo agora' }, { id: 'corrigir', label: 'Corrigir dados', description: 'Voltar para revisar informacoes' }] }, metadata: this.meta(execution, session, true) };
  }

  private buildUploadPrompt(execution: FlowExecution, session: CitizenAiSessionState): BotResponse {
    const uploadConfig = { text: 'Envie os documentos obrigatorios', multiple: true, maxFiles: 5, maxFileSize: 10, allowSkip: false, allowedTypes: ['application/pdf', 'image/*'], saveAs: 'uploadedDocuments' };
    const requiredDocuments = Array.isArray(session.formSchemaData?.requiredDocuments) ? session.formSchemaData?.requiredDocuments as any[] : [];
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
    return { flowId: execution.flowId, executionId: execution.id, nodeId: session.stage, waitingForInput, aiEngine: 'qwen3.5-2b-routing', aiStage: session.stage, ...extra };
  }

  private async runAction(actionName: keyof typeof actionHandlers, params: Record<string, unknown>, execution: FlowExecution, session: CitizenAiSessionState): Promise<Record<string, any>> {
    const currentNode: FlowNode = { id: session.stage, type: 'action', config: { action: actionName, params }, transitions: [] };
    const context: ExecutionContext = { execution: execution as any, flow: { id: execution.flowId, name: 'ai_assistant', version: '1.0.0', isActive: true, isDefault: false, nodes: [currentNode], createdAt: new Date(), updatedAt: new Date() }, currentNode, citizenId: execution.citizenId, state: { selectedServiceId: session.selectedServiceId, collectedFormData: session.collectedFormData || {}, description: session.description, uploadedDocuments: session.uploadedDocuments || [], protocolNumber: session.protocolNumber, formSchemaData: session.formSchemaData || {}, aiAssistant: session } };
    const result = await actionHandlers[actionName](params, context);
    return result && typeof result === 'object' ? result as Record<string, any> : {};
  }

  private normalize(value: string): string {
    return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  private matchExplicitIntent(normalized: string): string | undefined {
    if (!normalized) return undefined;
    if (normalized === 'solicitar servico' || normalized === 'solicitar_servico') return 'solicitar_servico';
    if (normalized === 'explorar por secretaria' || normalized === 'explorar_secretarias' || normalized === 'secretarias' || normalized === 'secretaria') return 'explorar_secretarias';
    if (normalized === 'consultar protocolo' || normalized === 'consultar_protocolo') return 'consultar_protocolo';
    if (normalized === 'meu perfil' || normalized === 'meu_perfil') return 'meu_perfil';
    if (normalized === 'documentos' || normalized === 'meus documentos') return 'documentos';
    if (normalized === 'ajuda') return 'ajuda';
    if (normalized === 'voltar menu' || normalized === 'voltar ao menu' || normalized === 'voltar_menu' || normalized === 'menu') return 'voltar_menu';
    if (normalized === 'descrever solicitacao' || normalized === 'descrever com minhas palavras' || normalized === 'descrever_solicitacao') return 'descrever_solicitacao';
    return undefined;
  }

  private shouldTryDirectServiceSearch(message: string): boolean {
    const normalized = this.normalize(message);
    if (normalized.length < 6) return false;
    if (this.isGreeting(message)) return false;
    if (this.extractProtocolNumber(message)) return false;
    if (this.matchExplicitIntent(normalized)) return false;
    if (this.isHumanRequest(message)) return false;
    return true;
  }

  private matchesAny(value: string, patterns: string[]): boolean { return patterns.some((pattern) => value.includes(this.normalize(pattern))); }
  private isGreeting(message: string): boolean { const normalized = this.normalize(message); return ['ola', 'oi', 'bom dia', 'boa tarde', 'boa noite'].some((pattern) => normalized.includes(pattern)); }
  private isHumanRequest(message: string): boolean { return this.matchesAny(this.normalize(message), HUMAN_PATTERNS); }
  private extractProtocolNumber(message: string): string | undefined { return message.match(/\b\d{4,}\b/)?.[0]; }

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
}

export const citizenAiOrchestrator = new CitizenAiOrchestrator();
