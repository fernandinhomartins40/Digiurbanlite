/**
 * Padroniza a lista de documentos de um serviço já gravado:
 *  - item com `code` do catálogo único: fica como está;
 *  - nome antigo conhecido ("RG e CPF", "Comprovante de Endereço"...) ou o próprio
 *    nome padrão: vira o documento padrão (nome, dica, formatos);
 *  - nome que o município inventou e não está na tabela: fica como está.
 * Regra pura (sem banco) — usada pela rotina de subida e pelo cadastro do serviço.
 */

import {
  DOCUMENT_CATALOG,
  DOCUMENT_CODES,
  DocumentCode,
  RequiredDocumentRef,
  StoredRequiredDocument,
  expandRequiredDocument,
  isDocumentCode,
} from '../../shared/constants/required-documents';
import { LEGACY_DOCUMENT_NAMES } from './legacy-names';

const key = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const LOOKUP = new Map<string, RequiredDocumentRef[]>();
for (const [name, refs] of Object.entries(LEGACY_DOCUMENT_NAMES)) LOOKUP.set(key(name), refs);
// o nome padrão também é reconhecido ("Comprovante de residência")
for (const code of DOCUMENT_CODES) LOOKUP.set(key(DOCUMENT_CATALOG[code].name), [code]);

/** Documento(s) padrão para um nome; null = nome desconhecido */
export function resolveDocumentName(name: string): RequiredDocumentRef[] | null {
  return LOOKUP.get(key(name)) ?? null;
}

type AnyDocument = string | (Record<string, any> & { name?: string; code?: string; required?: boolean });

export function normalizeRequiredDocumentList(raw: unknown): { documents: AnyDocument[]; changed: boolean } {
  let list: unknown = raw;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return { documents: [], changed: false };
    }
  }
  if (!Array.isArray(list)) return { documents: [], changed: false };

  const out: AnyDocument[] = [];
  const byCode = new Map<DocumentCode, StoredRequiredDocument>();
  let changed = false;

  const pushStandard = (doc: StoredRequiredDocument) => {
    const existing = byCode.get(doc.code);
    if (existing) {
      // o mesmo documento duas vezes ("RG" e "RG e CPF"): fica um
      if (doc.required) existing.required = true;
      changed = true;
      return;
    }
    byCode.set(doc.code, doc);
    out.push(doc);
  };

  for (const item of list as AnyDocument[]) {
    if (item && typeof item === 'object' && isDocumentCode(item.code)) {
      pushStandard(item as StoredRequiredDocument);
      continue;
    }
    const name = typeof item === 'string' ? item : String(item?.name || '');
    const refs = name ? resolveDocumentName(name) : null;
    if (!refs) {
      out.push(item);
      continue;
    }
    changed = true;
    for (const ref of refs) {
      const doc = expandRequiredDocument(ref);
      // item já gravado como objeto: vale o "obrigatório" que o município marcou
      if (item && typeof item === 'object' && typeof item.required === 'boolean') doc.required = item.required;
      pushStandard(doc);
    }
  }

  return { documents: out, changed };
}
