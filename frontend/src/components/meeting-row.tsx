import type { Meeting } from "@/lib/api";
import { formatOwnerTime, meetingEnd } from "@/lib/owner-time";

/** One meeting: its type, the guest, and the interval in the owner's zone. */
export function MeetingRow({ meeting }: { meeting: Meeting }) {
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
      <p className="shrink-0 text-sm font-medium tabular-nums sm:text-base">
        {start}–{end}
      </p>
    </li>
  );
}
