import { describe, expect, it } from '@jest/globals';
import { findAppAction } from '../../src/config/app-catalog';
import { suggestAppActions } from '../../src/services/apps/app-intelligence.service';
import { PORTAL_REQUEST_ACTIONS } from '../../src/services/apps/portal-requests.service';
import { horariosSeChocam, mensagemDoHorario, modalidadeDoServico } from '../../src/services/apps-gerais/agenda-atendimentos.service';
import { concluiuOCurso, frequenciaDe } from '../../src/services/apps-gerais/cursos.service';
import { precisaDeEspaco, situacaoDaPermissao } from '../../src/services/apps-gerais/feiras.service';
import { novaValidadeConcessao, podeExumar } from '../../src/services/apps-gerais/cemiterio.service';
import { tipoDoInsumo } from '../../src/services/agricultura/pedido-insumo.service';

const top = (name: string, departmentCode: string) => suggestAppActions({ name, departmentCode })[0]?.appAction;

describe('apps gerais — para onde vão os serviços', () => {
  it('atendimento e orientação vão para a agenda, em qualquer secretaria', () => {
    expect(top('Agendamento na Sala do Empreendedor', 'DESENVOLVIMENTO_ECONOMICO')).toBe('AGENDAMENTO_ATENDIMENTO');
    expect(top('Atendimento CREAS', 'ASSISTENCIA_SOCIAL')).toBe('AGENDAMENTO_ATENDIMENTO');
    expect(top('Agendamento de Orientação Tributária', 'FINANCAS')).toBe('AGENDAMENTO_ATENDIMENTO');
    expect(top('Visita Domiciliar', 'ASSISTENCIA_SOCIAL')).toBe('AGENDA_VISITA_DOMICILIAR');
  });

  it('o que não é horário marcado não vai para a agenda', () => {
    expect(top('Agendamento de Férias', 'ADMINISTRACAO')).toBeUndefined();
    expect(top('Acompanhamento de Manifestação', 'ADMINISTRACAO')).toBeUndefined();
    expect(top('Autorização de Visita Pedagógica', 'EDUCACAO')).toBeUndefined();
    // a Saúde tem agenda própria
    expect(top('Agendamento de Consulta Médica', 'SAUDE')).toBe('AGENDAMENTO_CONSULTA');
    // app especializado vence o geral
    expect(top('Atendimento Psicológico', 'POLITICAS_MULHERES')).toBe('ACOMPANHAMENTO_SOCIAL');
    expect(top('Agendamento de Vistoria de Táxi', 'TRANSPORTES_TRANSITO')).toBe('VISTORIA_VEICULO');
  });

  it('cursos vão para Cursos e Capacitações; oficina cultural continua na Cultura', () => {
    expect(top('Curso de Informática para Mulheres', 'POLITICAS_MULHERES')).toBe('INSCRICAO_CURSO');
    expect(top('Curso de Compostagem', 'AGRICULTURA')).toBe('INSCRICAO_CURSO');
    expect(top('Oficina de Música', 'CULTURA')).toBe('INSCRICAO_OFICINA');
    expect(top('Oficina de Música', 'EDUCACAO')).toBeUndefined();
    expect(top('Certificado de Curso', 'TECNOLOGIA_INOVACAO')).toBeUndefined();
  });

  it('feiras, cemitério e insumos', () => {
    expect(top('Permissão de Box em Mercado Municipal', 'SERVICOS_PUBLICOS')).toBe('PERMISSAO_ESPACO_FEIRA');
    expect(top('Inscrição na Feira do Produtor', 'AGRICULTURA')).toBe('INSCRICAO_FEIRA');
    expect(top('Relocação de Ponto em Feira Livre', 'SERVICOS_PUBLICOS')).toBe('RELOCACAO_PONTO_FEIRA');
    expect(top('Limpeza de Feira Livre', 'SERVICOS_PUBLICOS')).not.toMatch(/FEIRA/);
    expect(top('Concessão de Sepultura', 'SERVICOS_PUBLICOS')).toBe('CONCESSAO_SEPULTURA');
    expect(top('Renovação de Concessão de Sepultura', 'SERVICOS_PUBLICOS')).toBe('RENOVACAO_CONCESSAO_SEPULTURA');
    expect(top('Solicitação de Exumação', 'SERVICOS_PUBLICOS')).toBe('EXUMACAO');
    expect(top('Distribuição de Calcário', 'AGRICULTURA')).toBe('DISTRIBUICAO_INSUMOS');
    expect(top('Distribuição de Enxames de Abelhas', 'AGRICULTURA')).not.toBe('DISTRIBUICAO_INSUMOS');
  });

  it('toda porta nova tem conversão do pedido', () => {
    for (const code of ['AGENDAMENTO_ATENDIMENTO', 'AGENDA_VISITA_DOMICILIAR', 'INSCRICAO_CURSO', 'PERMISSAO_ESPACO_FEIRA', 'INSCRICAO_FEIRA', 'RELOCACAO_PONTO_FEIRA',
      'CONCESSAO_SEPULTURA', 'RENOVACAO_CONCESSAO_SEPULTURA', 'TRANSFERENCIA_JAZIGO', 'EXUMACAO', 'SEPULTAMENTO', 'DISTRIBUICAO_INSUMOS']) {
      expect(findAppAction(code)).toBeDefined();
      expect(PORTAL_REQUEST_ACTIONS as readonly string[]).toContain(code);
    }
  });
});

describe('agenda de atendimentos', () => {
  it('como acontece, pelo nome do serviço', () => {
    expect(modalidadeDoServico('Visita Domiciliar')).toBe('DOMICILIAR');
    expect(modalidadeDoServico('Atendimento Domiciliar (Home Care)')).toBe('DOMICILIAR');
    expect(modalidadeDoServico('Consultoria Online')).toBe('ONLINE');
    expect(modalidadeDoServico('Agendamento de Visita ao Museu')).toBe('PRESENCIAL');
  });

  it('o mesmo servidor não atende duas pessoas ao mesmo tempo', () => {
    const as14 = new Date('2026-10-20T14:00:00-03:00');
    expect(horariosSeChocam({ inicio: as14, duracaoMin: 30 }, { inicio: new Date('2026-10-20T14:20:00-03:00'), duracaoMin: 30 })).toBe(true);
    expect(horariosSeChocam({ inicio: as14, duracaoMin: 30 }, { inicio: new Date('2026-10-20T14:30:00-03:00'), duracaoMin: 30 })).toBe(false);
  });

  it('mensagem ao cidadão no horário de Brasília', () => {
    const texto = mensagemDoHorario({ modalidade: 'PRESENCIAL', dataHora: new Date('2026-10-20T17:00:00Z'), local: 'Sala do Empreendedor', profissionalNome: 'Ana' });
    expect(texto).toContain('20/10/2026 às 14:00');
    expect(texto).toContain('Local: Sala do Empreendedor');
    expect(texto).toContain('Ana');
    expect(mensagemDoHorario({ modalidade: 'DOMICILIAR', dataHora: new Date('2026-10-20T17:00:00Z'), local: 'x' })).toContain('na sua casa');
  });
});

describe('cursos', () => {
  it('frequência e conclusão', () => {
    expect(frequenciaDe(15, 20)).toBe(75);
    expect(frequenciaDe(3, 0)).toBe(100);
    expect(concluiuOCurso(15, 20, 75)).toBe(true);
    expect(concluiuOCurso(14, 20, 75)).toBe(false);
  });
});

describe('feiras e mercados', () => {
  it('permissão vencida e quando precisa de espaço', () => {
    const agora = new Date('2026-10-09T12:00:00Z');
    expect(situacaoDaPermissao('ATIVA', new Date('2026-10-01'), agora)).toBe('VENCIDA');
    expect(situacaoDaPermissao('ATIVA', new Date('2027-10-01'), agora)).toBe('ATIVA');
    expect(situacaoDaPermissao('REVOGADA', new Date('2026-10-01'), agora)).toBe('REVOGADA');
    expect(precisaDeEspaco('INSCRICAO_FEIRA')).toBe(false);
    expect(precisaDeEspaco('PERMISSAO')).toBe(true);
  });
});

describe('cemitérios', () => {
  it('renovação soma a partir do fim atual, ou de hoje se já venceu', () => {
    const agora = new Date('2026-10-09T12:00:00Z');
    expect(novaValidadeConcessao(new Date('2028-01-01T12:00:00Z'), 5, agora).getUTCFullYear()).toBe(2033);
    expect(novaValidadeConcessao(new Date('2020-01-01T12:00:00Z'), 5, agora).getUTCFullYear()).toBe(2031);
  });

  it('exumação só depois do prazo mínimo', () => {
    const agora = new Date('2026-10-09T12:00:00Z');
    expect(podeExumar(new Date('2023-10-01T12:00:00Z'), agora)).toBe(true);
    expect(podeExumar(new Date('2024-10-01T12:00:00Z'), agora)).toBe(false);
  });
});

describe('insumos da agricultura', () => {
  it('tipo pelo nome do serviço', () => {
    expect(tipoDoInsumo('Distribuição de Calcário')).toBe('CALCARIO');
    expect(tipoDoInsumo('Distribuição de Adubo Orgânico')).toBe('ADUBO');
    expect(tipoDoInsumo('Programa de Distribuição de Mudas Frutíferas')).toBe('MUDA');
    expect(tipoDoInsumo('Programa de Distribuição de Sementes Milho')).toBe('SEMENTE');
  });
});
