import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createStore, type MeetingTypeStore } from "./store.js";

function makeApp(seed: MeetingTypeStore | undefined = undefined) {
  const store = seed ?? createStore();

  return createApp({ store, now: () => new Date("2026-11-01T09:00:00.000Z") });
}

describe("GET /health", () => {
  it("reports the service as healthy", async () => {
    const response = await request(makeApp()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("allows the frontend origin", async () => {
    const response = await request(makeApp()).get("/health").set("Origin", "http://localhost:3000");

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
  });

  it("does not allow an unknown origin", async () => {
    const response = await request(makeApp())
      .get("/health")
      .set("Origin", "http://example.invalid");

    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });
});

describe("GET /api/meeting-types", () => {
  it("returns an empty list when the owner has no meeting types", async () => {
    const response = await request(makeApp()).get("/api/meeting-types");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ meetingTypes: [] });
  });

  it("returns every meeting type with the newest first", async () => {
    const store = createStore();
    const first = store.createMeetingType({
      name: "Кофе с гостем",
      description: "Короткий разговор о задаче",
      durationMinutes: 30,
    });
    const second = store.createMeetingType({
      name: "Созвон по проекту",
      description: "",
      durationMinutes: 60,
    });

    const response = await request(makeApp(store)).get("/api/meeting-types");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ meetingTypes: [second, first] });
  });
});

describe("unknown routes", () => {
  it("answers with the not_found error envelope", async () => {
    const response = await request(makeApp()).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "not_found", message: "Маршрут не найден" },
    });
  });
});

describe("unexpected failures", () => {
  it("answers with the internal_error envelope instead of an HTML page", async () => {
    const store: MeetingTypeStore = {
      ...createStore(),
      listMeetingTypes() {
        throw new Error("Хранилище недоступно");
      },
    };

    const response = await request(makeApp(store)).get("/api/meeting-types");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: { code: "internal_error", message: "Внутренняя ошибка сервера" },
    });
  });
});
