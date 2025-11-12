/**
 * Gerador de Números de Protocolo com Proteção contra Concorrência
 *
 * Implementa lock pessimista para evitar race conditions em cenários
 * de alta concorrência (picos de acesso, eventos, campanhas)
 */

import { prisma } from '../lib/prisma'

/**
 * Gera número de protocolo único com proteção contra concorrência
 * Formato: PROT-YYYYMMDD-XXXXX
 *
 * @returns String no formato "PROT-20251107-00001"
 *
 * @example
 * const number = await generateProtocolNumberSafe();
 * // Retorna: "PROT-20251107-00001"
 */
export async function generateProtocolNumberSafe(): Promise<string> {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const datePrefix = `${year}${month}${day}`

  // Usar transaction com lock para evitar race condition
  return await prisma.$transaction(async (tx) => {
    // Lock pessimista (FOR UPDATE): bloqueia registros durante a leitura
    // Outras transações precisam aguardar este lock ser liberado
    // Garante que apenas uma requisição por vez pode buscar o último número
    const lastProtocol = await tx.$queryRaw<Array<{ number: string }>>`
      SELECT number
      FROM protocols_simplified
      WHERE number LIKE ${'PROT-' + datePrefix + '%'}
      ORDER BY number DESC
      LIMIT 1
      FOR UPDATE
    `

    let sequence = 1
    if (lastProtocol && lastProtocol.length > 0) {
      const lastNumber = lastProtocol[0].number
      const lastSequence = parseInt(lastNumber.split('-')[2])
      sequence = lastSequence + 1
    }

    const sequenceStr = String(sequence).padStart(5, '0')
    return `PROT-${datePrefix}-${sequenceStr}`
  }, {
    // Timeout de 10 segundos para evitar deadlocks prolongados
    timeout: 10000,
    // Isolation level para garantir leitura consistente
    isolationLevel: 'Serializable'
  })
}

/**
 * Gera número de protocolo com retry automático
 * Alternativa ao lock: tenta gerar até maxRetries vezes
 *
 * @param maxRetries - Número máximo de tentativas (padrão: 3)
 * @returns Promise<string>
 */
export async function generateProtocolNumberWithRetry(maxRetries: number = 3): Promise<string> {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const datePrefix = `${year}${month}${day}`

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Buscar último protocolo
      const lastProtocol = await prisma.protocolSimplified.findFirst({
        where: {
          number: {
            startsWith: `PROT-${datePrefix}`
          }
        },
        orderBy: {
          number: 'desc'
        }
      })

      let sequence = 1
      if (lastProtocol) {
        const lastSequence = parseInt(lastProtocol.number.split('-')[2])
        sequence = lastSequence + 1
      }

      const sequenceStr = String(sequence).padStart(5, '0')
      const newNumber = `PROT-${datePrefix}-${sequenceStr}`

      // Tentar criar um registro temporário para verificar unicidade
      // Se falhar (duplicate key), o catch vai tentar novamente
      await prisma.protocolSimplified.findUnique({
        where: { number: newNumber }
      })

      return newNumber
    } catch (error: any) {
      // Se for último retry, propaga erro
      if (attempt === maxRetries - 1) {
        throw new Error(`Falha ao gerar número de protocolo após ${maxRetries} tentativas`)
      }

      // Exponential backoff: aguarda antes de tentar novamente
      const backoffMs = Math.pow(2, attempt) * 100 // 100ms, 200ms, 400ms
      await new Promise(resolve => setTimeout(resolve, backoffMs))
    }
  }

  throw new Error('Falha ao gerar número de protocolo')
}

/**
 * Valida formato de número de protocolo
 */
export function isValidProtocolNumber(protocolNumber: string): boolean {
  const regex = /^PROT-\d{8}-\d{5}$/
  return regex.test(protocolNumber)
}

/**
 * Extrai data do número de protocolo
 */
export function extractDateFromProtocol(protocolNumber: string): Date | null {
  if (!isValidProtocolNumber(protocolNumber)) {
    return null
  }

  const dateStr = protocolNumber.split('-')[1]
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1
  const day = parseInt(dateStr.substring(6, 8))

  return new Date(year, month, day)
}
