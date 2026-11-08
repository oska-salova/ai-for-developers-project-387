// The owner lives in Moscow, and Moscow has been on a fixed +03:00 offset since
// 2014. Every formatter names the zone explicitly, so the browser's own zone
// never leaks into the page.
const OWNER_TIME_ZONE = "Europe/Moscow";

const MINUTE_MS = 60 * 1000;

const dayKeyFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  day: "numeric",
  month: "long",
});

const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  weekday: "long",
});

const shortWeekdayFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  weekday: "short",
});

const dayOfMonthFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  timeZone: OWNER_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** The owner's `YYYY-MM-DD` date as a noon moment, safe from zone shifts. */
function ownerDayFromDate(date: string): Date {
  return new Date(`${date}T12:00:00.000Z`);
}

/** The owner's calendar day of an instant, YYYY-MM-DD. */
export function ownerDayKey(instant: string): string {
  const parts = dayKeyFormatter.formatToParts(new Date(instant));
  const value = (type: "year" | "month" | "day") =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

/** The owner's day as "1 ноября, воскресенье": no year, no "today"/"tomorrow". */
export function formatOwnerDay(instant: string): string {
  const date = new Date(instant);

  return `${dayFormatter.format(date)}, ${weekdayFormatter.format(date)}`;
}

/** The time of an instant as HH:mm in the owner's zone. */
export function formatOwnerTime(instant: string): string {
  return timeFormatter.format(new Date(instant));
}

/** The short weekday of an owner's date, as in "вс". */
export function formatOwnerWeekday(date: string): string {
  return shortWeekdayFormatter.format(ownerDayFromDate(date));
}

/** The day of the month of an owner's date, as in "1". */
export function formatOwnerDayOfMonth(date: string): string {
  return dayOfMonthFormatter.format(ownerDayFromDate(date));
}

/** The owner's date as "1 ноября": no year and no weekday. */
function formatOwnerDayFromDate(date: string): string {
  return dayFormatter.format(ownerDayFromDate(date));
}

/** The owner's day of an instant as "1 ноября", without the weekday. */
export function formatOwnerDayFromInstant(instant: string): string {
  return dayFormatter.format(new Date(instant));
}

/** The owner's day of a slot and its start time, as "1 ноября, 13:00". */
export function formatOwnerDateTime(date: string, instant: string): string {
  return `${formatOwnerDayFromDate(date)}, ${formatOwnerTime(instant)}`;
}

/** The end of a meeting: its start plus the duration of its type. */
export function meetingEnd(start: string, durationMinutes: number): Date {
  return new Date(new Date(start).getTime() + durationMinutes * MINUTE_MS);
}
