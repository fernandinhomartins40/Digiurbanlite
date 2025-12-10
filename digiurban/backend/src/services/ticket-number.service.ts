// ============================================================================
// TICKET-NUMBER.SERVICE.TS - Geração de números de chamados administrativos
// ============================================================================

import { prisma } from '../lib/prisma';

/**
 * Gera número sequencial para chamados administrativos
 * Formato: CH-2025-00001
 */
export async function generateTicketNumberSafe(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CH-${year}-`;

  // Buscar último chamado do ano
  const lastTicket = await prisma.adminTicket.findFirst({
    where: {
      number: {
        startsWith: prefix
      }
    },
    orderBy: {
      number: 'desc'
    },
    select: {
      number: true
    }
  });

  let nextSequence = 1;

  if (lastTicket) {
    const lastNumber = lastTicket.number.split('-')[2]; // CH-2025-00001 -> 00001
    const lastSequence = parseInt(lastNumber, 10);
    nextSequence = lastSequence + 1;
  }

  // Formatar com 5 dígitos: 00001, 00002, etc
  const sequenceStr = String(nextSequence).padStart(5, '0');
  const ticketNumber = `${prefix}${sequenceStr}`;

  return ticketNumber;
}
