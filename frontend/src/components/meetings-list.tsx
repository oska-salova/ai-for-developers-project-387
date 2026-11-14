"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ApiError, deleteMeeting, type Meeting } from "@/lib/api";
import { formatOwnerDay, ownerDayKey } from "@/lib/owner-time";
import { MeetingDayGroup } from "./meeting-day-group";
import { MeetingsEmptyState } from "./meetings-empty-state";

interface MeetingDay {
  key: string;
  label: string;
  meetings: Meeting[];
}

interface MeetingsListProps {
  meetings: Meeting[];
  /** The server moment, so past meetings never offer a cancellation. */
  now: string;
}

function groupByOwnerDay(meetings: Meeting[]): MeetingDay[] {
  const byDay = new Map<string, Meeting[]>();

  for (const meeting of meetings) {
    const key = ownerDayKey(meeting.start);
    const dayMeetings = byDay.get(key);

    if (dayMeetings === undefined) {
      byDay.set(key, [meeting]);
    } else {
      dayMeetings.push(meeting);
    }
  }

  return [...byDay.entries()]
    .toSorted(([left], [right]) => left.localeCompare(right))
    .map(([key, dayMeetings]) => ({
      key,
      label: formatOwnerDay(dayMeetings[0].start),
      meetings: dayMeetings.toSorted(
        (left, right) => Date.parse(left.start) - Date.parse(right.start),
      ),
    }));
}

function isUpcoming(meeting: Meeting, now: string): boolean {
  return Date.parse(meeting.start) > Date.parse(now);
}

/** Upcoming meetings grouped by the owner's days, days and starts ascending. */
export function MeetingsList({ meetings, now }: MeetingsListProps) {
  const router = useRouter();
  const [cancelledIds, setCancelledIds] = useState<ReadonlySet<string>>(() => new Set());
  const [meetingToCancel, setMeetingToCancel] = useState<Meeting | null>(null);
  const [pending, setPending] = useState(false);

  const remaining = meetings.filter((meeting) => !cancelledIds.has(meeting.id));
  const cancelableIds = new Set(
    remaining.filter((meeting) => isUpcoming(meeting, now)).map((meeting) => meeting.id),
  );

  async function confirmCancel() {
    if (pending || meetingToCancel === null) {
      return;
    }

    const meeting = meetingToCancel;

    setPending(true);

    try {
      await deleteMeeting(meeting.id);
      setCancelledIds((previous) => new Set(previous).add(meeting.id));
      setMeetingToCancel(null);
      toast.success("Встреча отменена");
      router.refresh();
    } catch (error) {
      setMeetingToCancel(null);
      toast.error(error instanceof ApiError ? error.message : "Не удалось отменить встречу");
    } finally {
      setPending(false);
    }
  }

  if (remaining.length === 0) {
    return <MeetingsEmptyState />;
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {groupByOwnerDay(remaining).map((day) => (
          <MeetingDayGroup
            key={day.key}
            label={day.label}
            meetings={day.meetings}
            cancelableIds={cancelableIds}
            onCancel={setMeetingToCancel}
          />
        ))}
      </div>

      <AlertDialog
        open={meetingToCancel !== null}
        onOpenChange={(open) => {
          if (!open && !pending) {
            setMeetingToCancel(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить встречу?</AlertDialogTitle>
            <AlertDialogDescription>
              Время встречи снова станет свободным для записи.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Не отменять</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={(event) => {
                event.preventDefault();
                void confirmCancel();
              }}
            >
              Отменить встречу
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
