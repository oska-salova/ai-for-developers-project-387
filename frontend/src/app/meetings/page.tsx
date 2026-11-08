import { connection } from "next/server";
import { Suspense } from "react";
import { MeetingsList } from "@/components/meetings-list";
import { MeetingsSkeleton } from "@/components/meetings-skeleton";
import { listMeetings } from "@/lib/api";

async function MeetingsContent() {
  // Waits for the request before asking the API, so the list is neither
  // prerendered nor cached: every visit shows the meetings still ahead.
  await connection();
  const meetings = await listMeetings();

  return <MeetingsList meetings={meetings} />;
}

export default function MeetingsPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Встречи</h1>
        <p className="text-muted-foreground">
          Предстоящие записи гостей — по дням в вашем часовом поясе
        </p>
      </header>
      <Suspense fallback={<MeetingsSkeleton />}>
        <MeetingsContent />
      </Suspense>
    </main>
  );
}
