/**
 * DIAN Modulo-11 NIT Check-Digit Validator
 *
 * Pure function implementation -- zero server-only imports.
 * Works on both client and server (no Prisma, no next/headers, etc.).
 *
 * The Colombian DIAN uses a modulo-11 algorithm with prime number weights
 * to compute the verification digit (digito de verificacion) of a NIT.
 */

const PRIME_WEIGHTS = [41, 37, 29, 23, 19, 17, 13, 7, 3];

/**
 * Computes the DIAN verification digit for a given NIT base number.
 *
 * @param nit - The NIT base number (digits only, no DV, no dashes)
 * @returns The computed verification digit (0-9), or -1 if input is invalid
 *
 * @example
 * calculateVerificationDigit("860069804") // => 2  (Bancolombia)
 * calculateVerificationDigit("900123456") // => 7
 */
export function calculateVerificationDigit(nit: string): number {
  const digits = nit.replace(/\D/g, "");
  if (digits.length < 1 || digits.length > 15) return -1;

  const padded = digits.padStart(PRIME_WEIGHTS.length, "0");
  let sum = 0;
  for (let i = 0; i < PRIME_WEIGHTS.length; i++) {
    sum += parseInt(padded[i]) * PRIME_WEIGHTS[i];
  }

  const remainder = sum % 11;
  return remainder <= 1 ? remainder : 11 - remainder;
}

/**
 * Validates a NIT and returns parsed information needed for the matching engine.
 *
 * @param nit - The NIT base number (may contain non-digit chars, which are stripped)
 * @returns Object with validity flag, cleaned base number, computed DV, and
 *          the last 1 and last 2 digits needed for FechaVencimiento lookup
 *
 * @example
 * validateNit("860069804")
 * // => {
 * //   valid: true,
 * //   baseNumber: "860069804",
 * //   verificationDigit: 2,
 * //   lastOneDigit: "4",
 * //   lastTwoDigits: "04"
 * // }
 */
export function validateNit(nit: string): {
  valid: boolean;
  baseNumber: string;
  verificationDigit: number;
  lastOneDigit: string;
  lastTwoDigits: string;
} {
  const baseNumber = nit.replace(/\D/g, "");
  const dv = calculateVerificationDigit(baseNumber);
  return {
    valid: baseNumber.length >= 6 && baseNumber.length <= 10,
    baseNumber,
    verificationDigit: dv,
    lastOneDigit: baseNumber.slice(-1),
    lastTwoDigits: baseNumber.slice(-2).padStart(2, "0"),
  };
}
