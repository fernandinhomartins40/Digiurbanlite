import { SentimentAnalysis } from './types';

/**
 * SentimentAnalysisService - Análise de sentimento e detecção de frustração
 *
 * Analisa mensagens do usuário para detectar:
 * - Frustração
 * - Raiva
 * - Confusão
 * - Satisfação
 *
 * E decide se deve transferir para atendente humano
 */
export class SentimentAnalysisService {
  private static instance: SentimentAnalysisService;

  // Keywords para detecção de sentimento
  private negativeKeywords = [
    'péssimo',
    'horrível',
    'terrível',
    'ruim',
    'não funciona',
    'não serve',
    'demora',
    'demorado',
    'lento',
    'impossível',
    'complicado',
    'difícil',
    'confuso',
    'raiva',
    'irritado',
    'chato',
    'cansado',
    'desistir',
    'nunca funciona',
    'sempre assim',
    'nunca resolvem',
    'incompetente',
    'inútil',
  ];

  private veryNegativeKeywords = [
    'ódio',
    'nojento',
    'lixo',
    'merda',
    'porcaria',
    'absurdo',
    'vergonha',
    'ridículo',
    'palhaçada',
  ];

  private positiveKeywords = [
    'bom',
    'ótimo',
    'excelente',
    'perfeito',
    'maravilhoso',
    'rápido',
    'fácil',
    'simples',
    'obrigado',
    'obrigada',
    'valeu',
    'ajudou',
    'resolveu',
    'funcionou',
    'legal',
    'show',
    'top',
  ];

  private frustrationIndicators = [
    'não entende',
    'não entendeu',
    'já falei',
    'já disse',
    'quantas vezes',
    'de novo',
    'outra vez',
    'sempre a mesma coisa',
    'não adianta',
    'desisto',
    'quero falar com',
    'atendente',
    'pessoa de verdade',
    'humano',
    'gerente',
    'reclamar',
    'reclamação',
  ];

  private confusionIndicators = [
    'não entendi',
    'como assim',
    'o que',
    'explicar melhor',
    'não sei',
    'confuso',
    'perdido',
    'ajuda',
  ];

  private constructor() {}

  public static getInstance(): SentimentAnalysisService {
    if (!SentimentAnalysisService.instance) {
      SentimentAnalysisService.instance = new SentimentAnalysisService();
    }
    return SentimentAnalysisService.instance;
  }

  /**
   * Analisa sentimento de uma mensagem
   */
  public analyzeSentiment(message: string, context?: {
    previousMessages?: string[];
    failedAttempts?: number;
    lowConfidenceCount?: number;
  }): SentimentAnalysis {
    const lowerMessage = message.toLowerCase();
    const words = lowerMessage.split(/\s+/);

    // Conta keywords
    const negativeCount = this.countKeywords(lowerMessage, this.negativeKeywords);
    const veryNegativeCount = this.countKeywords(lowerMessage, this.veryNegativeKeywords);
    const positiveCount = this.countKeywords(lowerMessage, this.positiveKeywords);
    const frustrationCount = this.countKeywords(lowerMessage, this.frustrationIndicators);
    const confusionCount = this.countKeywords(lowerMessage, this.confusionIndicators);

    // Detecta CAPS LOCK (sinal de raiva)
    const capsRatio = this.calculateCapsRatio(message);
    const hasExcessiveCaps = capsRatio > 0.6 && message.length > 10;

    // Detecta pontuação excessiva (!!! ou ???)
    const hasExcessivePunctuation = /[!?]{3,}/.test(message);

    // Detecta repetição de palavras
    const hasRepetition = this.detectRepetition(words);

    // Calcula score base (-1 a 1)
    let score = 0;
    score += positiveCount * 0.2;
    score -= negativeCount * 0.3;
    score -= veryNegativeCount * 0.5;
    score -= frustrationCount * 0.4;
    score -= confusionCount * 0.2;

    if (hasExcessiveCaps) score -= 0.3;
    if (hasExcessivePunctuation) score -= 0.2;
    if (hasRepetition) score -= 0.2;

    // Ajusta por contexto
    if (context) {
      if (context.failedAttempts && context.failedAttempts > 2) {
        score -= 0.3;
      }
      if (context.lowConfidenceCount && context.lowConfidenceCount > 2) {
        score -= 0.2;
      }
      if (context.previousMessages) {
        const repeatedQuestions = this.detectRepeatedQuestions(
          message,
          context.previousMessages
        );
        if (repeatedQuestions) score -= 0.4;
      }
    }

    // Limita score entre -1 e 1
    score = Math.max(-1, Math.min(1, score));

    // Calcula magnitude (intensidade)
    const magnitude =
      negativeCount +
      veryNegativeCount +
      positiveCount +
      frustrationCount +
      (hasExcessiveCaps ? 2 : 0) +
      (hasExcessivePunctuation ? 1 : 0);

    // Determina label
    let label: SentimentAnalysis['label'];
    if (score <= -0.6) label = 'very_negative';
    else if (score <= -0.2) label = 'negative';
    else if (score >= 0.6) label = 'very_positive';
    else if (score >= 0.2) label = 'positive';
    else label = 'neutral';

    // Detecta frustração
    const isFrustrated =
      frustrationCount > 0 ||
      veryNegativeCount > 0 ||
      hasExcessiveCaps ||
      hasRepetition ||
      (context?.failedAttempts && context.failedAttempts > 2) ||
      score <= -0.5;

    // Decide se deve transferir para humano
    const shouldTransferToHuman =
      isFrustrated &&
      (frustrationCount > 1 ||
        veryNegativeCount > 0 ||
        (context?.failedAttempts && context.failedAttempts > 3) ||
        this.hasExplicitHumanRequest(lowerMessage));

    // Extrai keywords encontradas
    const keywords: string[] = [];
    this.negativeKeywords.forEach(kw => {
      if (lowerMessage.includes(kw)) keywords.push(kw);
    });
    this.veryNegativeKeywords.forEach(kw => {
      if (lowerMessage.includes(kw)) keywords.push(kw);
    });
    this.frustrationIndicators.forEach(kw => {
      if (lowerMessage.includes(kw)) keywords.push(kw);
    });

    return {
      score,
      magnitude,
      label,
      isFrustrated,
      shouldTransferToHuman,
      keywords: keywords.slice(0, 5), // Limita a 5
    };
  }

  /**
   * Conta keywords na mensagem
   */
  private countKeywords(message: string, keywords: string[]): number {
    let count = 0;
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Calcula proporção de letras maiúsculas
   */
  private calculateCapsRatio(message: string): number {
    const letters = message.replace(/[^a-zA-Z]/g, '');
    if (letters.length === 0) return 0;

    const capsLetters = message.replace(/[^A-Z]/g, '');
    return capsLetters.length / letters.length;
  }

  /**
   * Detecta repetição de palavras
   */
  private detectRepetition(words: string[]): boolean {
    const wordCount: Record<string, number> = {};

    for (const word of words) {
      if (word.length < 3) continue; // Ignora palavras muito curtas

      wordCount[word] = (wordCount[word] || 0) + 1;

      if (wordCount[word] >= 3) {
        return true; // Palavra repetida 3+ vezes
      }
    }

    return false;
  }

  /**
   * Detecta perguntas repetidas
   */
  private detectRepeatedQuestions(
    currentMessage: string,
    previousMessages: string[]
  ): boolean {
    const currentWords = new Set(
      currentMessage.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    );

    for (const prevMsg of previousMessages.slice(-3)) {
      // Últimas 3 mensagens
      const prevWords = new Set(
        prevMsg.toLowerCase().split(/\s+/).filter(w => w.length > 3)
      );

      const intersection = new Set(
        [...currentWords].filter(w => prevWords.has(w))
      );

      // Se 60%+ das palavras são iguais, considera repetição
      if (intersection.size / currentWords.size >= 0.6) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica se há pedido explícito por atendente humano
   */
  private hasExplicitHumanRequest(message: string): boolean {
    const humanRequestPatterns = [
      /falar com (uma )?(pessoa|atendente|humano|algu[eé]m)/,
      /quero (uma )?(pessoa|atendente|humano)/,
      /atendente (humano|real|de verdade)/,
      /pessoa (real|de verdade)/,
      /n[aã]o quero (robô|bot)/,
      /sair do (robô|bot)/,
      /gerente/,
      /supervisor/,
    ];

    for (const pattern of humanRequestPatterns) {
      if (pattern.test(message)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gera resposta empática baseada no sentimento
   */
  public generateEmpatheticResponse(sentiment: SentimentAnalysis): string | null {
    if (sentiment.label === 'very_negative' || sentiment.isFrustrated) {
      return 'Entendo sua frustração e peço desculpas pela inconveniência. ';
    }

    if (sentiment.label === 'negative') {
      return 'Sinto muito se algo não está funcionando como esperado. ';
    }

    if (sentiment.label === 'positive' || sentiment.label === 'very_positive') {
      return 'Fico feliz em poder ajudar! ';
    }

    return null;
  }

  /**
   * Decide prioridade de transferência
   */
  public getTransferPriority(sentiment: SentimentAnalysis): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    if (sentiment.label === 'very_negative' || sentiment.keywords.some(k =>
      this.veryNegativeKeywords.includes(k)
    )) {
      return 'URGENT';
    }

    if (sentiment.isFrustrated) {
      return 'HIGH';
    }

    if (sentiment.label === 'negative') {
      return 'MEDIUM';
    }

    return 'LOW';
  }
}

export default SentimentAnalysisService;
