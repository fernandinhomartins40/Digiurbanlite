/**
 * Catálogo inicial de provedores e modelos (preços públicos pesquisados em
 * 30/09/2026 — o super-admin pode editar tudo na tela IA; confira os preços
 * no painel de cada provedor antes de ativar).
 *
 * Todos os LLMs usam a API compatível com OpenAI (/chat/completions).
 * O JEV (TypeSafe) usa a API "System One" (/systemone): não gera texto,
 * devolve decisões tipadas (escolha, nota, sim/não) com probabilidade —
 * saída grátis, entrada ~US$ 0,04–0,08 por milhão de tokens.
 *
 * LGPD — onde os dados são processados (dataRegion):
 *   CN     = servidores na China continental (transferência internacional;
 *            usar SEMPRE com remoção de dados pessoais — padrão do sistema)
 *   GLOBAL = endpoint internacional do próprio provedor (ex.: Singapura)
 *   US     = modelos chineses hospedados nos EUA por terceiros, com retenção
 *            zero declarada (DeepInfra, OpenRouter com ZDR) — opção preferível
 *            para dados de cidadãos
 */

export type AiTier = 'decision' | 'fast' | 'smart';

export interface ProviderDefault {
  provider: string;
  label: string;
  baseUrl: string;
  dataRegion: 'CN' | 'GLOBAL' | 'US';
  zeroRetention: boolean;
  kind: 'openai' | 'jev';
  signupUrl: string;
  notes: string;
}

export interface ModelDefault {
  provider: string;
  modelId: string;
  label: string;
  tier: AiTier;
  inputPricePerMUsd: number;
  outputPricePerMUsd: number;
  cachedInputPricePerMUsd?: number;
}

export const PROVIDER_DEFAULTS: ProviderDefault[] = [
  {
    provider: 'jev',
    label: 'JEV (TypeSafe) — decisões',
    baseUrl: 'https://api.typesafe.ai/v1',
    dataRegion: 'US',
    zeroRetention: false,
    kind: 'jev',
    signupUrl: 'https://api.typesafe.ai',
    notes: 'Classifica, escolhe e pontua sem gerar texto. Use só o endpoint oficial (há sites "Jev" não oficiais).',
  },
  {
    provider: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    dataRegion: 'CN',
    zeroRetention: false,
    kind: 'openai',
    signupUrl: 'https://platform.deepseek.com',
    notes: 'Mais barato com cache. Dados processados na China.',
  },
  {
    provider: 'qwen',
    label: 'Qwen (Alibaba Model Studio internacional)',
    baseUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    dataRegion: 'GLOBAL',
    zeroRetention: false,
    kind: 'openai',
    signupUrl: 'https://www.alibabacloud.com/product/modelstudio',
    notes: 'Endpoint internacional (Singapura). Qwen Flash é o mais barato para tarefas simples.',
  },
  {
    provider: 'minimax',
    label: 'MiniMax',
    baseUrl: 'https://api.minimax.io/v1',
    dataRegion: 'GLOBAL',
    zeroRetention: false,
    kind: 'openai',
    signupUrl: 'https://www.minimax.io/platform',
    notes: 'Bom custo-benefício para respostas mais elaboradas.',
  },
  {
    provider: 'moonshot',
    label: 'Kimi (Moonshot AI)',
    baseUrl: 'https://api.moonshot.ai/v1',
    dataRegion: 'CN',
    zeroRetention: false,
    kind: 'openai',
    signupUrl: 'https://platform.moonshot.ai',
    notes: 'Forte em raciocínio; mais caro na saída.',
  },
  {
    provider: 'zhipu',
    label: 'GLM (Z.ai / Zhipu)',
    baseUrl: 'https://api.z.ai/api/paas/v4',
    dataRegion: 'GLOBAL',
    zeroRetention: false,
    kind: 'openai',
    signupUrl: 'https://z.ai',
    notes: 'Alternativa de qualidade para fallback.',
  },
  {
    provider: 'deepinfra',
    label: 'DeepInfra (modelos chineses nos EUA)',
    baseUrl: 'https://api.deepinfra.com/v1/openai',
    dataRegion: 'US',
    zeroRetention: true,
    kind: 'openai',
    signupUrl: 'https://deepinfra.com',
    notes: 'DeepSeek/Qwen/GLM/Kimi hospedados nos EUA, retenção zero, SOC 2. Recomendado para dados de cidadãos.',
  },
  {
    provider: 'openrouter',
    label: 'OpenRouter (vários provedores + JEV)',
    baseUrl: 'https://openrouter.ai/api/v1',
    dataRegion: 'US',
    zeroRetention: false,
    kind: 'openai',
    signupUrl: 'https://openrouter.ai',
    notes: 'Uma chave para muitos modelos (inclusive JEV). Ative "zero data retention" na conta.',
  },
];

export const MODEL_DEFAULTS: ModelDefault[] = [
  // Decisões (JEV): saída grátis
  { provider: 'jev', modelId: 'jev-latest', label: 'JEV', tier: 'decision', inputPricePerMUsd: 0.084, outputPricePerMUsd: 0 },
  { provider: 'openrouter', modelId: 'typesafe/jev-latest', label: 'JEV via OpenRouter', tier: 'decision', inputPricePerMUsd: 0.084, outputPricePerMUsd: 0 },
  // Rápidos e baratos (extração, respostas curtas)
  { provider: 'deepseek', modelId: 'deepseek-chat', label: 'DeepSeek V4.1 Flash', tier: 'fast', inputPricePerMUsd: 0.3, outputPricePerMUsd: 1.2, cachedInputPricePerMUsd: 0.006 },
  { provider: 'qwen', modelId: 'qwen-flash', label: 'Qwen Flash', tier: 'fast', inputPricePerMUsd: 0.1, outputPricePerMUsd: 0.4 },
  { provider: 'deepinfra', modelId: 'deepseek-ai/DeepSeek-V4-Flash', label: 'DeepSeek V4 Flash (EUA)', tier: 'fast', inputPricePerMUsd: 0.14, outputPricePerMUsd: 0.42 },
  { provider: 'openrouter', modelId: 'deepseek/deepseek-chat', label: 'DeepSeek via OpenRouter', tier: 'fast', inputPricePerMUsd: 0.3, outputPricePerMUsd: 1.2 },
  // Mais inteligentes (conversa, orientação, casos difíceis)
  { provider: 'qwen', modelId: 'qwen-plus', label: 'Qwen Plus', tier: 'smart', inputPricePerMUsd: 0.4, outputPricePerMUsd: 2.4 },
  { provider: 'minimax', modelId: 'MiniMax-M3', label: 'MiniMax M3', tier: 'smart', inputPricePerMUsd: 0.3, outputPricePerMUsd: 1.2 },
  { provider: 'moonshot', modelId: 'kimi-k2.6', label: 'Kimi K2.6', tier: 'smart', inputPricePerMUsd: 0.95, outputPricePerMUsd: 4 },
  { provider: 'zhipu', modelId: 'glm-5.3', label: 'GLM 5.3', tier: 'smart', inputPricePerMUsd: 1.4, outputPricePerMUsd: 4.4 },
];

export const providerDefault = (provider: string) => PROVIDER_DEFAULTS.find((p) => p.provider === provider);

/** Pacotes iniciais (1 crédito = R$ 0,01 de venda). Editáveis na tela IA. */
export const PACKAGE_DEFAULTS = [
  { code: 'IA-START', name: 'IA Start', description: 'Para começar: ~5 mil atendimentos do DigiBot', credits: 20000, priceBrl: 200, sortOrder: 1 },
  { code: 'IA-PRO', name: 'IA Profissional', description: '~15 mil atendimentos/mês', credits: 60000, priceBrl: 540, sortOrder: 2 },
  { code: 'IA-MAX', name: 'IA Max', description: '~50 mil atendimentos/mês, melhor preço por crédito', credits: 200000, priceBrl: 1600, sortOrder: 3 },
];
