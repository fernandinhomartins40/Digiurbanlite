/**
 * Documentos pedidos pelos serviços: um catálogo só, sem variação de nome.
 * Serviço do catálogo só pede documento por código (o TypeScript já recusa
 * nome solto); aqui confere o que é gravado e a padronização do que já existe.
 */

import { allServices, catalogFields } from '../../src/catalog/services';
import { LEGACY_DOCUMENT_NAMES } from '../../src/catalog/documents/legacy-names';
import { normalizeRequiredDocumentList, resolveDocumentName } from '../../src/catalog/documents/normalize';
import {
  DOCUMENT_CATALOG,
  DOCUMENT_CODES,
  expandRequiredDocument,
  isDocumentCode,
} from '../../src/shared/constants/required-documents';

const services: any[] = allServices as any[];

describe('documentos pedidos pelos serviços', () => {
  it('o catálogo de serviços só pede documentos do catálogo único', () => {
    const wrong: string[] = [];
    for (const service of services) {
      for (const ref of service.requiredDocuments || []) {
        const code = typeof ref === 'string' ? ref : ref?.code;
        if (!isDocumentCode(code)) wrong.push(`${service.name}: ${JSON.stringify(ref)}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('o nome gravado é sempre o nome padrão (com o detalhe depois do travessão)', () => {
    const wrong: string[] = [];
    for (const service of services) {
      for (const doc of (catalogFields(service).requiredDocuments as any[]) || []) {
        const base = DOCUMENT_CATALOG[doc.code as keyof typeof DOCUMENT_CATALOG].name;
        if (doc.name !== base && !doc.name.startsWith(`${base} — `)) wrong.push(`${service.name}: ${doc.name}`);
        if (!doc.description || !doc.acceptedFormats?.length) wrong.push(`${service.name}: ${doc.code} sem dica ou formato`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('o mesmo documento não aparece duas vezes no mesmo serviço', () => {
    const repeated = services
      .filter((service) => {
        const codes = (service.requiredDocuments || []).map((ref: any) => (typeof ref === 'string' ? ref : ref.code));
        return new Set(codes).size !== codes.length;
      })
      .map((service) => service.name);
    expect(repeated).toEqual([]);
  });

  it('o detalhe não repete o que já está no nome nem diz "opcional" (isso é required: false)', () => {
    const wrong: string[] = [];
    for (const service of services) {
      for (const ref of service.requiredDocuments || []) {
        if (typeof ref === 'string' || !ref.note) continue;
        if (/opcional|se aplic|se houver/i.test(ref.note)) wrong.push(`${service.name}: ${ref.note}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('todo documento do catálogo tem nome, dica e jeito de fotografar', () => {
    for (const code of DOCUMENT_CODES) {
      const def = DOCUMENT_CATALOG[code];
      expect(def.name.length).toBeGreaterThan(2);
      expect(def.hint.length).toBeGreaterThan(5);
      expect(def.scan).toBeTruthy();
    }
    const names = DOCUMENT_CODES.map((code) => DOCUMENT_CATALOG[code].name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it('a tabela de nomes antigos só aponta para documentos que existem', () => {
    for (const refs of Object.values(LEGACY_DOCUMENT_NAMES)) {
      for (const ref of refs) expect(isDocumentCode(typeof ref === 'string' ? ref : ref.code)).toBe(true);
    }
  });

  describe('padronização do que já está gravado', () => {
    it('nomes antigos viram o documento padrão, sem repetir', () => {
      const { documents, changed } = normalizeRequiredDocumentList(['RG', 'RG e CPF', 'CPF', 'Comprovante de Endereço (se aplicável)']);
      expect(changed).toBe(true);
      expect(documents.map((doc: any) => doc.code)).toEqual(['IDENTIDADE', 'CPF']);
      expect((documents[0] as any).name).toBe(DOCUMENT_CATALOG.IDENTIDADE.name);
    });

    it('acentos, maiúsculas e o próprio nome padrão são reconhecidos', () => {
      expect(resolveDocumentName('comprovante de residencia')).toEqual(['COMPROVANTE_RESIDENCIA']);
      expect(resolveDocumentName('Comprovante de residência')).toEqual(['COMPROVANTE_RESIDENCIA']);
      expect(resolveDocumentName('Documento que só este município pede')).toBeNull();
    });

    it('documento inventado pelo município fica como está', () => {
      const custom = { name: 'Declaração da associação de moradores', required: true };
      const { documents } = normalizeRequiredDocumentList([custom, 'CPF']);
      expect(documents[0]).toBe(custom);
      expect((documents[1] as any).code).toBe('CPF');
    });

    it('mantém o "obrigatório" que o município marcou', () => {
      const { documents } = normalizeRequiredDocumentList([{ name: 'RG', required: false }]);
      expect((documents[0] as any).required).toBe(false);
    });

    it('rodar de novo não muda nada', () => {
      const first = normalizeRequiredDocumentList(['RG', 'Fotos do Local', 'Laudo especial do município']).documents;
      const second = normalizeRequiredDocumentList(first);
      expect(second.changed).toBe(false);
      expect(second.documents).toEqual(first);
    });

    it('lê a lista gravada como texto JSON', () => {
      const { documents } = normalizeRequiredDocumentList(JSON.stringify(['CPF']));
      expect((documents[0] as any).code).toBe('CPF');
    });
  });

  it('fotos do local aceitam só imagem e podem ser maiores', () => {
    const doc = expandRequiredDocument('FOTOS_LOCAL');
    expect(doc.acceptedFormats).toEqual(['jpg', 'jpeg', 'png']);
    expect(doc.maxSizeMB).toBe(10);
  });
});
