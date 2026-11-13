/** Tabela de sentidos: uma palavra e uma cor por situação, nos dois lados (servidor e cidadão) */
import { protocolSense } from '../../../frontend/lib/senses';

describe('tabela de sentidos', () => {
  it('servidor e cidadão veem a mesma cor com a palavra de cada um', () => {
    expect(protocolSense('PENDENCIA').label).toBe('Aguardando cidadão');
    expect(protocolSense('PENDENCIA', 'citizen').label).toBe('Aguardando você');
    expect(protocolSense('PENDENCIA').sense).toBe(protocolSense('PENDENCIA', 'citizen').sense);
    expect(protocolSense('CONCLUIDO', 'citizen').label).toBe('Pronto');
  });

  it('pendência aberta manda mais que o status, menos em pedido encerrado', () => {
    expect(protocolSense('PROGRESSO', 'citizen', true).sense).toBe('waiting');
    expect(protocolSense('CONCLUIDO', 'citizen', true).sense).toBe('done');
    expect(protocolSense('CANCELADO', 'server', true).sense).toBe('off');
  });

  it('vermelho não é usado para situação do protocolo (só para atraso)', () => {
    for (const status of ['VINCULADO', 'PROGRESSO', 'ATUALIZACAO', 'PENDENCIA', 'CONCLUIDO', 'CANCELADO', 'OUTRO']) {
      expect(protocolSense(status).sense).not.toBe('late');
    }
  });
});
