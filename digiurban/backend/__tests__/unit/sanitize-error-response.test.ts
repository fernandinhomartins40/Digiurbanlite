import { describe, expect, it, jest } from '@jest/globals';

jest.mock('../../src/config/logger.config', () => ({ logger: { error: jest.fn() } }));

import { isInternalErrorMessage, sanitizeErrorBody } from '../../src/middleware/sanitize-error-response';

const prismaMessage =
  '\nInvalid `prisma.viagemTFD.findMany()` invocation:\n\n{\n  where: { tenantId: "tenant-default" }\n}\n\nInvalid value for argument `status`.';

describe('sanitizeErrorBody', () => {
  it('oculta mensagem interna do Prisma em error/message/details', () => {
    const { body, sanitized } = sanitizeErrorBody({ success: false, error: prismaMessage, message: prismaMessage });
    expect(body.error).not.toContain('prisma');
    expect(body.message).not.toContain('tenant-default');
    expect(body.success).toBe(false);
    expect(sanitized).toHaveLength(2);
  });

  it('preserva mensagens de negócio e respostas de sucesso', () => {
    const business = { error: 'Protocolo já está cancelado' };
    expect(sanitizeErrorBody(business).body).toBe(business);
    const ok = { success: true, data: [1, 2] };
    expect(sanitizeErrorBody(ok).body).toBe(ok);
    expect(sanitizeErrorBody([1]).body).toEqual([1]);
    expect(sanitizeErrorBody(null).body).toBeNull();
  });

  it('detecta os formatos de erro do Prisma', () => {
    expect(isInternalErrorMessage(prismaMessage)).toBe(true);
    expect(isInternalErrorMessage('PrismaClientKnownRequestError: P2002')).toBe(true);
    expect(isInternalErrorMessage('Status inválido')).toBe(false);
  });
});
