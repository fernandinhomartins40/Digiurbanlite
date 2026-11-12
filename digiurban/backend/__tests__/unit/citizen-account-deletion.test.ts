/**
 * Excluir a conta com pedido em andamento (regra das lojas, 2026-11-10):
 * não recusa mais — cancela cada pedido aberto pelo motor de status.
 */

const findMany = jest.fn();
const cancel = jest.fn();
const familyFindMany = jest.fn();
const tx: Record<string, Record<string, jest.Mock>> = {};
const model = () => ({ updateMany: jest.fn().mockResolvedValue({}), deleteMany: jest.fn().mockResolvedValue({}), update: jest.fn().mockResolvedValue({}), create: jest.fn().mockResolvedValue({}) });
for (const name of ['message', 'conversation', 'flowExecution', 'botConversation', 'proactiveNotification', 'documentReading', 'citizenDocument', 'familyComposition', 'familyInvite', 'citizenCategoryAssignment', 'pushSubscription', 'nativePushDevice', 'notificationPreference', 'notification', 'passwordResetToken', 'citizen', 'auditLog']) tx[name] = model();

jest.mock('../../src/lib/prisma', () => ({
  prisma: {
    protocolSimplified: { findMany: (...args: any[]) => findMany(...args) },
    familyComposition: { findMany: (...args: any[]) => familyFindMany(...args) },
    citizenDocument: { findMany: async () => [] },
    $transaction: async (fn: any) => fn(tx),
  },
}));
jest.mock('../../src/services/protocol-status-wrapper.service', () => ({ cancelProtocolByCitizen: (...args: any[]) => cancel(...args) }));
jest.mock('../../src/services/face-platform-client.service', () => ({
  __esModule: true,
  default: { revokeConsent: jest.fn().mockResolvedValue(undefined), deleteCitizenBiometry: jest.fn().mockResolvedValue(undefined) },
}));

import { ACCOUNT_DELETED_REASON, cancelOpenProtocols, deleteCitizenAccount, ownedDependentIds } from '../../src/services/citizen-privacy.service';

describe('exclusão da conta: o que a política promete apagar', () => {
  it('apaga nascimento, escolha da IA e as conversas sem pedido (as de pedido ficam)', async () => {
    await deleteCitizenAccount('c1', {});
    const data = tx.citizen.update.mock.calls[0][0].data;
    expect(data).toMatchObject({ birthDate: null, aiConsent: null, aiConsentAt: null, phone: null, rg: null, isActive: false, email: '' });
    const where = tx.message.updateMany.mock.calls[0][0].where.conversation;
    expect(where.protocolId).toBeNull();
    expect(where.OR).toEqual([
      { participant1Id: 'c1', participant1Type: 'CITIZEN' },
      { participant2Id: 'c1', participant2Type: 'CITIZEN' },
    ]);
    expect(tx.botConversation.deleteMany).toHaveBeenCalledWith({ where: { citizenId: 'c1' } });
    expect(tx.proactiveNotification.deleteMany).toHaveBeenCalledWith({ where: { citizenId: 'c1' } });
  });

  it('dependentes que saem junto: só os cadastrados pela pessoa e sem acesso próprio', async () => {
    familyFindMany.mockResolvedValue([{ memberId: 'd1' }]);
    await expect(ownedDependentIds('c1')).resolves.toEqual(['d1']);
    expect(familyFindMany.mock.calls[0][0].where).toEqual({ headId: 'c1', isDependent: true, member: { registrationSource: 'FAMILY', email: '' } });
  });
});

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
