import type { Meeting } from "@/lib/api";
import { formatOwnerDay, ownerDayKey } from "@/lib/owner-time";
import { MeetingDayGroup } from "./meeting-day-group";
import { MeetingsEmptyState } from "./meetings-empty-state";

interface MeetingDay {
  key: string;
  label: string;
  meetings: Meeting[];
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

/** Upcoming meetings grouped by the owner's days, days and starts ascending. */
export function MeetingsList({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) {
    return <MeetingsEmptyState />;
  }

  return (
    <div className="flex flex-col gap-6">
      {groupByOwnerDay(meetings).map((day) => (
        <MeetingDayGroup key={day.key} label={day.label} meetings={day.meetings} />
      ))}
    </div>
  );
}
