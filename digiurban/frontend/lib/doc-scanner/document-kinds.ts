/**
 * Formato de cada documento na câmera: quantos lados fotografar e a forma da
 * moldura quando a câmera não acha o documento sozinha.
 */

export interface DocKindInfo {
  /** passos: ["Frente", "Verso"] ou ["Documento"] */
  sides: string[];
  /** largura/altura da moldura fixa */
  aspect: number;
  shape: 'card' | 'page';
}

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export function docKindFromName(documentName: string): DocKindInfo {
  const name = normalize(documentName || '');
  const oneSide = /frente|verso/.test(name);
  const card = (sides: string[]): DocKindInfo => ({ sides: oneSide ? ['Documento'] : sides, aspect: 1.586, shape: 'card' });

  if (/\brg\b|identidade|\bcin\b|habilitacao|\bcnh\b/.test(name)) return card(['Frente', 'Verso']);
  if (/\bcpf\b|\bsus\b|cartao|titulo|eleitor/.test(name)) return card(['Documento']);
  if (/carteira de trabalho|ctps/.test(name)) return { sides: ['Documento'], aspect: 0.72, shape: 'page' };
  return { sides: ['Documento'], aspect: 1 / 1.414, shape: 'page' };
}
