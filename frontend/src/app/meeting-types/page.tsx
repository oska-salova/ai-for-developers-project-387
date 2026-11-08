import { connection } from "next/server";
import { Suspense } from "react";
import { MeetingTypesForm } from "@/components/meeting-types-form";
import { MeetingTypesList } from "@/components/meeting-types-list";
import { MeetingTypesSkeleton } from "@/components/meeting-types-skeleton";
import { listMeetingTypes } from "@/lib/api";

async function MeetingTypesContent() {
  // Waits for the request before reading the current moment, so nothing is
  // prerendered or cached: every visit asks the API for the list as it is now.
  await connection();
  const meetingTypes = await listMeetingTypes();

  return <MeetingTypesList meetingTypes={meetingTypes} />;
}

export default function MeetingTypesPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Типы встреч</h1>
        <p className="text-muted-foreground">Форматы звонков, которые владелец предлагает гостям</p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <MeetingTypesForm />
        <Suspense fallback={<MeetingTypesSkeleton />}>
          <MeetingTypesContent />
        </Suspense>
      </div>
    </main>
  );
}
