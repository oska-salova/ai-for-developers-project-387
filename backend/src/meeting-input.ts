import { asRecord, readField } from "./body-input.js";
import type { components } from "./generated/openapi.js";
import { addDays, ownerDate, ownerTimeInstant } from "./owner-time.js";
import { normalizeSpaces } from "./text.js";
import {
  meetingEnd,
  SLOT_STEP_MINUTES,
  WINDOW_DAYS,
  WORKDAY_END_MINUTES,
  WORKDAY_START_MINUTES,
} from "./time-rules.js";

type ErrorField = components["schemas"]["ErrorField"];

/** Shown when the requested slot is already taken; never names the taker. */
export const SLOT_CONFLICT_MESSAGE = "Это время уже заняли";

export const MEETING_TYPE_NOT_FOUND_MESSAGE = "Тип встречи не найден";

const MAX_GUEST_NAME_LENGTH = 100;
const MAX_GUEST_EMAIL_LENGTH = 254;

/** One dog, two non-empty parts, a dot in the domain, no spaces. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

/** ISO 8601 in UTC: seconds are required, milliseconds are optional. */
const START_PATTERN =
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})(?:\.(?<millisecond>\d{1,3}))?Z$/u;

/**
 * The verbatim field messages of `POST /api/meetings`. They are part of the
 * contract: the guest's wizard shows them under the fields as they are.
 */
const FIELD_MESSAGES = {
  meetingTypeIdRequired: "Тип встречи обязателен",
  meetingTypeIdNotString: "Тип встречи должен быть строкой",
  startRequired: "Старт обязателен",
  startNotString: "Старт должен быть строкой",
  startFormat: "Старт должен быть датой ISO 8601 в UTC",
  startOffGrid: "Старт должен быть на сетке 15 минут",
  startOutsideWindow: "Старт вне окна записи",
  startOutsideWorkingHours: "Старт вне рабочих часов",
  startNotFuture: "Старт должен быть позже текущего момента",
  guestNameRequired: "Имя обязательно",
  guestNameNotString: "Имя должно быть строкой",
  guestNameTooLong: "Имя не длиннее 100 символов",
  guestEmailRequired: "Почта обязательна",
  guestEmailNotString: "Почта должна быть строкой",
  guestEmailTooLong: "Почта не длиннее 254 символов",
  guestEmailFormat: "Почта должна быть в формате name@example.com",
} as const;

/** The normalized body fields, ready for the type and start checks. */
interface MeetingFields {
  meetingTypeId: string;
  start: string;
  guestName: string;
  guestEmail: string;
}

export type MeetingFieldsResult =
  | { ok: true; value: MeetingFields }
  | { ok: false; fields: ErrorField[] };

export type MeetingStartResult = { ok: true; value: Date } | { ok: false; error: ErrorField };

interface Field<T> {
  value?: T;
  error?: ErrorField;
}

function readMeetingTypeId(record: Record<string, unknown>): Field<string> {
  const raw = readField(record, "meetingTypeId");

  if (raw === undefined) {
    return { error: { field: "meetingTypeId", message: FIELD_MESSAGES.meetingTypeIdRequired } };
  }
  if (typeof raw !== "string") {
    return { error: { field: "meetingTypeId", message: FIELD_MESSAGES.meetingTypeIdNotString } };
  }

  const meetingTypeId = raw.trim();

  if (meetingTypeId === "") {
    return { error: { field: "meetingTypeId", message: FIELD_MESSAGES.meetingTypeIdRequired } };
  }

  return { value: meetingTypeId };
}

function readStart(record: Record<string, unknown>): Field<string> {
  const raw = readField(record, "start");

  if (raw === undefined) {
    return { error: { field: "start", message: FIELD_MESSAGES.startRequired } };
  }
  if (typeof raw !== "string") {
    return { error: { field: "start", message: FIELD_MESSAGES.startNotString } };
  }

  return { value: raw };
}

function readGuestName(record: Record<string, unknown>): Field<string> {
  const raw = readField(record, "guestName");

  if (raw === undefined) {
    return { error: { field: "guestName", message: FIELD_MESSAGES.guestNameRequired } };
  }
  if (typeof raw !== "string") {
    return { error: { field: "guestName", message: FIELD_MESSAGES.guestNameNotString } };
  }

  const guestName = normalizeSpaces(raw);

  if (guestName === "") {
    return { error: { field: "guestName", message: FIELD_MESSAGES.guestNameRequired } };
  }
  if (guestName.length > MAX_GUEST_NAME_LENGTH) {
    return { error: { field: "guestName", message: FIELD_MESSAGES.guestNameTooLong } };
  }

  return { value: guestName };
}

function readGuestEmail(record: Record<string, unknown>): Field<string> {
  const raw = readField(record, "guestEmail");

  if (raw === undefined) {
    return { error: { field: "guestEmail", message: FIELD_MESSAGES.guestEmailRequired } };
  }
  if (typeof raw !== "string") {
    return { error: { field: "guestEmail", message: FIELD_MESSAGES.guestEmailNotString } };
  }

  const guestEmail = raw.trim().toLowerCase();

  if (guestEmail === "") {
    return { error: { field: "guestEmail", message: FIELD_MESSAGES.guestEmailRequired } };
  }
  if (guestEmail.length > MAX_GUEST_EMAIL_LENGTH) {
    return { error: { field: "guestEmail", message: FIELD_MESSAGES.guestEmailTooLong } };
  }
  if (!EMAIL_PATTERN.test(guestEmail)) {
    return { error: { field: "guestEmail", message: FIELD_MESSAGES.guestEmailFormat } };
  }

  return { value: guestEmail };
}

/**
 * Validates the body shape and field values in one pass, in the order the
 * contract declares them. Start *rules* are checked later, after the meeting
 * type is known to exist.
 */
export function parseMeetingFields(body: unknown): MeetingFieldsResult {
  const record = asRecord(body);
  const meetingTypeId = readMeetingTypeId(record);
  const start = readStart(record);
  const guestName = readGuestName(record);
  const guestEmail = readGuestEmail(record);
  const fields = [meetingTypeId.error, start.error, guestName.error, guestEmail.error].filter(
    (field): field is ErrorField => field !== undefined,
  );

  if (fields.length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    value: {
      meetingTypeId: meetingTypeId.value ?? "",
      start: start.value ?? "",
      guestName: guestName.value ?? "",
      guestEmail: guestEmail.value ?? "",
    },
  };
}

function parseIsoUtc(value: string): Date | undefined {
  const match = START_PATTERN.exec(value);
  const groups = match?.groups;

  if (groups === undefined) {
    return undefined;
  }

  const year = Number(groups.year);
  const month = Number(groups.month);
  const day = Number(groups.day);
  const hour = Number(groups.hour);
  const minute = Number(groups.minute);
  const second = Number(groups.second);
  const millisecond = Number((groups.millisecond ?? "").padEnd(3, "0"));
  const instant = new Date(Date.UTC(year, month - 1, day, hour, minute, second, millisecond));

  // `Date.UTC` rolls impossible dates over (February 30 becomes March 2), so
  // compare every component back to reject dates that do not exist.
  if (
    instant.getUTCFullYear() !== year ||
    instant.getUTCMonth() !== month - 1 ||
    instant.getUTCDate() !== day ||
    instant.getUTCHours() !== hour ||
    instant.getUTCMinutes() !== minute ||
    instant.getUTCSeconds() !== second
  ) {
    return undefined;
  }

  return instant;
}

function startError(message: string): MeetingStartResult {
  return { ok: false, error: { field: "start", message } };
}

/**
 * Applies the booking rules to an already parsed start: the 15-minute grid,
 * the 14-day window, working hours for the whole interval, and the future.
 * They run only after the meeting type exists, so the duration is known.
 */
export function parseMeetingStart(
  start: string,
  durationMinutes: number,
  now: Date,
): MeetingStartResult {
  const instant = parseIsoUtc(start);

  if (instant === undefined) {
    return startError(FIELD_MESSAGES.startFormat);
  }

  const startMs = instant.getTime();

  if (
    instant.getUTCMinutes() % SLOT_STEP_MINUTES !== 0 ||
    instant.getUTCSeconds() !== 0 ||
    instant.getUTCMilliseconds() !== 0
  ) {
    return startError(FIELD_MESSAGES.startOffGrid);
  }

  const today = ownerDate(now);
  const lastDay = addDays(today, WINDOW_DAYS - 1);
  const day = ownerDate(instant);

  if (day < today || day > lastDay) {
    return startError(FIELD_MESSAGES.startOutsideWindow);
  }

  const workdayStartMs = ownerTimeInstant(day, WORKDAY_START_MINUTES).getTime();
  const workdayEndMs = ownerTimeInstant(day, WORKDAY_END_MINUTES).getTime();

  if (startMs < workdayStartMs || meetingEnd(instant, durationMinutes).getTime() > workdayEndMs) {
    return startError(FIELD_MESSAGES.startOutsideWorkingHours);
  }

  if (startMs <= now.getTime()) {
    return startError(FIELD_MESSAGES.startNotFuture);
  }

  return { ok: true, value: instant };
}
