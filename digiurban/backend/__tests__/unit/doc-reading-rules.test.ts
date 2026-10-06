import {
  analyzeReading,
  compareBirthDate,
  compareCpf,
  compareName,
  detectKind,
  expectedKindOf,
  findCpfs,
  findDates,
  isValidCpf,
  kindMatches,
  mrzCheckDigit,
  parseMrzTd1,
} from '../../src/services/doc-reading/rules';

/** Monta uma faixa MRZ TD1 válida (como a da CIN) */
function buildTd1(docNumber: string, birth: string, expiry: string, surname: string, given: string) {
  const doc = docNumber.padEnd(9, '<');
  const l1 = `IDBRA${doc}${mrzCheckDigit(doc)}`.padEnd(30, '<');
  const l2base = `${birth}${mrzCheckDigit(birth)}F${expiry}${mrzCheckDigit(expiry)}BRA`.padEnd(29, '<');
  const composite = mrzCheckDigit(l1.slice(5, 30) + l2base.slice(0, 7) + l2base.slice(8, 15) + l2base.slice(18, 29));
  const l2 = `${l2base}${composite}`;
  const l3 = `${surname}<<${given.replace(/ /g, '<')}`.padEnd(30, '<');
  return [l1, l2, l3];
}

describe('leitura de documentos — regras', () => {
  it('CPF: valida e acha no texto, mesmo com erro de leitura', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('111.111.111-11')).toBe(false);
    expect(findCpfs('CPF: 529.982.247-25')).toEqual(['52998224725']);
    expect(findCpfs('CPF 529 982 247 25')).toEqual(['52998224725']);
    expect(findCpfs('CPF: 529.982.247-2O'.replace('2O', '25'))).toEqual(['52998224725']);
    expect(findCpfs('nº 123.456.789-00')).toEqual([]); // dígitos não conferem
    expect(compareCpf('52998224725', ['52998224725'])).toBe('MATCH');
    expect(compareCpf('52998224725', ['11144477735'])).toBe('NO_MATCH');
    expect(compareCpf('52998224725', [])).toBe('NOT_FOUND');
  });

  it('nome: confere palavra por palavra, ignora "da/de" e tolera um erro de leitura', () => {
    const text = 'REPUBLICA FEDERATIVA DO BRASIL\nNOME MARIA DA SILVA SOUZA\nFILIACAO JOSE SOUZA';
    expect(compareName('Maria da Silva Souza', text)).toBe('MATCH');
    expect(compareName('Maria Sílva Souza', text)).toBe('MATCH');
    expect(compareName('Maria da Silva Souza', text.replace('SOUZA', 'SOUZE'))).toBe('MATCH');
    expect(compareName('Maria Aparecida Souza Lima', text)).toBe('PARTIAL');
    expect(compareName('João Pereira', text)).toBe('NO_MATCH');
    expect(compareName('Maria', 'AB')).toBe('NOT_FOUND');
  });

  it('data de nascimento: só "confere" ou "não achei"', () => {
    const dates = findDates('NASCIMENTO 01/02/1980  EMISSAO 10.05.2020');
    expect(dates).toEqual(['1980-02-01', '2020-05-10']);
    expect(compareBirthDate(new Date('1980-02-01T00:00:00Z'), dates)).toBe('MATCH');
    expect(compareBirthDate('1990-01-01', dates)).toBe('NOT_FOUND');
  });

  it('tipo do documento: pelo texto e pelo que foi pedido', () => {
    expect(detectKind('REPUBLICA FEDERATIVA DO BRASIL CARTEIRA NACIONAL DE HABILITACAO DETRAN')).toBe('CNH');
    expect(detectKind('SECRETARIA DA SEGURANÇA PÚBLICA CARTEIRA DE IDENTIDADE REGISTRO GERAL')).toBe('RG');
    expect(detectKind('CARTEIRA DE IDENTIDADE NACIONAL')).toBe('CIN');
    expect(detectKind('FATURA DE ENERGIA VENCIMENTO 10/10/2026 CONSUMO KWH')).toBe('COMPROVANTE_RESIDENCIA');
    expect(detectKind('CEP 86900-000')).toBe('DESCONHECIDO');
    expect(expectedKindOf('rg_frente')).toBe('RG');
    expect(expectedKindOf('Comprovante de Residência')).toBe('COMPROVANTE_RESIDENCIA');
    expect(expectedKindOf('certidao_nascimento')).toBe('CERTIDAO');
    expect(expectedKindOf('foto 3x4')).toBeNull();
    expect(kindMatches('RG', 'CIN')).toBe(true);
    expect(kindMatches('CPF', 'CNH')).toBe(true);
    expect(kindMatches('COMPROVANTE_RESIDENCIA', 'RG')).toBe(false);
    expect(kindMatches('RG', 'DESCONHECIDO')).toBeNull();
  });

  it('faixa MRZ da CIN: confere os dígitos de controle, em qualquer ordem e com O/0 trocados', () => {
    const [l1, l2, l3] = buildTd1('52998224', '800201', '350101', 'SOUZA', 'MARIA DA SILVA');
    const ok = parseMrzTd1([l3, 'TEXTO QUALQUER', l1, l2]);
    expect(ok).toMatchObject({ valid: true, birthDate: '1980-02-01', expiryDate: '2035-01-01', names: 'SOUZA MARIA DA SILVA' });
    const misread = parseMrzTd1([l1, l2.replace(/0/, 'O'), l3.replace('SOUZA', 'S0UZA')]);
    expect(misread?.valid).toBe(true);
    expect(misread?.names).toBe('SOUZA MARIA DA SILVA');
    const tampered = parseMrzTd1([l1, l2.replace('800201', '800202'), l3]);
    expect(tampered?.valid).toBe(false);
    expect(tampered?.failedChecks).toContain('data de nascimento');
    expect(parseMrzTd1(['NADA AQUI'])).toBeNull();
  });

  it('resultado completo de uma CIN', () => {
    const mrz = buildTd1('52998224', '800201', '350101', 'SOUZA', 'MARIA DA SILVA');
    const lines = ['REPUBLICA FEDERATIVA DO BRASIL', 'CARTEIRA DE IDENTIDADE NACIONAL', 'CPF 529.982.247-25', ...mrz].map((text) => ({
      text,
      score: 0.98,
    }));
    const result = analyzeReading(lines, [{ format: 'QRCode', text: 'https://www.gov.br/validar?c=1' }], 'rg_frente', {
      name: 'Maria da Silva Souza',
      cpf: '529.982.247-25',
      birthDate: new Date('1980-02-01T00:00:00Z'),
    });
    expect(result).toMatchObject({
      detectedKind: 'CIN',
      expectedKind: 'RG',
      kindMatches: true,
      nameMatch: 'MATCH',
      cpfMatch: 'MATCH',
      birthDateMatch: 'MATCH',
      mrzValid: true,
      qrFound: true,
      qrGovUrl: 'https://www.gov.br/validar?c=1',
    });
  });

  it('QR que não é do governo não vira link', () => {
    const result = analyzeReading([], [{ format: 'QRCode', text: 'https://golpe.example.com/gov.br' }], null, {});
    expect(result.qrFound).toBe(true);
    expect(result.qrGovUrl).toBeNull();
  });
});
