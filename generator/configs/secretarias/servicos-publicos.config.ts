import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Serviços Públicos
 *
 * 9 módulos totais
 */
export const servicosPublicosConfig: SecretariaConfig = {
  id: 'servicos-publicos',
  name: 'Secretaria de Serviços Públicos',
  slug: 'servicos-publicos',
  departmentId: 'servicos-publicos',

  modules: [
    { id: 'limpeza', moduleType: 'LIMPEZA_URBANA' },
    { id: 'iluminacao', moduleType: 'ILUMINACAO_PUBLICA' },
    { id: 'coleta-especial', moduleType: 'COLETA_ESPECIAL' },
    { id: 'podas', moduleType: 'SOLICITACAO_PODA' },
    { id: 'capina', moduleType: 'SOLICITACAO_CAPINA' },
    { id: 'reparo-vias', moduleType: 'SOLICITACAO_REPARO_VIA' },
    { id: 'desobstrucao', moduleType: 'SOLICITACAO_DESOBSTRUCAO' },
    { id: 'gestao-equipes', moduleType: 'GESTAO_EQUIPES_SERVICOS' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_SERVICOS_PUBLICOS' }
  ]
};
