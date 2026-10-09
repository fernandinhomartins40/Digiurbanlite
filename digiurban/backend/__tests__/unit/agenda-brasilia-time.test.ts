import { describe, expect, it } from '@jest/globals';
import {
  brasiliaAt,
  brasiliaDayBounds,
  brasiliaDayKey,
  parseBrasiliaDateTime,
  weekDayOf,
} from '../../src/services/agenda-medica/brasilia-time';

describe('agenda de saúde em horário de Brasília', () => {
  it('hora sem fuso vinda da tela é hora de Brasília (08:00 = 11:00 UTC)', () => {
    expect(parseBrasiliaDateTime('2026-10-13T08:00:00').toISOString()).toBe('2026-10-13T11:00:00.000Z');
    expect(parseBrasiliaDateTime('2026-10-13T08:00').toISOString()).toBe('2026-10-13T11:00:00.000Z');
  });

  it('respeita o fuso quando ele vem escrito', () => {
    expect(parseBrasiliaDateTime('2026-10-13T11:00:00Z').toISOString()).toBe('2026-10-13T11:00:00.000Z');
  });

  it('o horário do slot é igual ao horário gravado da consulta', () => {
    const consulta = parseBrasiliaDateTime('2026-10-13T08:20:00');
    expect(brasiliaAt(brasiliaDayKey(consulta), '08:20').toISOString()).toBe(consulta.toISOString());
  });

  it('consulta à noite continua no mesmo dia (não vira o dia seguinte por causa do UTC)', () => {
    const noite = parseBrasiliaDateTime('2026-10-13T22:30:00');
    expect(brasiliaDayKey(noite)).toBe('2026-10-13');
    const { start, end } = brasiliaDayBounds('2026-10-13');
    expect(noite >= start && noite < end).toBe(true);
  });

  it('dia da semana vem do calendário (13/10/2026 é terça)', () => {
    expect(weekDayOf('2026-10-13')).toBe(2);
    expect(weekDayOf(brasiliaDayKey(parseBrasiliaDateTime('2026-10-13')))).toBe(2);
  });
});
