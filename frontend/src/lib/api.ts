import type { HttpClient } from "@typespec/ts-http-runtime";
import {
  CallCalendarClient,
  type CreateMeetingRequest,
  type ErrorBody,
  type ErrorBodyEnvelope,
  type Meeting,
  type MeetingType,
  type SlotDay,
  type SlotsEnvelope,
} from "./api/generated/dist/index.js";

export type { Meeting, MeetingType, SlotDay, SlotsEnvelope };

/** Where the Next.js server reaches the backend when NEXT_PUBLIC_API_URL is not set. */
const DEFAULT_SERVER_API_URL = "http://127.0.0.1:3001";

/** An error the API reported inside its `{ error }` envelope. */
export class ApiError extends Error {
  readonly code: string;
  readonly fields: NonNullable<ErrorBody["fields"]>;

  constructor(error: ErrorBody) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.fields = error.fields ?? [];
  }
}

/**
 * In the browser the API lives on the page origin: the Next.js server proxies
 * `/api` to Express, so a deployed container needs only one public port.
 * During server rendering the proxy is bypassed with the internal address.
 */
function defaultApiUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return process.env.API_URL ?? DEFAULT_SERVER_API_URL;
}

export function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL;

  return configured ? configured : defaultApiUrl();
}

interface ApiClientOptions {
  endpoint?: string;
  /** Injected so tests can observe the requests without a network. */
  httpClient?: HttpClient;
}

export function createApiClient({
  endpoint = resolveApiUrl(),
  httpClient,
}: ApiClientOptions = {}): CallCalendarClient {
  return new CallCalendarClient({
    endpoint,
    // The local backend speaks plain HTTP; production would use HTTPS.
    allowInsecureConnection: true,
    httpClient,
  });
}

/** The one client the app uses: the base URL lives here and nowhere else. */
const apiClient = createApiClient();

function isErrorEnvelope(value: unknown): value is ErrorBodyEnvelope {
  return typeof value === "object" && value !== null && "error" in value;
}

/**
 * The generated SDK returns declared error codes as values, not exceptions.
 * Turn them into ApiError so pages can show the server message verbatim.
 */
export function unwrap<T>(result: T | ErrorBodyEnvelope): T {
  if (isErrorEnvelope(result)) {
    throw new ApiError(result.error);
  }

  return result as T;
}

export async function listMeetingTypes() {
  const result = await apiClient.meetingTypesClient.list();

  return unwrap(result).meetingTypes;
}

/** The fields the owner fills in when creating a meeting type. */
export interface NewMeetingTypeInput {
  name: string;
  description?: string;
  durationMinutes: number;
}

export async function createMeetingType(input: NewMeetingTypeInput): Promise<MeetingType> {
  const result = await apiClient.meetingTypesClient.create(input);

  return unwrap(result).meetingType;
}

/** The full 14-day slot envelope for a meeting type. */
export async function listSlots(meetingTypeId: string): Promise<SlotsEnvelope> {
  const result = await apiClient.meetingTypesClient.slots(meetingTypeId);

  return unwrap(result);
}

/** The owner's upcoming meetings, sorted by start by the server. */
export async function listMeetings(): Promise<Meeting[]> {
  const result = await apiClient.meetingsClient.list();

  return unwrap(result).meetings;
}

/** The fields the guest fills in when booking a slot. */
export type NewMeetingInput = CreateMeetingRequest;

export async function createMeeting(input: NewMeetingInput): Promise<Meeting> {
  const result = await apiClient.meetingsClient.create(input);

  return unwrap(result).meeting;
}
