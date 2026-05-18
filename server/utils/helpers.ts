import { randomBytes } from 'crypto'

export function generateShareHash(): string {
  return randomBytes(32).toString('hex')
}

export function formatMoney(value: number | string): string {
  return Number(value).toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' zł'
}

/**
 * Generate order number in format NS-2026-0001
 * Prefix is derived from brand name initials.
 */
export function buildOrderNumber(brandName: string, year: number, seq: number): string {
  const prefix = brandName
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 4)
  return `${prefix}-${year}-${String(seq).padStart(4, '0')}`
}
