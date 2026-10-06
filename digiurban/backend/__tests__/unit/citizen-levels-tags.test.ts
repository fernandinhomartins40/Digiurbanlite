/**
 * Níveis do cidadão x nível pedido pelo serviço, e código das etiquetas.
 */

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));

import { levelBlockMessage, levelOfStatus, meetsLevel, normalizeLevel } from '../../src/services/service-access-level';
import { tagCodeFromName } from '../../src/services/citizen-tags.service';

describe('nível mínimo do serviço', () => {
  it('cadastro pendente ou recusado é Bronze; conferido é Prata; ouro é Ouro', () => {
    expect(levelOfStatus('PENDING')).toBe('BRONZE');
    expect(levelOfStatus('REJECTED')).toBe('BRONZE');
    expect(levelOfStatus('VERIFIED')).toBe('SILVER');
    expect(levelOfStatus('GOLD')).toBe('GOLD');
  });

  it('serviço aberto aceita todos; Prata barra Bronze; Ouro só Ouro', () => {
    expect(meetsLevel('PENDING', 'BRONZE')).toBe(true);
    expect(meetsLevel('PENDING', 'SILVER')).toBe(false);
    expect(meetsLevel('VERIFIED', 'SILVER')).toBe(true);
    expect(meetsLevel('GOLD', 'SILVER')).toBe(true);
    expect(meetsLevel('VERIFIED', 'GOLD')).toBe(false);
    expect(meetsLevel('GOLD', 'GOLD')).toBe(true);
  });

  it('valor desconhecido no serviço vale como aberto a todos', () => {
    expect(normalizeLevel(undefined)).toBe('BRONZE');
    expect(normalizeLevel('QUALQUER')).toBe('BRONZE');
    expect(meetsLevel('PENDING', null)).toBe(true);
  });

  it('o aviso cabe na resposta do assistente (menos de 200 letras)', () => {
    expect(levelBlockMessage('SILVER').length).toBeLessThan(200);
    expect(levelBlockMessage('GOLD').length).toBeLessThan(200);
  });
});

describe('etiquetas', () => {
  it('gera o código a partir do nome', () => {
    expect(tagCodeFromName('Produtor Rural')).toBe('PRODUTOR_RURAL');
    expect(tagCodeFromName('  Beneficiário do Bolsa-Aluguel ')).toBe('BENEFICIARIO_DO_BOLSA_ALUGUEL');
    expect(tagCodeFromName('!!!')).toBe('ETIQUETA');
  });
});
