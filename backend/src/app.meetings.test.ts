import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createStore, type Meeting } from "./store.js";

// 12:00 in Moscow, the first day of the booking window.
const now = new Date("2026-11-01T09:00:00.000Z");

// A valid start: 13:00 Moscow on the first day of the window.
const validStart = "2026-11-01T10:00:00.000Z";

function makeApp(seedMeetings: readonly Meeting[] = []) {
  const store = createStore({ meetings: seedMeetings });
  const coffee = store.createMeetingType({
    name: "Кофе с гостем",
    description: "Короткий разговор о задаче",
    durationMinutes: 30,
  });
  const project = store.createMeetingType({
    name: "Созвон по проекту",
    description: "Разбор задач на неделю",
    durationMinutes: 60,
  });

  return { app: createApp({ store, now: () => now }), store, coffee, project };
}

function validBody(meetingTypeId: string) {
  return {
    meetingTypeId,
    start: validStart,
    guestName: "Иван Иванов",
    guestEmail: "guest@example.com",
  };
}

async function postStart(start: string, type: "coffee" | "project" = "coffee") {
  const { app, coffee, project } = makeApp();
  const meetingTypeId = type === "coffee" ? coffee.id : project.id;

  return request(app)
    .post("/api/meetings")
    .send({ ...validBody(meetingTypeId), start });
}

describe("запись гостя: POST /api/meetings", () => {
  it("creates a meeting and returns it with a nested meeting type summary", async () => {
    const { app, coffee } = makeApp();

    const response = await request(app).post("/api/meetings").send(validBody(coffee.id));

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      meeting: {
        id: expect.any(String),
        start: validStart,
        guestName: "Иван Иванов",
        guestEmail: "guest@example.com",
        meetingType: {
          id: coffee.id,
          name: "Кофе с гостем",
          durationMinutes: 30,
        },
      },
    });
  });

  it("trims and lowercases the guest email and collapses the guest name", async () => {
    const { app, coffee } = makeApp();

    const response = await request(app)
      .post("/api/meetings")
      .send({
        ...validBody(coffee.id),
        guestName: "  Иван \n\t Иванов  ",
        guestEmail: "  Guest@Example.COM ",
      });

    expect(response.status).toBe(201);
    expect(response.body.meeting.guestName).toBe("Иван Иванов");
    expect(response.body.meeting.guestEmail).toBe("guest@example.com");
  });

  it("takes the duration from the type and computes the end on the server", async () => {
    const { app, project } = makeApp();

    const response = await request(app)
      .post("/api/meetings")
      .send({
        ...validBody(project.id),
        start: "2026-11-02T14:00:00.000Z",
      });

    expect(response.status).toBe(201);
    expect(response.body.meeting.meetingType.durationMinutes).toBe(60);
  });

  it("ignores keys outside the contract and treats null as absent", async () => {
    const { app, coffee } = makeApp();

    const response = await request(app)
      .post("/api/meetings")
      .send({ ...validBody(coffee.id), durationMinutes: 180, guest: "injected" });

    expect(response.status).toBe(201);
    expect(response.body.meeting).not.toHaveProperty("durationMinutes");
    expect(response.body.meeting).not.toHaveProperty("guest");
  });

  it("reads the current moment exactly once per request", async () => {
    const store = createStore();
    const coffee = store.createMeetingType({
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

    await request(app).post("/api/meetings").send(validBody(coffee.id));

    expect(calls).toBe(1);
  });

  it("does not read the current moment when the meeting type is unknown", async () => {
    let calls = 0;
    const store = createStore();
    const app = createApp({
      store,
      now: () => {
        calls += 1;

        return now;
      },
    });

    await request(app).post("/api/meetings").send(validBody("missing"));

    expect(calls).toBe(0);
  });
});

interface SeedMeeting {
  type: "coffee" | "project";
  start: string;
  guestName?: string;
  guestEmail?: string;
}

/** Builds an app whose store already holds the given meetings. */
function makeListApp(seed: readonly SeedMeeting[] = []) {
  const store = createStore();
  const coffee = store.createMeetingType({
    name: "Кофе с гостем",
    description: "Короткий разговор о задаче",
    durationMinutes: 30,
  });
  const project = store.createMeetingType({
    name: "Созвон по проекту",
    description: "Разбор задач на неделю",
    durationMinutes: 60,
  });
  const typeIds = { coffee: coffee.id, project: project.id };

  for (const [index, item] of seed.entries()) {
    const added = store.addMeeting({
      meetingTypeId: typeIds[item.type],
      start: new Date(item.start),
      guestName: item.guestName ?? `Гость ${index}`,
      guestEmail: item.guestEmail ?? `guest${index}@example.com`,
    });

    if (!added.ok) {
      throw new Error(`Не удалось подготовить встречу: ${added.reason}`);
    }
  }

  return { app: createApp({ store, now: () => now }), store, coffee, project };
}

describe("список встреч: GET /api/meetings", () => {
  it("returns only upcoming meetings sorted by start with a nested type summary", async () => {
    const { app, coffee, project } = makeListApp([
      { type: "coffee", start: "2026-11-01T06:00:00.000Z" },
      { type: "coffee", start: "2026-11-01T09:00:00.000Z" },
      { type: "project", start: "2026-11-03T10:00:00.000Z" },
      { type: "coffee", start: "2026-11-02T07:00:00.000Z" },
    ]);

    const response = await request(app).get("/api/meetings");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      meetings: [
        {
          id: expect.any(String),
          start: "2026-11-02T07:00:00.000Z",
          guestName: "Гость 3",
          guestEmail: "guest3@example.com",
          meetingType: {
            id: coffee.id,
            name: "Кофе с гостем",
            durationMinutes: 30,
          },
        },
        {
          id: expect.any(String),
          start: "2026-11-03T10:00:00.000Z",
          guestName: "Гость 2",
          guestEmail: "guest2@example.com",
          meetingType: {
            id: project.id,
            name: "Созвон по проекту",
            durationMinutes: 60,
          },
        },
      ],
    });
  });

  it("does not include a meeting that starts exactly at the current moment", async () => {
    const { app } = makeListApp([{ type: "coffee", start: now.toISOString() }]);

    const response = await request(app).get("/api/meetings");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ meetings: [] });
  });

  it("returns an empty list when nothing is booked", async () => {
    const { app } = makeListApp();

    const response = await request(app).get("/api/meetings");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ meetings: [] });
  });

  it("reads the current moment exactly once per request", async () => {
    const store = createStore();
    store.createMeetingType({ name: "Кофе с гостем", description: "", durationMinutes: 30 });
    let calls = 0;
    const app = createApp({
      store,
      now: () => {
        calls += 1;

        return now;
      },
    });

    await request(app).get("/api/meetings");

    expect(calls).toBe(1);
  });

  it("skips a meeting whose type is unknown, since it has no summary", async () => {
    const store = createStore({
      meetings: [
        {
          id: "orphan",
          meetingTypeId: "missing",
          start: new Date("2026-11-02T07:00:00.000Z"),
          guestName: "Гость",
          guestEmail: "guest@example.com",
        },
      ],
    });
    const app = createApp({ store, now: () => now });

    const response = await request(app).get("/api/meetings");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ meetings: [] });
  });
});

describe("валидация полей встречи", () => {
  const typeId = "type-id";

  describe.each([
    {
      title: "an absent meeting type",
      body: { start: validStart, guestName: "Иван", guestEmail: "guest@example.com" },
      fields: [{ field: "meetingTypeId", message: "Тип встречи обязателен" }],
    },
    {
      title: "a null meeting type",
      body: {
        meetingTypeId: null,
        start: validStart,
        guestName: "Иван",
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "meetingTypeId", message: "Тип встречи обязателен" }],
    },
    {
      title: "an empty meeting type",
      body: {
        meetingTypeId: "  ",
        start: validStart,
        guestName: "Иван",
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "meetingTypeId", message: "Тип встречи обязателен" }],
    },
    {
      title: "a non-string meeting type",
      body: {
        meetingTypeId: 42,
        start: validStart,
        guestName: "Иван",
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "meetingTypeId", message: "Тип встречи должен быть строкой" }],
    },
    {
      title: "an absent start",
      body: { meetingTypeId: typeId, guestName: "Иван", guestEmail: "guest@example.com" },
      fields: [{ field: "start", message: "Старт обязателен" }],
    },
    {
      title: "a null start",
      body: {
        meetingTypeId: typeId,
        start: null,
        guestName: "Иван",
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "start", message: "Старт обязателен" }],
    },
    {
      title: "a non-string start",
      body: {
        meetingTypeId: typeId,
        start: 42,
        guestName: "Иван",
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "start", message: "Старт должен быть строкой" }],
    },
    {
      title: "an absent guest name",
      body: { meetingTypeId: typeId, start: validStart, guestEmail: "guest@example.com" },
      fields: [{ field: "guestName", message: "Имя обязательно" }],
    },
    {
      title: "a null guest name",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: null,
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "guestName", message: "Имя обязательно" }],
    },
    {
      title: "a guest name of spaces",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: " \t\n ",
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "guestName", message: "Имя обязательно" }],
    },
    {
      title: "a non-string guest name",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: 42,
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "guestName", message: "Имя должно быть строкой" }],
    },
    {
      title: "a guest name longer than 100 characters",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "я".repeat(101),
        guestEmail: "guest@example.com",
      },
      fields: [{ field: "guestName", message: "Имя не длиннее 100 символов" }],
    },
    {
      title: "an absent guest email",
      body: { meetingTypeId: typeId, start: validStart, guestName: "Иван" },
      fields: [{ field: "guestEmail", message: "Почта обязательна" }],
    },
    {
      title: "a null guest email",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: null,
      },
      fields: [{ field: "guestEmail", message: "Почта обязательна" }],
    },
    {
      title: "an empty guest email",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: "   ",
      },
      fields: [{ field: "guestEmail", message: "Почта обязательна" }],
    },
    {
      title: "a non-string guest email",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: 42,
      },
      fields: [{ field: "guestEmail", message: "Почта должна быть строкой" }],
    },
    {
      title: "a guest email without a dog",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: "guest.example.com",
      },
      fields: [{ field: "guestEmail", message: "Почта должна быть в формате name@example.com" }],
    },
    {
      title: "a guest email with two dogs",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: "guest@@example.com",
      },
      fields: [{ field: "guestEmail", message: "Почта должна быть в формате name@example.com" }],
    },
    {
      title: "a guest email with an empty local part",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: "@example.com",
      },
      fields: [{ field: "guestEmail", message: "Почта должна быть в формате name@example.com" }],
    },
    {
      title: "a guest email without a dot in the domain",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: "guest@example",
      },
      fields: [{ field: "guestEmail", message: "Почта должна быть в формате name@example.com" }],
    },
    {
      title: "a guest email with a space",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: "guest name@example.com",
      },
      fields: [{ field: "guestEmail", message: "Почта должна быть в формате name@example.com" }],
    },
    {
      title: "a guest email longer than 254 characters",
      body: {
        meetingTypeId: typeId,
        start: validStart,
        guestName: "Иван",
        guestEmail: `${"a".repeat(243)}@example.com`,
      },
      fields: [{ field: "guestEmail", message: "Почта не длиннее 254 символов" }],
    },
  ])("rejects $title", ({ body, fields }) => {
    it("answers 400 with the verbatim field message", async () => {
      const response = await request(makeApp().app).post("/api/meetings").send(body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("validation_error");
      expect(response.body.error.message).toBe("Проверьте заполнение полей");
      expect(response.body.error.fields).toEqual(fields);
    });
  });

  it("collects every invalid field in the contract order in one pass", async () => {
    const response = await request(makeApp().app).post("/api/meetings").send({
      meetingTypeId: "  ",
      start: 42,
      guestName: 42,
      guestEmail: 42,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toEqual([
      { field: "meetingTypeId", message: "Тип встречи обязателен" },
      { field: "start", message: "Старт должен быть строкой" },
      { field: "guestName", message: "Имя должно быть строкой" },
      { field: "guestEmail", message: "Почта должна быть строкой" },
    ]);
  });
});

describe("правила старта встречи", () => {
  describe.each([
    { title: "a date without a time", start: "2026-11-02" },
    { title: "an arbitrary string", start: "tomorrow" },
    { title: "an offset instead of Z", start: "2026-11-02T10:00:00+03:00" },
    { title: "no time zone", start: "2026-11-02T10:00:00" },
    { title: "a nonexistent date", start: "2026-02-30T10:00:00.000Z" },
  ])("rejects $title as a format error", ({ start }) => {
    it("answers 400 with the format message", async () => {
      const response = await postStart(start);

      expect(response.status).toBe(400);
      expect(response.body.error.fields).toEqual([
        { field: "start", message: "Старт должен быть датой ISO 8601 в UTC" },
      ]);
    });
  });

  describe.each([
    { title: "not on the 15-minute grid", start: "2026-11-02T10:05:00.000Z" },
    { title: "with seconds on the grid", start: "2026-11-02T10:00:30.000Z" },
  ])("rejects a start $title", ({ start }) => {
    it("answers 400 with the grid message", async () => {
      const response = await postStart(start);

      expect(response.status).toBe(400);
      expect(response.body.error.fields).toEqual([
        { field: "start", message: "Старт должен быть на сетке 15 минут" },
      ]);
    });
  });

  describe.each([
    { title: "before the window", start: "2026-10-31T10:00:00.000Z" },
    { title: "after the window", start: "2026-11-15T10:00:00.000Z" },
  ])("rejects a start $title", ({ start }) => {
    it("answers 400 with the window message", async () => {
      const response = await postStart(start);

      expect(response.status).toBe(400);
      expect(response.body.error.fields).toEqual([
        { field: "start", message: "Старт вне окна записи" },
      ]);
    });
  });

  describe.each([
    { title: "before working hours", start: "2026-11-02T05:45:00.000Z" },
    { title: "whose interval ends after working hours", start: "2026-11-02T14:45:00.000Z" },
  ])("rejects a start $title", ({ start }) => {
    it("answers 400 with the working hours message", async () => {
      const response = await postStart(start);

      expect(response.status).toBe(400);
      expect(response.body.error.fields).toEqual([
        { field: "start", message: "Старт вне рабочих часов" },
      ]);
    });
  });

  it("rejects a start that is not strictly after the current moment", async () => {
    const response = await postStart("2026-11-01T08:00:00.000Z");

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toEqual([
      { field: "start", message: "Старт должен быть позже текущего момента" },
    ]);
  });

  it("rejects a start with the current moment exactly", async () => {
    const response = await postStart(now.toISOString());

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toEqual([
      { field: "start", message: "Старт должен быть позже текущего момента" },
    ]);
  });

  it("rejects 17:45 for a 30-minute type because the interval leaves working hours", async () => {
    const response = await postStart("2026-11-02T14:45:00.000Z", "coffee");

    expect(response.status).toBe(400);
    expect(response.body.error.fields).toEqual([
      { field: "start", message: "Старт вне рабочих часов" },
    ]);
  });

  it("accepts 17:30 for a 30-minute type and 17:00 for a 60-minute type", async () => {
    const coffee = await postStart("2026-11-02T14:30:00.000Z", "coffee");
    const project = await postStart("2026-11-02T14:00:00.000Z", "project");

    expect(coffee.status).toBe(201);
    expect(project.status).toBe(201);
  });

  it("accepts the first start of the window", async () => {
    const response = await postStart("2026-11-02T06:00:00.000Z", "project");

    expect(response.status).toBe(201);
  });
});

describe("порядок проверок", () => {
  it("answers 400, not 404, when the body is invalid and the type is unknown", async () => {
    const { app } = makeApp();

    const response = await request(app).post("/api/meetings").send({
      meetingTypeId: "missing",
      start: "2026-11-02T10:05:00.000Z",
      guestName: "  ",
      guestEmail: "not-an-email",
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
    expect(response.body.error.fields).toEqual([
      { field: "guestName", message: "Имя обязательно" },
      { field: "guestEmail", message: "Почта должна быть в формате name@example.com" },
    ]);
  });

  it("answers 400, not 409, when a field is invalid and the slot is busy", async () => {
    const { app, coffee, store } = makeApp();

    await request(app).post("/api/meetings").send(validBody(coffee.id));

    const response = await request(app)
      .post("/api/meetings")
      .send({
        ...validBody(coffee.id),
        guestEmail: "not-an-email",
      });

    expect(response.status).toBe(400);
    expect(store.listMeetings()).toHaveLength(1);
  });

  it("answers 404, not 400, when the type is unknown and the start breaks the rules", async () => {
    const { app } = makeApp();

    const response = await request(app).post("/api/meetings").send({
      meetingTypeId: "missing",
      start: "2026-11-02T10:05:00.000Z",
      guestName: "Иван Иванов",
      guestEmail: "guest@example.com",
    });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: { code: "not_found", message: "Тип встречи не найден" },
    });
  });

  it("answers 409 only after the type and the start are valid", async () => {
    const { app, coffee } = makeApp();

    await request(app).post("/api/meetings").send(validBody(coffee.id));

    const response = await request(app).post("/api/meetings").send(validBody(coffee.id));

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("slot_conflict");
  });
});

describe("конфликт слота", () => {
  it("contains no data about the meeting or guest that took the slot", async () => {
    const { app, coffee } = makeApp();

    await request(app)
      .post("/api/meetings")
      .send({
        ...validBody(coffee.id),
        guestName: "Первый Гость",
        guestEmail: "first@example.com",
      });

    const response = await request(app)
      .post("/api/meetings")
      .send({
        ...validBody(coffee.id),
        guestName: "Второй Гость",
        guestEmail: "second@example.com",
      });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      error: { code: "slot_conflict", message: "Это время уже заняли" },
    });
    expect(JSON.stringify(response.body)).not.toContain("Первый Гость");
    expect(JSON.stringify(response.body)).not.toContain("first@example.com");
    expect(response.body.error).not.toHaveProperty("meeting");
  });

  it("определяет частичное пересечение разных типов", async () => {
    const { app, coffee, project } = makeApp();

    const first = await request(app)
      .post("/api/meetings")
      .send({ ...validBody(coffee.id), start: "2026-11-02T10:00:00.000Z" });

    const overlapping = await request(app)
      .post("/api/meetings")
      .send({ ...validBody(project.id), start: "2026-11-02T10:15:00.000Z" });

    expect(first.status).toBe(201);
    expect(overlapping.status).toBe(409);
    expect(overlapping.body.error.code).toBe("slot_conflict");
  });

  it("разрешает касание концов: новая встреча начинается в момент окончания", async () => {
    const { app, coffee, project } = makeApp();

    await request(app)
      .post("/api/meetings")
      .send({ ...validBody(coffee.id), start: "2026-11-02T10:00:00.000Z" });

    const touching = await request(app)
      .post("/api/meetings")
      .send({ ...validBody(project.id), start: "2026-11-02T10:30:00.000Z" });

    expect(touching.status).toBe(201);
  });
});

describe("гонка за один слот", () => {
  it("gives exactly one success and nine conflicts for ten parallel bookings", async () => {
    const store = createStore();
    const coffee = store.createMeetingType({
      name: "Кофе с гостем",
      description: "",
      durationMinutes: 30,
    });
    const app = createApp({ store, now: () => now });

    const responses = await Promise.all(
      Array.from({ length: 10 }, (_unused, index) =>
        request(app)
          .post("/api/meetings")
          .send({
            ...validBody(coffee.id),
            guestName: `Гость ${index}`,
            guestEmail: `guest${index}@example.com`,
          }),
      ),
    );

    expect(responses.filter((response) => response.status === 201)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(9);
    expect(
      responses.every(
        (response) => response.status === 201 || response.body.error?.code === "slot_conflict",
      ),
    ).toBe(true);
    expect(store.listMeetings()).toHaveLength(1);
    expect(store.listMeetings()[0]?.start.toISOString()).toBe(validStart);
  });
});
