import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createStore } from "./store.js";

function makeApp() {
  return createApp({ store: createStore(), now: () => new Date("2026-11-01T09:00:00.000Z") });
}

const validBody = {
  name: "Кофе с гостем",
  description: "Короткий разговор о задаче",
  durationMinutes: 30,
};

describe("создание типа встречи", () => {
  it("creates a meeting type and shows it on top of the list", async () => {
    const app = makeApp();

    const created = await request(app).post("/api/meeting-types").send(validBody);

    expect(created.status).toBe(201);
    expect(created.body.meetingType).toEqual({
      id: expect.any(String),
      name: "Кофе с гостем",
      description: "Короткий разговор о задаче",
      durationMinutes: 30,
    });

    const list = await request(app).get("/api/meeting-types");

    expect(list.body).toEqual({ meetingTypes: [created.body.meetingType] });
  });

  it("trims the name and collapses its inner whitespace", async () => {
    const app = makeApp();

    const response = await request(app)
      .post("/api/meeting-types")
      .send({ name: "  Кофе \n\t с   гостем  ", durationMinutes: 30 });

    expect(response.status).toBe(201);
    expect(response.body.meetingType.name).toBe("Кофе с гостем");
  });

  it("trims the description but keeps its inner line breaks", async () => {
    const app = makeApp();

    const response = await request(app).post("/api/meeting-types").send({
      name: "Кофе с гостем",
      description: "  Первая строка\nВторая  строка  ",
      durationMinutes: 30,
    });

    expect(response.status).toBe(201);
    expect(response.body.meetingType.description).toBe("Первая строка\nВторая  строка");
  });

  it("stores an absent description as an empty string", async () => {
    const app = makeApp();

    const response = await request(app)
      .post("/api/meeting-types")
      .send({ name: "Кофе с гостем", durationMinutes: 30 });

    expect(response.status).toBe(201);
    expect(response.body.meetingType.description).toBe("");
  });

  it("treats null as an absent value", async () => {
    const app = makeApp();

    const response = await request(app)
      .post("/api/meeting-types")
      .send({ name: "Кофе с гостем", description: null, durationMinutes: 30 });

    expect(response.status).toBe(201);
    expect(response.body.meetingType.description).toBe("");
  });

  it("ignores keys the contract does not describe", async () => {
    const app = makeApp();

    const response = await request(app)
      .post("/api/meeting-types")
      .send({ ...validBody, id: "injected", owner: "someone" });

    expect(response.status).toBe(201);
    expect(response.body.meetingType).not.toHaveProperty("owner");
    expect(response.body.meetingType.id).not.toBe("injected");
  });

  it("collects every invalid field in the contract order in one pass", async () => {
    const app = makeApp();

    const response = await request(app)
      .post("/api/meeting-types")
      .send({ name: "  ", description: 42, durationMinutes: 7 });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
    expect(response.body.error.message).toBe("Проверьте заполнение полей");
    expect(response.body.error.fields).toEqual([
      { field: "name", message: "Название обязательно" },
      { field: "description", message: "Описание должно быть строкой" },
      { field: "durationMinutes", message: "Длительность от 15 до 180 минут" },
    ]);
  });

  it("answers 400 in the shared error envelope for a malformed JSON body", async () => {
    const app = makeApp();

    const response = await request(app)
      .post("/api/meeting-types")
      .set("content-type", "application/json")
      .send('{"name": ');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("validation_error");
    expect(response.body.error.message).toBe("Тело запроса должно быть корректным JSON");
  });

  describe.each([
    {
      title: "an empty body",
      body: {},
      fields: [
        { field: "name", message: "Название обязательно" },
        { field: "durationMinutes", message: "Длительность обязательна" },
      ],
    },
    {
      title: "a name of spaces",
      body: { name: " \t\n ", durationMinutes: 30 },
      fields: [{ field: "name", message: "Название обязательно" }],
    },
    {
      title: "a null name",
      body: { name: null, durationMinutes: 30 },
      fields: [{ field: "name", message: "Название обязательно" }],
    },
    {
      title: "a non-string name",
      body: { name: 42, durationMinutes: 30 },
      fields: [{ field: "name", message: "Название должно быть строкой" }],
    },
    {
      title: "a name longer than 100 characters",
      body: { name: "я".repeat(101), durationMinutes: 30 },
      fields: [{ field: "name", message: "Название не длиннее 100 символов" }],
    },
    {
      title: "a non-string description",
      body: { name: "Кофе с гостем", description: 42, durationMinutes: 30 },
      fields: [{ field: "description", message: "Описание должно быть строкой" }],
    },
    {
      title: "a description longer than 500 characters",
      body: { name: "Кофе с гостем", description: "я".repeat(501), durationMinutes: 30 },
      fields: [{ field: "description", message: "Описание не длиннее 500 символов" }],
    },
    {
      title: "an absent duration",
      body: { name: "Кофе с гостем" },
      fields: [{ field: "durationMinutes", message: "Длительность обязательна" }],
    },
    {
      title: "a null duration",
      body: { name: "Кофе с гостем", durationMinutes: null },
      fields: [{ field: "durationMinutes", message: "Длительность обязательна" }],
    },
    {
      title: "a duration given as a string",
      body: { name: "Кофе с гостем", durationMinutes: "30" },
      fields: [{ field: "durationMinutes", message: "Длительность должна быть целым числом" }],
    },
    {
      title: "a fractional duration",
      body: { name: "Кофе с гостем", durationMinutes: 30.5 },
      fields: [{ field: "durationMinutes", message: "Длительность должна быть целым числом" }],
    },
    {
      title: "a duration below 15 minutes",
      body: { name: "Кофе с гостем", durationMinutes: 0 },
      fields: [{ field: "durationMinutes", message: "Длительность от 15 до 180 минут" }],
    },
    {
      title: "a duration above 180 minutes",
      body: { name: "Кофе с гостем", durationMinutes: 195 },
      fields: [{ field: "durationMinutes", message: "Длительность от 15 до 180 минут" }],
    },
    {
      title: "a duration that is not a multiple of 15",
      body: { name: "Кофе с гостем", durationMinutes: 20 },
      fields: [{ field: "durationMinutes", message: "Длительность должна быть кратна 15 минутам" }],
    },
  ])("rejects $title", ({ body, fields }) => {
    it("answers 400 with the verbatim field messages", async () => {
      const response = await request(makeApp()).post("/api/meeting-types").send(body);

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe("validation_error");
      expect(response.body.error.fields).toEqual(fields);
    });
  });

  describe.each([
    { title: "a name of exactly 100 characters", body: { name: "я".repeat(100) } },
    { title: "a description of exactly 500 characters", body: { description: "я".repeat(500) } },
    { title: "a duration of 15 minutes", body: { durationMinutes: 15 } },
    { title: "a duration of 180 minutes", body: { durationMinutes: 180 } },
    { title: "a duration of 45 minutes", body: { durationMinutes: 45 } },
  ])("accepts $title", ({ body }) => {
    it("creates the meeting type", async () => {
      const response = await request(makeApp())
        .post("/api/meeting-types")
        .send({ name: "Кофе с гостем", durationMinutes: 30, ...body });

      expect(response.status).toBe(201);
    });
  });
});
