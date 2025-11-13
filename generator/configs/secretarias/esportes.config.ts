import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Esportes
 *
 * 8 módulos totais
 */
export const esportesConfig: SecretariaConfig = {
  id: 'esportes',
  name: 'Secretaria de Esportes',
  slug: 'esportes',
  departmentId: 'esportes',

  modules: [
    { id: 'escolinhas', moduleType: 'INSCRICAO_ESCOLINHA' },
    { id: 'atletas', moduleType: 'CADASTRO_ATLETA' },
    { id: 'espacos', moduleType: 'RESERVA_ESPACO_ESPORTIVO' },
    { id: 'competicoes', moduleType: 'INSCRICAO_COMPETICAO' },
    { id: 'equipes', moduleType: 'CADASTRO_EQUIPE_ESPORTIVA' },
    { id: 'torneios', moduleType: 'INSCRICAO_TORNEIO' },
    { id: 'modalidades', moduleType: 'CADASTRO_MODALIDADE' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_ESPORTES' }
  ]
};
