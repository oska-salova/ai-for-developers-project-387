import { randomUUID } from "node:crypto";
import type { components } from "./generated/openapi.js";
import { intervalsOverlap } from "./overlap.js";
import { meetingEnd } from "./time-rules.js";

/** A booking template the owner offers, as described by the API contract. */
type MeetingType = components["schemas"]["MeetingType"];

/** The fields the owner supplies when creating a meeting type. */
export interface NewMeetingType {
  name: string;
  description: string;
  durationMinutes: number;
}

/** A booked interval in the owner's calendar. */
export interface Meeting {
  id: string;
  meetingTypeId: string;
  start: Date;
  guestName: string;
  guestEmail: string;
}

/** The fields the guest supplies when booking a slot. */
interface NewMeeting {
  meetingTypeId: string;
  start: Date;
  guestName: string;
  guestEmail: string;
}

/** The outcome of a booking attempt; a conflict names no taker. */
type AddMeetingResult =
  | { ok: true; meeting: Meeting }
  | { ok: false; reason: "meeting_type_not_found" | "slot_conflict" };

/** Meetings the store starts with, so tests can pin busy intervals. */
export interface StoreSeed {
  meetings?: readonly Meeting[];
}

/**
 * Synchronous in-memory storage for meeting types and meetings. Every method
 * returns before the caller regains control, which is what makes a booking
 * check-and-insert atomic: there is no `await` between them.
 */
export interface MeetingTypeStore {
  /** Newest first, so the owner sees a freshly created type on top. */
  listMeetingTypes(): MeetingType[];
  createMeetingType(input: NewMeetingType): MeetingType;
  findMeetingType(id: string): MeetingType | undefined;
  listMeetings(): Meeting[];
  /**
   * Checks the interval against every existing meeting and inserts it in one
   * synchronous call. The duration always comes from the meeting type.
   */
  addMeeting(input: NewMeeting): AddMeetingResult;
}

export function createStore(seed: StoreSeed = {}): MeetingTypeStore {
  const meetingTypes: MeetingType[] = [];
  const meetings: Meeting[] = [...(seed.meetings ?? [])];

  return {
    listMeetingTypes() {
      return meetingTypes.toReversed();
    },
    createMeetingType(input) {
      const meetingType: MeetingType = { id: randomUUID(), ...input };
      meetingTypes.push(meetingType);

      return meetingType;
    },
    findMeetingType(id) {
      return meetingTypes.find((meetingType) => meetingType.id === id);
    },
    listMeetings() {
      return [...meetings];
    },
    addMeeting(input) {
      const meetingType = meetingTypes.find((type) => type.id === input.meetingTypeId);

      if (meetingType === undefined) {
        return { ok: false, reason: "meeting_type_not_found" };
      }

      const startMs = input.start.getTime();
      const endMs = meetingEnd(input.start, meetingType.durationMinutes).getTime();
      const conflicts = meetings.some((meeting) => {
        const otherType = meetingTypes.find((type) => type.id === meeting.meetingTypeId);

        // Meetings whose type is unknown cannot be produced by the API; the
        // slot engine skips them too, so they do not block anything.
        if (otherType === undefined) {
          return false;
        }

        const otherStartMs = meeting.start.getTime();
        const otherEndMs = meetingEnd(meeting.start, otherType.durationMinutes).getTime();

        return intervalsOverlap(startMs, endMs, otherStartMs, otherEndMs);
      });

      if (conflicts) {
        return { ok: false, reason: "slot_conflict" };
      }

      const meeting: Meeting = { id: randomUUID(), ...input };
      meetings.push(meeting);

      return { ok: true, meeting };
    },
  };
}
