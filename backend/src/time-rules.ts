// The booking rules shared by the slot engine, the start validation and the
// store. They live in one place so the three copies cannot drift apart.

const MINUTE_MS = 60 * 1000;

/** The booking window is today plus the following 13 owner days. */
export const WINDOW_DAYS = 14;

/** Working hours are 09:00–18:00 every day, without weekends or lunches. */
export const WORKDAY_START_MINUTES = 9 * 60;
export const WORKDAY_END_MINUTES = 18 * 60;

/** Offered starts are every 15 minutes: 09:00, 09:15, …, 17:45. */
export const SLOT_STEP_MINUTES = 15;

/** The end of a meeting: its start plus the duration of its type. */
export function meetingEnd(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * MINUTE_MS);
}
