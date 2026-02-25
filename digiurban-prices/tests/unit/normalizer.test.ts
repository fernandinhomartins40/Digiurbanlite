import {
  normalizeText,
  normalizeUnit,
  calculateUnitPrice,
  validateLineItem,
} from '../../src/ingest/normalizer';

describe('normalizeText', () => {
  it('deve converter para minúsculas', () => {
    expect(normalizeText('COMPUTADOR DESKTOP')).toContain('computador');
  });

  it('deve remover acentos', () => {
    const result = normalizeText('limpeza predial manutenção');
    expect(result).not.toContain('ç');
    expect(result).not.toContain('ã');
  });

  it('deve remover stopwords', () => {
    const result = normalizeText('fornecimento de papel para impressão');
    expect(result).not.toContain(' de ');
    expect(result).not.toContain(' para ');
  });

  it('deve tratar string vazia', () => {
    expect(normalizeText('')).toBe('');
  });

  it('deve tratar caracteres especiais', () => {
    const result = normalizeText('computador i5, 8GB; RAM!');
    expect(result).not.toContain(',');
    expect(result).not.toContain(';');
    expect(result).not.toContain('!');
  });
});

describe('normalizeUnit', () => {
  it('deve normalizar variações de unidade', () => {
    expect(normalizeUnit('und')).toBe('un');
    expect(normalizeUnit('unid')).toBe('un');
    expect(normalizeUnit('unidade')).toBe('un');
    expect(normalizeUnit('Unidades')).toBe('un');
  });

  it('deve normalizar mês', () => {
    expect(normalizeUnit('mês')).toBe('mes');
    expect(normalizeUnit('mensal')).toBe('mes');
  });

  it('deve retornar null para undefined/null', () => {
    expect(normalizeUnit(null)).toBeNull();
    expect(normalizeUnit(undefined)).toBeNull();
    expect(normalizeUnit('')).toBeNull();
  });

  it('deve retornar valor original se não encontrado no mapa', () => {
    expect(normalizeUnit('pç')).toBe('pç');
  });
});

describe('calculateUnitPrice', () => {
  it('deve calcular preço unitário corretamente', () => {
    expect(calculateUnitPrice(1000, 10)).toBe(100);
    expect(calculateUnitPrice(350.50, 5)).toBe(70.1);
  });

  it('deve retornar null para quantidade zero', () => {
    expect(calculateUnitPrice(1000, 0)).toBeNull();
  });

  it('deve retornar null para valores nulos', () => {
    expect(calculateUnitPrice(null, 10)).toBeNull();
    expect(calculateUnitPrice(1000, null)).toBeNull();
  });

  it('deve arredondar para 2 casas decimais', () => {
    const result = calculateUnitPrice(100, 3);
    expect(result).toBe(33.33);
  });
});

describe('validateLineItem', () => {
  it('deve aceitar item válido', () => {
    const result = validateLineItem({
      description: 'Computador Desktop Intel Core i5',
      quantity: 10,
      unitPrice: 2500,
      totalPrice: 25000,
    });
    expect(result.isValid).toBe(true);
  });

  it('deve rejeitar descrição muito curta', () => {
    const result = validateLineItem({ description: 'AB', unitPrice: 100 });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Descrição');
  });

  it('deve rejeitar quantidade zero', () => {
    const result = validateLineItem({ description: 'Item teste', quantity: 0, unitPrice: 100 });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Quantidade');
  });

  it('deve rejeitar preço zero', () => {
    const result = validateLineItem({ description: 'Item teste', unitPrice: 0 });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('Preço');
  });

  it('deve rejeitar item sem nenhum valor', () => {
    const result = validateLineItem({ description: 'Item sem preço' });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('valor');
  });

  it('deve rejeitar preço implausível', () => {
    const result = validateLineItem({ description: 'Item teste', unitPrice: 600_000_000 });
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('implausível');
  });
});
