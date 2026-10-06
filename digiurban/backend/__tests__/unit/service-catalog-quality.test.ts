/**
 * Qualidade do catálogo de serviços (os ~400 que todo município recebe).
 * Serviço novo no catálogo precisa passar aqui.
 */

import { allServices, catalogKeyOf } from '../../src/catalog/services';

const services: any[] = allServices as any[];
const INFO = ['CONSULTA_PUBLICA', 'CONSULTA_AUTENTICADA'];
const SOCIAL = /ASSISTENCIA_SOCIAL|HABITACAO|POLITICAS_MULHERES|social|habita|benef|bolsa|aux[ií]lio|cesta|isen[cç]|tarifa social|cad[uú]nico|programa|aluguel|renda|vulner|bpc|loas/i;
const DEPARTMENTS = [
  'ADMINISTRACAO', 'AGRICULTURA', 'ASSISTENCIA_SOCIAL', 'CULTURA', 'DEFESA_CIVIL', 'DESENVOLVIMENTO_ECONOMICO', 'EDUCACAO',
  'ESPORTES', 'FINANCAS', 'HABITACAO', 'MEIO_AMBIENTE', 'MOBILIDADE_URBANA', 'OBRAS_PUBLICAS', 'PLANEJAMENTO_URBANO',
  'POLITICAS_MULHERES', 'SAUDE', 'SEGURANCA_PUBLICA', 'SERVICOS_PUBLICOS', 'TECNOLOGIA_INOVACAO', 'TRANSPORTES_TRANSITO', 'TURISMO',
];

const problems = (check: (service: any) => string | null) =>
  services.map((service) => {
    const problem = check(service);
    return problem ? `${service.departmentCode}/${service.name}: ${problem}` : null;
  }).filter(Boolean);

describe('catálogo de serviços — qualidade', () => {
  it('tem os serviços de todas as secretarias que o município recebe', () => {
    expect(services.length).toBeGreaterThanOrEqual(400);
    expect(new Set(services.map((service) => service.departmentCode))).toEqual(new Set(DEPARTMENTS));
  });

  it('chaves e nomes não se repetem', () => {
    const keys = services.map(catalogKeyOf);
    expect(new Set(keys).size).toBe(keys.length);
    const names = services.map((service) => service.name.toLowerCase().trim());
    expect(names.filter((name, index) => names.indexOf(name) !== index)).toEqual([]);
  });

  it('tipo e subtipo combinam; quem abre pedido tem prazo', () => {
    expect(problems((s) => {
      if (s.serviceType === 'COM_DADOS' && (INFO.includes(s.serviceSubtype) || s.serviceSubtype === 'CONSULTIVO')) return 'COM_DADOS com subtipo de consulta';
      if (s.serviceType === 'SEM_DADOS' && ['CAPTURA_COMPLETA', 'SOLICITACAO_SIMPLES'].includes(s.serviceSubtype)) return 'SEM_DADOS com subtipo de formulário';
      if (!INFO.includes(s.serviceSubtype) && !(s.estimatedDays > 0)) return 'abre pedido mas não tem prazo';
      return null;
    })).toEqual([]);
  });

  it('dados básicos de exibição', () => {
    expect(problems((s) => {
      if (!s.description || s.description.length < 15) return 'descrição curta';
      if (!s.category) return 'sem categoria';
      if (!s.icon) return 'sem ícone';
      if (!/^#[0-9a-fA-F]{6}$/.test(s.color || '')) return 'cor inválida';
      if (!(s.priority >= 1 && s.priority <= 5)) return 'prioridade fora de 1 a 5';
      const docs = Array.isArray(s.requiredDocuments) ? s.requiredDocuments : [];
      if (s.requiresDocuments && docs.length === 0) return 'pede documento sem dizer qual';
      if (s.allowMultipleActiveProtocols === false && !s.uniquenessScope) return 'regra de um pedido por vez sem escopo';
      return null;
    })).toEqual([]);
  });

  it('formulário consistente', () => {
    expect(problems((s) => {
      if (s.serviceType !== 'COM_DADOS') return null;
      const props = s.formSchema?.properties || {};
      if (Object.keys(props).length === 0) return 'serviço com formulário sem campos';
      for (const field of s.formSchema.required || []) if (!props[field]) return `obrigatório "${field}" não existe`;
      for (const [id, prop] of Object.entries<any>(props)) {
        if (!prop.title || !prop.type) return `campo "${id}" sem título ou tipo`;
        if (prop.enum && (!Array.isArray(prop.enum) || prop.enum.length < 2)) return `campo "${id}" com lista vazia`;
        if (id.startsWith('citizen_')) return `campo "${id}" do cadastro dentro do formulário`;
      }
      return null;
    })).toEqual([]);
  });

  it('só pede renda, estado civil e profissão quando o serviço precisa (LGPD)', () => {
    expect(problems((s) => {
      const fields: string[] = s.formSchema?.citizenFields || [];
      const sensitive = fields.filter((field) => ['citizen_familyincome', 'citizen_maritalstatus', 'citizen_occupation'].includes(field));
      return sensitive.length && !SOCIAL.test(`${s.name} ${s.category} ${s.departmentCode}`) ? `pede ${sensitive.join(', ')}` : null;
    })).toEqual([]);
  });

  it('pedido de emergência mostra o telefone para ligar na hora', () => {
    expect(problems((s) =>
      /ambul[aâ]ncia|\bsos\b|alerta de emerg|sirene|acolhimento imediato/i.test(s.name) && !/\b(19[0-9]|180)\b/.test(s.description) ? 'sem telefone de emergência' : null
    )).toEqual([]);
  });
});
