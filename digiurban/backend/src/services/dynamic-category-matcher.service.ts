// ============================================================================
// DYNAMIC CATEGORY MATCHER - Sistema 100% Dinâmico de Categorização
// ============================================================================

import { prisma } from '../lib/prisma';
import { notifyNewCategorySuggestion, notifyStatsUpdate } from '../routes/notifications.routes';

// ============================================================================
// INTERFACES
// ============================================================================

export interface MatchResult {
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  matchType: 'EXACT' | 'PATTERN' | 'SEMANTIC';
  confidence: number; // 0-100
  shouldAutoAssign: boolean;
  shouldSuggest: boolean;
  matchDetails: any;
}

export interface SemanticRules {
  departments?: string[];
  tags?: {
    required?: string[];
    optional?: string[];
    exclude?: string[];
  };
  serviceTypes?: string[];
  minScore?: number;
}

export interface ServiceAnalysis {
  serviceId: string;
  serviceName: string;
  moduleType: string | null;
  departmentId: string;
  matches: MatchResult[];
  autoAssigned: number;
  suggested: number;
  timestamp: Date;
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Analisa um serviço e encontra categorias compatíveis
 */
export async function analyzeServiceForCategories(serviceId: string): Promise<ServiceAnalysis> {
  console.log(`🔍 [DynamicMatcher] Analisando serviço ${serviceId}...`);

  // 1. Buscar informações do serviço
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    select: {
      id: true,
      name: true,
      description: true,
      moduleType: true,
      departmentId: true,
      serviceType: true,
      tags: {
        select: { tag: true }
      }
    }
  });

  if (!service) {
    throw new Error(`Serviço ${serviceId} não encontrado`);
  }

  // 2. Extrair tags do serviço
  const serviceTags = service.tags.map((t: { tag: string }) => t.tag);

  // 3. Buscar todas as categorias ativas
  const categories = await prisma.citizenCategory.findMany({
    where: {
      active: true,
      matchingEnabled: true
    }
  });

  console.log(`📊 [DynamicMatcher] Analisando contra ${categories.length} categoria(s)`);

  // 4. Calcular match para cada categoria
  const matches: MatchResult[] = [];

  for (const category of categories) {
    const matchResult = calculateMatchScore(service, serviceTags, category);

    if (matchResult) {
      matches.push(matchResult);
    }
  }

  // 5. Ordenar por confiança
  matches.sort((a, b) => b.confidence - a.confidence);

  console.log(`✅ [DynamicMatcher] Encontrados ${matches.length} match(es)`);

  return {
    serviceId: service.id,
    serviceName: service.name,
    moduleType: service.moduleType,
    departmentId: service.departmentId,
    matches,
    autoAssigned: matches.filter(m => m.shouldAutoAssign).length,
    suggested: matches.filter(m => m.shouldSuggest && !m.shouldAutoAssign).length,
    timestamp: new Date()
  };
}

/**
 * Calcula score de match entre serviço e categoria
 */
function calculateMatchScore(
  service: any,
  serviceTags: string[],
  category: any
): MatchResult | null {

  // ═══ NÍVEL 1: EXACT MATCH ═══
  if (service.moduleType && category.exactPatterns && category.exactPatterns.length > 0) {
    if (category.exactPatterns.includes(service.moduleType)) {
      console.log(`✅ [ExactMatch] ${category.code} ← ${service.moduleType}`);

      return {
        categoryId: category.id,
        categoryCode: category.code,
        categoryName: category.name,
        matchType: 'EXACT',
        confidence: 100,
        shouldAutoAssign: 100 >= category.autoAssignThreshold,
        shouldSuggest: 100 >= category.suggestThreshold,
        matchDetails: {
          exactMatch: service.moduleType,
          pattern: service.moduleType
        }
      };
    }
  }

  // ═══ NÍVEL 2: PATTERN MATCH (REGEX) ═══
  if (service.moduleType && category.regexPatterns) {
    const patterns = Array.isArray(category.regexPatterns)
      ? category.regexPatterns
      : [];

    for (const patternConfig of patterns) {
      try {
        const regex = new RegExp(patternConfig.pattern, 'i');

        if (regex.test(service.moduleType)) {
          const confidence = patternConfig.confidence || 80;

          console.log(`🎯 [PatternMatch] ${category.code} ← ${service.moduleType} (${confidence}%)`);

          return {
            categoryId: category.id,
            categoryCode: category.code,
            categoryName: category.name,
            matchType: 'PATTERN',
            confidence,
            shouldAutoAssign: confidence >= category.autoAssignThreshold,
            shouldSuggest: confidence >= category.suggestThreshold,
            matchDetails: {
              patternMatched: patternConfig.pattern,
              moduleType: service.moduleType,
              confidence
            }
          };
        }
      } catch (error) {
        console.error(`❌ Erro ao processar regex: ${patternConfig.pattern}`, error);
      }
    }
  }

  // ═══ NÍVEL 3: SEMANTIC MATCH ═══
  if (category.semanticRules) {
    const rules: SemanticRules = typeof category.semanticRules === 'object'
      ? category.semanticRules
      : {};

    const semanticResult = calculateSemanticScore(service, serviceTags, rules);

    if (semanticResult.score >= (rules.minScore || category.suggestThreshold)) {
      console.log(`🧠 [SemanticMatch] ${category.code} ← ${service.name} (${semanticResult.score}%)`);

      return {
        categoryId: category.id,
        categoryCode: category.code,
        categoryName: category.name,
        matchType: 'SEMANTIC',
        confidence: semanticResult.score,
        shouldAutoAssign: semanticResult.score >= category.autoAssignThreshold,
        shouldSuggest: semanticResult.score >= category.suggestThreshold,
        matchDetails: semanticResult.details
      };
    }
  }

  return null; // Sem match
}

/**
 * Calcula score semântico baseado em tags, departamento, etc
 */
function calculateSemanticScore(
  service: any,
  serviceTags: string[],
  rules: SemanticRules
): { score: number; details: any } {

  let score = 0;
  const details: any = {
    departmentMatch: false,
    requiredTagsMatched: [],
    optionalTagsMatched: [],
    excludeTagFound: false,
    serviceTypeMatch: false
  };

  // Nome e descrição em lowercase para busca
  const searchText = `${service.name} ${service.description || ''}`.toLowerCase();

  // 1. DEPARTAMENTO (30 pontos)
  if (rules.departments && rules.departments.length > 0) {
    if (rules.departments.includes(service.departmentId)) {
      score += 30;
      details.departmentMatch = true;
    }
  }

  // 2. TAGS OBRIGATÓRIAS (40 pontos)
  if (rules.tags?.required && rules.tags.required.length > 0) {
    const requiredMatches = rules.tags.required.filter(tag => {
      const tagLower = tag.toLowerCase();
      return serviceTags.includes(tag) ||
             serviceTags.some(t => t.toLowerCase() === tagLower) ||
             searchText.includes(tagLower);
    });

    details.requiredTagsMatched = requiredMatches;

    if (requiredMatches.length === rules.tags.required.length) {
      // Todas as tags obrigatórias encontradas
      score += 40;
    } else {
      // Parcialmente encontradas
      score += (requiredMatches.length / rules.tags.required.length) * 40;
    }
  }

  // 3. TAGS OPCIONAIS (20 pontos)
  if (rules.tags?.optional && rules.tags.optional.length > 0) {
    const optionalMatches = rules.tags.optional.filter(tag => {
      const tagLower = tag.toLowerCase();
      return serviceTags.includes(tag) ||
             serviceTags.some(t => t.toLowerCase() === tagLower) ||
             searchText.includes(tagLower);
    });

    details.optionalTagsMatched = optionalMatches;

    if (rules.tags.optional.length > 0) {
      score += (optionalMatches.length / rules.tags.optional.length) * 20;
    }
  }

  // 4. TAGS EXCLUÍDAS (anula o score)
  if (rules.tags?.exclude && rules.tags.exclude.length > 0) {
    const excludeFound = rules.tags.exclude.some(tag => {
      const tagLower = tag.toLowerCase();
      return serviceTags.includes(tag) ||
             serviceTags.some(t => t.toLowerCase() === tagLower) ||
             searchText.includes(tagLower);
    });

    if (excludeFound) {
      score = 0;
      details.excludeTagFound = true;
    }
  }

  // 5. TIPO DE SERVIÇO (10 pontos)
  if (rules.serviceTypes && rules.serviceTypes.length > 0) {
    if (rules.serviceTypes.includes(service.serviceType)) {
      score += 10;
      details.serviceTypeMatch = true;
    }
  }

  details.finalScore = Math.round(score);

  return {
    score: Math.round(score),
    details
  };
}

/**
 * Processa resultados de análise e cria sugestões/atribuições
 */
export async function processMatchResults(
  serviceId: string,
  matches: MatchResult[],
  processedBy?: string
) {
  console.log(`⚙️  [DynamicMatcher] Processando ${matches.length} match(es)...`);

  const results = {
    autoAssigned: 0,
    suggested: 0,
    skipped: 0,
    errors: 0
  };

  for (const match of matches) {
    try {
      // Verificar se já existe sugestão/atribuição
      const existing = await prisma.citizenCategoryMatchSuggestion.findUnique({
        where: {
          serviceId_categoryId: {
            serviceId,
            categoryId: match.categoryId
          }
        }
      });

      if (existing) {
        console.log(`ℹ️  Match já existe: ${match.categoryCode}`);
        results.skipped++;
        continue;
      }

      if (match.shouldAutoAssign) {
        // AUTO-ATRIBUIR (alta confiança)
        await autoAssignServiceToCategory(serviceId, match, processedBy);
        results.autoAssigned++;
      } else if (match.shouldSuggest) {
        // CRIAR SUGESTÃO (confiança média)
        await createMatchSuggestion(serviceId, match);
        results.suggested++;
      } else {
        results.skipped++;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar match ${match.categoryCode}:`, error);
      results.errors++;
    }
  }

  console.log(`✅ [DynamicMatcher] Processamento concluído:`, results);

  return results;
}

/**
 * Auto-atribui serviço a categoria (alta confiança)
 */
async function autoAssignServiceToCategory(
  serviceId: string,
  match: MatchResult,
  assignedBy?: string
) {
  console.log(`🤖 [AutoAssign] ${match.categoryCode} (${match.confidence}%)`);

  // 1. Criar atribuição serviço ← categoria
  await prisma.serviceCategoryAssignment.create({
    data: {
      serviceId,
      categoryId: match.categoryId,
      assignmentType: 'AUTO',
      confidence: match.confidence,
      assignedBy,
      metadata: {
        matchType: match.matchType,
        matchDetails: match.matchDetails,
        autoAssigned: true,
        assignedAt: new Date().toISOString()
      }
    }
  });

  // 2. Criar registro na tabela de sugestões como AUTO_ASSIGNED
  await prisma.citizenCategoryMatchSuggestion.create({
    data: {
      serviceId,
      categoryId: match.categoryId,
      matchType: match.matchType,
      confidence: match.confidence,
      matchDetails: match.matchDetails,
      status: 'AUTO_ASSIGNED',
      wasAutoAssigned: true
    }
  });

  console.log(`✅ Auto-atribuído: ${match.categoryCode}`);
}

/**
 * Cria sugestão para aprovação manual (confiança média)
 */
async function createMatchSuggestion(serviceId: string, match: MatchResult) {
  console.log(`💡 [Suggestion] ${match.categoryCode} (${match.confidence}%) - aguardando aprovação`);

  // Buscar informações do serviço para notificação
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    select: { name: true }
  });

  const suggestion = await prisma.citizenCategoryMatchSuggestion.create({
    data: {
      serviceId,
      categoryId: match.categoryId,
      matchType: match.matchType,
      confidence: match.confidence,
      matchDetails: match.matchDetails,
      status: 'PENDING',
      wasAutoAssigned: false
    }
  });

  // ✅ NOVO: Notificar clientes SSE sobre nova sugestão
  if (service) {
    notifyNewCategorySuggestion({
      serviceId,
      serviceName: service.name,
      categoryName: match.categoryName,
      confidence: match.confidence
    });
  }

  // Atualizar estatísticas
  await notifyStatsUpdate();

  return suggestion;
}

/**
 * Hook: Executado quando serviço é criado/atualizado
 */
export async function onServiceCreatedOrUpdated(serviceId: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔔 [DynamicMatcher] Novo serviço detectado: ${serviceId}`);
  console.log('='.repeat(80));

  try {
    // 1. Analisar serviço
    const analysis = await analyzeServiceForCategories(serviceId);

    // 2. Processar matches
    const results = await processMatchResults(serviceId, analysis.matches);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ [DynamicMatcher] Processamento concluído`);
    console.log(`   Auto-atribuídos: ${results.autoAssigned}`);
    console.log(`   Sugestões criadas: ${results.suggested}`);
    console.log(`   Pulados: ${results.skipped}`);
    console.log(`   Erros: ${results.errors}`);
    console.log('='.repeat(80) + '\n');

    return results;
  } catch (error) {
    console.error(`❌ [DynamicMatcher] Erro ao processar serviço:`, error);
    throw error;
  }
}

// ============================================================================
// EXPORTAÇÕES
// ============================================================================

export default {
  analyzeServiceForCategories,
  processMatchResults,
  onServiceCreatedOrUpdated,
  calculateMatchScore,
  calculateSemanticScore
};
