// The API stores timestamps in UTC and pure calendar dates as YYYY-MM-DD. The
// timezone always comes from the organization, never from the browser, or a
// receipt printed in Dubai would carry a different date than the one in Patna.

const DAY_MONTH_YEAR: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

/** A UTC timestamp as `19 Jul 2027` in the organization's timezone. */
export function formatDate(value: string | Date, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', { ...DAY_MONTH_YEAR, timeZone }).format(date);
}

/** A UTC timestamp as `19 Jul 2027, 09:04` in the organization's timezone. */
export function formatDateTime(value: string | Date, timeZone: string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-GB', {
    ...DAY_MONTH_YEAR,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(date);
}

/**
 * A pure calendar date (`2012-03-14`) as `14 Mar 2012`. It is read as a plain
 * date, with no timezone applied, so a birthday can never shift by a day.
 */
export function formatCalendarDate(value: string): string {
  const parts = value.split('-');
  const [year, month, day] = [Number(parts[0]), Number(parts[1]), Number(parts[2])];
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return '';
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat('en-GB', { ...DAY_MONTH_YEAR, timeZone: 'UTC' }).format(date);
}
