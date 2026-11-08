import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Toaster } from "@/components/ui/sonner";
import { ApiError } from "@/lib/api";
import { MeetingTypesForm } from "./meeting-types-form";

const { refresh, createMeetingType } = vi.hoisted(() => ({
  refresh: vi.fn(),
  createMeetingType: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();

  return { ...actual, createMeetingType };
});

function renderForm() {
  return render(
    <>
      <MeetingTypesForm />
      <Toaster />
    </>,
  );
}

function nameInput() {
  return screen.getByLabelText("Название");
}

function descriptionInput() {
  return screen.getByLabelText("Описание (необязательно)");
}

function submit() {
  fireEvent.submit(screen.getByRole("button", { name: "Создать тип встречи" }).closest("form")!);
}

function validationError(fields: Array<{ field: string; message: string }>) {
  return new ApiError({
    code: "validation_error",
    message: "Проверьте заполнение полей",
    fields,
  });
}

describe("форма типа встречи", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the default duration of 30 minutes", () => {
    renderForm();

    expect(screen.getByLabelText("Длительность")).toHaveTextContent("30 мин");
  });

  it("creates a meeting type, confirms it and resets the form", async () => {
    createMeetingType.mockResolvedValue({
      id: "1",
      name: "Кофе с гостем",
      description: "Короткий разговор",
      durationMinutes: 30,
    });
    renderForm();

    fireEvent.change(nameInput(), { target: { value: "Кофе с гостем" } });
    fireEvent.change(descriptionInput(), { target: { value: "Короткий разговор" } });
    submit();

    expect(await screen.findByText("Тип встречи создан")).toBeInTheDocument();
    await waitFor(() => expect(nameInput()).toHaveValue(""));
    expect(descriptionInput()).toHaveValue("");
    expect(screen.getByLabelText("Длительность")).toHaveTextContent("30 мин");
    expect(nameInput()).toHaveFocus();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(createMeetingType).toHaveBeenCalledWith({
      name: "Кофе с гостем",
      description: "Короткий разговор",
      durationMinutes: 30,
    });
  });

  it("shows the server messages under the fields and focuses the first invalid one", async () => {
    createMeetingType.mockRejectedValue(
      validationError([
        { field: "name", message: "Название обязательно" },
        { field: "durationMinutes", message: "Длительность от 15 до 180 минут" },
      ]),
    );
    renderForm();

    fireEvent.change(nameInput(), { target: { value: "  " } });
    fireEvent.change(descriptionInput(), { target: { value: "Оставляем как есть" } });
    submit();

    expect(await screen.findByText("Название обязательно")).toBeInTheDocument();
    expect(screen.getByText("Длительность от 15 до 180 минут")).toBeInTheDocument();
    expect(screen.queryByText("Проверьте заполнение полей")).not.toBeInTheDocument();
    expect(nameInput()).toHaveValue("  ");
    expect(descriptionInput()).toHaveValue("Оставляем как есть");
    expect(nameInput()).toHaveFocus();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("shows an error under the description and focuses it", async () => {
    createMeetingType.mockRejectedValue(
      validationError([{ field: "description", message: "Описание не длиннее 500 символов" }]),
    );
    renderForm();

    fireEvent.change(nameInput(), { target: { value: "Кофе с гостем" } });
    fireEvent.change(descriptionInput(), { target: { value: "я".repeat(501) } });
    submit();

    expect(await screen.findByText("Описание не длиннее 500 символов")).toBeInTheDocument();
    expect(descriptionInput()).toHaveFocus();
  });

  it("shows an unknown field as a general form error", async () => {
    createMeetingType.mockRejectedValue(
      validationError([{ field: "nickname", message: "Неизвестное поле" }]),
    );
    renderForm();

    fireEvent.change(nameInput(), { target: { value: "Кофе с гостем" } });
    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Неизвестное поле");
  });

  it("does not send a second request while the first one is in flight", async () => {
    createMeetingType.mockReturnValue(new Promise(() => undefined));
    renderForm();

    fireEvent.change(nameInput(), { target: { value: "Кофе с гостем" } });
    submit();
    submit();

    await waitFor(() => expect(createMeetingType).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Создать тип встречи" })).toBeDisabled();
  });
});
