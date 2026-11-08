import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Meeting } from "@/lib/api";
import { MeetingsList } from "./meetings-list";

function meeting(id: string, start: string, durationMinutes = 30): Meeting {
  return {
    id,
    start,
    guestName: `Гость ${id}`,
    guestEmail: `guest${id}@example.com`,
    meetingType: { id: "coffee", name: "Кофе с гостем", durationMinutes },
  };
}

describe("MeetingsList", () => {
  it("groups meetings by owner days, ascending, and keeps the starts in order", () => {
    render(
      <MeetingsList
        meetings={[
          meeting("late", "2026-11-02T09:00:00.000Z"),
          meeting("first", "2026-11-01T10:00:00.000Z"),
        ]}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 2 });

    expect(headings.map((heading) => heading.textContent)).toEqual([
      "1 ноября, воскресенье",
      "2 ноября, понедельник",
    ]);
  });

  it("puts a meeting after Moscow midnight into the next day", () => {
    render(
      <MeetingsList
        meetings={[
          // 23:30 on 1 November in Moscow.
          meeting("evening", "2026-11-01T20:30:00.000Z"),
          // 00:30 on 2 November in Moscow, although still 1 November in UTC.
          meeting("midnight", "2026-11-01T21:30:00.000Z"),
        ]}
      />,
    );

    const [firstDay, secondDay] = screen.getAllByRole("heading", { level: 2 });

    if (firstDay === undefined || secondDay === undefined) {
      throw new Error("Ожидались два дня со встречами");
    }

    expect(firstDay.textContent).toBe("1 ноября, воскресенье");
    expect(secondDay.textContent).toBe("2 ноября, понедельник");

    const firstDaySection = firstDay.closest("section");
    const secondDaySection = secondDay.closest("section");

    if (firstDaySection === null || secondDaySection === null) {
      throw new Error("У каждого дня должна быть секция");
    }

    expect(within(firstDaySection).getAllByRole("listitem")).toHaveLength(1);
    expect(within(firstDaySection).getByText("23:30–00:00")).toBeInTheDocument();
    expect(within(secondDaySection).getAllByRole("listitem")).toHaveLength(1);
    expect(within(secondDaySection).getByText("00:30–01:00")).toBeInTheDocument();
  });

  it("renders one row per meeting with its own data", () => {
    render(
      <MeetingsList
        meetings={[
          meeting("morning", "2026-11-01T07:00:00.000Z"),
          meeting("afternoon", "2026-11-01T13:00:00.000Z"),
        ]}
      />,
    );

    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("10:00–10:30"),
      expect.stringContaining("16:00–16:30"),
    ]);
    expect(screen.getByRole("link", { name: "guestmorning@example.com" })).toHaveAttribute(
      "href",
      "mailto:guestmorning@example.com",
    );
  });

  it("shows the empty state instead of an empty list", () => {
    render(<MeetingsList meetings={[]} />);

    expect(screen.getByText("Предстоящих встреч нет")).toBeInTheDocument();
    expect(
      screen.getByText("Записи появятся здесь, когда гость выберет время"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });
});
