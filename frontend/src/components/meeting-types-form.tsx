"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, createMeetingType } from "@/lib/api";

// The owner picks a duration from the whole 15…180 grid, 30 by default.
const DURATIONS = Array.from({ length: 12 }, (_, index) => (index + 1) * 15);

type KnownField = "name" | "description" | "durationMinutes";

const KNOWN_FIELDS: KnownField[] = ["name", "description", "durationMinutes"];

function isKnownField(field: string): field is KnownField {
  return (KNOWN_FIELDS as string[]).includes(field);
}

/**
 * The owner's create form. The server is the judge: its 400 field messages are
 * shown under the fields verbatim, and an unknown field becomes a form error.
 */
export function MeetingTypesForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [description, setDescription] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<KnownField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const durationRef = useRef<HTMLButtonElement>(null);

  function clearFieldError(field: KnownField) {
    setFieldErrors((previous) => {
      if (previous[field] === undefined) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];

      return next;
    });
  }

  function showError(error: ApiError) {
    const messages: Partial<Record<KnownField, string>> = {};
    let general: string | null = null;

    for (const { field, message } of error.fields) {
      if (isKnownField(field)) {
        messages[field] = message;
      } else {
        general = message;
      }
    }

    setFieldErrors(messages);
    setFormError(general ?? (Object.keys(messages).length === 0 ? error.message : null));

    const firstInvalid = error.fields.find(({ field }) => isKnownField(field));

    if (firstInvalid?.field === "name") {
      nameRef.current?.focus();
    } else if (firstInvalid?.field === "durationMinutes") {
      durationRef.current?.focus();
    } else if (firstInvalid?.field === "description") {
      descriptionRef.current?.focus();
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (pending) {
      return;
    }

    setPending(true);
    setFieldErrors({});
    setFormError(null);

    try {
      await createMeetingType({ name, description, durationMinutes: Number(duration) });
      toast.success("Тип встречи создан");
      setName("");
      setDescription("");
      setDuration("30");
      nameRef.current?.focus();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        showError(error);
      } else {
        setFormError("Не удалось сохранить тип встречи");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый тип встречи</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="meeting-type-name">Название</Label>
            <Input
              ref={nameRef}
              id="meeting-type-name"
              name="name"
              value={name}
              required
              maxLength={100}
              aria-invalid={fieldErrors.name !== undefined}
              aria-describedby={
                fieldErrors.name === undefined ? undefined : "meeting-type-name-error"
              }
              onChange={(event) => {
                setName(event.target.value);
                clearFieldError("name");
              }}
            />
            {fieldErrors.name !== undefined && (
              <p id="meeting-type-name-error" className="text-sm text-destructive">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meeting-type-duration">Длительность</Label>
            <Select
              value={duration}
              onValueChange={(value) => {
                setDuration(value);
                clearFieldError("durationMinutes");
              }}
            >
              <SelectTrigger
                ref={durationRef}
                id="meeting-type-duration"
                className="w-full"
                aria-invalid={fieldErrors.durationMinutes !== undefined}
                aria-describedby={
                  fieldErrors.durationMinutes === undefined
                    ? undefined
                    : "meeting-type-duration-error"
                }
              >
                <SelectValue placeholder="Выберите длительность" />
              </SelectTrigger>
              <SelectContent>
                {DURATIONS.map((minutes) => (
                  <SelectItem key={minutes} value={String(minutes)}>
                    {minutes} мин
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.durationMinutes !== undefined && (
              <p id="meeting-type-duration-error" className="text-sm text-destructive">
                {fieldErrors.durationMinutes}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="meeting-type-description">Описание (необязательно)</Label>
            <Textarea
              ref={descriptionRef}
              id="meeting-type-description"
              name="description"
              value={description}
              maxLength={500}
              aria-invalid={fieldErrors.description !== undefined}
              aria-describedby={
                fieldErrors.description === undefined ? undefined : "meeting-type-description-error"
              }
              onChange={(event) => {
                setDescription(event.target.value);
                clearFieldError("description");
              }}
            />
            {fieldErrors.description !== undefined && (
              <p id="meeting-type-description-error" className="text-sm text-destructive">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {formError !== null && (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          )}

          <Button type="submit" disabled={pending}>
            Создать тип встречи
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
