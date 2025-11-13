import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Assistência Social
 *
 * 9 módulos totais
 */
export const assistenciaSocialConfig: SecretariaConfig = {
  id: 'assistencia-social',
  name: 'Secretaria de Assistência Social',
  slug: 'assistencia-social',
  departmentId: 'assistencia-social',

  modules: [
    { id: 'cadastro-unico', moduleType: 'CADASTRO_UNICO' },
    { id: 'beneficios', moduleType: 'SOLICITACAO_BENEFICIO' },
    { id: 'entregas', moduleType: 'ENTREGA_EMERGENCIAL' },
    { id: 'oficinas', moduleType: 'INSCRICAO_GRUPO_OFICINA' },
    { id: 'visitas', moduleType: 'VISITAS_DOMICILIARES' },
    { id: 'programas', moduleType: 'INSCRICAO_PROGRAMA_SOCIAL' },
    { id: 'agendamentos', moduleType: 'AGENDAMENTO_ATENDIMENTO_SOCIAL' },
    { id: 'gestao-cras', moduleType: 'GESTAO_CRAS_CREAS' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_ASSISTENCIA_SOCIAL' }
  ]
};
