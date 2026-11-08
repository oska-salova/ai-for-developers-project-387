import type { MeetingTypeStore, NewMeetingType } from "./store.js";

/** The type every server starts with, so the whole booking flow works out of the box. */
const DEFAULT_MEETING_TYPE: NewMeetingType = {
  name: "Знакомство",
  description: "Познакомимся и обсудим, чем я могу помочь.",
  durationMinutes: 30,
};

/**
 * Seeds the default meeting type. Data lives in memory, so every start recreates
 * it; tests call `createStore` directly, so they still start empty.
 */
export function seedDefaultMeetingType(store: MeetingTypeStore): void {
  store.createMeetingType(DEFAULT_MEETING_TYPE);
}
