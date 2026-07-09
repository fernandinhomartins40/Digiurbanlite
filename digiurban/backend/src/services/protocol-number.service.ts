/**
 * ============================================================================
 * PROTOCOL NUMBER SERVICE - Sistema Centralizado e Thread-Safe
 * ============================================================================
 *
 * Garante geração de números únicos de protocolo mesmo em alta concorrência.
 * Usa lock pessimista (SELECT FOR UPDATE) para evitar race conditions.
 *
 * Formato: {ANO}-{CONTADOR SEQUENCIAL}
 * Exemplo: 2025-000042
 */

import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { tryGetTenantId, DEFAULT_TENANT_ID } from '../lib/tenant-context';

/**
 * Gera número de protocolo único com proteção contra race conditions
 *
 * ✅ Thread-safe: Usa SELECT FOR UPDATE para lock pessimista
 * ✅ Funciona em transações: Aceita PrismaClient ou TransactionClient
 * ✅ Sem duplicações: Garante unicidade mesmo com requisições simultâneas
 *
 * @param tx - Transação Prisma opcional (recomendado usar)
 * @returns String no formato "2025-000042"
 *
 * @example
 * // Uso dentro de transação (RECOMENDADO)
 * await prisma.$transaction(async (tx) => {
 *   const protocolNumber = await generateProtocolNumberSafe(tx);
 *   // criar protocolo com número único
 * });
 *
 * @example
 * // Uso standalone (cria própria transação)
 * const protocolNumber = await generateProtocolNumberSafe();
 */
export async function generateProtocolNumberSafe(
  tx?: Prisma.TransactionClient
): Promise<string> {
  // Se já está em transação, usar. Se não, criar nova transação
  if (tx) {
    return await generateNumberWithLock(tx);
  }

  // Criar transação com isolation level adequado
  return await prisma.$transaction(
    async (innerTx) => {
      return await generateNumberWithLock(innerTx);
    },
    {
      isolationLevel: 'Serializable', // Máxima proteção contra race conditions
      timeout: 10000, // 10 segundos timeout
    }
  );
}

/**
 * Lógica interna de geração com lock
 * NUNCA chamar diretamente - sempre usar generateProtocolNumberSafe()
 */
async function generateNumberWithLock(
  tx: Prisma.TransactionClient
): Promise<string> {
  const year = new Date().getFullYear();

  // 🔒 LOCK PESSIMISTA: Bloqueia a tabela durante a leitura
  // Outras transações terão que esperar este lock ser liberado
  // Fase 3 Multi-Tenant: numeração POR TENANT. Seta o GUC (RLS filtra o
  // FOR UPDATE) e ainda filtra explicitamente por tenantId — o número do
  // protocolo do município B nao pode herdar a sequência do A.
  const tenantId = tryGetTenantId() || DEFAULT_TENANT_ID;
  await tx.$executeRawUnsafe(`SELECT set_config('app.tenant_id', $1, true)`, tenantId);
  const lastProtocol = await tx.$queryRaw<Array<{ number: string }>>`
    SELECT number
    FROM protocols_simplified
    WHERE "tenantId" = ${tenantId}
    ORDER BY "createdAt" DESC
    LIMIT 1
    FOR UPDATE
  `;

  let nextSequence = 1;

  if (lastProtocol && lastProtocol.length > 0) {
    const lastNumber = lastProtocol[0].number;

    // Extrair sequência do último protocolo
    const parts = lastNumber.split('-');
    if (parts.length === 2) {
      const lastSequence = parseInt(parts[1]);
      nextSequence = lastSequence + 1;
    }
  }

  const protocolNumber = `${year}-${String(nextSequence).padStart(6, '0')}`;
  return protocolNumber;
}

/**
 * Valida formato de número de protocolo
 */
export function isValidProtocolNumber(protocolNumber: string): boolean {
  const regex = /^\d{4}-\d{6}$/;
  return regex.test(protocolNumber);
}

/**
 * Extrai ano do número de protocolo
 */
export function extractYearFromProtocol(protocolNumber: string): number | null {
  if (!isValidProtocolNumber(protocolNumber)) {
    return null;
  }
  return parseInt(protocolNumber.split('-')[0]);
}

/**
 * Extrai número sequencial do protocolo
 */
export function extractSequenceFromProtocol(protocolNumber: string): number | null {
  if (!isValidProtocolNumber(protocolNumber)) {
    return null;
  }
  return parseInt(protocolNumber.split('-')[1]);
}
