import { describe, expect, it } from '@eduflow/shared/testing';

import {
  academicYearName,
  academicYearNameFor,
  academicYearRange,
  addDays,
  addMoney,
  compareMoney,
  dayRangeUtc,
  differenceInDays,
  DOMAIN_EVENTS,
  endOfDayUtc,
  eventDomain,
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  fromMinorUnits,
  isApiError,
  isCalendarDate,
  isDomainEventName,
  isNegativeMoney,
  isOverdue,
  isUtcTimestamp,
  isValidEventName,
  isWithinAcademicYear,
  isZeroMoney,
  multiplyMoney,
  negateMoney,
  parseAcademicYearName,
  parseMoney,
  percentageOfMoney,
  roundMoney,
  splitMoneyEqually,
  startOfDayUtc,
  subtractMoney,
  sumMoney,
  toMinorUnits,
  todayInTimeZone,
} from './index.ts';

const KOLKATA = 'Asia/Kolkata';

describe('money arithmetic', () => {
  it('adds the two numbers that a float gets wrong', () => {
    expect(addMoney('0.10', '0.20')).toBe('0.30');
  });

  it('reads an exact amount into paise', () => {
    expect(parseMoney('12000.50')).toBe(1_200_050n);
    expect(parseMoney('12000')).toBe(1_200_000n);
  });

  it('refuses an amount with more than two decimal places', () => {
    expect(() => parseMoney('925.875')).toThrow(RangeError);
  });

  it('rounds half away from zero to two places', () => {
    expect(roundMoney('925.875')).toBe('925.88');
    expect(roundMoney('925.874')).toBe('925.87');
    expect(roundMoney('0.005')).toBe('0.01');
    expect(roundMoney('-0.005')).toBe('-0.01');
    expect(roundMoney('1.005')).toBe('1.01');
  });

  it('takes a percentage the way the fee module does', () => {
    // A 7.5 percent sibling discount on 12,345.00 is 925.875 before rounding.
    expect(percentageOfMoney('12345.00', 7.5)).toBe('925.88');
    expect(percentageOfMoney('12345.00', '7.5')).toBe('925.88');
  });

  it('multiplies by a tax rate', () => {
    expect(multiplyMoney('12000.00', '0.18')).toBe('2160.00');
    expect(multiplyMoney('2499.00', '0.18')).toBe('449.82');
  });

  it('subtracts, negates and compares without floats', () => {
    expect(subtractMoney('12000.00', '5000.00')).toBe('7000.00');
    expect(isZeroMoney(subtractMoney('100.00', '100.00'))).toBe(true);
    expect(negateMoney('5000.00')).toBe('-5000.00');
    expect(negateMoney('0.00')).toBe('0.00');
    expect(isNegativeMoney('-0.01')).toBe(true);
    expect(compareMoney('100.10', '100.09')).toBe(1);
    expect(compareMoney('100.10', '100.10')).toBe(0);
  });

  it('splits a yearly fee into instalments that still add up', () => {
    const instalments = splitMoneyEqually('10000.00', 3);
    expect(instalments).toEqual(['3333.33', '3333.33', '3333.34']);
    expect(sumMoney(instalments)).toBe('10000.00');
  });

  it('converts to the whole paise a payment gateway wants', () => {
    expect(toMinorUnits('12000.50')).toBe(1_200_050);
    expect(fromMinorUnits(1_200_050)).toBe('12000.50');
    expect(fromMinorUnits(-500)).toBe('-5.00');
  });

  it('refuses an amount larger than Decimal(12, 2)', () => {
    expect(() => parseMoney('10000000000.00')).toThrow(RangeError);
  });
});

describe('money formatting', () => {
  it('groups rupees in lakhs, the way an Indian receipt reads', () => {
    const formatted = formatMoney('1234567.89', 'INR');
    expect(formatted).toContain('12,34,567.89');
    expect(formatted.startsWith('₹')).toBe(true);
  });

  it('pads a short amount to two places', () => {
    expect(formatMoney('12000.5', 'INR')).toContain('12,000.50');
  });

  it('groups other currencies in thousands', () => {
    expect(formatMoney('1234567.89', 'USD')).toContain('1,234,567.89');
    expect(formatMoney('1234567.89', 'AUD')).toContain('1,234,567.89');
  });
});

describe('dates', () => {
  it('works out today in the organization timezone, not in UTC', () => {
    // 11:45 pm UTC on 5 October is already 5:15 am on 6 October in Patna.
    const lateEvening = new Date('2026-10-05T23:45:00.000Z');
    expect(todayInTimeZone(KOLKATA, lateEvening)).toBe('2026-10-06');
    expect(lateEvening.toISOString().slice(0, 10)).toBe('2026-10-05');
  });

  it('starts and ends a day at the right UTC instant', () => {
    expect(startOfDayUtc('2026-10-06', KOLKATA).toISOString()).toBe('2026-10-05T18:30:00.000Z');
    expect(endOfDayUtc('2026-10-06', KOLKATA).toISOString()).toBe('2026-10-06T18:29:59.999Z');
    const range = dayRangeUtc('2026-10-06', KOLKATA);
    expect(range.endsBefore.toISOString()).toBe('2026-10-06T18:30:00.000Z');
  });

  it('follows daylight saving in a market that uses it', () => {
    expect(startOfDayUtc('2027-03-01', 'America/New_York').toISOString()).toBe(
      '2027-03-01T05:00:00.000Z',
    );
    expect(startOfDayUtc('2027-03-15', 'America/New_York').toISOString()).toBe(
      '2027-03-15T04:00:00.000Z',
    );
  });

  it('makes an invoice overdue at the start of the next day in the organization timezone', () => {
    expect(isOverdue('2027-04-10', KOLKATA, new Date('2027-04-10T18:25:00.000Z'))).toBe(false);
    expect(isOverdue('2027-04-10', KOLKATA, new Date('2027-04-10T18:35:00.000Z'))).toBe(true);
  });

  it('adds days and counts days on plain calendar dates', () => {
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(differenceInDays('2027-04-01', '2028-03-31')).toBe(365);
  });

  it('checks that a calendar date and a UTC timestamp are real', () => {
    expect(isCalendarDate('2027-04-10')).toBe(true);
    expect(isCalendarDate('2027-02-30')).toBe(false);
    expect(isCalendarDate('10-04-2027')).toBe(false);
    expect(isUtcTimestamp('2027-04-02T05:31:22.418Z')).toBe(true);
    expect(isUtcTimestamp('2027-04-02T05:31:22+05:30')).toBe(false);
  });

  it('shows a stored UTC timestamp in the organization timezone', () => {
    const shown = formatDateTime('2027-04-02T05:31:22.418Z', KOLKATA);
    expect(shown).toContain('2027');
    expect(shown).toContain('11:01');
  });

  it('never shifts a calendar date, whichever timezone the reader is in', () => {
    const shown = formatCalendarDate('2011-08-14');
    expect(shown).toContain('2011');
    expect(shown).toContain('14');
  });

  it('names academic years the way the canon does', () => {
    expect(academicYearName('2027-04-01')).toBe('2027-28');
    expect(academicYearNameFor('2027-03-31')).toBe('2026-27');
    expect(academicYearNameFor('2027-04-01')).toBe('2027-28');
    expect(parseAcademicYearName('2027-28')).toEqual({ startYear: 2027, endYear: 2028 });
    expect(academicYearRange('2027-28')).toEqual({
      startDate: '2027-04-01',
      endDate: '2028-03-31',
    });
    expect(isWithinAcademicYear('2027-12-25', '2027-04-01', '2028-03-31')).toBe(true);
    expect(isWithinAcademicYear('2028-04-01', '2027-04-01', '2028-03-31')).toBe(false);
  });
});

describe('api envelope and events', () => {
  it('recognises the error envelope and refuses a success body', () => {
    expect(
      isApiError({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No such student' },
        requestId: 'req_8f3a2c71d94e',
      }),
    ).toBe(true);
    expect(isApiError({ success: true, data: { id: 'x' } })).toBe(false);
    expect(isApiError(null)).toBe(false);
  });

  it('knows the event names the modules publish', () => {
    expect(isDomainEventName('fee.invoice.issued')).toBe(true);
    expect(isDomainEventName('payment.captured')).toBe(true);
    expect(isDomainEventName('attendance.marked')).toBe(true);
    expect(isDomainEventName('student.absent')).toBe(true);
    expect(isDomainEventName('send.sms')).toBe(false);
  });

  it('lists every event once and keeps every name inside the naming rule', () => {
    expect(new Set(DOMAIN_EVENTS).size).toBe(DOMAIN_EVENTS.length);
    const wrong = DOMAIN_EVENTS.filter((name) => !isValidEventName(name));
    expect(wrong).toEqual([]);
    expect(eventDomain('fee.invoice.paid')).toBe('fee');
    expect(isValidEventName('FEE_INVOICE_PAID')).toBe(false);
  });
});
