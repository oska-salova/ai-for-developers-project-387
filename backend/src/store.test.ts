import { describe, expect, it } from "vitest";
import { createStore } from "./store.js";

describe("meeting type store", () => {
  it("finds a stored meeting type by its id", () => {
    const store = createStore();
    const created = store.createMeetingType({
      name: "Кофе с гостем",
      description: "",
      durationMinutes: 30,
    });

    expect(store.findMeetingType(created.id)).toEqual(created);
  });

  it("returns nothing for an unknown id", () => {
    const store = createStore();

    expect(store.findMeetingType("missing")).toBeUndefined();
  });
});
