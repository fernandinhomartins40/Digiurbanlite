/**
 * Utilitário para geração de números de protocolo
 * Versão simplificada - não depende de banco de dados
 * Formato: PROT-YYYYMMDD-XXXXX
 */

/**
 * Gera número de protocolo único no formato PROT-YYYYMMDD-XXXXX
 *
 * @returns String no formato "PROT-20251029-00001"
 *
 * @example
 * const number = generateProtocolNumber();
 * // Retorna: "PROT-20251029-12345"
 */
export function generateProtocolNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  // Gerar número aleatório de 5 dígitos
  // Em produção, considerar usar timestamp + random para melhor unicidade
  const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0')

  return `PROT-${year}${month}${day}-${random}`
}

/**
 * Valida formato de número de protocolo
 *
 * @param protocolNumber - Número do protocolo a validar
 * @returns true se válido, false caso contrário
 *
 * @example
 * isValidProtocolNumber("PROT-20251029-00001") // true
 * isValidProtocolNumber("INVALID") // false
 */
export function isValidProtocolNumber(protocolNumber: string): boolean {
  const regex = /^PROT-\d{8}-\d{5}$/
  return regex.test(protocolNumber)
}

/**
 * Extrai data do número de protocolo
 *
 * @param protocolNumber - Número do protocolo
 * @returns Date object ou null se inválido
 *
 * @example
 * extractDateFromProtocol("PROT-20251029-00001")
 * // Retorna: Date(2025-10-29)
 */
export function extractDateFromProtocol(protocolNumber: string): Date | null {
  if (!isValidProtocolNumber(protocolNumber)) {
    return null
  }

  const dateStr = protocolNumber.split('-')[1]
  const year = parseInt(dateStr.substring(0, 4))
  const month = parseInt(dateStr.substring(4, 6)) - 1 // JS months são 0-indexed
  const day = parseInt(dateStr.substring(6, 8))

  return new Date(year, month, day)
}
