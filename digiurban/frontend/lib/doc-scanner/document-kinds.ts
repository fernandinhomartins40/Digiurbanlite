/**
 * Como a câmera trata cada documento pedido, a partir do NOME que o serviço deu
 * a ele ("RG", "Comprovante de Residência", "Fotos do Local"...):
 *  - quantos lados fotografar (frente e verso) ou se aceita várias páginas;
 *  - a forma da moldura (cartão, folha A4, carteira, foto 3x4, carnê, cena livre);
 *  - uma dica curta para cada passo.
 *
 * Documento com código do catálogo único (shared/constants/required-documents.ts)
 * usa o jeito de fotografar do catálogo (`docKindFor`); o nome só é usado para
 * documento próprio do município e para as telas que ainda passam só o nome.
 *
 * Regra pura (sem tela), para poder conferir com a lista do catálogo.
 */

import { DOCUMENT_CATALOG, DocumentScanProfile, isDocumentCode } from '@/shared/constants/required-documents';

export type DocShape = 'card' | 'page' | 'booklet' | 'photo' | 'slip' | 'scene';

export interface DocKindInfo {
  /** código para conferência e testes */
  key: string;
  /** passos fixos: ["Frente", "Verso"] ou ["Documento"] */
  sides: string[];
  /** dica de cada passo fixo (mesma posição de `sides`) */
  hints: string[];
  /** o último lado pode ser pulado ("RG ou CPF": o CPF não tem verso útil) */
  backOptional: boolean;
  /** depois do último passo fixo, a pessoa pode acrescentar mais páginas */
  multiPage: boolean;
  maxPages: number;
  /** largura/altura da moldura */
  aspect: number;
  shape: DocShape;
  /** clarear o papel (não serve para foto de rosto nem foto de lugar) */
  enhance: boolean;
}

export const normalizeDocName = (value: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // "(se aplicável)", "(opcional)", "(se houver)" não mudam o documento
    .replace(/\((?:se |opcional|caso )[^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ID_CARD = 1.586; // CIN, CPF, CNH, cartão SUS (padrão ID-1)
const A4 = 1 / 1.414;

const base = (key: string, shape: DocShape, aspect: number, extra: Partial<DocKindInfo> = {}): DocKindInfo => ({
  key,
  sides: ['Documento'],
  hints: [''],
  backOptional: false,
  multiPage: false,
  maxPages: 1,
  aspect,
  shape,
  enhance: shape !== 'photo' && shape !== 'scene',
  ...extra,
});

const pages = (key: string, aspect = A4, shape: DocShape = 'page', maxPages = 10) =>
  base(key, shape, aspect, { sides: ['Página 1'], hints: ['Mostre a folha inteira.'], multiPage: true, maxPages });

const ID_SIDES = { sides: ['Frente', 'Verso'], hints: ['O lado com a foto.', 'Agora vire: o lado de trás, com os números.'] };

/** Pelo jeito de fotografar do catálogo único (documento com código) */
export function docKindFromProfile(profile: DocumentScanProfile, documentName = ''): DocKindInfo {
  const name = normalizeDocName(documentName);
  switch (profile) {
    case 'id-card':
      // "— criança sem RG: certidão de nascimento", "— idoso...": pode não ter verso
      return base('id-card', 'card', ID_CARD, { ...ID_SIDES, backOptional: /certidao|\bcpf\b|idoso/.test(name) });
    case 'card':
      return base('card', 'card', ID_CARD, { hints: ['O lado com o número.'] });
    case 'photo-3x4':
      return base('photo-3x4', 'photo', 3 / 4, { hints: ['Fotografe a foto 3x4 bem de perto, sem reflexo.'] });
    case 'scene':
      return base('scene', 'scene', 4 / 3, { sides: ['Foto 1'], hints: ['Mostre bem o que precisa ser visto.'], multiPage: true, maxPages: 6 });
    case 'booklet':
      return pages('booklet', 0.7, 'booklet', 8);
    case 'slip':
      return pages('slip', 2.2, 'slip', 6);
    case 'drawing':
      return pages('drawing', 1.414, 'page', 10);
    default:
      return pages('page');
  }
}

/** Documento do serviço: pelo código quando tem; documento próprio do município, pelo nome */
export function docKindFor(document: { code?: string | null; name: string }): DocKindInfo {
  if (isDocumentCode(document.code)) return docKindFromProfile(DOCUMENT_CATALOG[document.code].scan, document.name);
  return docKindFromName(document.name);
}

export function docKindFromName(documentName: string): DocKindInfo {
  const name = normalizeDocName(documentName);
  const has = (re: RegExp) => re.test(name);

  // fotos de lugar ou de coisa: sem moldura, a imagem inteira, várias fotos
  if (has(/\bfotos?\b/) && !has(/3x4|rosto|recente/)) {
    return base('scene', 'scene', 4 / 3, {
      sides: ['Foto 1'],
      hints: ['Mostre bem o que precisa ser visto.'],
      multiPage: true,
      maxPages: 6,
    });
  }
  if (has(/3x4|foto recente|foto do rosto/)) {
    return base('photo-3x4', 'photo', 3 / 4, { hints: ['Fotografe a foto 3x4 bem de perto, sem reflexo.'] });
  }

  // o próprio nome já diz qual lado ("RG — frente", "rg_verso")
  const oneSide = has(/\bfrente\b|\bverso\b/);
  const idCard = has(/\brg\b|identidade|\bcin\b|habilitacao|\bcnh\b|\brne\b|\bcrnm\b|documentos? pessoa|documentos? (?:dos|do) (?:menor|integrante|socio|filho|atleta)/);

  if (idCard) {
    if (oneSide) {
      return base('id-card-side', 'card', ID_CARD, { hints: [has(/verso/) ? 'O lado de trás do documento.' : 'O lado com a foto.'] });
    }
    // "RG ou CPF", "Documentos pessoais": se mandar só o CPF, não tem verso
    const alternatives = has(/\bou (?:cpf|certidao|documento|cnpj)/) || has(/documentos? pessoa/);
    return base('id-card', 'card', ID_CARD, {
      sides: ['Frente', 'Verso'],
      hints: ['O lado com a foto.', 'Agora vire: o lado de trás, com os números.'],
      backOptional: alternatives,
    });
  }

  if (has(/carteira de trabalho|\bctps\b/)) return pages('work-booklet', 0.7, 'booklet', 8);
  if (has(/cartao de vacina|caderneta/)) return pages('vaccine-booklet', 0.7, 'booklet', 8);

  if (has(/\bcpf\b|cartao (?:do )?sus|\bsus\b|cartao nacional de saude|cartao|credencial/)) {
    return base('card', 'card', ID_CARD, { hints: ['O lado com o número.'] });
  }
  if (has(/titulo de eleitor/) && !has(/\bou\b/)) {
    return base('voter-card', 'card', 1.45, { hints: ['O lado com o número do título.'] });
  }

  // carnê do IPTU, boleto: tira comprida deitada
  if (has(/carne|\bboleto\b/)) return pages('slip', 2.2, 'slip', 6);

  // plantas e projetos costumam ser folhas grandes deitadas
  // ("Projeto do Evento", "Projeto Detalhado" são texto: folha em pé)
  if (has(/\bplanta\b|projeto (?:arquitetonico|hidraulico|aprovado|de demolicao|estrutural|eletrico)|levantamento topografico|croqui/)) {
    return pages('drawing', 1.414, 'page', 10);
  }

  return pages('page');
}
