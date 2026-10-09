import { describe, expect, it } from '@jest/globals';
import { allAppActionCodes } from '../../src/config/app-catalog';
import { APP_FIELD_CONTRACTS } from '../../src/config/app-field-contracts';
import { allServices, catalogRouteOf } from '../../src/catalog/services';
import { checkAppFields, mapFormToApp, suggestAppActions, withAppFields } from '../../src/services/apps/app-intelligence.service';

/** Formulário como a tela de criar serviço grava (campos `campo_<número>` + título) */
const manualForm = (fields: Array<[string, string, string?]>) => ({
  type: 'object',
  properties: Object.fromEntries(fields.map(([id, title, type]) => [id, { title, type: type || 'string', ...(type === 'date' ? { type: 'string', format: 'date' } : {}) }])),
});

describe('contratos de campos', () => {
  it('toda porta de app tem contrato, e todo contrato é de uma porta que existe', () => {
    const actions = allAppActionCodes();
    expect(actions.filter((code) => !APP_FIELD_CONTRACTS[code])).toEqual([]);
    expect(Object.keys(APP_FIELD_CONTRACTS).filter((code) => !actions.includes(code))).toEqual([]);
  });

  it('todo serviço do catálogo que vai para app manda os dados obrigatórios do app', () => {
    const faltando = allServices
      .map((def) => ({ def, route: catalogRouteOf(def) }))
      .filter(({ route }) => route.destination === 'APP' && route.appAction)
      .map(({ def, route }) => ({ nome: def.name, falta: checkAppFields(route.appAction!, def.formSchema)!.missingRequired }))
      .filter((item) => item.falta.length);
    expect(faltando).toEqual([]);
  });
});

describe('leitura do formulário pelo título do campo', () => {
  it('serviço criado à mão: "Nome da criança" e "Data de nascimento" viram dados da matrícula', () => {
    const form = manualForm([
      ['campo_1', 'Nome da criança'],
      ['campo_2', 'Data de nascimento', 'date'],
      ['campo_3', 'Série que vai cursar'],
      ['campo_4', 'Escola de preferência'],
      ['campo_5', 'Cor preferida da mochila'],
    ]);
    const data = withAppFields('MATRICULA_ESCOLAR', form, { campo_1: 'Ana Souza', campo_2: '2019-05-01', campo_3: '2º Ano', campo_4: 'EM Centro', campo_5: 'Azul' });
    expect(data).toMatchObject({ nomeAluno: 'Ana Souza', dataNascimentoAluno: '2019-05-01', serie: '2º Ano', escolaPreferencial: 'EM Centro' });
    expect(data.observacoes).toBe('Outros dados: Cor preferida da mochila: Azul');
    expect(data.campo_1).toBe('Ana Souza'); // o original continua
  });

  it('sugestão com nomes em snake_case chega à mecanização', () => {
    const form = manualForm([
      ['tipo_maquina', 'Tipo de Máquina/Implemento'],
      ['area_trabalhar', 'Área a Trabalhar (hectares)', 'number'],
      ['data_preferencial', 'Data Preferencial de Uso', 'date'],
    ]);
    const data = withAppFields('SOLICITACAO_MAQUINAS', form, { tipo_maquina: 'Trator', area_trabalhar: 3, data_preferencial: '2026-11-10' });
    expect(data).toMatchObject({ tipoMaquina: 'Trator', areaTrabalho: 3, dataDesejada: '2026-11-10' });
  });

  it('cada campo vai para um dado só, e o encaixe mais específico vence', () => {
    const form = manualForm([
      ['campo_a', 'Cidade de destino'],
      ['campo_b', 'Hospital de destino'],
    ]);
    const roles = mapFormToApp(APP_FIELD_CONTRACTS.ENCAMINHAMENTOS_TFD, form);
    expect(roles.find((r) => r.role.key === 'cidadeDestino')?.field?.id).toBe('campo_a');
    expect(roles.find((r) => r.role.key === 'hospitalDestino')?.field?.id).toBe('campo_b');
  });

  it('a ligação feita no assistente (x-app-field) vale mais que o título', () => {
    const form = { properties: { campo_x: { title: 'Informe aqui', type: 'string', 'x-app-field': 'medicamento' } } };
    expect(withAppFields('CONTROLE_MEDICAMENTOS', form, { campo_x: 'Losartana' }).medicamento).toBe('Losartana');
  });

  it('campo de sim/não não vira texto, e data não pega lista de opções', () => {
    const form = { properties: { campo_1: { title: 'Data', type: 'string', enum: ['Manhã', 'Tarde'] }, campo_2: { title: 'Acompanhante', type: 'string' } } };
    const roles = mapFormToApp(APP_FIELD_CONTRACTS.ENCAMINHAMENTOS_TFD, form);
    expect(roles.find((r) => r.role.key === 'dataConsulta')?.field).toBeUndefined();
    expect(roles.find((r) => r.role.key === 'acompanhante')?.field).toBeUndefined();
  });

  it('o que o formulário não tem vem do nome do serviço e do perfil do cidadão', () => {
    const data = withAppFields('INSCRICAO_OFICINA', { properties: {} }, {}, {
      serviceName: 'Oficina de Violão',
      citizen: { name: 'João', phone: '44999990000' },
    });
    expect(data).toMatchObject({ oficina: 'Oficina de Violão', telefone: '44999990000' });

    const abrigo = withAppFields('SOLICITACAO_ABRIGO', { properties: {} }, {}, {
      citizen: { address: { logradouro: 'Rua A', numero: '10', bairro: 'Centro' } },
    });
    expect(abrigo).toMatchObject({ endereco: 'Rua A, 10', bairro: 'Centro' });
  });

  it('endereço da casa NÃO entra onde o local é outro (ordem de serviço)', () => {
    const data = withAppFields('ILUMINACAO_PUBLICA', { properties: {} }, {}, { citizen: { address: { logradouro: 'Rua A', numero: '10' } } });
    expect(data.endereco).toBeUndefined();
  });
});

describe('sugestão de app pelo nome do serviço', () => {
  const top = (name: string, departmentCode?: string) => suggestAppActions({ name, departmentCode })[0];

  it('acerta o app em nomes comuns', () => {
    expect(top('Empréstimo de Máquinas Agrícolas', 'AGRICULTURA')).toMatchObject({ appAction: 'SOLICITACAO_MAQUINAS', confident: true });
    expect(top('Vaga em Creche', 'EDUCACAO')?.appAction).toBe('MATRICULA_ESCOLAR');
    expect(top('Troca de lâmpada de poste', 'SERVICOS_PUBLICOS')?.appAction).toBe('ILUMINACAO_PUBLICA');
    expect(top('Pedido de Cesta Básica', 'ASSISTENCIA_SOCIAL')?.appAction).toBe('CESTA_BASICA');
  });

  it('documento, consulta e reclamação ficam na fila do protocolo', () => {
    expect(top('Declaração de Matrícula', 'EDUCACAO')).toBeUndefined();
    expect(top('Certidão de Produtor Rural', 'AGRICULTURA')).toBeUndefined();
    expect(top('Segunda Via de Licença Ambiental', 'MEIO_AMBIENTE')).toBeUndefined();
    expect(top('Reclamação sobre Transporte Escolar', 'EDUCACAO')).toBeUndefined();
  });

  it('palavras que afastam a porta', () => {
    expect(top('Trancamento de Matrícula', 'EDUCACAO')).toBeUndefined();
    expect(top('Cadastro para Alertas SMS', 'DEFESA_CIVIL')).toBeUndefined();
  });

  it('só sugere app da secretaria do serviço', () => {
    expect(top('Oficina de Música', 'EDUCACAO')).toBeUndefined();
    expect(top('Oficina de Música', 'CULTURA')?.appAction).toBe('INSCRICAO_OFICINA');
  });
});

describe('conferência no assistente', () => {
  it('mostra o que falta e entrega o campo pronto, já ligado ao app', () => {
    const check = checkAppFields('TRANSPORTE_ESCOLAR', manualForm([['campo_1', 'Escola'], ['campo_2', 'Endereço de embarque']]))!;
    expect(check.missingRequired).toEqual(['Nome do aluno']);
    expect(check.fieldsToAdd.nomeAluno).toMatchObject({ title: 'Nome do aluno', type: 'string', 'x-app-field': 'nomeAluno' });
    expect(check.fieldsToAdd.unidadeEscolar).toBeUndefined();
  });

  it('o que vem do perfil não é pedido de novo', () => {
    const check = checkAppFields('ISENCAO_IDOSO', { properties: {} })!;
    expect(check.missingRequired).toEqual([]);
    expect(check.fieldsToAdd.dataNascimento).toBeUndefined();
    expect(check.roles.find((role) => role.key === 'dataNascimento')?.source).toBe('perfil');
  });
});
