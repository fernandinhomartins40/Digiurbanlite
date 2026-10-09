import { describe, expect, it } from '@jest/globals';
import { mesmoDia, valorDoServico } from '../../src/services/agricultura/mecanizacao.service';
import { nivelEscolaridade, notaDoCandidato, palavras } from '../../src/services/emprego/emprego.service';
import { ordenarPorUrgencia, semDenunciante } from '../../src/services/seguranca/seguranca.service';
import { situacaoDoCadastro, validadeAPartirDe } from '../../src/services/turismo/turismo.service';

describe('mecanização agrícola', () => {
  it('mesmo dia é o dia de Brasília (não o do relógio do servidor)', () => {
    // 22h de Brasília = 01h UTC do dia seguinte
    expect(mesmoDia(new Date('2026-10-13T08:00:00-03:00'), new Date('2026-10-13T22:00:00-03:00'))).toBe(true);
    expect(mesmoDia(new Date('2026-10-13T22:00:00-03:00'), new Date('2026-10-14T08:00:00-03:00'))).toBe(false);
  });

  it('valor = horas × valor da hora; sem cobrança dá zero', () => {
    expect(valorDoServico(3.5, 120)).toBe(420);
    expect(valorDoServico(2, 99.99)).toBe(199.98);
    expect(valorDoServico(4, null)).toBe(0);
    expect(valorDoServico(0, 120)).toBe(0);
  });
});

describe('balcão de empregos — sugestão de candidatos', () => {
  const vaga = { titulo: 'Auxiliar de Cozinha', area: 'Alimentação', descricao: 'Preparo de refeições em restaurante', escolaridadeMinima: 'Fundamental Completo' };

  it('palavras úteis ignoram acento, caixa e enchimento', () => {
    expect(palavras('Experiência em COZINHA e para Atendimento')).toEqual(['cozinha', 'atendimento']);
  });

  it('escada da escolaridade', () => {
    expect(nivelEscolaridade('Médio Completo')).toBeGreaterThan(nivelEscolaridade('Fundamental Completo'));
    expect(nivelEscolaridade('')).toBe(-1);
  });

  it('quem quer a área e tem experiência fica na frente', () => {
    const forte = notaDoCandidato(vaga, { areaInteresse: 'cozinha', experiencia: 'Trabalhei 2 anos em restaurante', escolaridade: 'Médio Completo', disponibilidade: true });
    const fraco = notaDoCandidato(vaga, { areaInteresse: 'construção civil', experiencia: 'Servente de pedreiro', escolaridade: 'Médio Completo', disponibilidade: true });
    expect(forte.nota).toBeGreaterThan(fraco.nota);
    expect(forte.motivos.join(' ')).toMatch(/cozinha/);
  });

  it('escolaridade abaixo da pedida zera a nota', () => {
    const resultado = notaDoCandidato(vaga, { areaInteresse: 'cozinha', escolaridade: 'Fundamental Incompleto' });
    expect(resultado.nota).toBe(0);
    expect(resultado.motivos).toEqual(['Escolaridade abaixo da pedida']);
  });

  it('escolaridade não informada não elimina ninguém', () => {
    expect(notaDoCandidato(vaga, { areaInteresse: 'cozinha' }).nota).toBeGreaterThan(0);
  });

  it('a nota nunca passa de 100', () => {
    const tudo = notaDoCandidato(
      { ...vaga, pcd: true },
      { areaInteresse: 'cozinha alimentação', experiencia: 'restaurante refeições preparo auxiliar', habilidades: 'cozinha', escolaridade: 'Superior Completo', disponibilidade: true, pcd: true }
    );
    expect(tudo.nota).toBeLessThanOrEqual(100);
  });
});

describe('segurança pública', () => {
  it('fila: urgente primeiro, depois a mais antiga', () => {
    const fila = ordenarPorUrgencia([
      { id: 'a', prioridade: 'MEDIA', createdAt: new Date('2026-10-01') },
      { id: 'b', prioridade: 'URGENTE', createdAt: new Date('2026-10-05') },
      { id: 'c', prioridade: 'MEDIA', createdAt: new Date('2026-09-20') },
      { id: 'd', prioridade: 'ALTA', createdAt: new Date('2026-10-03') },
    ]);
    expect(fila.map((i) => i.id)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('denúncia anônima nunca devolve quem fez', () => {
    const limpa = semDenunciante({ anonima: true, citizenId: 'c1', solicitanteNome: 'Maria', telefone: '99', citizen: { name: 'Maria' }, descricao: 'x' });
    expect(limpa).toMatchObject({ citizenId: null, solicitanteNome: null, telefone: null, citizen: null, descricao: 'x' });
    expect(semDenunciante({ anonima: false, citizenId: 'c1', solicitanteNome: 'Maria' }).solicitanteNome).toBe('Maria');
  });
});

describe('cadastro do turismo', () => {
  it('validade em meses de calendário (padrão 24)', () => {
    expect(validadeAPartirDe(new Date('2026-10-08T12:00:00Z')).toISOString().slice(0, 10)).toBe('2028-10-08');
    expect(validadeAPartirDe(new Date('2026-10-08T12:00:00Z'), 12).toISOString().slice(0, 10)).toBe('2027-10-08');
  });

  it('cadastro ativo com validade passada aparece como vencido', () => {
    const hoje = new Date('2026-10-08');
    expect(situacaoDoCadastro('ATIVO', new Date('2026-01-01'), hoje)).toBe('VENCIDO');
    expect(situacaoDoCadastro('ATIVO', new Date('2027-01-01'), hoje)).toBe('ATIVO');
    expect(situacaoDoCadastro('SUSPENSO', new Date('2026-01-01'), hoje)).toBe('SUSPENSO');
  });
});
