import OpenAI from 'openai';
import { OllamaService } from './OllamaService';

export interface Intent {
  name: string;
  confidence: number;
  entities?: Record<string, any>;
  suggestedCards?: Array<{
    title: string;
    description: string;
    actionLabel: string;
  }>;
}

export interface Context {
  lastIntent?: string;
  lastMessage?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  messages?: Array<{ sender: string; content: string }>;
}

/**
 * Serviço de reconhecimento de intenções usando Ollama/Phi-4, OpenAI GPT-4 e Keywords
 */
export class IntentRecognitionService {
  private openai: OpenAI | null = null;
  private ollamaService: OllamaService;
  private useOllama: boolean;
  private intents: Map<string, string[]>;

  constructor() {
    // Inicializar Ollama
    this.ollamaService = new OllamaService();
    this.useOllama = process.env.USE_OLLAMA !== 'false'; // Ativado por padrão

    // Inicializar OpenAI se a API key estiver disponível
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn('⚠️  OPENAI_API_KEY não configurada. Usando Ollama/Phi-4 ou reconhecimento baseado em keywords.');
    }

    // Mapa de intents e keywords associadas
    this.intents = new Map([
      ['AGENDAR_CONSULTA', [
        'agendar', 'marcar', 'consulta', 'médico', 'médica', 'exame',
        'agendamento', 'horário', 'hora', 'atendimento', 'clínica'
      ]],
      ['VER_PROTOCOLOS', [
        'protocolo', 'protocolos', 'solicitação', 'solicitações',
        'pedido', 'pedidos', 'meus protocolos', 'minhas solicitações'
      ]],
      ['ENVIAR_DOCUMENTO', [
        'enviar', 'documento', 'arquivo', 'anexar', 'upload',
        'comprovante', 'certidão', 'documento', 'documentos'
      ]],
      ['SOLICITAR_SERVICO', [
        'solicitar', 'pedir', 'quero', 'preciso', 'serviço',
        'como faço', 'como solicitar'
      ]],
      ['STATUS_PROTOCOLO', [
        'status', 'situação', 'andamento', 'acompanhar',
        'onde está', 'protocolo', 'número'
      ]],
      ['EDITAR_PERFIL', [
        'editar', 'alterar', 'mudar', 'atualizar', 'perfil',
        'dados', 'informações', 'cadastro', 'telefone', 'email', 'e-mail'
      ]],
      ['CHAT_HUMANO', [
        'atendente', 'pessoa', 'humano', 'falar com', 'conversar',
        'preciso de ajuda', 'suporte', 'atendimento'
      ]],
      ['PESQUISAR_SERVICO', [
        'buscar', 'procurar', 'encontrar', 'pesquisar', 'qual',
        'quais serviços', 'tem serviço', 'existe'
      ]],
      ['VER_DOCUMENTOS', [
        'documentos', 'meus documentos', 'ver documentos',
        'listar documentos', 'documentos cadastrados'
      ]],
      ['CANCELAR_PROTOCOLO', [
        'cancelar', 'desistir', 'anular', 'remover protocolo'
      ]],
      ['SAUDACAO', [
        'oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite',
        'hey', 'ei', 'hello', 'opa'
      ]],
      ['AJUDA', [
        'ajuda', 'help', 'socorro', 'não sei', 'como funciona',
        'o que pode', 'comandos', 'menu'
      ]],
      ['DESPEDIDA', [
        'tchau', 'até logo', 'até mais', 'bye', 'adeus',
        'valeu', 'obrigado', 'obrigada'
      ]]
    ]);
  }

  /**
   * Reconhece a intenção da mensagem do usuário
   * VERSÃO 100% IA - SEM FALLBACKS
   */
  async recognizeIntent(message: string, context?: Context, servicesMetadata?: any[]): Promise<Intent> {
    // Validação: IA deve estar habilitada
    if (!this.useOllama) {
      console.error('❌ IA desabilitada. Configure USE_OLLAMA=true');
      return {
        name: 'AI_UNAVAILABLE',
        confidence: 0,
        entities: { error: 'IA desabilitada. Configure USE_OLLAMA=true' }
      };
    }

    try {
      const services = servicesMetadata || [];
      const ollamaResult = await this.ollamaService.recognizeIntent(
        message,
        context || {},
        services
      );

      // NOVO: Aceitar confiança >= 0.4 (IA é mais confiável que keywords)
      if (ollamaResult.confidence >= 0.4) {
        console.log(`✅ Ollama: ${ollamaResult.intent} (confiança: ${ollamaResult.confidence.toFixed(2)})`);
        return {
          name: ollamaResult.intent,
          confidence: ollamaResult.confidence,
          entities: ollamaResult.parameters,
          suggestedCards: ollamaResult.suggestedCards,
        };
      }

      // Se confiança muito baixa, pedir clarificação
      console.log(`⚠️ Baixa confiança (${ollamaResult.confidence.toFixed(2)}), pedindo clarificação`);
      return {
        name: 'CLARIFICATION_NEEDED',
        confidence: ollamaResult.confidence,
        entities: {
          originalIntent: ollamaResult.intent,
          originalParameters: ollamaResult.parameters
        },
        suggestedCards: ollamaResult.suggestedCards || []
      };

    } catch (error: any) {
      console.error('❌ Ollama indisponível:', error.message);

      // SEM FALLBACK - Transferir para humano
      return {
        name: 'AI_UNAVAILABLE',
        confidence: 0,
        entities: { error: error.message }
      };
    }
  }

  /**
   * Reconhecimento de intent usando OpenAI GPT-4
   */
  private async recognizeWithOpenAI(message: string, context?: Context): Promise<Intent> {
    try {
      const systemPrompt = `Você é um assistente de classificação de intenções para um sistema de atendimento municipal brasileiro.

Analise a mensagem do usuário e identifique a intenção principal entre as seguintes opções:

- AGENDAR_CONSULTA: usuário quer agendar consulta médica, exame ou atendimento de saúde
- VER_PROTOCOLOS: usuário quer ver suas solicitações/protocolos
- ENVIAR_DOCUMENTO: usuário quer enviar ou anexar um documento
- SOLICITAR_SERVICO: usuário quer solicitar um serviço municipal
- STATUS_PROTOCOLO: usuário quer saber o status/andamento de um protocolo específico
- EDITAR_PERFIL: usuário quer alterar dados cadastrais (nome, telefone, email, etc)
- CHAT_HUMANO: usuário quer falar com um atendente humano
- PESQUISAR_SERVICO: usuário está procurando/buscando informações sobre serviços
- VER_DOCUMENTOS: usuário quer ver seus documentos cadastrados
- CANCELAR_PROTOCOLO: usuário quer cancelar um protocolo
- SAUDACAO: usuário está cumprimentando (oi, olá, bom dia, etc)
- AJUDA: usuário precisa de ajuda ou quer saber o que o bot pode fazer
- DESPEDIDA: usuário está se despedindo (tchau, até logo, obrigado, etc)

Retorne APENAS um objeto JSON com:
{
  "intent": "NOME_DA_INTENT",
  "confidence": 0.95,
  "entities": {
    "protocolNumber": "número do protocolo se mencionado",
    "serviceName": "nome do serviço se mencionado",
    "searchTerm": "termo de busca se aplicável"
  }
}

Se não tiver certeza, use confidence menor que 0.7 e retorne a intent mais provável.`;

      const userMessage = context?.lastIntent
        ? `Contexto da conversa anterior: ${context.lastIntent}\n\nNova mensagem: ${message}`
        : message;

      const completion = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        max_tokens: 200,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        const parsed = JSON.parse(response);
        return {
          name: parsed.intent || 'UNKNOWN',
          confidence: parsed.confidence || 0.5,
          entities: parsed.entities || {}
        };
      }

      return { name: 'UNKNOWN', confidence: 0.0 };
    } catch (error) {
      console.error('Erro ao reconhecer intent com OpenAI:', error);
      // Fallback para keyword matching
      return this.recognizeWithKeywords(message);
    }
  }

  /**
   * Reconhecimento de intent usando keywords (fallback)
   */
  private recognizeWithKeywords(message: string): Intent {
    const normalizedMessage = message.toLowerCase().trim();

    // Extrair possíveis números de protocolo
    const protocolMatch = normalizedMessage.match(/protocolo\s*#?\s*(\d{4}-?\d+|\d+)/i);
    const protocolNumber = protocolMatch ? protocolMatch[1] : undefined;

    // Contar matches para cada intent
    const scores = new Map<string, number>();

    for (const [intentName, keywords] of this.intents.entries()) {
      let score = 0;
      for (const keyword of keywords) {
        if (normalizedMessage.includes(keyword.toLowerCase())) {
          // Peso maior se a palavra for exata
          const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
          score += regex.test(normalizedMessage) ? 2 : 1;
        }
      }
      if (score > 0) {
        scores.set(intentName, score);
      }
    }

    // Encontrar intent com maior score
    if (scores.size > 0) {
      const sortedScores = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1]);

      const [topIntent, topScore] = sortedScores[0];

      // Calcular confiança baseada no score
      const maxPossibleScore = 20; // Assumindo até 10 keywords matched com peso 2
      const confidence = Math.min(topScore / maxPossibleScore, 1.0);

      const entities: Record<string, any> = {};

      // Adicionar número do protocolo se encontrado
      if (protocolNumber) {
        entities.protocolNumber = protocolNumber;
      }

      // Extrair nome de serviço para SOLICITAR_SERVICO
      if (topIntent === 'SOLICITAR_SERVICO' || topIntent === 'PESQUISAR_SERVICO') {
        // Remover keywords comuns para extrair o que sobra como termo de busca
        let searchTerm = normalizedMessage;
        ['solicitar', 'pedir', 'quero', 'preciso', 'buscar', 'procurar'].forEach(word => {
          searchTerm = searchTerm.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
        });
        searchTerm = searchTerm.trim();
        if (searchTerm.length > 3) {
          entities.searchTerm = searchTerm;
          entities.serviceName = searchTerm;
        }
      }

      return {
        name: topIntent,
        confidence,
        entities
      };
    }

    // Se não encontrou nenhum match, retornar UNKNOWN
    return {
      name: 'UNKNOWN',
      confidence: 0.0
    };
  }

  /**
   * Adiciona uma nova intent ao sistema
   */
  addIntent(intentName: string, keywords: string[]): void {
    this.intents.set(intentName, keywords);
  }

  /**
   * Lista todas as intents disponíveis
   */
  getAvailableIntents(): string[] {
    return Array.from(this.intents.keys());
  }

  /**
   * Obter keywords de uma intent específica
   */
  getIntentKeywords(intentName: string): string[] {
    return this.intents.get(intentName) || [];
  }
}
