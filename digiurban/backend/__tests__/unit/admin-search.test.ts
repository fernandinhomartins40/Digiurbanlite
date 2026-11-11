/** Busca do painel (Ctrl+K): termo mínimo, CPF mascarado e quem vê cidadão */
import { canReadCitizens, maskCpf, parseSearchQuery } from '../../src/services/admin-search-rules';

describe('busca do painel', () => {
  it('exige ao menos 3 caracteres', () => {
    expect(parseSearchQuery('ab')).toBeNull();
    expect(parseSearchQuery('   ab   ')).toBeNull();
    expect(parseSearchQuery(undefined)).toBeNull();
    expect(parseSearchQuery('  joão   silva ')).toEqual({ term: 'joão silva', digits: '' });
  });

  it('separa os números do CPF digitado com pontuação', () => {
    expect(parseSearchQuery('123.456.789-01')?.digits).toBe('12345678901');
  });

  it('mascara o CPF na lista', () => {
    expect(maskCpf('12345678901')).toBe('***.456.789-**');
    expect(maskCpf('123.456.789-01')).toBe('***.456.789-**');
    expect(maskCpf('')).toBe('');
    expect(maskCpf('123')).toBe('***');
  });

  it('cidadão só para quem tem citizens:read', () => {
    expect(canReadCitizens('USER')).toBe(true);
    expect(canReadCitizens('SUPER_ADMIN')).toBe(true);
    expect(canReadCitizens('GUEST')).toBe(false);
  });
});
