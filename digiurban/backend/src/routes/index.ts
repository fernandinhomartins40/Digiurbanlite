// ============================================================
// ROUTES - Centralized Router Configuration
// ============================================================
// Este arquivo agrupa e organiza todas as rotas do sistema
// usando lazy loading para otimizar a performance do TypeScript

import { Router } from 'express';

// ============================================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================================
export const loadPublicRoutes = () => {
  console.log('  📂 Carregando rotas públicas...');
  const router = Router();
  const publicRoutes = require('./public').default;
  router.use('/public', publicRoutes);
  console.log('  ✅ Rotas públicas carregadas');
  return router;
};

// ============================================================
// ROTAS BÁSICAS (Fase 1)
// ============================================================
export const loadBasicRoutes = () => {
  console.log('  📂 Carregando rotas básicas...');
  const router = Router();
  const serviceRoutes = require('./services').default;
  router.use('/services', serviceRoutes);
  console.log('  ✅ Rotas básicas carregadas');
  return router;
};

// ============================================================
// SISTEMA DE PROTOCOLOS (Motor de Protocolos V2)
// ============================================================
export const loadProtocolRoutes = () => {
  console.log('  📂 Carregando rotas de protocolos...');
  const router = Router();

  console.log('    - protocols-simplified.routes');
  const protocolsSimplifiedRoutes = require('./protocols-simplified.routes').default;
  console.log('    - protocol-interactions');
  const protocolInteractionsRoutes = require('./protocol-interactions').default;
  console.log('    - protocol-documents');
  const protocolDocumentsRoutes = require('./protocol-documents').default;
  console.log('    - protocol-pendings');
  const protocolPendingsRoutes = require('./protocol-pendings').default;
  console.log('    - protocol-stages');
  const protocolStagesRoutes = require('./protocol-stages').default;
  console.log('    - protocol-sla');
  const protocolSLARoutes = require('./protocol-sla').default;
  console.log('    - service-workflows (novo)');
  const serviceWorkflowsRoutes = require('./service-workflows.routes').default;
  console.log('    - protocol-citizen-links');
  const protocolCitizenLinksRoutes = require('./protocol-citizen-links.routes').default;
  console.log('    - unified-protocols (novo)');
  const unifiedProtocolsRoutes = require('./unified-protocols.routes').default;

  console.log('    - Montando rotas...');
  router.use('/protocols', protocolsSimplifiedRoutes);
  router.use('/protocols', protocolInteractionsRoutes);
  router.use('/protocols', protocolDocumentsRoutes);
  router.use('/protocols', protocolPendingsRoutes);
  router.use('/protocols', protocolStagesRoutes);
  router.use('/protocols', protocolSLARoutes);
  router.use('/protocols', protocolCitizenLinksRoutes);
  router.use('/protocols', unifiedProtocolsRoutes); // Rotas unificadas
  router.use('/service-workflows', serviceWorkflowsRoutes); // Workflows por serviço (fonte única)
  router.use('/sla', protocolSLARoutes);

  console.log('  ✅ Rotas de protocolos carregadas');
  return router;
};

// ============================================================
// PORTAL DO CIDADÃO (Fase 3)
// ============================================================
export const loadCitizenRoutes = () => {
  const router = Router();

  const citizenAuthRoutes = require('./citizen-auth').default;
  const citizenServicesRoutes = require('./citizen-services').default;
  const citizenProtocolsRoutes = require('./citizen-protocols').default;
  const citizenFamilyRoutes = require('./citizen-family').default;
  const citizenDocumentsRoutes = require('./citizen-documents').default;
  const citizenPersonalDocumentsRoutes = require('./citizen-personal-documents').default;
  const citizenNotificationsRoutes = require('./citizen-notifications').default;
  // DIA 3: REMOVED - citizen-transfer era específico para multi-tenant

  router.use('/auth/citizen', citizenAuthRoutes);
  router.use('/citizen/services', citizenServicesRoutes);
  router.use('/citizen/protocols', citizenProtocolsRoutes);
  router.use('/citizen/family', citizenFamilyRoutes);
  router.use('/citizen/documents', citizenDocumentsRoutes);
  router.use('/citizen/personal-documents', citizenPersonalDocumentsRoutes);
  router.use('/citizen/notifications', citizenNotificationsRoutes);
  // DIA 3: REMOVED - citizen-transfer route

  return router;
};

// ============================================================
// ROTAS ADMINISTRATIVAS (Fase 4)
// ============================================================
export const loadAdminRoutes = () => {
  const router = Router();

  const adminAuthRoutes = require('./admin-auth').default;
  const adminManagementRoutes = require('./admin-management').default;
  const adminChamadosRoutes = require('./admin-chamados').default;
  const departmentsTicketsRoutes = require('./departments-tickets').default;
  const adminReportsRoutes = require('./admin-reports').default;
  const adminGabineteRoutes = require('./admin-gabinete').default;
  const adminGabinetePainelRoutes = require('./admin-gabinete-painel').default;
  // REMOVED: customModulesRoutes - código morto de micro-sistemas abandonados
  // REMOVED: serviceTemplatesRoutes - código legado/abandonado (sem modelo no Prisma)
  // DIA 3: REMOVED - admin-transfer era específico para multi-tenant
  const citizensRoutes = require('./citizens').default;
  const adminCitizensRoutes = require('./admin-citizens').default;
  const adminCitizenDocumentsRoutes = require('./admin-citizen-documents').default;
  const citizenLinksValidationRoutes = require('./citizen-links-validation.routes').default;
  const citizenCategoriesRoutes = require('./citizen-categories.routes').default;

  router.use('/admin/auth', adminAuthRoutes);
  router.use('/admin/management', adminManagementRoutes);
  router.use('/admin/chamados', adminChamadosRoutes);
  router.use('/departments', departmentsTicketsRoutes);
  router.use('/admin/relatorios', adminReportsRoutes);
  router.use('/admin/gabinete', adminGabineteRoutes);
  router.use('/admin/gabinete/painel-prefeito', adminGabinetePainelRoutes);
  // REMOVED: admin/templates route - código legado/abandonado
  // REMOVED: custom-modules route - código morto
  // DIA 3: REMOVED - admin-transfer route
  router.use('/citizens', citizensRoutes);
  router.use('/admin/citizens', adminCitizensRoutes);
  router.use('/admin/citizen-documents', adminCitizenDocumentsRoutes);
  router.use('/admin/citizens', citizenLinksValidationRoutes);
  router.use('/admin/categories', citizenCategoriesRoutes);

  return router;
};

// ============================================================
// SECRETARIAS ESPECIALIZADAS (Fase 5)
// ============================================================
export const loadSecretariasRoutes = () => {
  const router = Router();

  // Secretarias
  const secretariasSaudeRoutes = require('./secretarias-saude').default;
  const saudeRoutes = require('./saude').default; // Rotas do App Sistema de Atendimento
  const saudeFarmaciaRoutes = require('./saude-farmacia.routes').default; // App Farmácia
  const saudeTFDRoutes = require('./saude-tfd.routes').default; // App TFD
  const saudeCadastrosRoutes = require('./saude-cadastros.routes').default; // Cadastros de Saúde
  const secretariasEducacaoRoutes = require('./secretarias-educacao').default;
  const secretariasAssistenciaSocialRoutes = require('./secretarias-assistencia-social').default;
  const secretariasCulturaRoutes = require('./secretarias-cultura').default;
  const secretariasEsportesRoutes = require('./secretarias-esportes').default;
  const secretariasHabitacaoRoutes = require('./secretarias-habitacao').default;
  const secretariasAgriculturaRoutes = require('./secretarias-agricultura').default;
  const secretariasAgricultureProdutoresRoutes = require('./secretarias-agricultura-produtores').default;
  const secretariasSegurancaPublicaRoutes = require('./secretarias-seguranca-publica').default;
  const secretariasMeioAmbienteRoutes = require('./secretarias-meio-ambiente').default;
  const secretariasObrasPublicasRoutes = require('./secretarias-obras-publicas').default;
  const secretariasPlanejamentoUrbanoRoutes = require('./secretarias-planejamento-urbano').default;
  const secretariasServicosPublicosRoutes = require('./secretarias-servicos-publicos').default;
  const secretariasTurismoRoutes = require('./secretarias-turismo').default;
  const adminSecretariasRoutes = require('./admin-secretarias').default;

  router.use('/secretarias/saude', secretariasSaudeRoutes);
  router.use('/saude', saudeRoutes); // App Sistema de Atendimento
  router.use('/saude/farmacia', saudeFarmaciaRoutes); // App Farmácia
  router.use('/saude/tfd', saudeTFDRoutes); // App TFD
  router.use('/apps/saude/cadastros', saudeCadastrosRoutes); // Cadastros de Saúde
  router.use('/admin/secretarias/educacao', secretariasEducacaoRoutes);
  router.use('/secretarias/assistencia-social', secretariasAssistenciaSocialRoutes);
  router.use('/secretarias/cultura', secretariasCulturaRoutes);
  router.use('/secretarias/esportes', secretariasEsportesRoutes);
  router.use('/secretarias/habitacao', secretariasHabitacaoRoutes);
  router.use('/admin/secretarias/agricultura', secretariasAgriculturaRoutes);
  router.use('/admin/secretarias/agricultura/produtores', secretariasAgricultureProdutoresRoutes);
  router.use('/secretarias/seguranca-publica', secretariasSegurancaPublicaRoutes);
  router.use('/admin/secretarias/meio-ambiente', secretariasMeioAmbienteRoutes);
  router.use('/admin/secretarias/obras-publicas', secretariasObrasPublicasRoutes);
  router.use('/admin/secretarias/planejamento-urbano', secretariasPlanejamentoUrbanoRoutes);
  router.use('/admin/secretarias/servicos-publicos', secretariasServicosPublicosRoutes);
  router.use('/admin/secretarias/turismo', secretariasTurismoRoutes);
  router.use('/secretarias', adminSecretariasRoutes);

  return router;
};

// ============================================================
// IMPLEMENTAÇÕES REAIS (Fase 7)
// ============================================================
export const loadImplementationRoutes = () => {
  const router = Router();

  const integrationsRoutes = require('./integrations').default;
  const adminEmailRoutes = require('./admin-email').default;
  const adminEmailServiceRoutes = require('./admin-email-service').default;
  const adminEmailAccountsRoutes = require('./admin-email-accounts').default;
  const municipalityConfigRoutes = require('./municipality-config').default;
  const facePlatformRoutes = require('./face-platform.routes').default;

  router.use('/integrations', integrationsRoutes);
  router.use('/admin/email', adminEmailRoutes); // Webmail (inbox, sent, drafts, trash)
  router.use('/admin/email-service', adminEmailServiceRoutes); // Service management
  router.use('/admin/email-accounts', adminEmailAccountsRoutes);
  router.use('/municipality', municipalityConfigRoutes);
  router.use('/admin/face-platform', facePlatformRoutes);
  router.use('/apps/seguranca-escolar', facePlatformRoutes);

  return router;
};

// ============================================================
// HELPER: Carregar todas as rotas
// ============================================================
export const loadAllRoutes = () => {
  return {
    public: loadPublicRoutes(),
    basic: loadBasicRoutes(),
    protocols: loadProtocolRoutes(),
    citizen: loadCitizenRoutes(),
    admin: loadAdminRoutes(),
    secretarias: loadSecretariasRoutes(),
    implementations: loadImplementationRoutes()
  };
};
