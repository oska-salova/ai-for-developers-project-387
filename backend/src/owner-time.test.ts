import { describe, expect, it } from "vitest";
import { addDays, ownerDate, ownerTimeInstant } from "./owner-time.js";

describe("owner time", () => {
  it("starts the owner's day at midnight Moscow time", () => {
    expect(ownerDate(new Date("2026-10-31T20:59:59.999Z"))).toBe("2026-10-31");
    expect(ownerDate(new Date("2026-10-31T21:00:00.000Z"))).toBe("2026-11-01");
  });

  it("turns an owner's date and time into an instant with a fixed +03:00 offset", () => {
    expect(ownerTimeInstant("2026-11-01", 9 * 60).toISOString()).toBe("2026-11-01T06:00:00.000Z");
    expect(ownerTimeInstant("2026-11-01", 17 * 60 + 45).toISOString()).toBe(
      "2026-11-01T14:45:00.000Z",
    );
  });

  it("keeps the same offset all year, without DST transitions", () => {
    const cases = [
      ["2026-01-15", "2026-01-14T21:00:00.000Z"],
      ["2026-03-29", "2026-03-28T21:00:00.000Z"],
      ["2026-07-01", "2026-06-30T21:00:00.000Z"],
      ["2026-10-25", "2026-10-24T21:00:00.000Z"],
    ] as const;

    for (const [date, instant] of cases) {
      expect(ownerTimeInstant(date, 0).toISOString()).toBe(instant);
      expect(ownerDate(new Date(instant))).toBe(date);
    }
  });

  it("adds calendar days across month and year boundaries", () => {
    expect(addDays("2026-11-01", 13)).toBe("2026-11-14");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});
