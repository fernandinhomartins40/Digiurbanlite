export function normalizeProtocolDocumentLabel(value?: string | null): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/^\d+(?:-\d+)+-/, '')
    .replace(/^upload[-_]/i, '')
    .replace(/^documento[-_]/i, '')
    .replace(/(?:_|-)\d{6,}$/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
}

function compactProtocolDocumentLabel(value?: string | null): string {
  return normalizeProtocolDocumentLabel(value).replace(/_/g, '')
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0
  if (!left.length) return right.length
  if (!right.length) return left.length

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = new Array<number>(right.length + 1).fill(0)

  for (let i = 1; i <= left.length; i += 1) {
    current[0] = i

    for (let j = 1; j <= right.length; j += 1) {
      const substitutionCost = left[i - 1] === right[j - 1] ? 0 : 1
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + substitutionCost
      )
    }

    for (let j = 0; j <= right.length; j += 1) {
      previous[j] = current[j]
    }
  }

  return previous[right.length]
}

function similarityScore(left: string, right: string): number {
  if (!left || !right) return 0
  if (left === right) return 1

  const maxLength = Math.max(left.length, right.length)
  if (!maxLength) return 0

  return 1 - levenshteinDistance(left, right) / maxLength
}

export function resolveCanonicalProtocolDocumentLabel(
  candidate: string,
  requiredLabels: string[]
): string | undefined {
  if (!candidate || !Array.isArray(requiredLabels) || requiredLabels.length === 0) {
    return undefined
  }

  const normalizedCandidate = normalizeProtocolDocumentLabel(candidate)
  const compactCandidate = compactProtocolDocumentLabel(candidate)
  if (!normalizedCandidate && !compactCandidate) return undefined

  let bestMatch: { label: string; score: number } | undefined

  for (const label of requiredLabels) {
    const normalizedLabel = normalizeProtocolDocumentLabel(label)
    const compactLabel = compactProtocolDocumentLabel(label)
    if (!normalizedLabel && !compactLabel) continue

    if (normalizedCandidate === normalizedLabel || compactCandidate === compactLabel) {
      return label
    }

    const prefixMatch =
      normalizedCandidate.startsWith(`${normalizedLabel}_`) ||
      normalizedLabel.startsWith(`${normalizedCandidate}_`) ||
      compactCandidate.startsWith(compactLabel) ||
      compactLabel.startsWith(compactCandidate)

    const score = prefixMatch
      ? 0.99
      : Math.max(
          similarityScore(normalizedCandidate, normalizedLabel),
          similarityScore(compactCandidate, compactLabel)
        )

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { label, score }
    }
  }

  return bestMatch && bestMatch.score >= 0.82 ? bestMatch.label : undefined
}

export function matchProtocolDocumentLabel(candidate: string, target: string): boolean {
  return Boolean(resolveCanonicalProtocolDocumentLabel(candidate, [target]))
}

export function isGenericServiceDocumentLabel(value?: string | null): boolean {
  return /^documento\s*\d+$/i.test(String(value || '').trim())
}