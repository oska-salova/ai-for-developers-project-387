import { asRecord, readField } from "./body-input.js";
import type { components } from "./generated/openapi.js";
import type { NewMeetingType } from "./store.js";
import { normalizeSpaces } from "./text.js";

type ErrorField = components["schemas"]["ErrorField"];

/**
 * The verbatim field messages of `POST /api/meeting-types`. They are part of
 * the contract: the owner's form shows them under the fields as they are.
 */
const FIELD_MESSAGES = {
  nameRequired: "Название обязательно",
  nameNotString: "Название должно быть строкой",
  nameTooLong: "Название не длиннее 100 символов",
  descriptionNotString: "Описание должно быть строкой",
  descriptionTooLong: "Описание не длиннее 500 символов",
  durationRequired: "Длительность обязательна",
  durationNotInteger: "Длительность должна быть целым числом",
  durationOutOfRange: "Длительность от 15 до 180 минут",
  durationOffStep: "Длительность должна быть кратна 15 минутам",
} as const;

export type CreateMeetingTypeResult =
  | { ok: true; value: NewMeetingType }
  | { ok: false; fields: ErrorField[] };

interface NameField {
  name?: string;
  error?: ErrorField;
}

function readName(body: Record<string, unknown>): NameField {
  const raw = readField(body, "name");

  if (raw === undefined) {
    return { error: { field: "name", message: FIELD_MESSAGES.nameRequired } };
  }
  if (typeof raw !== "string") {
    return { error: { field: "name", message: FIELD_MESSAGES.nameNotString } };
  }

  const name = normalizeSpaces(raw);

  if (name === "") {
    return { error: { field: "name", message: FIELD_MESSAGES.nameRequired } };
  }
  if (name.length > 100) {
    return { error: { field: "name", message: FIELD_MESSAGES.nameTooLong } };
  }

  return { name };
}

interface DescriptionField {
  description?: string;
  error?: ErrorField;
}

function readDescription(body: Record<string, unknown>): DescriptionField {
  const raw = readField(body, "description");

  if (raw === undefined) {
    return { description: "" };
  }
  if (typeof raw !== "string") {
    return { error: { field: "description", message: FIELD_MESSAGES.descriptionNotString } };
  }

  const description = raw.trim();

  if (description.length > 500) {
    return { error: { field: "description", message: FIELD_MESSAGES.descriptionTooLong } };
  }

  return { description };
}

interface DurationField {
  durationMinutes?: number;
  error?: ErrorField;
}

function readDuration(body: Record<string, unknown>): DurationField {
  const raw = readField(body, "durationMinutes");

  if (raw === undefined) {
    return { error: { field: "durationMinutes", message: FIELD_MESSAGES.durationRequired } };
  }
  if (typeof raw !== "number" || !Number.isInteger(raw)) {
    return { error: { field: "durationMinutes", message: FIELD_MESSAGES.durationNotInteger } };
  }
  if (raw < 15 || raw > 180) {
    return { error: { field: "durationMinutes", message: FIELD_MESSAGES.durationOutOfRange } };
  }
  if (raw % 15 !== 0) {
    return { error: { field: "durationMinutes", message: FIELD_MESSAGES.durationOffStep } };
  }

  return { durationMinutes: raw };
}

/**
 * Validates and normalizes the create request in one pass. Every invalid field
 * is reported at once, in the order the contract declares them.
 */
export function parseCreateMeetingType(body: unknown): CreateMeetingTypeResult {
  const record = asRecord(body);
  const name = readName(record);
  const description = readDescription(record);
  const duration = readDuration(record);
  const fields = [name.error, description.error, duration.error].filter(
    (field): field is ErrorField => field !== undefined,
  );

  if (fields.length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      name: name.name ?? "",
      description: description.description ?? "",
      durationMinutes: duration.durationMinutes ?? 0,
    },
  };
}
