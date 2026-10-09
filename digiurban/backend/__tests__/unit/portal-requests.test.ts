import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

import { normalizeName, turnoPreferencia, PORTAL_REQUEST_ACTIONS } from '../../src/services/apps/portal-requests.service';
import { findAppAction } from '../../src/config/app-catalog';

describe('pedidos do portal nos apps (Fase 1)', () => {
  it('compara nomes sem acento, caixa ou espaço sobrando', () => {
    expect(normalizeName('  José  da SILVA ')).toBe('jose da silva');
    expect(normalizeName('Conceição')).toBe(normalizeName('conceicao'));
  });

  it('traduz o turno do formulário para o turno da matrícula', () => {
    expect(turnoPreferencia('Matutino')).toBe('MATUTINO');
    expect(turnoPreferencia('Vespertino')).toBe('VESPERTINO');
    expect(turnoPreferencia('Integral')).toBe('INTEGRAL');
    expect(turnoPreferencia('Tanto faz')).toBe('INDIFERENTE');
    expect(turnoPreferencia(undefined)).toBe('INDIFERENTE');
  });

  it('toda fila do portal é uma porta de app do catálogo', () => {
    expect(PORTAL_REQUEST_ACTIONS.filter((code) => !findAppAction(code))).toEqual([]);
  });

  it('o gancho de criação manda para a fila exatamente as mesmas ações', () => {
    const source = readFileSync(join(__dirname, '../../src/services/apps/protocol-to-app.service.ts'), 'utf8');
    const block = source.slice(source.indexOf('PORTAL_QUEUE_MODULE_TYPES = new Set(['));
    const codes = [...block.slice(0, block.indexOf(']);')).matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);
    expect(codes.sort()).toEqual([...PORTAL_REQUEST_ACTIONS].sort());
  });
});
