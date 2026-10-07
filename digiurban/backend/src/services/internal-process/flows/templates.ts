/**
 * Modelos de documentos da contratação pública (Lei 14.133/2021).
 * Texto simples com seções; os campos {{...}} são preenchidos com os dados do
 * processo e o servidor completa o resto. São pontos de partida: a
 * prefeitura deve adequar aos seus regulamentos locais.
 */

export interface DocumentTemplate {
  key: string;
  title: string;
  legal: string;
  body: string;
}

const HEADER = `{{municipio}}
{{unidade}}
Processo nº {{numero}}`;

const SIGN = `
{{cidade_data}}


_____________________________________
{{responsavel}}
{{cargo}}`;

export const DOCUMENT_TEMPLATES: Record<string, DocumentTemplate> = {
  DFD: {
    key: 'DFD',
    title: 'Documento de Formalização da Demanda (DFD)',
    legal: 'Lei 14.133/2021, art. 12, VII, e art. 72, I',
    body: `${HEADER}

DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA

1. UNIDADE REQUISITANTE
{{unidade}} — responsável: {{responsavel}}

2. OBJETO
{{objeto}}

3. JUSTIFICATIVA DA NECESSIDADE
(Explique o problema a ser resolvido e o interesse público atendido.)

4. QUANTIDADE ESTIMADA
(Itens, unidades e quantidades, com a memória de cálculo.)

5. PRAZO DESEJADO
(Data em que o bem/serviço precisa estar disponível.)

6. PLANO DE CONTRATAÇÕES ANUAL
( ) A contratação está prevista no PCA {{ano}}, item nº ____.
( ) Não está prevista — justificativa: ____.

7. VALOR ESTIMADO PRELIMINAR
{{valor}}

8. RESPONSÁVEIS PELA FISCALIZAÇÃO (sugestão)
(Indique servidores para gestor e fiscal do futuro contrato.)
${SIGN}`,
  },

  ETP: {
    key: 'ETP',
    title: 'Estudo Técnico Preliminar (ETP)',
    legal: 'Lei 14.133/2021, art. 18, I, § 1º e § 2º',
    body: `${HEADER}

ESTUDO TÉCNICO PRELIMINAR

Objeto: {{objeto}}

I. DESCRIÇÃO DA NECESSIDADE (obrigatório — § 2º)
(Problema a resolver, sob a perspectiva do interesse público.)

II. PREVISÃO NO PLANO DE CONTRATAÇÕES ANUAL
(Item do PCA ou justificativa.)

III. REQUISITOS DA CONTRATAÇÃO
(Padrões mínimos de qualidade, desempenho, sustentabilidade.)

IV. ESTIMATIVA DAS QUANTIDADES (obrigatório — § 2º)
(Memória de cálculo e documentos de suporte.)

V. LEVANTAMENTO DE MERCADO
(Alternativas possíveis e justificativa técnica e econômica da escolhida.)

VI. ESTIMATIVA DO VALOR (obrigatório — § 2º)
{{valor}} (memória de cálculo e documentos de suporte; pode ser sigilosa até a licitação)

VII. DESCRIÇÃO DA SOLUÇÃO COMO UM TODO
(Inclusive manutenção e assistência técnica, se for o caso.)

VIII. JUSTIFICATIVA DO PARCELAMENTO OU NÃO (obrigatório — § 2º)

IX. RESULTADOS PRETENDIDOS
(Economicidade e melhor aproveitamento dos recursos.)

X. PROVIDÊNCIAS ANTES DO CONTRATO
(Capacitação de servidores, adequações de ambiente etc.)

XI. CONTRATAÇÕES CORRELATAS E/OU INTERDEPENDENTES

XII. IMPACTOS AMBIENTAIS E MEDIDAS MITIGADORAS

XIII. POSICIONAMENTO CONCLUSIVO (obrigatório — § 2º)
( ) A contratação é viável e adequada à necessidade.
( ) A contratação não é viável, pelos motivos: ____.

Elementos do § 1º não tratados e sua justificativa: ____.
${SIGN}`,
  },

  MAPA_RISCOS: {
    key: 'MAPA_RISCOS',
    title: 'Mapa de riscos',
    legal: 'Lei 14.133/2021, art. 18, X, e art. 22',
    body: `${HEADER}

MAPA DE RISCOS

Objeto: {{objeto}}

Para cada risco: descrição | probabilidade (baixa/média/alta) | impacto (baixo/médio/alto) | ação preventiva | ação de contingência | responsável

1. Risco: ____
2. Risco: ____
3. Risco: ____

Fase em que foi avaliado: planejamento da contratação.
${SIGN}`,
  },

  TERMO_REFERENCIA: {
    key: 'TERMO_REFERENCIA',
    title: 'Termo de Referência',
    legal: 'Lei 14.133/2021, art. 6º, XXIII',
    body: `${HEADER}

TERMO DE REFERÊNCIA

a) DEFINIÇÃO DO OBJETO
{{objeto}}
(Natureza, quantitativos, prazo do contrato e, se for o caso, possibilidade de prorrogação.)

b) FUNDAMENTAÇÃO DA CONTRATAÇÃO
(Referência ao Estudo Técnico Preliminar ou justificativa de sua dispensa.)

c) DESCRIÇÃO DA SOLUÇÃO COMO UM TODO
(Considerado todo o ciclo de vida do objeto.)

d) REQUISITOS DA CONTRATAÇÃO

e) MODELO DE EXECUÇÃO DO OBJETO
(Como o contrato deverá produzir os resultados, do início ao fim.)

f) MODELO DE GESTÃO DO CONTRATO
(Como a execução será acompanhada e fiscalizada.)

g) CRITÉRIOS DE MEDIÇÃO E DE PAGAMENTO

h) FORMA E CRITÉRIOS DE SELEÇÃO DO FORNECEDOR
Modalidade: {{modalidade}} — Critério de julgamento: {{criterio}}

i) ESTIMATIVA DO VALOR DA CONTRATAÇÃO
{{valor}} (com os preços unitários de referência e a memória de cálculo)

j) ADEQUAÇÃO ORÇAMENTÁRIA
(Dotação orçamentária.)
${SIGN}`,
  },

  PESQUISA_PRECOS: {
    key: 'PESQUISA_PRECOS',
    title: 'Pesquisa de preços e mapa comparativo',
    legal: 'Lei 14.133/2021, art. 23',
    body: `${HEADER}

PESQUISA DE PREÇOS

Objeto: {{objeto}}

1. PARÂMETROS UTILIZADOS (art. 23, § 1º)
( ) I — Painel de Preços / banco de preços em saúde (composição de custos)
( ) II — Contratações similares de outros entes (até 1 ano)
( ) III — Mídia especializada, tabelas de referência, sites (com data e hora de acesso)
( ) IV — Pesquisa direta com no mínimo 3 fornecedores (cotações de até 6 meses)
( ) V — Notas fiscais de compras pelo ente (até 1 ano)

2. MAPA COMPARATIVO
Item | Fonte 1 | Fonte 2 | Fonte 3 | Média/mediana | Preço adotado

3. TRATAMENTO DOS PREÇOS
(Critério: média, mediana ou menor preço; preços descartados por serem inexequíveis ou excessivos e o motivo.)

4. VALOR ESTIMADO DA CONTRATAÇÃO
{{valor}}
${SIGN}`,
  },

  DISPONIBILIDADE_ORCAMENTARIA: {
    key: 'DISPONIBILIDADE_ORCAMENTARIA',
    title: 'Declaração de disponibilidade orçamentária',
    legal: 'Lei 14.133/2021, art. 72, IV',
    body: `${HEADER}

DECLARAÇÃO DE DISPONIBILIDADE ORÇAMENTÁRIA

Declaro, para os fins do processo nº {{numero}}, que há recursos orçamentários para a despesa estimada em {{valor}}, referente a: {{objeto}}.

Dotação orçamentária:
Órgão/Unidade: ____
Programa de trabalho: ____
Elemento de despesa: ____
Fonte de recurso: ____
${SIGN}`,
  },

  MINUTA_EDITAL: {
    key: 'MINUTA_EDITAL',
    title: 'Minuta do edital',
    legal: 'Lei 14.133/2021, art. 25',
    body: `${HEADER}

EDITAL DE {{modalidade_maiuscula}} Nº ____/{{ano}}

1. OBJETO: {{objeto}}
2. CRITÉRIO DE JULGAMENTO: {{criterio}}
3. MODO DE DISPUTA: ( ) aberto ( ) fechado ( ) aberto e fechado
4. DATA, HORA E LOCAL DA SESSÃO: ____ (plataforma eletrônica: ____)
5. VALOR ESTIMADO: {{valor}} ( ) divulgado ( ) sigiloso até o julgamento (art. 24)
6. CONDIÇÕES DE PARTICIPAÇÃO E IMPEDIMENTOS (art. 14)
7. PROPOSTAS E LANCES
8. JULGAMENTO E NEGOCIAÇÃO (arts. 59 e 61)
9. HABILITAÇÃO (arts. 62 a 70): jurídica; técnica; fiscal, social e trabalhista; econômico-financeira
10. ESCLARECIMENTOS E IMPUGNAÇÕES: até 3 dias úteis antes da sessão (art. 164)
11. RECURSOS: 3 dias úteis (art. 165)
12. SANÇÕES (arts. 155 a 163)
13. CONTRATAÇÃO, PRAZOS E PAGAMENTO
14. ANEXOS: Termo de Referência; Minuta do contrato; Modelos de declarações
${SIGN}`,
  },

  MINUTA_CONTRATO: {
    key: 'MINUTA_CONTRATO',
    title: 'Minuta do contrato',
    legal: 'Lei 14.133/2021, art. 92',
    body: `${HEADER}

MINUTA DE CONTRATO Nº ____/{{ano}}

CONTRATANTE: {{municipio}}
CONTRATADA: ____ (CNPJ ____)

CLÁUSULA 1ª — OBJETO E SEUS ELEMENTOS: {{objeto}}
CLÁUSULA 2ª — VINCULAÇÃO AO EDITAL/TERMO QUE DISPENSOU OU INEXIGIU A LICITAÇÃO E À PROPOSTA
CLÁUSULA 3ª — LEGISLAÇÃO APLICÁVEL: Lei 14.133/2021
CLÁUSULA 4ª — REGIME DE EXECUÇÃO OU FORMA DE FORNECIMENTO
CLÁUSULA 5ª — PREÇO: {{valor}}, condições de pagamento, critérios de reajuste e periodicidade
CLÁUSULA 6ª — PRAZOS DE INÍCIO, EXECUÇÃO, ENTREGA E RECEBIMENTO
CLÁUSULA 7ª — CRÉDITO ORÇAMENTÁRIO: ____
CLÁUSULA 8ª — GARANTIA (se exigida)
CLÁUSULA 9ª — DIREITOS E RESPONSABILIDADES DAS PARTES E PENALIDADES
CLÁUSULA 10ª — HIPÓTESES DE EXTINÇÃO
CLÁUSULA 11ª — FISCALIZAÇÃO (gestor e fiscal — art. 117)
CLÁUSULA 12ª — OBRIGAÇÃO DE MANTER AS CONDIÇÕES DE HABILITAÇÃO
CLÁUSULA 13ª — MATRIZ DE RISCOS (quando for o caso)
CLÁUSULA 14ª — FORO: comarca de ____
${SIGN}`,
  },

  PARECER_JURIDICO: {
    key: 'PARECER_JURIDICO',
    title: 'Parecer jurídico',
    legal: 'Lei 14.133/2021, art. 53 e art. 72, III',
    body: `${HEADER}

PARECER JURÍDICO

Interessado: {{unidade}}
Assunto: {{objeto}}

I. RELATÓRIO
(Resumo do que consta no processo.)

II. ANÁLISE (controle prévio de legalidade — art. 53)
a) Planejamento: DFD, ETP, riscos e termo de referência
b) Estimativa de preços (art. 23)
c) Disponibilidade orçamentária
d) {{secao_juridica}}
e) Minutas (edital/contrato) e cláusulas obrigatórias

III. CONCLUSÃO
( ) Favorável ao prosseguimento.
( ) Favorável, com as recomendações: ____.
( ) Desfavorável, pelos motivos: ____.

(Redigido em linguagem simples, com apreciação de todos os elementos indispensáveis — art. 53, § 1º.)
${SIGN}`,
  },

  AUTORIZACAO: {
    key: 'AUTORIZACAO',
    title: 'Autorização da autoridade competente',
    legal: 'Lei 14.133/2021, arts. 7º, 8º e 72, VIII',
    body: `${HEADER}

AUTORIZAÇÃO

Considerando o que consta no processo nº {{numero}}, em especial o parecer jurídico, AUTORIZO {{autorizacao_texto}} para: {{objeto}}, no valor estimado de {{valor}}.

{{autorizacao_complemento}}
${SIGN}`,
  },

  PORTARIA_AGENTE: {
    key: 'PORTARIA_AGENTE',
    title: 'Portaria de designação do agente de contratação',
    legal: 'Lei 14.133/2021, arts. 7º e 8º',
    body: `${HEADER}

PORTARIA Nº ____/{{ano}}

Designa agente de contratação e equipe de apoio.

Art. 1º Fica designado(a) ____ (matrícula ____), servidor(a) efetivo(a), como agente de contratação/pregoeiro(a) do processo nº {{numero}} — {{objeto}}.
Art. 2º Compõem a equipe de apoio: ____.
Art. 3º Observe-se a segregação de funções (art. 7º, § 1º, da Lei 14.133/2021).
Art. 4º Esta portaria entra em vigor na data de sua publicação.
${SIGN}`,
  },

  AVISO_LICITACAO: {
    key: 'AVISO_LICITACAO',
    title: 'Aviso de licitação (extrato do edital)',
    legal: 'Lei 14.133/2021, arts. 54 e 55',
    body: `${HEADER}

AVISO DE {{modalidade_maiuscula}} Nº ____/{{ano}}

{{municipio}} torna público que realizará licitação na modalidade {{modalidade}}, critério {{criterio}}.

Objeto: {{objeto}}
Sessão: ____ às ____ (plataforma: ____)
Edital completo: Portal Nacional de Contratações Públicas (PNCP) e ____

Publicado no PNCP em ____; no diário oficial em ____; em jornal de grande circulação em ____.
${SIGN}`,
  },

  ATA_SESSAO: {
    key: 'ATA_SESSAO',
    title: 'Ata da sessão de julgamento e habilitação',
    legal: 'Lei 14.133/2021, arts. 17, 59, 61 e 62',
    body: `${HEADER}

ATA DA SESSÃO

Objeto: {{objeto}} — Modalidade: {{modalidade}} — Critério: {{criterio}}

1. Abertura: ____ às ____, conduzida por ____ (agente de contratação/pregoeiro).
2. Licitantes participantes: ____
3. Propostas e lances (classificação final): ____
4. Análise de aceitabilidade e exequibilidade (art. 59): ____
5. Negociação com o primeiro colocado (art. 61): ____
6. Habilitação do vencedor (arts. 62 a 70): ( ) habilitado ( ) inabilitado — motivo: ____
7. Intenção de recurso: ( ) não houve ( ) houve — licitante: ____
8. Encerramento: ____
${SIGN}`,
  },

  DECISAO_RECURSO: {
    key: 'DECISAO_RECURSO',
    title: 'Decisão de recurso',
    legal: 'Lei 14.133/2021, art. 165',
    body: `${HEADER}

DECISÃO DE RECURSO

Recorrente: ____
Recorrido(s): ____
Objeto: {{objeto}}

1. Tempestividade (3 dias úteis — art. 165, I): ____
2. Razões e contrarrazões: ____
3. Análise: ____
4. Decisão: ( ) conheço e dou provimento ( ) conheço e nego provimento ( ) não conheço
${SIGN}`,
  },

  TERMO_HOMOLOGACAO: {
    key: 'TERMO_HOMOLOGACAO',
    title: 'Termo de adjudicação e homologação',
    legal: 'Lei 14.133/2021, art. 71, IV',
    body: `${HEADER}

TERMO DE ADJUDICAÇÃO E HOMOLOGAÇÃO

Encerradas as fases de julgamento, habilitação e recursal do processo nº {{numero}} ({{modalidade}}), e verificada a regularidade dos atos, ADJUDICO o objeto — {{objeto}} — à empresa ____ (CNPJ ____), pelo valor de R$ ____, e HOMOLOGO o procedimento.
${SIGN}`,
  },

  AVISO_DISPENSA: {
    key: 'AVISO_DISPENSA',
    title: 'Aviso de dispensa (propostas adicionais)',
    legal: 'Lei 14.133/2021, art. 75, § 3º',
    body: `${HEADER}

AVISO DE DISPENSA DE LICITAÇÃO Nº ____/{{ano}}

{{municipio}} torna pública a intenção de contratar, por dispensa de licitação ({{hipotese}}), o seguinte objeto:

{{objeto}}

Valor estimado: {{valor}}
Interessados poderão enviar propostas adicionais até ____ (mínimo de 3 dias úteis da publicação), para ____.
Especificações completas: ____
${SIGN}`,
  },

  JUSTIFICATIVA_CONTRATACAO_DIRETA: {
    key: 'JUSTIFICATIVA_CONTRATACAO_DIRETA',
    title: 'Justificativa da contratação direta',
    legal: 'Lei 14.133/2021, art. 72, V, VI e VII; arts. 74 e 75',
    body: `${HEADER}

JUSTIFICATIVA DE CONTRATAÇÃO DIRETA

Objeto: {{objeto}}
Fundamento legal: {{hipotese}}

1. CABIMENTO DA {{tipo_contratacao_maiuscula}}
(Por que a situação se enquadra na hipótese legal. Na dispensa por valor, demonstrar que o somatório do mesmo objeto no exercício não passa o limite — art. 75, § 1º.)

2. RAZÃO DA ESCOLHA DO CONTRATADO (art. 72, VI)
Contratado: ____ (CNPJ/CPF ____)

3. JUSTIFICATIVA DO PREÇO (art. 72, VII)
Valor: {{valor}} — compatível com: ____

4. HABILITAÇÃO E QUALIFICAÇÃO MÍNIMA (art. 72, V)
( ) Regularidade fiscal federal, estadual e municipal
( ) FGTS ( ) Débitos trabalhistas (CNDT)
( ) Outros: ____
${SIGN}`,
  },

  CONTRATO: {
    key: 'CONTRATO',
    title: 'Contrato (ou instrumento equivalente)',
    legal: 'Lei 14.133/2021, arts. 89 a 95',
    body: `${HEADER}

CONTRATO Nº ____/{{ano}}

(Use a minuta aprovada pelo jurídico. Na contratação direta de pequeno valor, o contrato pode ser substituído por nota de empenho, carta-contrato ou ordem de serviço — art. 95.)

Objeto: {{objeto}}
Valor: {{valor}}
Vigência: ____
Contratada: ____

Publicação no PNCP em ____ (até 20 dias úteis — licitação; até 10 dias úteis — contratação direta; art. 94).
${SIGN}`,
  },

  PORTARIA_FISCAL: {
    key: 'PORTARIA_FISCAL',
    title: 'Portaria de designação de gestor e fiscal do contrato',
    legal: 'Lei 14.133/2021, art. 117',
    body: `${HEADER}

PORTARIA Nº ____/{{ano}}

Designa gestor e fiscal do contrato decorrente do processo nº {{numero}}.

Art. 1º Fica designado(a) como gestor(a) do contrato: ____ (matrícula ____).
Art. 2º Fica designado(a) como fiscal do contrato: ____ (matrícula ____), e como suplente: ____.
Art. 3º Cabe ao fiscal acompanhar e fiscalizar a execução, anotar em registro próprio as ocorrências e determinar o que for necessário para a regularização (art. 117, § 1º).
Art. 4º Esta portaria entra em vigor na data de sua publicação.
${SIGN}`,
  },
};

const BRL = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `R$ ${number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'R$ ____';
};

export interface TemplateContext {
  municipio: string;
  cidade: string;
  unidade: string;
  numero: string;
  objeto: string;
  responsavel: string;
  cargo: string;
  flowKey: string | null;
  fields: Record<string, any>;
}

/** Preenche o modelo com os dados do processo */
export function fillTemplate(template: DocumentTemplate, ctx: TemplateContext): string {
  const today = new Date();
  const isDireta = ctx.flowKey === 'DISPENSA' || ctx.flowKey === 'INEXIGIBILIDADE';
  const tipo = ctx.flowKey === 'INEXIGIBILIDADE' ? 'inexigibilidade' : 'dispensa';
  const modalidade = String(ctx.fields?.modalidade || '____');
  const values: Record<string, string> = {
    municipio: ctx.municipio,
    unidade: ctx.unidade,
    numero: ctx.numero,
    objeto: ctx.objeto,
    responsavel: ctx.responsavel,
    cargo: ctx.cargo || '____',
    ano: String(today.getFullYear()),
    cidade_data: `${ctx.cidade || '____'}, ${today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
    valor: BRL(ctx.fields?.valorEstimado),
    modalidade,
    modalidade_maiuscula: modalidade.toUpperCase(),
    criterio: String(ctx.fields?.criterio || '____'),
    hipotese: String(ctx.fields?.hipotese || '____'),
    tipo_contratacao_maiuscula: tipo.toUpperCase(),
    secao_juridica: isDireta
      ? `Enquadramento da contratação direta (${ctx.fields?.hipotese || 'hipótese legal'}), razão da escolha, justificativa de preço e habilitação (art. 72)`
      : `Modalidade (${modalidade}) e critério de julgamento (${ctx.fields?.criterio || '____'})`,
    autorizacao_texto: isDireta ? `a contratação direta por ${tipo} de licitação, com fundamento em ${ctx.fields?.hipotese || '____'},` : `a abertura de licitação na modalidade ${modalidade}`,
    autorizacao_complemento: isDireta
      ? 'Publique-se o ato em sítio eletrônico oficial (art. 72, parágrafo único).'
      : 'Designo como agente de contratação/pregoeiro(a) ____ e equipe de apoio ____ (arts. 7º e 8º).',
  };
  return template.body.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => values[key] ?? '____');
}
