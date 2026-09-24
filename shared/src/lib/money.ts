// Money helpers that never touch a JavaScript float.
//
// A fee receipt that is one paisa wrong destroys trust, and `0.1 + 0.2` is `0.30000000000000004`.
// So every amount travels as text ("12000.50") and every calculation happens on a bigint count of
// minor units (paise, cents). The only place a float appears is display formatting, after the
// exact value is already fixed.

/** Money is Decimal(12, 2) in PostgreSQL: two decimal places, twelve digits in all. */
export const MONEY_SCALE = 2;

/** The largest amount Decimal(12, 2) can hold, as minor units. */
export const MAX_MONEY_MINOR = 999_999_999_999n;

/** The same limit written as an amount, for error messages and validation. */
export const MAX_MONEY_AMOUNT = '9999999999.99';

const MINOR_FACTOR = 100n;
const DECIMAL_PATTERN = /^([+-]?)(\d+)(?:\.(\d+))?$/;

/** Locales whose grouping suits each market currency. INR groups in lakhs and crores. */
const CURRENCY_LOCALES: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  AUD: 'en-AU',
  AED: 'en-AE',
};

interface DecimalParts {
  negative: boolean;
  /** The digits with the point removed, always zero or more. */
  digits: bigint;
  /** How many of those digits sit after the point. */
  scale: number;
}

function parseDecimal(value: string, label: string): DecimalParts {
  if (typeof value !== 'string') {
    throw new TypeError(`${label} must be written as text, for example "12000.50".`);
  }
  const match = DECIMAL_PATTERN.exec(value.trim());
  if (match === null) {
    throw new TypeError(`${label} is not a decimal number: "${value}".`);
  }
  const fraction = match[3] ?? '';
  return {
    negative: (match[1] ?? '') === '-',
    digits: BigInt((match[2] ?? '0') + fraction),
    scale: fraction.length,
  };
}

/** Moves a digit count to another scale, rounding half away from zero: 925.875 becomes 925.88. */
function rescaleHalfUp(digits: bigint, fromScale: number, toScale: number): bigint {
  if (toScale === fromScale) return digits;
  if (toScale > fromScale) return digits * 10n ** BigInt(toScale - fromScale);
  const factor = 10n ** BigInt(fromScale - toScale);
  const quotient = digits / factor;
  const remainder = digits % factor;
  return remainder * 2n >= factor ? quotient + 1n : quotient;
}

function absolute(value: bigint): bigint {
  return value < 0n ? -value : value;
}

function assertStorable(minor: bigint, label: string): bigint {
  if (absolute(minor) > MAX_MONEY_MINOR) {
    throw new RangeError(
      `${label} is larger than ${MAX_MONEY_AMOUNT}, which Decimal(12, 2) cannot hold.`,
    );
  }
  return minor;
}

function toMinor(parts: DecimalParts): bigint {
  const magnitude = rescaleHalfUp(parts.digits, parts.scale, MONEY_SCALE);
  return parts.negative ? -magnitude : magnitude;
}

function formatMinor(minor: bigint): string {
  const magnitude = absolute(minor);
  const whole = magnitude / MINOR_FACTOR;
  const fraction = magnitude % MINOR_FACTOR;
  const text = `${whole.toString()}.${fraction.toString().padStart(MONEY_SCALE, '0')}`;
  return minor < 0n ? `-${text}` : text;
}

function numberToDecimalText(value: number, label: string): string {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
  const text = String(value);
  if (text.includes('e') || text.includes('E')) {
    throw new RangeError(
      `${label} is too small or too large to write as a number; pass it as text.`,
    );
  }
  return text;
}

/**
 * Reads an exact amount into minor units. Rejects anything with more than two decimal places,
 * because silently rounding an input is how a fee becomes wrong without anyone noticing.
 * Round on purpose with `roundMoney` first.
 */
export function parseMoney(amount: string): bigint {
  const parts = parseDecimal(amount, 'An amount');
  if (parts.scale > MONEY_SCALE) {
    throw new RangeError(
      `An amount may have at most ${MONEY_SCALE} decimal places: "${amount}". Round it first.`,
    );
  }
  return assertStorable(toMinor(parts), 'That amount');
}

/** Rounds any decimal text to two places, half away from zero: "925.875" becomes "925.88". */
export function roundMoney(amount: string): string {
  const parts = parseDecimal(amount, 'An amount');
  return formatMinor(assertStorable(toMinor(parts), 'The rounded amount'));
}

export function addMoney(left: string, right: string): string {
  return formatMinor(assertStorable(parseMoney(left) + parseMoney(right), 'The total'));
}

export function subtractMoney(left: string, right: string): string {
  return formatMinor(assertStorable(parseMoney(left) - parseMoney(right), 'The difference'));
}

export function negateMoney(amount: string): string {
  return formatMinor(-parseMoney(amount));
}

export function sumMoney(amounts: readonly string[]): string {
  let total = 0n;
  for (const amount of amounts) {
    total += parseMoney(amount);
  }
  return formatMinor(assertStorable(total, 'The total'));
}

/**
 * Multiplies an amount by a rate given as text, for example a tax rate of "0.18".
 * The rate may carry as many decimal places as it needs; only the result is rounded.
 */
export function multiplyMoney(amount: string, rate: string): string {
  const base = parseMoney(amount);
  const factor = parseDecimal(rate, 'A rate');
  const negative = (base < 0n) !== factor.negative;
  const magnitude = rescaleHalfUp(
    absolute(base) * factor.digits,
    MONEY_SCALE + factor.scale,
    MONEY_SCALE,
  );
  return formatMinor(assertStorable(negative ? -magnitude : magnitude, 'The product'));
}

/**
 * Takes a percentage of an amount. `10.5` means 10.5 percent, exactly as the API sends it.
 * A 7.5 percent discount on "12345.00" is 925.875, which rounds to "925.88".
 */
export function percentageOfMoney(amount: string, percent: string | number): string {
  const text = typeof percent === 'number' ? numberToDecimalText(percent, 'A percentage') : percent;
  const parts = parseDecimal(text, 'A percentage');
  const base = parseMoney(amount);
  const negative = (base < 0n) !== parts.negative;
  // Dividing by one hundred is two more decimal places, so nothing is rounded early.
  const magnitude = rescaleHalfUp(
    absolute(base) * parts.digits,
    MONEY_SCALE + parts.scale + 2,
    MONEY_SCALE,
  );
  return formatMinor(assertStorable(negative ? -magnitude : magnitude, 'The percentage'));
}

/**
 * Splits a total into equal parts. The last part absorbs the leftover paise, so the parts
 * always add up to the total: 10000.00 in three parts is 3333.33, 3333.33 and 3333.34.
 */
export function splitMoneyEqually(total: string, parts: number): string[] {
  if (!Number.isInteger(parts) || parts < 1) {
    throw new RangeError('Split a total into one part or more.');
  }
  const minor = parseMoney(total);
  const share = minor / BigInt(parts);
  const shares: string[] = [];
  for (let index = 0; index < parts - 1; index += 1) {
    shares.push(formatMinor(share));
  }
  shares.push(formatMinor(minor - share * BigInt(parts - 1)));
  return shares;
}

export function compareMoney(left: string, right: string): -1 | 0 | 1 {
  const difference = parseMoney(left) - parseMoney(right);
  if (difference < 0n) return -1;
  return difference > 0n ? 1 : 0;
}

export function equalsMoney(left: string, right: string): boolean {
  return compareMoney(left, right) === 0;
}

export function isZeroMoney(amount: string): boolean {
  return parseMoney(amount) === 0n;
}

export function isNegativeMoney(amount: string): boolean {
  return parseMoney(amount) < 0n;
}

/** Guards the canon rule that two amounts in different currencies are never added. */
export function assertSameCurrency(left: string, right: string): void {
  if (left.trim().toUpperCase() !== right.trim().toUpperCase()) {
    throw new RangeError(`Cannot combine ${left} and ${right}: the currencies differ.`);
  }
}

/** Razorpay and Stripe both want a whole number of paise or cents. */
export function toMinorUnits(amount: string): number {
  const minor = parseMoney(amount);
  if (absolute(minor) > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new RangeError(`${amount} is too large to send to a payment gateway as a whole number.`);
  }
  return Number(minor);
}

/** Turns a gateway amount such as 1200050 paise back into "12000.50". */
export function fromMinorUnits(minor: number | bigint): string {
  if (typeof minor === 'number' && !Number.isInteger(minor)) {
    throw new TypeError('Minor units are whole paise or cents, never a fraction.');
  }
  return formatMinor(assertStorable(BigInt(minor), 'That amount'));
}

/** The locale whose grouping suits a currency: INR groups in lakhs, USD in thousands. */
export function defaultLocaleForCurrency(currency: string): string {
  return CURRENCY_LOCALES[currency.trim().toUpperCase()] ?? 'en';
}

/**
 * Formats an amount for a human: "1234567.89" in INR becomes "₹12,34,567.89".
 * Display only. Never feed the result of this back into a calculation.
 */
export function formatMoney(amount: string, currency: string, locale?: string): string {
  const exact = roundMoney(amount);
  const code = currency.trim().toUpperCase();
  const formatter = new Intl.NumberFormat(locale ?? defaultLocaleForCurrency(code), {
    style: 'currency',
    currency: code,
    minimumFractionDigits: MONEY_SCALE,
    maximumFractionDigits: MONEY_SCALE,
  });
  // Intl accepts an exact decimal string, which keeps large amounts precise, but the
  // TypeScript lib types still describe only numbers.
  const exactFormatter = formatter as unknown as { format(value: string): string };
  const text = exactFormatter.format(exact);
  return text.includes('NaN') ? formatter.format(Number(exact)) : text;
}

/** Formats the number without a currency symbol, for columns that show the code separately. */
export function formatMoneyNumber(amount: string, locale = 'en-IN'): string {
  const exact = roundMoney(amount);
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: MONEY_SCALE,
    maximumFractionDigits: MONEY_SCALE,
  });
  const exactFormatter = formatter as unknown as { format(value: string): string };
  const text = exactFormatter.format(exact);
  return text.includes('NaN') ? formatter.format(Number(exact)) : text;
}
