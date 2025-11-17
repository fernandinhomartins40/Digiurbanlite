import { SecretariaConfig } from '../../schemas/secretaria.schema';

/**
 * Configuração da Secretaria de Educação
 *
 * 10 módulos totais
 */
export const educacaoConfig: SecretariaConfig = {
  id: 'educacao',
  name: 'Secretaria de Educação',
  slug: 'educacao',
  departmentId: 'educacao',

  modules: [
    { id: 'matriculas', moduleType: 'MATRICULA_ALUNO' },
    { id: 'transporte', moduleType: 'TRANSPORTE_ESCOLAR' },
    { id: 'ocorrencias', moduleType: 'REGISTRO_OCORRENCIA_ESCOLAR' },
    { id: 'documentos', moduleType: 'SOLICITACAO_DOCUMENTO_ESCOLAR' },
    { id: 'transferencias', moduleType: 'TRANSFERENCIA_ESCOLAR' },
    { id: 'frequencia', moduleType: 'CONSULTA_FREQUENCIA' },
    { id: 'notas', moduleType: 'CONSULTA_NOTAS' },
    { id: 'gestao-escolar', moduleType: 'GESTAO_ESCOLAR' },
    { id: 'merenda', moduleType: 'GESTAO_MERENDA' },
    { id: 'servicos', moduleType: 'ATENDIMENTOS_EDUCACAO' }
  ]
};
