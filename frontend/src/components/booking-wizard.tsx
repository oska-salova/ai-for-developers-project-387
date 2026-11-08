"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MeetingTypesSkeleton } from "@/components/meeting-types-skeleton";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  createMeeting,
  listMeetingTypes,
  listSlots,
  type Meeting,
  type MeetingType,
  type SlotDay,
  type SlotsEnvelope,
} from "@/lib/api";
import {
  GUEST_EMAIL_PATTERN,
  type GuestInputErrors,
  normalizeGuestEmail,
  normalizeGuestName,
  validateGuestInput,
} from "@/lib/guest-input";
import {
  formatOwnerDateTime,
  formatOwnerDayFromInstant,
  formatOwnerDayOfMonth,
  formatOwnerTime,
  formatOwnerWeekday,
} from "@/lib/owner-time";

/** Network failures stay vague: the server's own messages are shown verbatim. */
const REQUEST_ERROR_MESSAGE = "Не удалось выполнить запрос";

/** The server's message for one field, or `null` when it did not report it. */
function fieldMessage(
  fields: readonly { field: string; message: string }[],
  name: string,
): string | null {
  return fields.find((field) => field.field === name)?.message ?? null;
}

function availableCount(day: SlotDay): number {
  return day.slots.filter((slot) => slot.available).length;
}

function firstSelectableDate(slots: SlotsEnvelope): string | null {
  const withFreeSlots = slots.days.find((day) => availableCount(day) > 0);

  return withFreeSlots?.date ?? slots.days[0]?.date ?? null;
}

type Step = 1 | 2 | 3 | 4 | 5;

const STEP_HEADINGS: Record<Exclude<Step, 5>, string> = {
  1: "Выберите тип встречи",
  2: "Выберите день и время",
  3: "Укажите имя и почту",
  4: "Проверьте запись",
};

function SlotsSkeleton() {
  return (
    <div role="status" aria-label="Загрузка слотов" className="flex flex-col gap-3">
      <span className="sr-only">Загрузка слотов</span>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }, (_unused, index) => (
          <div key={index} className="h-16 animate-pulse rounded-lg bg-muted" aria-hidden />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {Array.from({ length: 8 }, (_unused, index) => (
          <div key={index} className="h-10 animate-pulse rounded-lg bg-muted" aria-hidden />
        ))}
      </div>
    </div>
  );
}

/**
 * The guest's linear booking wizard: type → day and time → name and email →
 * review. The server is the judge: its messages are shown verbatim, and a
 * conflict returns the guest to the time step with the guest data intact.
 */
export function BookingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [typesError, setTypesError] = useState<string | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotsEnvelope | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [timeMessage, setTimeMessage] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<GuestInputErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [booked, setBooked] = useState<Meeting | null>(null);

  useEffect(() => {
    let active = true;

    listMeetingTypes()
      .then((types) => {
        if (active) {
          setMeetingTypes(types);
          setLoadingTypes(false);
        }
      })
      .catch(() => {
        if (active) {
          setTypesError(REQUEST_ERROR_MESSAGE);
          setLoadingTypes(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // A late response from a previously selected type must not overwrite the
  // grid of the type the guest is looking at now.
  const loadRequest = useRef(0);

  const loadSlots = useCallback(async (meetingTypeId: string) => {
    const request = loadRequest.current + 1;

    loadRequest.current = request;
    setLoadingSlots(true);
    setSlotsError(null);

    try {
      const next = await listSlots(meetingTypeId);

      if (request !== loadRequest.current) {
        return;
      }

      setSlots(next);
      setSelectedDate((current) =>
        current !== null && next.days.some((day) => day.date === current)
          ? current
          : firstSelectableDate(next),
      );
    } catch {
      if (request === loadRequest.current) {
        setSlotsError(REQUEST_ERROR_MESSAGE);
      }
    } finally {
      if (request === loadRequest.current) {
        setLoadingSlots(false);
      }
    }
  }, []);

  const selectedType =
    meetingTypes.find((meetingType) => meetingType.id === selectedTypeId) ?? null;
  const selectedDay = slots?.days.find((day) => day.date === selectedDate) ?? null;
  const hasFreeSlots = slots?.days.some((day) => availableCount(day) > 0) ?? false;

  function selectType(meetingTypeId: string) {
    if (meetingTypeId === selectedTypeId) {
      return;
    }

    setSelectedTypeId(meetingTypeId);
    setSlots(null);
    setSelectedDate(null);
    setSelectedStart(null);
    setTimeMessage(null);
    void loadSlots(meetingTypeId);
  }

  function selectDay(date: string) {
    setSelectedDate(date);
    setSelectedStart(null);
    setTimeMessage(null);
  }

  function selectSlot(start: string) {
    setSelectedStart(start);
    setTimeMessage(null);
  }

  function goBack() {
    setTimeMessage(null);
    setSubmitError(null);
    setStep((current) => (current > 1 ? ((current - 1) as Step) : current));
  }

  function goNext() {
    setTimeMessage(null);
    setSubmitError(null);

    if (step === 1 && selectedTypeId !== null) {
      setStep(2);

      return;
    }

    if (step === 2 && selectedStart !== null) {
      setStep(3);

      return;
    }

    if (step === 3) {
      const errors = validateGuestInput(guestName, guestEmail);

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);

        return;
      }

      setFieldErrors({});
      setStep(4);
    }
  }

  async function submit() {
    if (pending || selectedTypeId === null || selectedStart === null) {
      return;
    }

    setPending(true);
    setSubmitError(null);

    try {
      const meeting = await createMeeting({
        meetingTypeId: selectedTypeId,
        start: selectedStart,
        guestName: normalizeGuestName(guestName),
        guestEmail: normalizeGuestEmail(guestEmail),
      });

      setBooked(meeting);
      setStep(5);
    } catch (error) {
      handleSubmitError(error);
    } finally {
      setPending(false);
    }
  }

  function handleSubmitError(error: unknown) {
    if (!(error instanceof ApiError)) {
      setSubmitError(REQUEST_ERROR_MESSAGE);

      return;
    }

    const startMessage = fieldMessage(error.fields, "start");

    // A taken slot and a start the server rejects are the same situation for
    // the guest: go back to the grid, refetch it and drop the stale choice.
    if (error.code === "slot_conflict" || startMessage !== null) {
      setTimeMessage(startMessage ?? error.message);
      setSelectedStart(null);
      setStep(2);

      if (selectedTypeId !== null) {
        void loadSlots(selectedTypeId);
      }

      return;
    }

    const nameMessage = fieldMessage(error.fields, "guestName");
    const emailMessage = fieldMessage(error.fields, "guestEmail");
    const nextErrors: GuestInputErrors = {};

    if (nameMessage !== null) {
      nextErrors.guestName = nameMessage;
    }
    if (emailMessage !== null) {
      nextErrors.guestEmail = emailMessage;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setStep(3);

      return;
    }

    setSubmitError(error.message);
  }

  function restart() {
    setStep(1);
    setSelectedTypeId(null);
    setSlots(null);
    setSelectedDate(null);
    setSelectedStart(null);
    setTimeMessage(null);
    setGuestName("");
    setGuestEmail("");
    setFieldErrors({});
    setSubmitError(null);
    setBooked(null);
  }

  if (step === 5 && booked !== null) {
    return (
      <section aria-label="Запись гостя" className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold tracking-tight">Вы записаны</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Встреча добавлена в календарь владельца
          </p>
          <dl className="mt-6 grid gap-3 text-sm">
            <div className="grid gap-0.5">
              <dt className="text-muted-foreground">Тип встречи</dt>
              <dd className="font-medium">{booked.meetingType.name}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-muted-foreground">Время</dt>
              <dd className="font-medium">
                {formatOwnerDayFromInstant(booked.start)}, {formatOwnerTime(booked.start)}
              </dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-muted-foreground">Имя</dt>
              <dd className="font-medium">{booked.guestName}</dd>
            </div>
            <div className="grid gap-0.5">
              <dt className="text-muted-foreground">Почта</dt>
              <dd className="font-medium">{booked.guestEmail}</dd>
            </div>
          </dl>
          <Button type="button" className="mt-6 w-full" onClick={restart}>
            Записаться ещё
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Запись гостя" className="mx-auto w-full max-w-xl">
      <div className="flex flex-col rounded-2xl border bg-card shadow-sm">
        <div className="flex flex-col gap-1 border-b px-5 py-4 sm:px-6">
          <span className="text-xs font-medium text-muted-foreground">Шаг {step} из 4</span>
          <h2 className="text-xl font-semibold tracking-tight">
            {STEP_HEADINGS[step as Exclude<Step, 5>]}
          </h2>
        </div>

        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6">
          {step === 1 && (
            <>
              {loadingTypes && <MeetingTypesSkeleton />}
              {typesError !== null && (
                <p role="alert" className="text-sm text-destructive">
                  {typesError}
                </p>
              )}
              {!loadingTypes && typesError === null && meetingTypes.length === 0 && (
                <p className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                  Типов встреч пока нет
                </p>
              )}
              {!loadingTypes && meetingTypes.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {meetingTypes.map((meetingType) => {
                    const selected = meetingType.id === selectedTypeId;

                    return (
                      <li key={meetingType.id}>
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectType(meetingType.id)}
                          className={`flex w-full flex-col gap-1 rounded-xl border px-4 py-3 text-left transition ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted/60"
                          }`}
                        >
                          <span className="flex items-baseline justify-between gap-3">
                            <span className="font-medium">{meetingType.name}</span>
                            <span className="shrink-0 text-sm text-muted-foreground">
                              {meetingType.durationMinutes} мин
                            </span>
                          </span>
                          {meetingType.description !== "" && (
                            <span className="text-sm text-muted-foreground">
                              {meetingType.description}
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {timeMessage !== null && (
                <p
                  role="alert"
                  className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  {timeMessage}
                </p>
              )}
              {loadingSlots && <SlotsSkeleton />}
              {slotsError !== null && (
                <p role="alert" className="text-sm text-destructive">
                  {slotsError}
                </p>
              )}
              {!loadingSlots && slots !== null && (
                <>
                  <div role="group" aria-label="Дни записи" className="grid grid-cols-7 gap-1">
                    {slots.days.map((day) => {
                      const selected = day.date === selectedDate;
                      const count = availableCount(day);

                      return (
                        <button
                          key={day.date}
                          type="button"
                          aria-pressed={selected}
                          aria-label={`${day.date}, свободных слотов: ${count}`}
                          onClick={() => selectDay(day.date)}
                          className={`flex flex-col items-center rounded-lg border px-1 py-2 text-center transition ${
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted/60"
                          } ${count === 0 ? "opacity-60" : ""}`}
                        >
                          <span className="text-[11px] capitalize text-muted-foreground">
                            {formatOwnerWeekday(day.date)}
                          </span>
                          <span className="text-sm font-medium">
                            {formatOwnerDayOfMonth(day.date)}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{count}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!hasFreeSlots && (
                    <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                      <p>В ближайшие 14 дней нет свободных слотов</p>
                      <p className="mt-1">Попробуйте выбрать формат покороче</p>
                    </div>
                  )}

                  {hasFreeSlots && selectedDay !== null && (
                    <div
                      role="group"
                      aria-label="Слоты дня"
                      className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4"
                    >
                      {selectedDay.slots.map((slot) => (
                        <button
                          key={slot.start}
                          type="button"
                          disabled={!slot.available}
                          aria-pressed={slot.start === selectedStart}
                          onClick={() => selectSlot(slot.start)}
                          className={`rounded-lg border px-1 py-2 text-sm transition disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground disabled:opacity-60 ${
                            slot.start === selectedStart
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "hover:bg-muted/60"
                          }`}
                        >
                          {formatOwnerTime(slot.start)}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {step === 3 && (
            <form
              className="flex flex-col gap-4"
              noValidate
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="grid gap-2">
                <label htmlFor="booking-guest-name" className="text-sm font-medium">
                  Имя
                </label>
                <input
                  id="booking-guest-name"
                  name="guestName"
                  type="text"
                  required
                  value={guestName}
                  aria-invalid={fieldErrors.guestName !== undefined}
                  aria-describedby={
                    fieldErrors.guestName === undefined ? undefined : "booking-guest-name-error"
                  }
                  onChange={(event) => {
                    setGuestName(event.target.value);
                    setFieldErrors((current) => ({ ...current, guestName: undefined }));
                  }}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
                />
                {fieldErrors.guestName !== undefined && (
                  <p id="booking-guest-name-error" className="text-sm text-destructive">
                    {fieldErrors.guestName}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="booking-guest-email" className="text-sm font-medium">
                  Почта
                </label>
                <input
                  id="booking-guest-email"
                  name="guestEmail"
                  type="email"
                  required
                  pattern={GUEST_EMAIL_PATTERN.source}
                  value={guestEmail}
                  aria-invalid={fieldErrors.guestEmail !== undefined}
                  aria-describedby={
                    fieldErrors.guestEmail === undefined ? undefined : "booking-guest-email-error"
                  }
                  onChange={(event) => {
                    setGuestEmail(event.target.value);
                    setFieldErrors((current) => ({ ...current, guestEmail: undefined }));
                  }}
                  className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-destructive"
                />
                {fieldErrors.guestEmail !== undefined && (
                  <p id="booking-guest-email-error" className="text-sm text-destructive">
                    {fieldErrors.guestEmail}
                  </p>
                )}
              </div>
            </form>
          )}

          {step === 4 &&
            selectedType !== null &&
            selectedDate !== null &&
            selectedStart !== null && (
              <>
                {submitError !== null && (
                  <p role="alert" className="text-sm text-destructive">
                    {submitError}
                  </p>
                )}
                <dl className="grid gap-3 text-sm">
                  <div className="grid gap-0.5">
                    <dt className="text-muted-foreground">Тип встречи</dt>
                    <dd className="font-medium">
                      {selectedType.name}, {selectedType.durationMinutes} мин
                    </dd>
                  </div>
                  <div className="grid gap-0.5">
                    <dt className="text-muted-foreground">Время</dt>
                    <dd className="font-medium">
                      {formatOwnerDateTime(selectedDate, selectedStart)}
                    </dd>
                  </div>
                  <div className="grid gap-0.5">
                    <dt className="text-muted-foreground">Имя</dt>
                    <dd className="font-medium">{normalizeGuestName(guestName)}</dd>
                  </div>
                  <div className="grid gap-0.5">
                    <dt className="text-muted-foreground">Почта</dt>
                    <dd className="font-medium">{normalizeGuestEmail(guestEmail)}</dd>
                  </div>
                </dl>
              </>
            )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-6">
          {step > 1 ? (
            <Button type="button" variant="outline" onClick={goBack} disabled={pending}>
              Назад
            </Button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <Button
              type="button"
              onClick={goNext}
              disabled={
                pending ||
                (step === 1 && selectedTypeId === null) ||
                (step === 2 && selectedStart === null)
              }
            >
              Далее
            </Button>
          ) : (
            <Button type="button" onClick={() => void submit()} disabled={pending}>
              Подтвердить запись
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
