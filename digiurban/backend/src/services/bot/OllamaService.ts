import axios from 'axios';
import { SemanticSearchService } from './SemanticSearchService';

export interface OllamaResponse {
  intent: string;
  confidence: number;
  parameters: Record<string, any>;
  suggestedCards?: Array<{
    title: string;
    description: string;
    actionLabel: string;
  }>;
}

/**
 * OllamaService - Serviço de IA com arquitetura RAG em 2 estágios
 *
 * ESTÁGIO 1: Intent Classification (prompt mínimo, sem contexto)
 * ESTÁGIO 2: RAG - Retrieval Augmented Generation (busca semântica + contexto relevante)
 *
 * Referências:
 * - https://arxiv.org/html/2506.00210 (REIC: RAG-Enhanced Intent Classification)
 * - https://www.pinecone.io/learn/retrieval-augmented-generation/
 * - https://ragflow.io/blog/rag-review-2025-from-rag-to-context
 */
export class OllamaService {
  private baseUrl: string;
  private model: string;
  private timeout: number;
  private semanticSearch: SemanticSearchService;

  constructor(
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model = process.env.OLLAMA_MODEL || 'digibot-qwen2.5',
    timeout = parseInt(process.env.OLLAMA_TIMEOUT || '30000') // 30s para Stage 1
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.timeout = timeout;
    this.semanticSearch = SemanticSearchService.getInstance();
  }

  /**
   * ESTÁGIO 1 + 2: Intent Classification + RAG
   */
  async recognizeIntent(
    message: string,
    context: any,
    _servicesMetadata?: any[] // Não usado (RAG busca dinamicamente)
  ): Promise<OllamaResponse> {
    try {
      // ===================================================================
      // ESTÁGIO 1: Intent Classification LEVE (sem contexto de serviços)
      // ===================================================================
      const stage1Result = await this.stage1_IntentClassification(message, context);

      // Se é saudação, despedida, ajuda → Não precisa de RAG
      const simpleIntents = ['SAUDACAO', 'DESPEDIDA', 'AJUDA', 'CHAT_HUMANO', 'VER_PROTOCOLOS'];
      if (simpleIntents.includes(stage1Result.intent)) {
        console.log(`✅ Stage 1 only: ${stage1Result.intent} (${stage1Result.confidence})`);
        return stage1Result;
      }

      // ===================================================================
      // ESTÁGIO 2: RAG - Retrieval Augmented Generation
      // ===================================================================
      // Se precisa de contexto de serviços → Busca semântica + regeneração
      const needsServiceContext = [
        'SOLICITAR_SERVICO',
        'INFORMACAO_SERVICO',
        'PESQUISAR_SERVICO',
        'AGENDAR_CONSULTA'
      ];

      if (needsServiceContext.includes(stage1Result.intent)) {
        console.log(`🔍 Stage 2: RAG for ${stage1Result.intent}`);
        return await this.stage2_RAG(message, context, stage1Result);
      }

      // Outros casos: retorna Stage 1
      console.log(`✅ Stage 1 result: ${stage1Result.intent}`);
      return stage1Result;

    } catch (error: any) {
      console.error('Ollama error:', error.message);
      throw new Error('OLLAMA_UNAVAILABLE');
    }
  }

  /**
   * ESTÁGIO 1: Classificação de Intent RÁPIDA (prompt mínimo)
   */
  private async stage1_IntentClassification(
    message: string,
    context: any
  ): Promise<OllamaResponse> {
    const prompt = this.buildStage1Prompt(message, context);

    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.2, // Muito determinístico para classificação
          top_p: 0.8,
          num_predict: 100, // Resposta curta
        },
      },
      { timeout: this.timeout }
    );

    return this.parseOllamaResponse(response.data.response);
  }

  /**
   * ESTÁGIO 2: RAG - Busca semântica + Geração contextual
   */
  private async stage2_RAG(
    message: string,
    context: any,
    stage1Result: OllamaResponse
  ): Promise<OllamaResponse> {
    // 1. Busca semântica: TOP 3 serviços mais relevantes
    const relevantServices = await this.semanticSearch.searchRelevantServices(message, 3);

    if (relevantServices.length === 0) {
      console.log('⚠️ RAG: Nenhum serviço relevante encontrado');
      return stage1Result; // Retorna Stage 1
    }

    // 2. Buscar detalhes completos dos serviços encontrados
    const { prisma } = await import('../../lib/prisma');
    const servicesWithDetails = await prisma.serviceSimplified.findMany({
      where: {
        id: { in: relevantServices.map(s => s.id) }
      },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        formSchema: true,
        formFieldsConfig: true,
        requiredDocuments: true
      }
    });

    // 3. Prompt com contexto MÍNIMO mas RELEVANTE
    const prompt = this.buildStage2RAGPrompt(message, context, servicesWithDetails, stage1Result);

    // 4. Regenerar com contexto
    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          num_predict: 200,
        },
      },
      { timeout: this.timeout + 10000 } // Timeout maior para RAG
    );

    const result = this.parseOllamaResponse(response.data.response);
    console.log(`✅ RAG result: ${result.intent} com ${servicesWithDetails.length} serviços`);
    return result;
  }

  /**
   * STAGE 1 PROMPT: Minimalista, apenas classificação
   */
  private buildStage1Prompt(message: string, context: any): string {
    const conversationContext = context.messages
      ?.slice(-3)
      .map((m: any) => `${m.sender}: ${m.content}`)
      .join('\n') || 'Início da conversa';

    return `Você é DigiBot da prefeitura. Classifique a INTENÇÃO:

INTENÇÕES:
- AGENDAR_CONSULTA: consulta médica/exame
- SOLICITAR_SERVICO: serviço municipal (IPTU, alvará, licença)
- CONSULTAR_PROTOCOLO: consultar protocolo
- VER_PROTOCOLOS: ver meus protocolos
- ENVIAR_DOCUMENTO: enviar documento
- INFORMACAO_SERVICO: informações sobre serviço
- PESQUISAR_SERVICO: buscar serviços
- RECLAMACAO: reclamação/denúncia
- ELOGIO: elogio
- SAUDACAO: olá, oi, bom dia
- DESPEDIDA: tchau, obrigado
- AJUDA: ajuda, menu
- CHAT_HUMANO: falar com humano
- OUTROS: não se encaixa

CONTEXTO (últimas 3 msgs):
${conversationContext}

MENSAGEM: "${message}"

RESPONDA JSON (sem texto):
{
  "intent": "NOME_INTENCAO",
  "confidence": 0.85,
  "parameters": {}
}`;
  }

  /**
   * STAGE 2 RAG PROMPT: Com serviços relevantes recuperados
   */
  private buildStage2RAGPrompt(
    message: string,
    context: any,
    relevantServices: any[],
    stage1Result: OllamaResponse
  ): string {
    // Serviços ULTRA-COMPACTOS
    const servicesContext = relevantServices
      .slice(0, 3)
      .map((s, i) => {
        const fields = s.formSchema?.fields || s.formFieldsConfig || [];
        const fieldsList = Array.isArray(fields)
          ? fields.filter((f: any) => f.enabled !== false).slice(0, 5).map((f: any) => f.label || f.id).join(', ')
          : '';

        return `${i + 1}. ${s.name}
   ID: ${s.id}
   Categoria: ${s.category || 'Geral'}
   Descrição: ${s.description?.substring(0, 80) || ''}
   Campos: ${fieldsList || 'Ver detalhes'}`;
      })
      .join('\n\n');

    const conversationContext = context.messages
      ?.slice(-3)
      .map((m: any) => `${m.sender}: ${m.content}`)
      .join('\n') || 'Início';

    return `DigiBot - Prefeitura

SERVIÇOS RELEVANTES (busca semântica):
${servicesContext}

INTENT DETECTADA: ${stage1Result.intent}
CONTEXTO: ${conversationContext}
MENSAGEM: "${message}"

INSTRUÇÕES:
1. Identifique qual serviço (se mencionado) e retorne o ID
2. Confidence >= 0.6 se certeza, >= 0.4 provável, < 0.4 incerto
3. Gere 1-2 cards ÚTEIS

JSON:
{
  "intent": "${stage1Result.intent}",
  "confidence": 0.85,
  "parameters": {
    "serviceId": "id-se-identificado",
    "serviceName": "nome"
  },
  "suggestedCards": [
    {
      "title": "Título",
      "description": "Descrição",
      "actionLabel": "Ação"
    }
  ]
}`;
  }

  /**
   * Parseia resposta do Ollama
   */
  private parseOllamaResponse(rawResponse: string): OllamaResponse {
    try {
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        intent: parsed.intent || 'OUTROS',
        confidence: Math.min(Math.max(parsed.confidence || 0, 0), 1),
        parameters: parsed.parameters || {},
        suggestedCards: parsed.suggestedCards || [],
      };
    } catch (error) {
      console.error('Parse error:', error);
      return {
        intent: 'OUTROS',
        confidence: 0.3,
        parameters: {},
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 2000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Lista modelos
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }
}
