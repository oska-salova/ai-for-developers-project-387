import type { components } from "./generated/openapi.js";
import { intervalsOverlap } from "./overlap.js";
import { addDays, ownerDate, ownerTimeInstant, OWNER_TIMEZONE } from "./owner-time.js";
import type { Meeting } from "./store.js";
import {
  meetingEnd,
  SLOT_STEP_MINUTES,
  WINDOW_DAYS,
  WORKDAY_END_MINUTES,
  WORKDAY_START_MINUTES,
} from "./time-rules.js";

type SlotsEnvelope = components["schemas"]["SlotsEnvelope"];
type Slot = components["schemas"]["Slot"];
type SlotDay = components["schemas"]["SlotDay"];

/** A half-open `[start, end)` interval that blocks overlapping slots. */
export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface SlotEngineInput {
  /** The duration of the requested meeting type, in minutes. */
  durationMinutes: number;
  /** Existing meetings as half-open intervals; not filtered or validated. */
  busy: readonly BusyInterval[];
  /** The current moment, injected so tests can pin it. */
  now: Date;
}

function slotsForDay(date: string, input: SlotEngineInput, nowMs: number): SlotDay {
  const workdayEndMs = ownerTimeInstant(date, WORKDAY_END_MINUTES).getTime();
  const slots: Slot[] = [];

  for (
    let minutes = WORKDAY_START_MINUTES;
    minutes < WORKDAY_END_MINUTES;
    minutes += SLOT_STEP_MINUTES
  ) {
    const start = ownerTimeInstant(date, minutes);
    const startMs = start.getTime();
    const endMs = meetingEnd(start, input.durationMinutes).getTime();
    const available =
      startMs > nowMs &&
      endMs <= workdayEndMs &&
      !input.busy.some((interval) =>
        intervalsOverlap(startMs, endMs, interval.start.getTime(), interval.end.getTime()),
      );

    slots.push({ start: start.toISOString(), available });
  }

  return { date, slots };
}

/**
 * Builds the whole slots envelope for a meeting type. A pure function: the
 * same duration, busy intervals and moment always produce the same response.
 */
export function buildSlots(input: SlotEngineInput): SlotsEnvelope {
  const nowMs = input.now.getTime();
  const startDate = ownerDate(input.now);
  const days = Array.from({ length: WINDOW_DAYS }, (_unused, index) =>
    slotsForDay(addDays(startDate, index), input, nowMs),
  );

  return {
    window: { start: startDate, end: addDays(startDate, WINDOW_DAYS - 1) },
    timezone: OWNER_TIMEZONE,
    days,
  };
}

/**
 * Joins every meeting with the duration of its meeting type. Meetings whose
 * type is unknown are skipped: the contract cannot produce them.
 */
export function busyIntervalsFromMeetings(
  meetings: readonly Meeting[],
  durationOf: (meetingTypeId: string) => number | undefined,
): BusyInterval[] {
  const intervals: BusyInterval[] = [];

  for (const meeting of meetings) {
    const durationMinutes = durationOf(meeting.meetingTypeId);

    if (durationMinutes === undefined) {
      continue;
    }

    intervals.push({
      start: meeting.start,
      end: meetingEnd(meeting.start, durationMinutes),
    });
  }

  return intervals;
}
