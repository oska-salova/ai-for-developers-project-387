import { describe, expect, it } from "vitest";
import type { components } from "./generated/openapi.js";
import { buildSlots, busyIntervalsFromMeetings, type BusyInterval } from "./slots.js";
import type { Meeting } from "./store.js";

type SlotsEnvelope = components["schemas"]["SlotsEnvelope"];
type Slot = components["schemas"]["Slot"];
type SlotDay = components["schemas"]["SlotDay"];

const FIRST_DAY = "2026-11-01";

/** An instant written as owner (Moscow) local time. */
function msk(local: string): Date {
  return new Date(`${local}+03:00`);
}

function build(now: Date, durationMinutes = 30, busy: BusyInterval[] = []): SlotsEnvelope {
  return buildSlots({ now, durationMinutes, busy });
}

function day(envelope: SlotsEnvelope, date: string): SlotDay {
  const found = envelope.days.find((candidate) => candidate.date === date);

  if (found === undefined) {
    throw new Error(`No day ${date} in the window`);
  }

  return found;
}

function slot(envelope: SlotsEnvelope, start: string): Slot {
  for (const candidate of envelope.days) {
    const found = candidate.slots.find((entry) => entry.start === start);

    if (found !== undefined) {
      return found;
    }
  }

  throw new Error(`No slot starting at ${start}`);
}

function available(envelope: SlotsEnvelope, start: string): boolean {
  return slot(envelope, start).available;
}

const busyAt1000: BusyInterval[] = [
  { start: msk("2026-11-01T10:00:00"), end: msk("2026-11-01T10:30:00") },
];

describe("слоты: движок", () => {
  it("returns 14 owner days starting today in Moscow time", () => {
    const envelope = build(msk("2026-11-01T00:00:00"));

    expect(envelope.window).toEqual({ start: "2026-11-01", end: "2026-11-14" });
    expect(envelope.timezone).toBe("Europe/Moscow");
    expect(envelope.days.map((entry) => entry.date)).toEqual([
      "2026-11-01",
      "2026-11-02",
      "2026-11-03",
      "2026-11-04",
      "2026-11-05",
      "2026-11-06",
      "2026-11-07",
      "2026-11-08",
      "2026-11-09",
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
  });

  it("starts the window at the owner's midnight, not the server's", () => {
    expect(build(new Date("2026-10-31T20:59:59.999Z")).window.start).toBe("2026-10-31");
    expect(build(new Date("2026-10-31T21:00:00.000Z")).window.start).toBe("2026-11-01");
  });

  it("keeps the full 09:00–17:45 grid even when every slot is unavailable", () => {
    const envelope = build(msk("2026-11-01T17:46:00"));
    const today = day(envelope, FIRST_DAY);

    expect(today.slots).toHaveLength(36);
    expect(today.slots[0]?.start).toBe("2026-11-01T06:00:00.000Z");
    expect(today.slots.at(-1)?.start).toBe("2026-11-01T14:45:00.000Z");
    expect(today.slots.every((entry) => !entry.available)).toBe(true);
  });

  it("offers 09:00 when the current moment is one millisecond before it", () => {
    const envelope = build(msk("2026-11-01T08:59:59.999"));

    expect(available(envelope, "2026-11-01T06:00:00.000Z")).toBe(true);
  });

  it("does not offer a start exactly at the current moment", () => {
    const envelope = build(msk("2026-11-01T09:00:00"));

    expect(available(envelope, "2026-11-01T06:00:00.000Z")).toBe(false);
    expect(available(envelope, "2026-11-01T06:15:00.000Z")).toBe(true);
  });

  it("keeps past starts of today in the grid, marked unavailable", () => {
    const envelope = build(msk("2026-11-01T12:00:00"));

    expect(available(envelope, "2026-11-01T08:45:00.000Z")).toBe(false);
    expect(available(envelope, "2026-11-01T09:00:00.000Z")).toBe(false);
    expect(available(envelope, "2026-11-01T09:15:00.000Z")).toBe(true);
  });

  it("offers 17:45 for a 15-minute meeting one millisecond before it", () => {
    const envelope = build(msk("2026-11-01T17:44:59.999"), 15);

    expect(available(envelope, "2026-11-01T14:45:00.000Z")).toBe(true);
  });

  it("does not offer 17:45 for a 30-minute meeting that leaves the workday", () => {
    const envelope = build(msk("2026-11-01T00:00:00"), 30);

    expect(available(envelope, "2026-11-01T14:30:00.000Z")).toBe(true);
    expect(available(envelope, "2026-11-01T14:45:00.000Z")).toBe(false);
  });

  it("does not offer 17:45 once the current moment is 17:46", () => {
    const envelope = build(msk("2026-11-01T17:46:00"), 15);

    expect(available(envelope, "2026-11-01T14:45:00.000Z")).toBe(false);
  });

  it("fits a 540-minute meeting only at 09:00", () => {
    const envelope = build(msk("2026-11-01T00:00:00"), 540);

    expect(available(envelope, "2026-11-01T06:00:00.000Z")).toBe(true);
    expect(available(envelope, "2026-11-01T06:15:00.000Z")).toBe(false);
  });

  it("blocks a 540-minute meeting by any busy interval inside the workday", () => {
    const envelope = build(msk("2026-11-01T00:00:00"), 540, busyAt1000);

    expect(available(envelope, "2026-11-01T06:00:00.000Z")).toBe(false);
  });

  it("blocks starts that overlap a 10:00–10:30 meeting and keeps touching ends free", () => {
    const envelope = build(msk("2026-11-01T00:00:00"), 30, busyAt1000);

    expect(available(envelope, "2026-11-01T06:30:00.000Z")).toBe(true);
    expect(available(envelope, "2026-11-01T07:00:00.000Z")).toBe(false);
    expect(available(envelope, "2026-11-01T07:15:00.000Z")).toBe(false);
    expect(available(envelope, "2026-11-01T07:30:00.000Z")).toBe(true);
  });

  it("does not validate injected intervals: a 20-minute one blocks what it overlaps", () => {
    const busy: BusyInterval[] = [
      { start: msk("2026-11-01T10:00:00"), end: msk("2026-11-01T10:20:00") },
    ];
    const envelope = build(msk("2026-11-01T00:00:00"), 30, busy);

    expect(available(envelope, "2026-11-01T06:30:00.000Z")).toBe(true);
    expect(available(envelope, "2026-11-01T06:45:00.000Z")).toBe(false);
    expect(available(envelope, "2026-11-01T07:15:00.000Z")).toBe(false);
    expect(available(envelope, "2026-11-01T07:30:00.000Z")).toBe(true);
  });

  it("ignores busy intervals outside the booking window", () => {
    const busy: BusyInterval[] = [
      { start: msk("2030-01-01T10:00:00"), end: msk("2030-01-01T10:30:00") },
    ];
    const envelope = build(msk("2026-11-01T00:00:00"), 30, busy);

    expect(available(envelope, "2026-11-01T06:00:00.000Z")).toBe(true);
  });
});

function meeting(meetingTypeId: string, start: Date): Meeting {
  return {
    id: `meeting-${meetingTypeId}`,
    meetingTypeId,
    start,
    guestName: "Гость",
    guestEmail: "guest@example.com",
  };
}

describe("слоты: занятость из встреч", () => {
  it("joins every meeting with the duration of its meeting type", () => {
    const start = msk("2026-11-01T10:00:00");
    const durations: Record<string, number> = { short: 30, long: 60 };
    const intervals = busyIntervalsFromMeetings(
      [meeting("short", start), meeting("long", start)],
      (meetingTypeId) => durations[meetingTypeId],
    );

    expect(intervals).toEqual([
      { start, end: msk("2026-11-01T10:30:00") },
      { start, end: msk("2026-11-01T11:00:00") },
    ]);
  });

  it("skips meetings whose meeting type is unknown", () => {
    const intervals = busyIntervalsFromMeetings(
      [meeting("missing", msk("2026-11-01T10:00:00"))],
      () => undefined,
    );

    expect(intervals).toEqual([]);
  });
});
