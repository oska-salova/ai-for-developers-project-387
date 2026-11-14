import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/ui/sonner";
import { ApiError, type Meeting } from "@/lib/api";
import { MeetingsList } from "./meetings-list";

const { refresh, deleteMeeting } = vi.hoisted(() => ({
  refresh: vi.fn(),
  deleteMeeting: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return { ...actual, deleteMeeting };
});

function meeting(id: string, start: string, durationMinutes = 30): Meeting {
  return {
    id,
    start,
    guestName: `Гость ${id}`,
    guestEmail: `guest${id}@example.com`,
    meetingType: { id: "coffee", name: "Кофе с гостем", durationMinutes },
  };
}

const NOW = "2026-11-01T00:00:00.000Z";

function renderList(meetings: Meeting[], now = NOW) {
  return render(
    <>
      <MeetingsList meetings={meetings} now={now} />
      <Toaster />
    </>,
  );
}

function rowOf(guestName: string): HTMLElement {
  const row = screen.getByText(guestName).closest("li");

  if (row === null) {
    throw new Error(`У гостя ${guestName} нет строки встречи`);
  }

  return row;
}

describe("MeetingsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups meetings by owner days, ascending, and keeps the starts in order", () => {
    renderList([
      meeting("late", "2026-11-02T09:00:00.000Z"),
      meeting("first", "2026-11-01T10:00:00.000Z"),
    ]);

    const headings = screen.getAllByRole("heading", { level: 2 });

    expect(headings.map((heading) => heading.textContent)).toEqual([
      "1 ноября, воскресенье",
      "2 ноября, понедельник",
    ]);
  });

  it("puts a meeting after Moscow midnight into the next day", () => {
    renderList([
      // 23:30 on 1 November in Moscow.
      meeting("evening", "2026-11-01T20:30:00.000Z"),
      // 00:30 on 2 November in Moscow, although still 1 November in UTC.
      meeting("midnight", "2026-11-01T21:30:00.000Z"),
    ]);

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
    renderList([
      meeting("morning", "2026-11-01T07:00:00.000Z"),
      meeting("afternoon", "2026-11-01T13:00:00.000Z"),
    ]);

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
    renderList([]);

    expect(screen.getByText("Предстоящих встреч нет")).toBeInTheDocument();
    expect(
      screen.getByText("Записи появятся здесь, когда гость выберет время"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2 })).not.toBeInTheDocument();
  });

  it("offers cancellation for upcoming meetings only", () => {
    renderList(
      [meeting("future", "2026-11-02T09:00:00.000Z"), meeting("past", "2026-11-01T07:00:00.000Z")],
      "2026-11-01T09:00:00.000Z",
    );

    expect(within(rowOf("Гость future")).getByRole("button", { name: "Отменить" })).toBeVisible();
    expect(within(rowOf("Гость past")).queryByRole("button", { name: "Отменить" })).toBeNull();
  });

  it("asks for confirmation and leaves the list untouched when the owner declines", async () => {
    renderList([meeting("future", "2026-11-02T09:00:00.000Z")], "2026-11-01T09:00:00.000Z");

    fireEvent.click(within(rowOf("Гость future")).getByRole("button", { name: "Отменить" }));

    expect(screen.getByText("Отменить встречу?")).toBeInTheDocument();
    expect(
      screen.getByText("Время встречи снова станет свободным для записи."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Не отменять" }));

    await waitFor(() => expect(screen.queryByText("Отменить встречу?")).not.toBeInTheDocument());
    expect(deleteMeeting).not.toHaveBeenCalled();
    expect(screen.getByText("Гость future")).toBeInTheDocument();
  });

  it("leaves the list untouched when the dialog is closed without confirming", async () => {
    renderList([meeting("future", "2026-11-02T09:00:00.000Z")], "2026-11-01T09:00:00.000Z");

    fireEvent.click(within(rowOf("Гость future")).getByRole("button", { name: "Отменить" }));
    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByText("Отменить встречу?")).not.toBeInTheDocument());
    expect(deleteMeeting).not.toHaveBeenCalled();
    expect(screen.getByText("Гость future")).toBeInTheDocument();
  });

  it("cancels the chosen meeting, confirms it and refreshes the list", async () => {
    deleteMeeting.mockResolvedValue(undefined);
    renderList([meeting("future", "2026-11-02T09:00:00.000Z")], "2026-11-01T09:00:00.000Z");

    fireEvent.click(within(rowOf("Гость future")).getByRole("button", { name: "Отменить" }));
    fireEvent.click(screen.getByRole("button", { name: "Отменить встречу" }));

    expect(await screen.findByText("Встреча отменена")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Гость future")).not.toBeInTheDocument());
    expect(deleteMeeting).toHaveBeenCalledWith("future");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state after cancelling the last meeting", async () => {
    deleteMeeting.mockResolvedValue(undefined);
    renderList([meeting("future", "2026-11-02T09:00:00.000Z")], "2026-11-01T09:00:00.000Z");

    fireEvent.click(within(rowOf("Гость future")).getByRole("button", { name: "Отменить" }));
    fireEvent.click(screen.getByRole("button", { name: "Отменить встречу" }));

    expect(await screen.findByText("Предстоящих встреч нет")).toBeInTheDocument();
  });

  it("shows the server message verbatim and keeps the meeting on an ApiError", async () => {
    deleteMeeting.mockRejectedValue(
      new ApiError({ code: "not_found", message: "Встреча уже прошла" }),
    );
    renderList([meeting("future", "2026-11-02T09:00:00.000Z")], "2026-11-01T09:00:00.000Z");

    fireEvent.click(within(rowOf("Гость future")).getByRole("button", { name: "Отменить" }));
    fireEvent.click(screen.getByRole("button", { name: "Отменить встречу" }));

    expect(await screen.findByText("Встреча уже прошла")).toBeInTheDocument();
    expect(screen.getByText("Гость future")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows a general error for an unexpected failure and keeps the meeting", async () => {
    deleteMeeting.mockRejectedValue(new Error("boom"));
    renderList([meeting("future", "2026-11-02T09:00:00.000Z")], "2026-11-01T09:00:00.000Z");

    fireEvent.click(within(rowOf("Гость future")).getByRole("button", { name: "Отменить" }));
    fireEvent.click(screen.getByRole("button", { name: "Отменить встречу" }));

    expect(await screen.findByText("Не удалось отменить встречу")).toBeInTheDocument();
    expect(screen.getByText("Гость future")).toBeInTheDocument();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("does not send a second request while the first one is in flight", async () => {
    deleteMeeting.mockReturnValue(new Promise(() => undefined));
    renderList([meeting("future", "2026-11-02T09:00:00.000Z")], "2026-11-01T09:00:00.000Z");

    fireEvent.click(within(rowOf("Гость future")).getByRole("button", { name: "Отменить" }));
    const confirm = screen.getByRole("button", { name: "Отменить встречу" });

    fireEvent.click(confirm);
    fireEvent.click(confirm);

    await waitFor(() => expect(deleteMeeting).toHaveBeenCalledTimes(1));
    expect(confirm).toBeDisabled();
  });
});
