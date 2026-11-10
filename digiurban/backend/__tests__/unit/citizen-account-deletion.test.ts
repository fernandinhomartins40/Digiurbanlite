/**
 * Excluir a conta com pedido em andamento (regra das lojas, 2026-11-10):
 * não recusa mais — cancela cada pedido aberto pelo motor de status.
 */

const findMany = jest.fn();
const cancel = jest.fn();

jest.mock('../../src/lib/prisma', () => ({ prisma: { protocolSimplified: { findMany: (...args: any[]) => findMany(...args) } } }));
jest.mock('../../src/services/protocol-status-wrapper.service', () => ({ cancelProtocolByCitizen: (...args: any[]) => cancel(...args) }));
jest.mock('../../src/services/face-platform-client.service', () => ({ __esModule: true, default: {} }));

import { ACCOUNT_DELETED_REASON, cancelOpenProtocols } from '../../src/services/citizen-privacy.service';

describe('exclusão da conta com pedidos em andamento', () => {
  beforeEach(() => {
    findMany.mockReset();
    cancel.mockReset();
  });

  it('cancela só os pedidos abertos do cidadão, pelo motor de status, com o motivo', async () => {
    findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    cancel.mockResolvedValue({});
    await expect(cancelOpenProtocols('c1')).resolves.toBe(2);
    expect(findMany.mock.calls[0][0].where).toEqual({ citizenId: 'c1', status: { in: ['VINCULADO', 'PROGRESSO', 'PENDENCIA', 'ATUALIZACAO'] } });
    expect(cancel).toHaveBeenCalledWith('p1', 'c1', ACCOUNT_DELETED_REASON);
    expect(cancel).toHaveBeenCalledWith('p2', 'c1', 'Conta excluída pelo cidadão');
  });

  it('um pedido que falha não impede os outros', async () => {
    findMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);
    cancel.mockRejectedValueOnce(new Error('transição inválida')).mockResolvedValueOnce({});
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    await expect(cancelOpenProtocols('c1')).resolves.toBe(1);
    expect(cancel).toHaveBeenCalledTimes(2);
  });
});
