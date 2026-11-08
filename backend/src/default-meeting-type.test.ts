import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { seedDefaultMeetingType } from "./default-meeting-type.js";
import { createStore } from "./store.js";

describe("тип встречи по умолчанию", () => {
  it("оставляет ровно один тип «Знакомство» на 30 минут с описанием", async () => {
    const store = createStore();
    seedDefaultMeetingType(store);
    const app = createApp({ store, now: () => new Date("2026-11-01T09:00:00.000Z") });

    const response = await request(app).get("/api/meeting-types");

    expect(response.status).toBe(200);
    expect(response.body.meetingTypes).toHaveLength(1);
    expect(response.body.meetingTypes[0]).toMatchObject({
      id: expect.any(String),
      name: "Знакомство",
      description: "Познакомимся и обсудим, чем я могу помочь.",
      durationMinutes: 30,
    });
  });
});
