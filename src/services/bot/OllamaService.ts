import axios from 'axios';

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

export class OllamaService {
  private baseUrl: string;
  private model: string;
  private timeout: number;

  constructor(
    baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model = process.env.OLLAMA_MODEL || 'phi4',
    timeout = parseInt(process.env.OLLAMA_TIMEOUT || '5000')
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.timeout = timeout;
  }

  /**
   * Reconhece intenção usando Phi-4 fine-tuned
   */
  async recognizeIntent(
    message: string,
    context: any,
    servicesMetadata: any[]
  ): Promise<OllamaResponse> {
    const prompt = this.buildPrompt(message, context, servicesMetadata);

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3, // Baixa temperatura = mais determinístico
            top_p: 0.9,
            num_predict: 200,
          },
        },
        { timeout: this.timeout }
      );

      return this.parseOllamaResponse(response.data.response);
    } catch (error: any) {
      console.error('Ollama error:', error.message);
      throw new Error('OLLAMA_UNAVAILABLE');
    }
  }

  /**
   * Constrói prompt otimizado para Phi-4
   */
  private buildPrompt(
    message: string,
    context: any,
    servicesMetadata: any[]
  ): string {
    const servicesContext = servicesMetadata
      .slice(0, 10) // Top 10 serviços mais relevantes
      .map(
        (s, i) =>
          `${i + 1}. ${s.name} (${s.category}) - ${s.description.substring(0, 80)}...`
      )
      .join('\n');

    const conversationContext = context.messages
      ?.slice(-3)
      .map((m: any) => `${m.sender}: ${m.content}`)
      .join('\n') || 'Início da conversa';

    return `Você é o DigiBot, assistente virtual da prefeitura municipal. Analise a mensagem do cidadão e identifique a intenção.

SERVIÇOS DISPONÍVEIS:
${servicesContext}

INTENÇÕES POSSÍVEIS:
- AGENDAR_CONSULTA: Agendar consulta médica
- SOLICITAR_SERVICO: Solicitar serviço municipal (IPTU, alvará, etc)
- CONSULTAR_PROTOCOLO: Consultar andamento de protocolo
- ENVIAR_DOCUMENTO: Enviar documentação
- INFORMACAO_SERVICO: Obter informações sobre serviços
- RECLAMACAO: Registrar reclamação/denúncia
- ELOGIO: Elogiar atendimento
- SAUDACAO: Cumprimentar
- DESPEDIDA: Finalizar conversa
- AJUDA: Pedir ajuda
- OUTROS: Não se encaixa nas anteriores

CONTEXTO DA CONVERSA:
${conversationContext}

MENSAGEM DO CIDADÃO:
"${message}"

RESPONDA EM JSON VÁLIDO:
{
  "intent": "NOME_DA_INTENCAO",
  "confidence": 0.85,
  "parameters": {
    "serviceId": "opcional-id-servico",
    "protocolNumber": "opcional-numero"
  },
  "suggestedCards": [
    {
      "title": "Título do Card",
      "description": "Descrição breve",
      "actionLabel": "Botão de Ação"
    }
  ]
}`;
  }

  /**
   * Parseia resposta do Ollama e valida
   */
  private parseOllamaResponse(rawResponse: string): OllamaResponse {
    try {
      // Extrai JSON da resposta (Phi-4 pode retornar texto + JSON)
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validação e normalização
      return {
        intent: parsed.intent || 'OUTROS',
        confidence: Math.min(Math.max(parsed.confidence || 0, 0), 1),
        parameters: parsed.parameters || {},
        suggestedCards: parsed.suggestedCards || [],
      };
    } catch (error) {
      console.error('Parse error:', error);
      // Fallback para análise básica
      return {
        intent: 'OUTROS',
        confidence: 0.3,
        parameters: {},
      };
    }
  }

  /**
   * Fine-tuning: Cria dataset de treinamento
   */
  async generateTrainingDataset(services: any[]): Promise<string> {
    const examples: string[] = [];

    for (const service of services) {
      // Exemplo positivo - solicitação direta
      examples.push(`Mensagem: "Preciso de ${service.name.toLowerCase()}"
Resposta: {"intent":"SOLICITAR_SERVICO","confidence":0.9,"parameters":{"serviceId":"${service.id}"},"suggestedCards":[{"title":"${service.name}","description":"${service.description.substring(0, 60)}...","actionLabel":"Solicitar Agora"}]}`);

      // Exemplo de informação
      examples.push(`Mensagem: "Como faço para ${service.name.toLowerCase()}?"
Resposta: {"intent":"INFORMACAO_SERVICO","confidence":0.85,"parameters":{"serviceId":"${service.id}"},"suggestedCards":[{"title":"Informações - ${service.name}","description":"Documentos necessários e prazos","actionLabel":"Ver Detalhes"}]}`);

      // Exemplo de dúvida sobre documentos
      if (service.requiredDocuments && service.requiredDocuments.length > 0) {
        examples.push(`Mensagem: "Quais documentos preciso para ${service.name.toLowerCase()}?"
Resposta: {"intent":"INFORMACAO_SERVICO","confidence":0.88,"parameters":{"serviceId":"${service.id}"},"suggestedCards":[{"title":"Documentos - ${service.name}","description":"${service.requiredDocuments.join(', ')}","actionLabel":"Iniciar Solicitação"}]}`);
      }
    }

    // Adiciona exemplos de outras intenções
    examples.push(`Mensagem: "Quero consultar meu protocolo 2025001234"
Resposta: {"intent":"CONSULTAR_PROTOCOLO","confidence":0.95,"parameters":{"protocolNumber":"2025001234"},"suggestedCards":[{"title":"Protocolo #2025001234","description":"Consultar status do seu protocolo","actionLabel":"Ver Andamento"}]}`);

    examples.push(`Mensagem: "Olá, bom dia"
Resposta: {"intent":"SAUDACAO","confidence":0.98,"parameters":{},"suggestedCards":[{"title":"Como posso ajudar?","description":"Estou aqui para auxiliar com serviços municipais","actionLabel":"Ver Serviços"}]}`);

    examples.push(`Mensagem: "Obrigado, até logo"
Resposta: {"intent":"DESPEDIDA","confidence":0.97,"parameters":{},"suggestedCards":[]}`);

    examples.push(`Mensagem: "Preciso fazer uma reclamação sobre buraco na rua"
Resposta: {"intent":"RECLAMACAO","confidence":0.92,"parameters":{},"suggestedCards":[{"title":"Registrar Reclamação","description":"Envie sua reclamação sobre infraestrutura","actionLabel":"Registrar Agora"}]}`);

    return examples.join('\n---\n');
  }

  /**
   * Verifica se Ollama está disponível
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
   * Lista modelos disponíveis
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
