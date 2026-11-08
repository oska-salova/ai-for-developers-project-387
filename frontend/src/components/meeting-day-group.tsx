import type { Meeting } from "@/lib/api";
import { MeetingRow } from "./meeting-row";

/** One owner day: a dated heading and the meetings booked inside it. */
export function MeetingDayGroup({ label, meetings }: { label: string; meetings: Meeting[] }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
      <ul className="flex flex-col">
        {meetings.map((meeting) => (
          <MeetingRow key={meeting.id} meeting={meeting} />
        ))}
      </ul>
    </section>
  );
}
