// Display only. Money maths happens on the API, on Decimal(12,2) columns, never
// here: a JavaScript number cannot hold 0.1 + 0.2 without drifting.

/** On-screen prefix per currency. PDFs use the real symbol instead. */
const SCREEN_PREFIX: Record<string, string> = {
  INR: 'Rs',
  USD: '$',
  AUD: 'A$',
  AED: 'AED',
};

const LOCALE_BY_CURRENCY: Record<string, string> = {
  INR: 'en-IN',
  USD: 'en-US',
  AUD: 'en-AU',
  AED: 'en-AE',
};

/**
 * Turns the API's money string and currency code into display text.
 * `formatMoney('12000.00', 'INR')` gives `Rs 12,000.00`, with Indian grouping.
 */
export function formatMoney(amount: string | number, currency: string): string {
  const value = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(value)) return `${SCREEN_PREFIX[currency] ?? currency} 0.00`;
  const formatted = new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency] ?? 'en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return `${SCREEN_PREFIX[currency] ?? currency} ${formatted}`;
}

/** The same amount without decimals, for a dashboard tile where space is tight. */
export function formatMoneyShort(amount: string | number, currency: string): string {
  const value = typeof amount === 'number' ? amount : Number(amount);
  if (!Number.isFinite(value)) return `${SCREEN_PREFIX[currency] ?? currency} 0`;
  const formatted = new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency] ?? 'en-IN', {
    maximumFractionDigits: 0,
  }).format(value);
  return `${SCREEN_PREFIX[currency] ?? currency} ${formatted}`;
}
