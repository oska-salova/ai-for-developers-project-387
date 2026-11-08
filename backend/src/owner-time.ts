// The owner lives in Moscow, and Moscow has been on a fixed +03:00 offset
// since 2014. These helpers do plain UTC arithmetic instead of `Intl`, so the
// server's own time zone can never leak into the booking window.
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

/** The owner's time zone as it appears on the wire. */
export const OWNER_TIMEZONE = "Europe/Moscow";

const OWNER_OFFSET_MINUTES = 3 * 60;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/u;

interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function parseDate(date: string): CalendarDate {
  const match = DATE_PATTERN.exec(date);

  if (match === null) {
    throw new Error(`Некорректная календарная дата: ${date}`);
  }

  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatUtcDate(instant: Date): string {
  return `${instant.getUTCFullYear()}-${pad(instant.getUTCMonth() + 1)}-${pad(instant.getUTCDate())}`;
}

/** The owner's calendar date for an instant. */
export function ownerDate(instant: Date): string {
  return formatUtcDate(new Date(instant.getTime() + OWNER_OFFSET_MINUTES * MINUTE_MS));
}

/** The instant of an owner's date and a minute of that day (09:00 is 540). */
export function ownerTimeInstant(date: string, minutesFromMidnight: number): Date {
  const { year, month, day } = parseDate(date);
  const ownerMidnightUtc = Date.UTC(year, month - 1, day);

  return new Date(ownerMidnightUtc + (minutesFromMidnight - OWNER_OFFSET_MINUTES) * MINUTE_MS);
}

/** Moves a `YYYY-MM-DD` date by whole calendar days. */
export function addDays(date: string, days: number): string {
  const { year, month, day } = parseDate(date);
  const shifted = new Date(Date.UTC(year, month - 1, day) + days * DAY_MS);

  return formatUtcDate(shifted);
}
