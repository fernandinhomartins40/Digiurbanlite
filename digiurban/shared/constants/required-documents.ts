/**
 * Catálogo único de documentos que um serviço pode pedir ao cidadão.
 *
 * Fonte de verdade: digiurban/shared/constants/required-documents.ts
 * (copiado para backend/src/shared e frontend/shared — alterar aqui e copiar).
 *
 * O catálogo de serviços (backend/src/catalog/services/*.seed.ts) só pode pedir
 * documentos por CÓDIGO deste arquivo — o TypeScript recusa nome solto. Quem
 * precisa ("do responsável", "categoria D") vai em `note`, nunca no nome.
 * O mesmo documento tem sempre o mesmo nome, a mesma dica e o mesmo jeito de
 * fotografar (`scan`) em todo serviço, no portal, no balcão e no bot.
 */

/** Como a câmera trata o documento (lib/doc-scanner/document-kinds.ts no frontend) */
export type DocumentScanProfile =
  | 'id-card' // documento com foto: frente e verso
  | 'card' // cartão de um lado só
  | 'page' // folha, uma ou mais páginas
  | 'drawing' // planta/projeto: folha grande deitada
  | 'booklet' // caderneta/carteira
  | 'slip' // carnê/boleto
  | 'photo-3x4'
  | 'scene'; // fotos de lugar ou de coisa

export interface DocumentDefinition {
  /** nome que o cidadão vê */
  name: string;
  /** o que serve como esse documento (dica curta) */
  hint: string;
  scan: DocumentScanProfile;
  group: DocumentGroup;
}

export type DocumentGroup =
  | 'Pessoais'
  | 'Endereço e renda'
  | 'Família e social'
  | 'Saúde'
  | 'Educação'
  | 'Imóvel e obras'
  | 'Meio ambiente e rural'
  | 'Empresa'
  | 'Veículo e transporte'
  | 'Segurança e justiça'
  | 'Projetos e eventos'
  | 'Outros';

const doc = (group: DocumentGroup, scan: DocumentScanProfile, name: string, hint: string): DocumentDefinition => ({ name, hint, scan, group });

export const DOCUMENT_CATALOG = {
  // ------------------------------------------------------------ pessoais
  IDENTIDADE: doc('Pessoais', 'id-card', 'Documento de identidade (RG, CIN ou CNH)', 'Frente e verso, sem capa plástica.'),
  CPF: doc('Pessoais', 'card', 'CPF', 'Cartão do CPF ou documento com o número do CPF.'),
  CNH: doc('Pessoais', 'id-card', 'Carteira de motorista (CNH)', 'Física (frente e verso) ou a CNH digital.'),
  FOTO_3X4: doc('Pessoais', 'photo-3x4', 'Foto 3x4 recente', 'Foto de rosto, fundo claro, sem óculos escuros.'),
  CERTIDAO_NASCIMENTO: doc('Pessoais', 'page', 'Certidão de nascimento', 'Todas as páginas, se tiver mais de uma.'),
  CERTIDAO_CASAMENTO: doc('Pessoais', 'page', 'Certidão de casamento ou união estável', 'Certidão do cartório ou escritura de união estável.'),
  TITULO_ELEITOR: doc('Pessoais', 'card', 'Título de eleitor', 'O título físico ou o e-Título.'),
  PROCURACAO: doc('Pessoais', 'page', 'Procuração', 'Quando outra pessoa faz o pedido por você.'),

  // ------------------------------------------------------------ endereço e renda
  COMPROVANTE_RESIDENCIA: doc('Endereço e renda', 'page', 'Comprovante de residência', 'Conta de luz, água, telefone ou contrato de aluguel dos últimos 3 meses.'),
  COMPROVANTE_RENDA: doc('Endereço e renda', 'page', 'Comprovante de renda', 'Contracheque, extrato do benefício ou carteira de trabalho.'),
  CONTRATO_ALUGUEL: doc('Endereço e renda', 'page', 'Contrato de aluguel', 'Todas as páginas, com as assinaturas.'),
  COMPROVANTE_TRABALHO: doc('Endereço e renda', 'page', 'Comprovante de trabalho', 'Declaração do empregador ou carteira de trabalho.'),
  COMPROVANTE_PAGAMENTO: doc('Endereço e renda', 'page', 'Comprovante de pagamento', 'Recibo ou comprovante do banco.'),

  // ------------------------------------------------------------ família e social
  CADUNICO: doc('Família e social', 'page', 'Folha resumo do CadÚnico', 'Pegue no CRAS ou no app do CadÚnico.'),
  DECLARACAO_VULNERABILIDADE: doc('Família e social', 'page', 'Declaração de baixa renda ou vulnerabilidade', 'Declaração assinada ou emitida pelo CRAS.'),
  LAUDO_SOCIAL: doc('Família e social', 'page', 'Relatório ou laudo social', 'Emitido por assistente social.'),
  AUTORIZACAO_RESPONSAVEL: doc('Família e social', 'page', 'Autorização do responsável', 'Assinada pelo pai, mãe ou responsável legal.'),

  // ------------------------------------------------------------ saúde
  CARTAO_SUS: doc('Saúde', 'card', 'Cartão SUS', 'Cartão físico ou o número no app Meu SUS Digital.'),
  CARTAO_VACINA: doc('Saúde', 'booklet', 'Cartão de vacina', 'Todas as páginas com vacinas.'),
  ATESTADO_MEDICO: doc('Saúde', 'page', 'Atestado médico', 'Com nome, CRM e assinatura do médico.'),
  LAUDO_MEDICO: doc('Saúde', 'page', 'Laudo médico', 'Com CID, nome, CRM e assinatura do médico.'),
  RECEITA_MEDICA: doc('Saúde', 'page', 'Receita médica', 'Dentro da validade.'),
  ENCAMINHAMENTO_MEDICO: doc('Saúde', 'page', 'Encaminhamento ou pedido médico', 'Pedido do médico para o exame, consulta ou tratamento.'),
  EXAMES: doc('Saúde', 'page', 'Exames', 'Resultados de exames recentes.'),

  // ------------------------------------------------------------ educação
  COMPROVANTE_MATRICULA: doc('Educação', 'page', 'Comprovante ou declaração de matrícula', 'Emitido pela escola, do ano atual.'),
  HISTORICO_ESCOLAR: doc('Educação', 'page', 'Histórico escolar', 'Todas as páginas.'),
  COMPROVANTE_ESCOLARIDADE: doc('Educação', 'page', 'Comprovante de escolaridade', 'Diploma, certificado de conclusão ou histórico.'),
  DECLARACAO_TRANSFERENCIA: doc('Educação', 'page', 'Declaração de transferência', 'Emitida pela escola de origem.'),
  RELATORIO_PEDAGOGICO: doc('Educação', 'page', 'Relatório pedagógico', 'Emitido pela escola ou pelo professor.'),
  CERTIFICADO_CURSO: doc('Educação', 'page', 'Certificado de curso', 'Certificado de conclusão do curso.'),

  // ------------------------------------------------------------ imóvel e obras
  MATRICULA_IMOVEL: doc('Imóvel e obras', 'page', 'Matrícula do imóvel', 'Certidão de matrícula do cartório de registro de imóveis.'),
  ESCRITURA: doc('Imóvel e obras', 'page', 'Escritura ou contrato de compra e venda', 'Todas as páginas.'),
  COMPROVANTE_PROPRIEDADE: doc('Imóvel e obras', 'page', 'Comprovante de propriedade ou posse', 'Escritura, matrícula, contrato ou recibo de compra.'),
  DECLARACAO_POSSE: doc('Imóvel e obras', 'page', 'Declaração de posse', 'Declaração assinada de que mora ou usa o imóvel.'),
  DECLARACAO_NAO_PROPRIETARIO: doc('Imóvel e obras', 'page', 'Declaração de que não tem imóvel', 'Declaração assinada.'),
  IPTU: doc('Imóvel e obras', 'slip', 'Carnê ou certidão do IPTU', 'A página com o número de inscrição do imóvel.'),
  PLANTA: doc('Imóvel e obras', 'drawing', 'Planta do imóvel', 'Planta baixa, de situação ou croqui do terreno.'),
  PROJETO_TECNICO: doc('Imóvel e obras', 'drawing', 'Projeto técnico', 'Projeto assinado pelo responsável técnico.'),
  MEMORIAL_DESCRITIVO: doc('Imóvel e obras', 'page', 'Memorial descritivo', 'Assinado pelo responsável técnico.'),
  ART: doc('Imóvel e obras', 'page', 'ART ou RRT do responsável técnico', 'Anotação (CREA) ou registro (CAU) de responsabilidade técnica.'),
  LEVANTAMENTO_TOPOGRAFICO: doc('Imóvel e obras', 'drawing', 'Levantamento topográfico', 'Assinado pelo responsável técnico.'),
  LAUDO_TECNICO: doc('Imóvel e obras', 'page', 'Laudo técnico', 'Assinado pelo profissional responsável.'),
  AVCB: doc('Imóvel e obras', 'page', 'Auto de vistoria do Corpo de Bombeiros (AVCB)', 'Dentro da validade.'),

  // ------------------------------------------------------------ meio ambiente e rural
  LICENCA_AMBIENTAL: doc('Meio ambiente e rural', 'page', 'Licença ambiental', 'Dentro da validade.'),
  ESTUDO_AMBIENTAL: doc('Meio ambiente e rural', 'page', 'Estudo ou plano ambiental', 'Estudo de impacto, plano de controle ou de manejo.'),
  DAP_CAF: doc('Meio ambiente e rural', 'page', 'DAP ou CAF (agricultor familiar)', 'Declaração de Aptidão ao Pronaf ou Cadastro da Agricultura Familiar.'),
  CADASTRO_PRODUTOR_RURAL: doc('Meio ambiente e rural', 'page', 'Inscrição de produtor rural', 'Cadastro de produtor rural no estado.'),
  COMPROVANTE_ATIVIDADE_RURAL: doc('Meio ambiente e rural', 'page', 'Comprovante de atividade rural', 'Notas de venda da produção, declaração do sindicato ou da área plantada.'),
  CAR: doc('Meio ambiente e rural', 'page', 'CAR (Cadastro Ambiental Rural)', 'Recibo de inscrição do CAR.'),
  ITR: doc('Meio ambiente e rural', 'page', 'ITR (Imposto Territorial Rural)', 'Recibo da última declaração.'),

  // ------------------------------------------------------------ empresa
  CNPJ: doc('Empresa', 'page', 'Cartão CNPJ', 'Comprovante de inscrição no CNPJ (site da Receita Federal).'),
  CONTRATO_SOCIAL: doc('Empresa', 'page', 'Contrato social ou estatuto', 'Última versão, com todas as páginas. MEI: certificado do MEI.'),
  ALVARA_FUNCIONAMENTO: doc('Empresa', 'page', 'Alvará de funcionamento', 'O último alvará emitido.'),
  LICENCA_SANITARIA: doc('Empresa', 'page', 'Licença sanitária', 'Dentro da validade.'),
  CERTIDOES_NEGATIVAS: doc('Empresa', 'page', 'Certidões negativas de débitos', 'Federal, estadual, municipal e trabalhista, conforme o pedido.'),
  CADASTUR: doc('Empresa', 'page', 'Cadastur', 'Certificado do Cadastur (Ministério do Turismo).'),
  PLANO_NEGOCIO: doc('Empresa', 'page', 'Plano de negócio ou apresentação', 'Pode ser simples: o que faz, para quem e quanto custa.'),
  PORTFOLIO: doc('Empresa', 'page', 'Portfólio ou catálogo', 'Trabalhos, produtos ou histórico do grupo.'),
  CURRICULO: doc('Empresa', 'page', 'Currículo', 'Atualizado.'),
  REGISTRO_PROFISSIONAL: doc('Empresa', 'card', 'Registro no conselho profissional', 'Carteira do conselho (CREF, CREA, CRM...).'),
  CARTAS_RECOMENDACAO: doc('Empresa', 'page', 'Cartas de recomendação', 'Assinadas por quem recomenda.'),

  // ------------------------------------------------------------ veículo e transporte
  CRLV: doc('Veículo e transporte', 'page', 'Documento do veículo (CRLV)', 'CRLV do ano, físico ou digital.'),
  SEGURO_VEICULO: doc('Veículo e transporte', 'page', 'Seguro do veículo', 'Apólice dentro da validade.'),
  SEGURO_RESPONSABILIDADE: doc('Veículo e transporte', 'page', 'Seguro de responsabilidade civil', 'Apólice dentro da validade.'),
  VISTORIA_VEICULO: doc('Veículo e transporte', 'page', 'Laudo de vistoria do veículo', 'Vistoria dentro da validade.'),
  CREDENCIAL_CONDUTOR: doc('Veículo e transporte', 'card', 'Credencial de condutor', 'Credencial de taxista, mototaxista ou transporte escolar.'),
  NOTIFICACAO_AUTUACAO: doc('Veículo e transporte', 'page', 'Notificação da multa', 'A notificação de autuação recebida.'),

  // ------------------------------------------------------------ segurança e justiça
  BOLETIM_OCORRENCIA: doc('Segurança e justiça', 'page', 'Boletim de ocorrência', 'Todas as páginas.'),
  ANTECEDENTES_CRIMINAIS: doc('Segurança e justiça', 'page', 'Certidão de antecedentes criminais', 'Emitida no site da Polícia Federal ou do estado.'),
  PROCESSO_JUDICIAL: doc('Segurança e justiça', 'page', 'Documento do processo judicial', 'Decisão, ofício ou encaminhamento do juizado.'),
  PROVAS: doc('Segurança e justiça', 'scene', 'Provas (fotos ou prints)', 'Fotos, prints de mensagens ou outros registros.'),
  DECLARACAO_TESTEMUNHAS: doc('Segurança e justiça', 'page', 'Declaração de testemunhas', 'Assinada pelas testemunhas, com nome e CPF.'),

  // ------------------------------------------------------------ projetos e eventos
  PROPOSTA: doc('Projetos e eventos', 'page', 'Projeto ou proposta por escrito', 'O que vai ser feito, quando, onde e para quem.'),
  ORCAMENTO: doc('Projetos e eventos', 'page', 'Orçamento', 'Valores previstos, item por item.'),
  LISTA_PARTICIPANTES: doc('Projetos e eventos', 'page', 'Lista de participantes', 'Nome e documento de cada participante.'),
  ABAIXO_ASSINADO: doc('Projetos e eventos', 'page', 'Abaixo-assinado', 'Com nome, endereço e assinatura de cada pessoa.'),
  TERMO_RESPONSABILIDADE: doc('Projetos e eventos', 'page', 'Termo de responsabilidade assinado', 'O termo do serviço, assinado.'),

  // ------------------------------------------------------------ outros
  FOTOS_LOCAL: doc('Outros', 'scene', 'Fotos do local', 'Fotos que mostrem bem o lugar ou o problema.'),
  JUSTIFICATIVA: doc('Outros', 'page', 'Justificativa por escrito', 'Explique o motivo do pedido.'),
  DOCUMENTO_A_PROTOCOLAR: doc('Outros', 'page', 'Documento a ser protocolado', 'O documento que você quer entregar à Prefeitura.'),
  DOCUMENTOS_COMPLEMENTARES: doc('Outros', 'page', 'Documentos complementares', 'Outros documentos que ajudem a entender o pedido.'),
} as const satisfies Record<string, DocumentDefinition>;

export type DocumentCode = keyof typeof DOCUMENT_CATALOG;

export const DOCUMENT_CODES = Object.keys(DOCUMENT_CATALOG) as DocumentCode[];

/** Como o catálogo de serviços pede um documento: só o código, ou o código com detalhes */
export type RequiredDocumentRef =
  | DocumentCode
  | {
      code: DocumentCode;
      /** padrão: obrigatório */
      required?: boolean;
      /** de quem / qual ("do responsável", "categoria D ou E", "dos últimos 3 meses") */
      note?: string;
    };

/** Formato gravado em ServiceSimplified.requiredDocuments (o que portal, balcão e bot leem) */
export interface StoredRequiredDocument {
  code: DocumentCode;
  name: string;
  description: string;
  required: boolean;
  acceptedFormats: string[];
  allowCameraUpload: boolean;
  maxSizeMB: number;
}

export function isDocumentCode(value: unknown): value is DocumentCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(DOCUMENT_CATALOG, value);
}

export function documentDefinition(code: DocumentCode): DocumentDefinition {
  return DOCUMENT_CATALOG[code];
}

/** Converte o pedido do catálogo no objeto gravado no serviço */
export function expandRequiredDocument(ref: RequiredDocumentRef): StoredRequiredDocument {
  const item = typeof ref === 'string' ? { code: ref } : ref;
  const def = DOCUMENT_CATALOG[item.code];
  if (!def) throw new Error(`Documento fora do catálogo: ${String(item.code)}`);
  const note = item.note?.trim();
  const isScene = def.scan === 'scene';
  return {
    code: item.code,
    // "Documento de identidade (RG, CIN ou CNH) — do responsável"
    name: note ? `${def.name} — ${note}` : def.name,
    description: def.hint,
    required: item.required !== false,
    acceptedFormats: isScene ? ['jpg', 'jpeg', 'png'] : ['pdf', 'jpg', 'jpeg', 'png'],
    allowCameraUpload: true,
    maxSizeMB: isScene || def.scan === 'drawing' ? 10 : 5,
  };
}

export function expandRequiredDocuments(refs: readonly RequiredDocumentRef[] | null | undefined): StoredRequiredDocument[] | null {
  if (!refs) return null;
  return refs.map(expandRequiredDocument);
}
