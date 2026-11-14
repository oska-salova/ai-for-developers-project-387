import { Button } from "@/components/ui/button";
import type { Meeting } from "@/lib/api";
import { formatOwnerTime, meetingEnd } from "@/lib/owner-time";

interface MeetingRowProps {
  meeting: Meeting;
  /** Rendered as the cancel action; omitted for meetings that cannot be cancelled. */
  onCancel?: () => void;
}

/** One meeting: its type, the guest, and the interval in the owner's zone. */
export function MeetingRow({ meeting, onCancel }: MeetingRowProps) {
  const { name, durationMinutes } = meeting.meetingType;
  const start = formatOwnerTime(meeting.start);
  const end = formatOwnerTime(meetingEnd(meeting.start, durationMinutes).toISOString());

  return (
    <li className="flex flex-col gap-1 border-t py-3 first:border-t-0 first:pt-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">{meeting.guestName}</p>
        <a
          className="w-fit text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          href={`mailto:${meeting.guestEmail}`}
        >
          {meeting.guestEmail}
        </a>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
        <p className="text-sm font-medium tabular-nums sm:text-base">
          {start}–{end}
        </p>
        {onCancel !== undefined && (
          <Button variant="destructive" size="sm" onClick={onCancel}>
            Отменить
          </Button>
        )}
      </div>
    </li>
  );
}
