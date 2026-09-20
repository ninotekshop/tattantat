import { BadRequestException } from '@nestjs/common';

/** Monetary values sent over the API are decimal VND strings. Keeping them as
 * bigint here prevents precision loss before PostgreSQL receives a BIGINT. */
export function parseVnd(value: string | undefined, field: string): bigint {
  if (!value || !/^[1-9]\d{0,14}$/.test(value)) {
    throw new BadRequestException(`${field} phải là số tiền VND nguyên dương`);
  }
  return BigInt(value);
}

export function parseOptionalVnd(value: string | undefined, field: string): bigint | undefined {
  return value === undefined ? undefined : parseVnd(value, field);
}

export function decimalToVnd(value: string | number | bigint | null | undefined, field: string): bigint {
  if (value === null || value === undefined) return 0n;
  const raw = String(value);
  // PostgreSQL NUMERIC(15,2) commonly returns values such as "100000.00".
  // Accept that representation only when its fractional part is all zero.
  const match = /^(\d+)(?:\.(\d+))?$/.exec(raw);
  if (!match || (match[2] !== undefined && !/^0+$/.test(match[2]))) {
    throw new BadRequestException(`${field} không phải số tiền VND hợp lệ`);
  }
  return BigInt(match[1]);
}

/** ROUND_HALF_UP for a non-negative rational VND amount. */
export function roundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new Error('Denominator must be positive');
  if (numerator < 0n) return -roundHalfUp(-numerator, denominator);
  return (numerator + denominator / 2n) / denominator;
}

export function proportionalRound(amount: bigint, part: bigint, total: bigint): bigint {
  return roundHalfUp(amount * part, total);
}

export function money(value: bigint): string {
  return value.toString();
}
