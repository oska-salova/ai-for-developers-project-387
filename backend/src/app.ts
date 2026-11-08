import cors from "cors";
import express, { type Express } from "express";
import type { components } from "./generated/openapi.js";
import {
  MEETING_TYPE_NOT_FOUND_MESSAGE,
  parseMeetingFields,
  parseMeetingStart,
  SLOT_CONFLICT_MESSAGE,
} from "./meeting-input.js";
import { parseCreateMeetingType } from "./meeting-type-input.js";
import { INTERNAL_ERROR_MESSAGE, MALFORMED_JSON_MESSAGE, VALIDATION_MESSAGE } from "./messages.js";
import { buildSlots, busyIntervalsFromMeetings } from "./slots.js";
import type { Meeting, MeetingTypeStore } from "./store.js";

const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export interface AppDependencies {
  store: MeetingTypeStore;
  /** The current moment, injected so tests can pin it. */
  now: () => Date;
}

type MeetingType = components["schemas"]["MeetingType"];
type MeetingTypeListBody = components["schemas"]["MeetingTypeList"];
type MeetingTypeCreatedBody = components["schemas"]["MeetingTypeCreatedBody"];
type MeetingBody = components["schemas"]["Meeting"];
type MeetingListBody = components["schemas"]["MeetingList"];
type MeetingCreatedBody = components["schemas"]["MeetingCreatedBody"];
type ErrorBody = components["schemas"]["ErrorBody"];
type ErrorBodyEnvelope = components["schemas"]["ErrorBodyEnvelope"];
type ErrorField = components["schemas"]["ErrorField"];

/** The machine codes of the shared error envelope. */
const ERROR_CODES = {
  validation: "validation_error",
  notFound: "not_found",
  slotConflict: "slot_conflict",
  internal: "internal_error",
} as const;

type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

function errorEnvelope(code: ErrorCode, message: string, fields?: ErrorField[]): ErrorBodyEnvelope {
  const error: ErrorBody = { code, message };

  if (fields !== undefined) {
    error.fields = fields;
  }

  return { error };
}

function validationEnvelope(fields: ErrorField[]): ErrorBodyEnvelope {
  return errorEnvelope(ERROR_CODES.validation, VALIDATION_MESSAGE, fields);
}

/** The wire shape of a meeting: a type summary, never a snapshot. */
function meetingBody(meeting: Meeting, meetingType: MeetingType): MeetingBody {
  return {
    id: meeting.id,
    start: meeting.start.toISOString(),
    guestName: meeting.guestName,
    guestEmail: meeting.guestEmail,
    meetingType: {
      id: meetingType.id,
      name: meetingType.name,
      durationMinutes: meetingType.durationMinutes,
    },
  };
}

function isMalformedJson(error: unknown): boolean {
  return (
    error instanceof SyntaxError &&
    "status" in error &&
    (error as { status?: unknown }).status === 400
  );
}

/**
 * Builds the HTTP app around its dependencies. Tests get a fresh store and a
 * fixed clock per test; the server entry point passes the real ones.
 */
export function createApp({ store, now }: AppDependencies): Express {
  const app = express();

  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, origin === undefined || origin === corsOrigin);
      },
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/meeting-types", (_req, res) => {
    const body: MeetingTypeListBody = { meetingTypes: store.listMeetingTypes() };

    res.status(200).json(body);
  });

  app.post("/api/meeting-types", (req, res) => {
    const parsed = parseCreateMeetingType(req.body);

    if (!parsed.ok) {
      res.status(400).json(validationEnvelope(parsed.fields));

      return;
    }

    const body: MeetingTypeCreatedBody = {
      meetingType: store.createMeetingType(parsed.value),
    };

    res.status(201).json(body);
  });

  app.get("/api/meeting-types/:id/slots", (req, res) => {
    const meetingType = store.findMeetingType(req.params.id);

    if (meetingType === undefined) {
      res.status(404).json(errorEnvelope(ERROR_CODES.notFound, MEETING_TYPE_NOT_FOUND_MESSAGE));

      return;
    }

    const body = buildSlots({
      durationMinutes: meetingType.durationMinutes,
      busy: busyIntervalsFromMeetings(
        store.listMeetings(),
        (meetingTypeId) => store.findMeetingType(meetingTypeId)?.durationMinutes,
      ),
      now: now(),
    });

    res.status(200).json(body);
  });

  app.get("/api/meetings", (_req, res) => {
    // The current moment is read once: the same instant filters every meeting.
    const currentMoment = now();
    const upcoming = store
      .listMeetings()
      .filter((meeting) => meeting.start.getTime() > currentMoment.getTime())
      .toSorted((left, right) => left.start.getTime() - right.start.getTime());

    const meetings = upcoming.flatMap((meeting) => {
      const meetingType = store.findMeetingType(meeting.meetingTypeId);

      // A meeting without a type cannot be produced by the API, and it has no
      // summary to show; the slots engine skips such meetings too.
      return meetingType === undefined ? [] : [meetingBody(meeting, meetingType)];
    });

    const body: MeetingListBody = { meetings };

    res.status(200).json(body);
  });

  app.post("/api/meetings", (req, res) => {
    // Order is part of the contract: fields, then the type, then start rules,
    // then the overlap check inside the store.
    const parsed = parseMeetingFields(req.body);

    if (!parsed.ok) {
      res.status(400).json(validationEnvelope(parsed.fields));

      return;
    }

    const meetingType = store.findMeetingType(parsed.value.meetingTypeId);

    if (meetingType === undefined) {
      res.status(404).json(errorEnvelope(ERROR_CODES.notFound, MEETING_TYPE_NOT_FOUND_MESSAGE));

      return;
    }

    const start = parseMeetingStart(parsed.value.start, meetingType.durationMinutes, now());

    if (!start.ok) {
      res.status(400).json(validationEnvelope([start.error]));

      return;
    }

    const added = store.addMeeting({
      meetingTypeId: parsed.value.meetingTypeId,
      start: start.value,
      guestName: parsed.value.guestName,
      guestEmail: parsed.value.guestEmail,
    });

    if (!added.ok) {
      if (added.reason === "meeting_type_not_found") {
        res.status(404).json(errorEnvelope(ERROR_CODES.notFound, MEETING_TYPE_NOT_FOUND_MESSAGE));

        return;
      }

      // A conflict says nothing about the meeting that took the slot.
      res.status(409).json(errorEnvelope(ERROR_CODES.slotConflict, SLOT_CONFLICT_MESSAGE));

      return;
    }

    const body: MeetingCreatedBody = {
      meeting: meetingBody(added.meeting, meetingType),
    };

    res.status(201).json(body);
  });

  app.use((_req, res) => {
    res.status(404).json(errorEnvelope(ERROR_CODES.notFound, "Маршрут не найден"));
  });

  // express.json() rejects a broken body before any route runs; the answer
  // still has to use the shared error envelope. Anything else that reaches
  // this middleware is unexpected: answer with the envelope, never with the
  // HTML page and stack of Express's default handler.
  app.use(
    (error: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (res.headersSent) {
        next(error);

        return;
      }

      if (isMalformedJson(error)) {
        res.status(400).json(errorEnvelope(ERROR_CODES.validation, MALFORMED_JSON_MESSAGE));

        return;
      }

      res.status(500).json(errorEnvelope(ERROR_CODES.internal, INTERNAL_ERROR_MESSAGE));
    },
  );

  return app;
}
