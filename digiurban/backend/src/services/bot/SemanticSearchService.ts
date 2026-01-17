/**
 * SemanticSearchService - Busca semântica de serviços usando embeddings
 *
 * Implementa RAG (Retrieval-Augmented Generation) para:
 * 1. Gerar embeddings de texto (TF-IDF simplificado)
 * 2. Buscar serviços por similaridade semântica
 * 3. Retornar apenas os mais relevantes para o contexto
 *
 * Referências:
 * - https://www.pinecone.io/learn/retrieval-augmented-generation/
 * - https://arxiv.org/html/2506.00210 (REIC: RAG-Enhanced Intent Classification)
 */

import { prisma } from '../../lib/prisma';

interface ServiceEmbedding {
  id: string;
  name: string;
  description: string;
  category: string;
  keywords: string[];
  vector: number[]; // Simplified embedding
}

export class SemanticSearchService {
  private static instance: SemanticSearchService;
  private servicesCache: ServiceEmbedding[] = [];
  private lastCacheUpdate: Date | null = null;
  private readonly CACHE_TTL_MS = 3600000; // 1 hora

  private constructor() {}

  public static getInstance(): SemanticSearchService {
    if (!SemanticSearchService.instance) {
      SemanticSearchService.instance = new SemanticSearchService();
    }
    return SemanticSearchService.instance;
  }

  /**
   * Busca semântica: Retorna TOP N serviços mais relevantes
   */
  public async searchRelevantServices(
    query: string,
    topN: number = 3
  ): Promise<any[]> {
    await this.ensureCacheUpdated();

    // 1. Gerar embedding da query
    const queryVector = this.generateEmbedding(query);

    // 2. Calcular similaridade com cada serviço
    const similarities = this.servicesCache.map(service => ({
      service,
      score: this.cosineSimilarity(queryVector, service.vector)
    }));

    // 3. Ordenar por score e retornar TOP N
    const topServices = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(item => ({
        id: item.service.id,
        name: item.service.name,
        description: item.service.description,
        category: item.service.category,
        relevanceScore: item.score
      }));

    console.log(`🔍 Semantic Search: "${query}" → Top ${topN} serviços (scores: ${topServices.map(s => s.relevanceScore.toFixed(2)).join(', ')})`);

    return topServices;
  }

  /**
   * Atualiza cache de embeddings dos serviços
   */
  private async ensureCacheUpdated(): Promise<void> {
    const now = new Date();

    // Verificar se precisa atualizar cache
    if (
      this.lastCacheUpdate &&
      now.getTime() - this.lastCacheUpdate.getTime() < this.CACHE_TTL_MS &&
      this.servicesCache.length > 0
    ) {
      return; // Cache ainda válido
    }

    console.log('📊 Atualizando cache de embeddings de serviços...');

    // Buscar todos os serviços ativos
    const services = await prisma.serviceSimplified.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        category: true
      }
    });

    // Gerar embeddings para cada serviço
    this.servicesCache = services.map(service => {
      const text = this.buildServiceText(service);
      return {
        id: service.id,
        name: service.name,
        description: service.description || '',
        category: service.category || 'Geral',
        keywords: this.extractKeywords(text),
        vector: this.generateEmbedding(text)
      };
    });

    this.lastCacheUpdate = now;
    console.log(`✅ Cache atualizado: ${this.servicesCache.length} serviços indexados`);
  }

  /**
   * Gera texto combinado do serviço para embedding
   */
  private buildServiceText(service: any): string {
    return [
      service.name,
      service.description || '',
      service.category || ''
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  /**
   * Extrai keywords importantes do texto
   */
  private extractKeywords(text: string): string[] {
    // Remove stopwords comuns em PT-BR
    const stopwords = new Set([
      'o', 'a', 'de', 'para', 'com', 'em', 'um', 'uma', 'os', 'as',
      'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'por', 'ao',
      'e', 'ou', 'mas', 'se', 'que', 'este', 'esse', 'aquele'
    ]);

    return text
      .toLowerCase()
      .replace(/[^\wáàâãéèêíïóôõöúçñ\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopwords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  /**
   * Gera embedding simplificado usando TF-IDF
   * (Em produção, usar modelo de embeddings real como sentence-transformers)
   */
  private generateEmbedding(text: string): number[] {
    const keywords = this.extractKeywords(text);
    const vector = new Array(50).fill(0); // Vetor de dimensão 50

    // TF-IDF simplificado: Distribuir keywords no vetor
    keywords.forEach((keyword, index) => {
      const hash = this.simpleHash(keyword);
      const position = hash % vector.length;
      vector[position] += 1 / (index + 1); // Peso decrescente
    });

    // Normalizar vetor (L2 norm)
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  /**
   * Calcula similaridade de cosseno entre dois vetores
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    return Math.max(0, Math.min(1, dotProduct)); // Clamp entre 0 e 1
  }

  /**
   * Hash simples para distribuir keywords
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Força atualização do cache (útil para testes)
   */
  public async refreshCache(): Promise<void> {
    this.lastCacheUpdate = null;
    await this.ensureCacheUpdated();
  }
}

export default SemanticSearchService;
