import { describe, expect, it } from '@jest/globals';
import { explainError } from '../../src/utils/explain-error';

describe('explainError — o motivo do erro para quem está na tela', () => {
  const fallback = 'Erro ao salvar';

  it('erro de regra do serviço vira 400 com a própria mensagem', () => {
    expect(explainError(new Error('Turma sem vagas disponíveis'), fallback)).toEqual({ status: 400, message: 'Turma sem vagas disponíveis' });
  });

  it('registro repetido, não encontrado e item que não existe mais', () => {
    expect(explainError({ code: 'P2002', name: 'PrismaClientKnownRequestError', message: 'x' }, fallback).status).toBe(409);
    expect(explainError({ code: 'P2025', name: 'PrismaClientKnownRequestError', message: 'x' }, fallback).status).toBe(404);
    expect(explainError({ code: 'P2003', name: 'PrismaClientKnownRequestError', message: 'x' }, fallback).message).toMatch(/não existe mais/);
  });

  it('campo obrigatório faltando explica sem mostrar a consulta', () => {
    const erro = { name: 'PrismaClientValidationError', message: 'Invalid `prisma.triagemEnfermagem.create()` invocation: Argument `unidadeId` is missing.' };
    const explicado = explainError(erro, fallback);
    expect(explicado.status).toBe(400);
    expect(explicado.message).toMatch(/campos obrigatórios/);
    expect(explicado.message).not.toMatch(/prisma|unidadeId/);
  });

  it('nunca devolve mensagem interna do banco', () => {
    const erro = new Error('Invalid `prisma.user.findMany()` invocation in /app/src/x.ts');
    expect(explainError(erro, fallback)).toEqual({ status: 500, message: fallback });
    expect(explainError({ code: 'P1001', name: 'PrismaClientInitializationError', message: "Can't reach database" }, fallback)).toEqual({ status: 500, message: fallback });
  });

  it('defeito do sistema (TypeError) continua 500 genérico', () => {
    expect(explainError(new TypeError("Cannot read properties of undefined (reading 'id')"), fallback)).toEqual({ status: 500, message: fallback });
  });

  it('mensagem enorme ou com várias linhas não vai para a tela', () => {
    expect(explainError(new Error('a'.repeat(400)), fallback).status).toBe(500);
    expect(explainError(new Error('linha 1\nlinha 2'), fallback).status).toBe(500);
  });
});
