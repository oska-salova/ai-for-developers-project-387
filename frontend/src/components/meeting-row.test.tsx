import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Meeting } from "@/lib/api";
import { MeetingRow } from "./meeting-row";

const meeting: Meeting = {
  id: "meeting-1",
  // 13:00 in Moscow.
  start: "2026-11-01T10:00:00.000Z",
  guestName: "Иван Иванов",
  guestEmail: "guest@example.com",
  meetingType: { id: "coffee", name: "Кофе с гостем", durationMinutes: 30 },
};

describe("MeetingRow", () => {
  it("shows the start and the end in the owner's zone, not the browser's", () => {
    render(<MeetingRow meeting={meeting} />);

    // jsdom runs in the host zone; 10:00Z is 13:00 in Moscow regardless of it.
    expect(screen.getByText("13:00–13:30")).toBeInTheDocument();
  });

  it("takes the end from the meeting type duration", () => {
    render(
      <MeetingRow
        meeting={{
          ...meeting,
          meetingType: { ...meeting.meetingType, name: "Созвон по проекту", durationMinutes: 60 },
        }}
      />,
    );

    expect(screen.getByText("13:00–14:00")).toBeInTheDocument();
    expect(screen.getByText("Созвон по проекту")).toBeInTheDocument();
  });

  it("shows the meeting type and the guest name", () => {
    render(<MeetingRow meeting={meeting} />);

    expect(screen.getByText("Кофе с гостем")).toBeInTheDocument();
    expect(screen.getByText("Иван Иванов")).toBeInTheDocument();
  });

  it("makes the guest email a mailto link", () => {
    render(<MeetingRow meeting={meeting} />);

    expect(screen.getByRole("link", { name: "guest@example.com" })).toHaveAttribute(
      "href",
      "mailto:guest@example.com",
    );
  });
});
