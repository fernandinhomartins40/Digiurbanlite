import { administrationServices } from '../prisma/seeds/services/administration.seed';
import { agricultureServices } from '../prisma/seeds/services/agriculture.seed';
import { civilDefenseServices } from '../prisma/seeds/services/civil-defense.seed';
import { cultureServices } from '../prisma/seeds/services/culture.seed';
import { economicDevelopmentServices } from '../prisma/seeds/services/economic-development.seed';
import { educationServices } from '../prisma/seeds/services/education.seed';
import { environmentServices } from '../prisma/seeds/services/environment.seed';
import { financeServices } from '../prisma/seeds/services/finance.seed';
import { healthServices } from '../prisma/seeds/services/health.seed';
import { housingServices } from '../prisma/seeds/services/housing.seed';
import { publicSafetyServices } from '../prisma/seeds/services/public-safety.seed';
import { publicServices } from '../prisma/seeds/services/public-services.seed';
import { publicWorksServices } from '../prisma/seeds/services/public-works.seed';
import { socialServices } from '../prisma/seeds/services/social.seed';
import { sportsServices } from '../prisma/seeds/services/sports.seed';
import { technologyInnovationServices } from '../prisma/seeds/services/technology-innovation.seed';
import { tourismServices } from '../prisma/seeds/services/tourism.seed';
import { transportTransitServices } from '../prisma/seeds/services/transport-transit.seed';
import { urbanMobilityServices } from '../prisma/seeds/services/urban-mobility.seed';
import { urbanPlanningServices } from '../prisma/seeds/services/urban-planning.seed';
import { womenPoliciesServices } from '../prisma/seeds/services/women-policies.seed';
import { buildSeedWorkflowStagesForService } from '../prisma/seeds/service-workflows.seed';

const allServices = [
  ...healthServices,
  ...educationServices,
  ...socialServices,
  ...agricultureServices,
  ...cultureServices,
  ...sportsServices,
  ...housingServices,
  ...environmentServices,
  ...publicWorksServices,
  ...urbanPlanningServices,
  ...publicSafetyServices,
  ...publicServices,
  ...tourismServices,
  ...financeServices,
  ...administrationServices,
  ...civilDefenseServices,
  ...womenPoliciesServices,
  ...technologyInnovationServices,
  ...transportTransitServices,
  ...economicDevelopmentServices,
  ...urbanMobilityServices
];

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function parseJsonObject(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof value === 'object' ? (value as Record<string, any>) : null;
}

function parseRequiredDocuments(service: any): string[] {
  const rawDocuments =
    typeof service?.requiredDocuments === 'string'
      ? parseJsonObject(service.requiredDocuments)
      : service?.requiredDocuments;

  const documentsArray = Array.isArray(rawDocuments)
    ? rawDocuments
    : Array.isArray(service?.requiredDocuments)
      ? service.requiredDocuments
      : [];

  return normalizeStringArray(
    documentsArray
      .map((document: unknown) => {
        if (typeof document === 'string') return document;
        if (document && typeof document === 'object') {
          const record = document as Record<string, any>;
          return typeof record.type === 'string'
            ? record.type
            : typeof record.name === 'string'
              ? record.name
              : null;
        }
        return null;
      })
      .filter((document: unknown): document is string => typeof document === 'string')
  );
}

function parseRequiredFields(service: any): string[] {
  const formSchema = parseJsonObject(service?.formSchema);
  const schemaRequired = Array.isArray(formSchema?.required)
    ? formSchema.required.filter((fieldId: unknown): fieldId is string => typeof fieldId === 'string')
    : [];

  const formFieldsConfig = Array.isArray(service?.formFieldsConfig) ? service.formFieldsConfig : [];
  const configRequired = formFieldsConfig
    .filter((field: unknown) => field && typeof field === 'object' && Boolean((field as Record<string, any>).required))
    .map((field: unknown) => {
      const record = field as Record<string, any>;
      const rawId = record.id ?? record.key ?? record.name;
      return typeof rawId === 'string' ? rawId : null;
    })
    .filter((fieldId: unknown): fieldId is string => typeof fieldId === 'string');

  return normalizeStringArray([...schemaRequired, ...configRequired]);
}

function isReceptionStage(stage: Record<string, any>): boolean {
  const stageType = typeof stage.stageType === 'string' ? stage.stageType.trim() : '';
  if (stageType === 'RECEPTION') return true;
  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  return stageName.includes('recep') || stageName.includes('receb');
}

function isConclusionStage(stage: Record<string, any>): boolean {
  const stageType = typeof stage.stageType === 'string' ? stage.stageType.trim() : '';
  if (stageType === 'CONCLUSION') return true;
  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  return stageName.includes('conclus') || stageName.includes('conclu');
}

function isDocumentGenerationStage(stage: Record<string, any>): boolean {
  const stageType = typeof stage.stageType === 'string' ? stage.stageType.trim() : '';
  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  const availableTabs = normalizeStringArray(stage.availableTabs ?? []);
  const primaryTab = typeof stage.primaryTab === 'string' ? stage.primaryTab : '';
  const hasGeneratedTab = primaryTab === 'documentos-gerados' || availableTabs.includes('documentos-gerados');
  const hasGenerationName = [
    'emiss',
    'emitir',
    'expedi',
    'impress',
    'disponibil',
    'gerar',
    'gerac',
    'assin',
    'publica',
    'homolog'
  ].some(keyword => stageName.includes(keyword));
  const hasAnalysisName = [
    'analis',
    'analise',
    'valid',
    'vistoria',
    'triagem',
    'parecer',
    'fiscal',
    'tecnic',
    'socioeconom'
  ].some(keyword => stageName.includes(keyword));
  const hasRequirements =
    normalizeStringArray(stage.requiredDocumentTypes ?? []).length > 0 ||
    normalizeStringArray(stage.requiredInputFieldIds ?? []).length > 0 ||
    normalizeStringArray(stage.requiredStageOutputs ?? []).length > 0 ||
    normalizeStringArray(stage.allowedActions ?? []).some(
      action => action === 'REJECT' || action === 'REQUEST_INFO' || action === 'CREATE_PENDING'
    );

  if (hasGeneratedTab) return true;
  if (hasRequirements || hasAnalysisName) return false;
  if (stageType === 'DOCUMENT_GENERATION') return true;
  return hasGenerationName;
}

function isActionableStage(stage: Record<string, any>): boolean {
  return !isReceptionStage(stage) && !isConclusionStage(stage) && !isDocumentGenerationStage(stage);
}

function looksLikeDocumentStage(stage: Record<string, any>): boolean {
  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  const availableTabs = normalizeStringArray(stage.availableTabs ?? []);
  const primaryTab = typeof stage.primaryTab === 'string' ? stage.primaryTab : '';
  return (
    normalizeStringArray(stage.requiredDocumentTypes ?? []).length > 0 ||
    stageName.includes('document') ||
    primaryTab === 'documentos' ||
    availableTabs.includes('documentos')
  );
}

function looksLikeDataStage(stage: Record<string, any>): boolean {
  const stageName = typeof stage.name === 'string' ? stage.name.toLowerCase() : '';
  const availableTabs = normalizeStringArray(stage.availableTabs ?? []);
  const primaryTab = typeof stage.primaryTab === 'string' ? stage.primaryTab : '';
  return (
    normalizeStringArray(stage.requiredInputFieldIds ?? []).length > 0 ||
    stageName.includes('dados') ||
    stageName.includes('valida') ||
    (stageName.includes('anal') && !stageName.includes('document')) ||
    primaryTab === 'dados' ||
    availableTabs.includes('dados')
  );
}

interface AuditIssue {
  moduleType: string;
  serviceName: string;
  issue: string;
  details: string;
}

async function main() {
  const issues: AuditIssue[] = [];
  let servicesWithRequiredDocs = 0;
  let servicesWithRequiredFields = 0;
  let servicesWithDocStage = 0;
  let servicesWithDataStage = 0;

  for (const service of allServices) {
    const requiredDocuments = parseRequiredDocuments(service);
    const requiredFields = parseRequiredFields(service);
    const workflow = buildSeedWorkflowStagesForService(service);
    const stages = (workflow.stages as Record<string, any>[]).filter(isActionableStage);
    const coveredDocuments = new Set(
      stages.flatMap((stage) => normalizeStringArray(stage.requiredDocumentTypes ?? []))
    );
    const coveredFields = new Set(
      stages.flatMap((stage) => normalizeStringArray(stage.requiredInputFieldIds ?? []))
    );
    const hasDocumentStage = stages.some(looksLikeDocumentStage);
    const hasDataStage = stages.some(looksLikeDataStage);

    if (requiredDocuments.length > 0) {
      servicesWithRequiredDocs += 1;
      if (hasDocumentStage) servicesWithDocStage += 1;
    }

    if (requiredFields.length > 0) {
      servicesWithRequiredFields += 1;
      if (hasDataStage) servicesWithDataStage += 1;
    }

    if (requiredDocuments.length > 0 && !hasDocumentStage) {
      issues.push({
        moduleType: service.moduleType || service.name,
        serviceName: service.name,
        issue: 'missing_document_stage',
        details: `Serviço exige ${requiredDocuments.length} documento(s), mas o workflow não possui etapa documental.`
      });
    }

    if (requiredFields.length > 0 && !hasDataStage) {
      issues.push({
        moduleType: service.moduleType || service.name,
        serviceName: service.name,
        issue: 'missing_data_stage',
        details: `Serviço exige ${requiredFields.length} campo(s) obrigatório(s), mas o workflow não possui etapa de validação de dados.`
      });
    }

    const uncoveredDocuments = requiredDocuments.filter((document) => !coveredDocuments.has(document));
    if (uncoveredDocuments.length > 0) {
      issues.push({
        moduleType: service.moduleType || service.name,
        serviceName: service.name,
        issue: 'uncovered_documents',
        details: `Documentos não cobertos por etapas acionáveis: ${uncoveredDocuments.join(', ')}`
      });
    }

    const uncoveredFields = requiredFields.filter((fieldId) => !coveredFields.has(fieldId));
    if (uncoveredFields.length > 0) {
      issues.push({
        moduleType: service.moduleType || service.name,
        serviceName: service.name,
        issue: 'uncovered_required_fields',
        details: `Campos obrigatórios não cobertos por etapas acionáveis: ${uncoveredFields.join(', ')}`
      });
    }
  }

  console.log(`Serviços auditados: ${allServices.length}`);
  console.log(`Serviços com documentos obrigatórios: ${servicesWithRequiredDocs}`);
  console.log(`Serviços com etapa documental: ${servicesWithDocStage}`);
  console.log(`Serviços com campos obrigatórios: ${servicesWithRequiredFields}`);
  console.log(`Serviços com etapa de dados: ${servicesWithDataStage}`);
  console.log(`Problemas encontrados: ${issues.length}`);

  if (issues.length > 0) {
    for (const issue of issues.slice(0, 200)) {
      console.error(`- [${issue.issue}] ${issue.moduleType} :: ${issue.details}`);
    }
    if (issues.length > 200) {
      console.error(`... e mais ${issues.length - 200} problema(s)`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Falha na auditoria de cobertura de fases dos workflows:', error);
  process.exitCode = 1;
});
