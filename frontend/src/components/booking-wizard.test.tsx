import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, type Meeting, type SlotsEnvelope } from "@/lib/api";
import { BookingWizard } from "./booking-wizard";

const { listMeetingTypes, listSlots, createMeeting } = vi.hoisted(() => ({
  listMeetingTypes: vi.fn(),
  listSlots: vi.fn(),
  createMeeting: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return { ...actual, listMeetingTypes, listSlots, createMeeting };
});

const coffee = {
  id: "coffee",
  name: "Кофе с гостем",
  description: "Короткий разговор",
  durationMinutes: 30,
};

const project = {
  id: "project",
  name: "Созвон по проекту",
  description: "Разбор задач",
  durationMinutes: 60,
};

const bookedMeeting: Meeting = {
  id: "meeting-1",
  start: "2026-11-01T10:00:00.000Z",
  guestName: "Иван Иванов",
  guestEmail: "guest@example.com",
  meetingType: { id: coffee.id, name: coffee.name, durationMinutes: coffee.durationMinutes },
};

function dateAfter(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, (day ?? 1) + days))
    .toISOString()
    .slice(0, 10);
}

function makeSlots(available = true): SlotsEnvelope {
  const dates = Array.from({ length: 14 }, (_unused, index) => dateAfter("2026-11-01", index));
  const days = dates.map((date, index) => {
    if (!available) {
      return { date, slots: [{ start: `${date}T10:00:00.000Z`, available: false }] };
    }

    if (index === 0) {
      return {
        date,
        slots: [
          { start: `${date}T10:00:00.000Z`, available: true },
          { start: `${date}T10:15:00.000Z`, available: false },
          { start: `${date}T10:30:00.000Z`, available: false },
        ],
      };
    }

    if (index === 1) {
      return {
        date,
        slots: [
          { start: `${date}T10:00:00.000Z`, available: true },
          { start: `${date}T10:15:00.000Z`, available: true },
        ],
      };
    }

    return { date, slots: [{ start: `${date}T10:00:00.000Z`, available: false }] };
  });

  return {
    window: { start: dates[0] ?? "", end: dates[13] ?? "" },
    timezone: "Europe/Moscow",
    days,
  };
}

function renderWizard() {
  return render(<BookingWizard />);
}

async function selectCoffee() {
  fireEvent.click(await screen.findByRole("button", { name: /Кофе с гостем/u }));
}

async function openTimeStep() {
  renderWizard();
  await selectCoffee();
  fireEvent.click(screen.getByRole("button", { name: "Далее" }));
  await screen.findByRole("button", { name: "2026-11-01, свободных слотов: 1" });
}

async function openGuestStep() {
  await openTimeStep();
  fireEvent.click(screen.getByRole("button", { name: "13:00" }));
  fireEvent.click(screen.getByRole("button", { name: "Далее" }));
  await screen.findByRole("heading", { name: "Укажите имя и почту" });
}

async function openReviewStep() {
  await openGuestStep();
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Иван Иванов" } });
  fireEvent.change(screen.getByLabelText("Почта"), {
    target: { value: "guest@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Далее" }));
  await screen.findByRole("heading", { name: "Проверьте запись" });
}

beforeEach(() => {
  vi.clearAllMocks();
  listMeetingTypes.mockResolvedValue([coffee, project]);
  listSlots.mockResolvedValue(makeSlots());
  createMeeting.mockResolvedValue(bookedMeeting);
});

describe("мастер записи", () => {
  it("shows a skeleton while meeting types are loading", () => {
    listMeetingTypes.mockReturnValue(new Promise(() => undefined));

    renderWizard();

    expect(screen.getByRole("status", { name: "Загрузка типов встреч" })).toBeInTheDocument();
  });

  it("lists meeting types and highlights the selected one", async () => {
    renderWizard();

    const coffeeButton = await screen.findByRole("button", { name: /Кофе с гостем/u });
    const projectButton = screen.getByRole("button", { name: /Созвон по проекту/u });
    const next = screen.getByRole("button", { name: "Далее" });

    expect(next).toBeDisabled();

    fireEvent.click(coffeeButton);

    expect(coffeeButton).toHaveAttribute("aria-pressed", "true");
    expect(projectButton).toHaveAttribute("aria-pressed", "false");
    expect(next).toBeEnabled();
  });

  it("shows all 14 days with their free slot counts and highlights the day", async () => {
    await openTimeStep();

    expect(screen.getAllByRole("button", { name: /свободных слотов/u })).toHaveLength(14);
    expect(screen.getByRole("button", { name: "2026-11-01, свободных слотов: 1" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "2026-11-02, свободных слотов: 2" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: "2026-11-02, свободных слотов: 2" }));

    expect(screen.getByRole("button", { name: "2026-11-02, свободных слотов: 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "13:00" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "13:15" })).toBeEnabled();
  });

  it("shows a skeleton while slots are loading", async () => {
    listSlots.mockReturnValue(new Promise(() => undefined));
    renderWizard();
    await selectCoffee();

    fireEvent.click(screen.getByRole("button", { name: "Далее" }));

    expect(await screen.findByRole("status", { name: "Загрузка слотов" })).toBeInTheDocument();
  });

  it("keeps busy and past slots visible but disabled", async () => {
    await openTimeStep();

    expect(screen.getByRole("button", { name: "13:00" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "13:15" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "13:30" })).toBeDisabled();
  });

  it("explains an empty window instead of showing an empty grid", async () => {
    listSlots.mockResolvedValue(makeSlots(false));
    renderWizard();
    await selectCoffee();
    fireEvent.click(screen.getByRole("button", { name: "Далее" }));

    expect(await screen.findByText("В ближайшие 14 дней нет свободных слотов")).toBeInTheDocument();
    expect(screen.getByText(/формат покороче/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Далее" })).toBeDisabled();
  });

  it("shows field errors under the inputs when leaving the guest step", async () => {
    await openGuestStep();
    fireEvent.click(screen.getByRole("button", { name: "Далее" }));

    expect(screen.getByText("Имя обязательно")).toBeInTheDocument();
    expect(screen.getByText("Почта обязательна")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Укажите имя и почту" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Иван Иванов" } });
    fireEvent.change(screen.getByLabelText("Почта"), { target: { value: "guest@" } });
    fireEvent.click(screen.getByRole("button", { name: "Далее" }));

    expect(screen.getByText("Почта должна быть в формате name@example.com")).toBeInTheDocument();
  });

  it("reviews the type, time, name and email before confirming", async () => {
    await openReviewStep();

    expect(screen.getByText(/Кофе с гостем/u)).toBeInTheDocument();
    expect(screen.getByText(/1 ноября, 13:00/u)).toBeInTheDocument();
    expect(screen.getByText("Иван Иванов")).toBeInTheDocument();
    expect(screen.getByText("guest@example.com")).toBeInTheDocument();

    createMeeting.mockResolvedValue(bookedMeeting);
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    await screen.findByRole("heading", { name: "Вы записаны" });

    expect(createMeeting).toHaveBeenCalledWith({
      meetingTypeId: coffee.id,
      start: "2026-11-01T10:00:00.000Z",
      guestName: "Иван Иванов",
      guestEmail: "guest@example.com",
    });
    expect(screen.getByText("Кофе с гостем")).toBeInTheDocument();
    expect(screen.getByText(/13:00/u)).toBeInTheDocument();
  });

  it("shows the success screen and starts over", async () => {
    await openReviewStep();
    fireEvent.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    await screen.findByRole("heading", { name: "Вы записаны" });
    fireEvent.click(screen.getByRole("button", { name: "Записаться ещё" }));

    expect(
      await screen.findByRole("heading", { name: "Выберите тип встречи" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Далее" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Кофе с гостем/u })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("disables the confirm button while the request is in flight", async () => {
    await openReviewStep();
    createMeeting.mockReturnValue(new Promise(() => undefined));

    const confirm = screen.getByRole("button", { name: "Подтвердить запись" });
    fireEvent.click(confirm);

    await waitFor(() => expect(createMeeting).toHaveBeenCalledTimes(1));
    expect(confirm).toBeDisabled();
  });

  it("returns to the time step on a 409 conflict without losing the guest data", async () => {
    await openReviewStep();
    createMeeting.mockRejectedValue(
      new ApiError({ code: "slot_conflict", message: "Это время уже заняли" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Это время уже заняли");
    expect(screen.getByRole("heading", { name: "Выберите день и время" })).toBeInTheDocument();
    expect(listSlots).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Далее" })).toBeDisabled();

    fireEvent.click(await screen.findByRole("button", { name: "13:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Далее" }));

    expect(screen.getByLabelText("Имя")).toHaveValue("Иван Иванов");
    expect(screen.getByLabelText("Почта")).toHaveValue("guest@example.com");
  });

  it("treats a 400 on the start like a conflict: message, refetch and reset", async () => {
    await openReviewStep();
    createMeeting.mockRejectedValue(
      new ApiError({
        code: "validation_error",
        message: "Проверьте заполнение полей",
        fields: [{ field: "start", message: "Старт вне рабочих часов" }],
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Подтвердить запись" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Старт вне рабочих часов");
    expect(screen.getByRole("heading", { name: "Выберите день и время" })).toBeInTheDocument();
    expect(listSlots).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Далее" })).toBeDisabled();
  });

  it("keeps the choice when going back and forward", async () => {
    await openTimeStep();
    fireEvent.click(screen.getByRole("button", { name: "13:00" }));
    fireEvent.click(screen.getByRole("button", { name: "Далее" }));
    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Иван Иванов" } });

    fireEvent.click(screen.getByRole("button", { name: "Назад" }));

    expect(screen.getByRole("button", { name: "13:00" })).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Назад" }));

    expect(screen.getByRole("button", { name: /Кофе с гостем/u })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Далее" }));
    fireEvent.click(screen.getByRole("button", { name: "Далее" }));

    expect(screen.getByLabelText("Имя")).toHaveValue("Иван Иванов");
  });
});
