import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Habitação
 *
 * 6 módulos totais
 */
export const habitacaoConfig: SecretariaConfig = {
  id: 'habitacao',
  name: 'Secretaria de Habitação',
  slug: 'habitacao',
  departmentId: 'habitacao',

  modules: [
    { id: 'programas', moduleType: 'INSCRICAO_PROGRAMA_HABITACIONAL' },
    { id: 'regularizacao', moduleType: 'REGULARIZACAO_FUNDIARIA' },
    { id: 'auxilio-aluguel', moduleType: 'SOLICITACAO_AUXILIO_ALUGUEL' },
    { id: 'unidades', moduleType: 'CADASTRO_UNIDADE_HABITACIONAL' },
    { id: 'fila', moduleType: 'INSCRICAO_FILA_HABITACAO' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_HABITACAO' }
  ]
};
