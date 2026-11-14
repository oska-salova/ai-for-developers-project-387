import { describe, expect, it } from "vitest";
import { createStore, type Meeting } from "./store.js";

describe("meeting type store", () => {
  it("finds a stored meeting type by its id", () => {
    const store = createStore();
    const created = store.createMeetingType({
      name: "Кофе с гостем",
      description: "",
      durationMinutes: 30,
    });

    expect(store.findMeetingType(created.id)).toEqual(created);
  });

  it("returns nothing for an unknown id", () => {
    const store = createStore();

    expect(store.findMeetingType("missing")).toBeUndefined();
  });
});

describe("meeting store", () => {
  it("deletes a meeting synchronously and forgets it", () => {
    const meeting: Meeting = {
      id: "meeting-1",
      meetingTypeId: "type-1",
      start: new Date("2026-11-14T10:00:00.000Z"),
      guestName: "Гость",
      guestEmail: "guest@example.com",
    };
    const store = createStore({ meetings: [meeting] });

    const removed = store.deleteMeeting(meeting.id);

    expect(removed).toEqual(meeting);
    expect(removed).not.toHaveProperty("then");
    expect(store.deleteMeeting(meeting.id)).toBeUndefined();
  });
});
