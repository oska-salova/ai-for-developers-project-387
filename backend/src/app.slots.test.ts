import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createStore } from "./store.js";

const now = new Date("2026-11-01T06:00:00.000Z");

function makeApp() {
  const store = createStore();
  const meetingType = store.createMeetingType({
    name: "Кофе с гостем",
    description: "",
    durationMinutes: 30,
  });

  return { app: createApp({ store, now: () => now }), meetingType };
}

describe("слоты: GET /api/meeting-types/:id/slots", () => {
  it("returns the slots envelope with exactly the contract fields", async () => {
    const { app, meetingType } = makeApp();

    const response = await request(app).get(`/api/meeting-types/${meetingType.id}/slots`);

    expect(response.status).toBe(200);
    expect(Object.keys(response.body).toSorted()).toEqual(["days", "timezone", "window"]);
    expect(response.body.window).toEqual({ start: "2026-11-01", end: "2026-11-14" });
    expect(response.body.timezone).toBe("Europe/Moscow");
    expect(response.body.days).toHaveLength(14);

    for (const day of response.body.days) {
      expect(Object.keys(day).toSorted()).toEqual(["date", "slots"]);
      expect(day.slots).toHaveLength(36);

      for (const slot of day.slots) {
        expect(Object.keys(slot).toSorted()).toEqual(["available", "start"]);
      }
    }

    expect(response.body.days[0].slots[0]).toEqual({
      start: "2026-11-01T06:00:00.000Z",
      available: false,
    });
    expect(response.body.days[0].slots[1]).toEqual({
      start: "2026-11-01T06:15:00.000Z",
      available: true,
    });
  });

  it("reads the current moment exactly once per response", async () => {
    const store = createStore();
    const meetingType = store.createMeetingType({
      name: "Кофе с гостем",
      description: "",
      durationMinutes: 30,
    });
    let calls = 0;
    const app = createApp({
      store,
      now: () => {
        calls += 1;

        return now;
      },
    });

    await request(app).get(`/api/meeting-types/${meetingType.id}/slots`);

    expect(calls).toBe(1);
  });

  it("answers 404 in the shared envelope for an unknown meeting type", async () => {
    const store = createStore();
    let calls = 0;
    const app = createApp({
      store,
      now: () => {
        calls += 1;

        return now;
      },
    });

    const response = await request(app).get("/api/meeting-types/missing/slots");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "not_found", message: "Тип встречи не найден" },
    });
    expect(calls).toBe(0);
  });
});
