import { citizenProtocolEta } from '../../src/services/citizen-protocol-eta';
import { pickReusableDocument } from '../../../frontend/components/citizen/protocol/reuse-documents';

const now = new Date('2026-11-11T12:00:00Z');
const due = (iso: string, isPaused = false) => ({ expectedEndDate: new Date(iso), isPaused });

describe('data prevista do pedido para o cidadão', () => {
  it('no prazo', () => {
    const eta = citizenProtocolEta('PROGRESSO', due('2026-11-20T12:00:00Z'), now);
    expect(eta).toEqual({ expectedEndDate: new Date('2026-11-20T12:00:00Z'), isLate: false, slaPaused: false });
  });

  it('passou da data = atrasado', () => {
    expect(citizenProtocolEta('VINCULADO', due('2026-11-10T12:00:00Z'), now).isLate).toBe(true);
  });

  it('esperando o cidadão não conta como atraso', () => {
    const eta = citizenProtocolEta('PENDENCIA', due('2026-11-10T12:00:00Z', true), now);
    expect(eta.isLate).toBe(false);
    expect(eta.slaPaused).toBe(true);
  });

  it('encerrado ou sem prazo não tem data', () => {
    expect(citizenProtocolEta('CONCLUIDO', due('2026-11-10T12:00:00Z'), now).expectedEndDate).toBeNull();
    expect(citizenProtocolEta('PROGRESSO', null, now)).toEqual({ expectedEndDate: null, isLate: false, slaPaused: false });
  });
});

describe('usar documento já enviado', () => {
  const mine = [
    { id: 'a', documentType: 'comprovante_residencia', status: 'REJECTED', uploadedAt: '2026-10-01' },
    { id: 'b', documentType: 'comprovante_residencia', status: 'APPROVED', uploadedAt: '2026-09-01' },
    { id: 'c', documentType: 'comprovante_residencia', status: 'APPROVED', uploadedAt: '2026-10-05' },
    { id: 'd', documentType: 'cpf', status: 'UNDER_REVIEW', uploadedAt: '2026-10-05' },
    { id: 'e', documentType: 'rg_frente', status: 'APPROVED', uploadedAt: '2026-10-05' },
  ];
  const catalogName = 'Comprovante de residência';

  it('só aprovado, o mais recente, do mesmo código', () => {
    expect(pickReusableDocument({ code: 'COMPROVANTE_RESIDENCIA', name: catalogName }, catalogName, mine)?.id).toBe('c');
  });

  it('em análise não serve', () => {
    expect(pickReusableDocument({ code: 'CPF', name: 'CPF' }, 'CPF', mine)).toBeNull();
  });

  it('documento de outra pessoa (com observação) não usa o do cidadão', () => {
    expect(pickReusableDocument({ code: 'COMPROVANTE_RESIDENCIA', name: `${catalogName} — do responsável` }, catalogName, mine)).toBeNull();
  });

  it('identidade (frente e verso numa imagem) e documento sem código ficam de fora', () => {
    expect(pickReusableDocument({ code: 'IDENTIDADE', name: 'x' }, 'x', mine)).toBeNull();
    expect(pickReusableDocument({ name: catalogName }, catalogName, mine)).toBeNull();
  });
});
