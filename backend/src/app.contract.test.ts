import SwaggerParser from "@apidevtools/swagger-parser";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";
import { createStore, type MeetingTypeStore } from "./store.js";

// The contract is the source of truth: these tests check that the real server
// answers with codes and bodies the committed OpenAPI document declares.
const openapiPath = fileURLToPath(new URL("../../contract/openapi/openapi.json", import.meta.url));

interface ResponseObject {
  description?: string;
  content?: Record<string, { schema?: unknown }>;
}

interface OperationObject {
  responses?: Record<string, ResponseObject>;
}

interface DocumentObject {
  paths?: Record<string, Record<string, OperationObject | undefined> | undefined>;
  components?: unknown;
}

interface ValidatorArgs {
  responses: Record<string, ResponseObject>;
  components?: unknown;
}

interface ValidatorModule {
  default: new (args: ValidatorArgs) => {
    validateResponse: (status: number, body: unknown) => unknown;
  };
}

// openapi-response-validator is CommonJS: its class is `exports.default`, and
// Node's ESM interop hands the whole exports object to a default import.
const require = createRequire(import.meta.url);
const OpenAPIResponseValidator = (require("openapi-response-validator") as ValidatorModule).default;

let documentPromise: Promise<DocumentObject> | undefined;

function loadDocument(): Promise<DocumentObject> {
  documentPromise ??= SwaggerParser.dereference(openapiPath) as unknown as Promise<DocumentObject>;

  return documentPromise;
}

async function validateResponse(
  path: string,
  method: "get" | "post",
  status: number,
  body: unknown,
): Promise<void> {
  const document = await loadDocument();
  const operation = document.paths?.[path]?.[method];

  if (operation?.responses === undefined) {
    throw new Error(`The contract does not describe ${method.toUpperCase()} ${path}`);
  }

  const validator = new OpenAPIResponseValidator({
    responses: operation.responses as ValidatorArgs["responses"],
    components: document.components as ValidatorArgs["components"],
  });
  const error: unknown = validator.validateResponse(status, body);

  if (error !== undefined) {
    throw new Error(JSON.stringify(error));
  }
}

function makeApp() {
  const store = createStore();
  store.createMeetingType({
    name: "Кофе с гостем",
    description: "Короткий разговор о задаче",
    durationMinutes: 30,
  });

  return createApp({ store, now: () => new Date("2026-11-01T09:00:00.000Z") });
}

function makeSlotsApp() {
  const store = createStore();
  const meetingType = store.createMeetingType({
    name: "Кофе с гостем",
    description: "Короткий разговор о задаче",
    durationMinutes: 30,
  });

  return {
    app: createApp({ store, now: () => new Date("2026-11-01T09:00:00.000Z") }),
    meetingTypeId: meetingType.id,
  };
}

function makeMeetingsApp() {
  const store = createStore();
  const meetingType = store.createMeetingType({
    name: "Кофе с гостем",
    description: "Короткий разговор о задаче",
    durationMinutes: 30,
  });

  return {
    app: createApp({ store, now: () => new Date("2026-11-01T09:00:00.000Z") }),
    meetingTypeId: meetingType.id,
  };
}

const failing = (): never => {
  throw new Error("Хранилище недоступно");
};

/** A store whose every operation fails, as an unexpected internal error would. */
function makeThrowingApp() {
  const store: MeetingTypeStore = {
    listMeetingTypes: failing,
    createMeetingType: failing,
    findMeetingType: failing,
    listMeetings: failing,
    addMeeting: failing,
  };

  return createApp({ store, now: () => new Date("2026-11-01T09:00:00.000Z") });
}

const validMeeting = (meetingTypeId: string) => ({
  meetingTypeId,
  start: "2026-11-02T10:00:00.000Z",
  guestName: "Иван Иванов",
  guestEmail: "guest@example.com",
});

describe("contract compliance", () => {
  it("validates the 200 body of GET /api/meeting-types", async () => {
    const response = await request(makeApp()).get("/api/meeting-types");

    expect(response.status).toBe(200);
    await validateResponse("/api/meeting-types", "get", response.status, response.body);
  });

  it("validates the 201 body of POST /api/meeting-types", async () => {
    const response = await request(makeApp()).post("/api/meeting-types").send({
      name: "Созвон по проекту",
      description: "Разбор задач на неделю",
      durationMinutes: 60,
    });

    expect(response.status).toBe(201);
    await validateResponse("/api/meeting-types", "post", response.status, response.body);
  });

  it("validates the 400 body of POST /api/meeting-types with invalid fields", async () => {
    const response = await request(makeApp())
      .post("/api/meeting-types")
      .send({ name: "  ", durationMinutes: 20 });

    expect(response.status).toBe(400);
    await validateResponse("/api/meeting-types", "post", response.status, response.body);
  });

  it("validates the 400 body of POST /api/meeting-types with a malformed JSON body", async () => {
    const response = await request(makeApp())
      .post("/api/meeting-types")
      .set("content-type", "application/json")
      .send('{"name": ');

    expect(response.status).toBe(400);
    await validateResponse("/api/meeting-types", "post", response.status, response.body);
  });

  it("rejects an extra field, so sealed schemas are enforced", async () => {
    const body = {
      meetingTypes: [
        { id: "id", name: "Кофе с гостем", description: "", durationMinutes: 30, extra: true },
      ],
    };

    await expect(validateResponse("/api/meeting-types", "get", 200, body)).rejects.toThrow();
  });

  it("rejects a body that is missing a required field", async () => {
    const body = { meetingTypes: [{ name: "Кофе с гостем" }] };

    await expect(validateResponse("/api/meeting-types", "get", 200, body)).rejects.toThrow();
  });

  it("validates the 200 body of GET /api/meeting-types/:id/slots", async () => {
    const { app, meetingTypeId } = makeSlotsApp();

    const response = await request(app).get(`/api/meeting-types/${meetingTypeId}/slots`);

    expect(response.status).toBe(200);
    await validateResponse("/api/meeting-types/{id}/slots", "get", response.status, response.body);
  });

  it("validates the 404 body of GET /api/meeting-types/:id/slots", async () => {
    const { app } = makeSlotsApp();

    const response = await request(app).get("/api/meeting-types/missing/slots");

    expect(response.status).toBe(404);
    await validateResponse("/api/meeting-types/{id}/slots", "get", response.status, response.body);
  });

  it("rejects an extra field inside a slot, so nested sealed schemas are enforced", async () => {
    const { app, meetingTypeId } = makeSlotsApp();

    const response = await request(app).get(`/api/meeting-types/${meetingTypeId}/slots`);
    const body = structuredClone(response.body) as {
      days: { slots: Record<string, unknown>[] }[];
    };
    const firstSlot = body.days[0]?.slots[0];

    if (firstSlot === undefined) {
      throw new Error("The slots response has no first slot");
    }

    firstSlot.extra = true;

    await expect(
      validateResponse("/api/meeting-types/{id}/slots", "get", 200, body),
    ).rejects.toThrow();
  });

  it("validates the 200 body of GET /api/meetings with upcoming meetings", async () => {
    const { app, meetingTypeId } = makeMeetingsApp();

    await request(app).post("/api/meetings").send(validMeeting(meetingTypeId));
    const response = await request(app).get("/api/meetings");

    expect(response.status).toBe(200);
    await validateResponse("/api/meetings", "get", response.status, response.body);
  });

  it("validates the 200 body of GET /api/meetings when the list is empty", async () => {
    const { app } = makeMeetingsApp();

    const response = await request(app).get("/api/meetings");

    expect(response.status).toBe(200);
    await validateResponse("/api/meetings", "get", response.status, response.body);
  });

  it("validates the 201 body of POST /api/meetings", async () => {
    const { app, meetingTypeId } = makeMeetingsApp();

    const response = await request(app).post("/api/meetings").send(validMeeting(meetingTypeId));

    expect(response.status).toBe(201);
    await validateResponse("/api/meetings", "post", response.status, response.body);
  });

  it("validates the 400 body of POST /api/meetings with invalid fields", async () => {
    const { app, meetingTypeId } = makeMeetingsApp();

    const response = await request(app)
      .post("/api/meetings")
      .send({ ...validMeeting(meetingTypeId), guestEmail: "not-an-email" });

    expect(response.status).toBe(400);
    await validateResponse("/api/meetings", "post", response.status, response.body);
  });

  it("validates the 400 body of POST /api/meetings with a malformed JSON body", async () => {
    const { app } = makeMeetingsApp();

    const response = await request(app)
      .post("/api/meetings")
      .set("content-type", "application/json")
      .send('{"meetingTypeId": ');

    expect(response.status).toBe(400);
    await validateResponse("/api/meetings", "post", response.status, response.body);
  });

  it("validates the 404 body of POST /api/meetings with an unknown meeting type", async () => {
    const { app } = makeMeetingsApp();

    const response = await request(app).post("/api/meetings").send(validMeeting("missing"));

    expect(response.status).toBe(404);
    await validateResponse("/api/meetings", "post", response.status, response.body);
  });

  it("validates the 409 body of POST /api/meetings on a taken slot", async () => {
    const { app, meetingTypeId } = makeMeetingsApp();

    await request(app).post("/api/meetings").send(validMeeting(meetingTypeId));

    const response = await request(app).post("/api/meetings").send(validMeeting(meetingTypeId));

    expect(response.status).toBe(409);
    await validateResponse("/api/meetings", "post", response.status, response.body);
  });

  describe("internal errors", () => {
    it("validates the 500 body of GET /api/meeting-types", async () => {
      const response = await request(makeThrowingApp()).get("/api/meeting-types");

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: { code: "internal_error" } });
      await validateResponse("/api/meeting-types", "get", response.status, response.body);
    });

    it("validates the 500 body of POST /api/meeting-types", async () => {
      const response = await request(makeThrowingApp()).post("/api/meeting-types").send({
        name: "Созвон по проекту",
        durationMinutes: 60,
      });

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: { code: "internal_error" } });
      await validateResponse("/api/meeting-types", "post", response.status, response.body);
    });

    it("validates the 500 body of GET /api/meeting-types/:id/slots", async () => {
      const response = await request(makeThrowingApp()).get("/api/meeting-types/id/slots");

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: { code: "internal_error" } });
      await validateResponse(
        "/api/meeting-types/{id}/slots",
        "get",
        response.status,
        response.body,
      );
    });

    it("validates the 500 body of GET /api/meetings", async () => {
      const response = await request(makeThrowingApp()).get("/api/meetings");

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: { code: "internal_error" } });
      await validateResponse("/api/meetings", "get", response.status, response.body);
    });

    it("validates the 500 body of POST /api/meetings", async () => {
      const response = await request(makeThrowingApp())
        .post("/api/meetings")
        .send(validMeeting("id"));

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({ error: { code: "internal_error" } });
      await validateResponse("/api/meetings", "post", response.status, response.body);
    });
  });
});
