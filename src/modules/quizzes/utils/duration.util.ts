const UNIT_TO_MS: Record<string, number> = {
  d: 24 * 60 * 60 * 1000,
  h: 60 * 60 * 1000,
  m: 60 * 1000,
  s: 1000,
}

export function isValidDurationString(value: unknown): boolean {
  if (typeof value !== 'string') return false

  const trimmed = value.trim()
  if (trimmed === '') return false

  const tokenRegex = /(\d+)(d|h|m|s)/gi
  let matchedLength = 0
  let foundAny = false
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(trimmed)) !== null) {
    foundAny = true
    matchedLength += match[0].length
  }
  return foundAny && matchedLength === trimmed.length
}

export function durationToMs(value: string): number {
  const trimmed = value.trim()
  const tokenRegex = /(\d+)(d|h|m|s)/gi
  let totalMs = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(trimmed)) !== null) {
    const amount = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()
    totalMs += amount * UNIT_TO_MS[unit]
  }

  return totalMs
}
