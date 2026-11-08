const placeholders = ["first", "second", "third"];

/** The Suspense fallback while the upcoming meetings are fetched. */
export function MeetingsSkeleton() {
  return (
    <div role="status" aria-label="Загрузка встреч" className="flex flex-col gap-6">
      <span className="sr-only">Загрузка встреч</span>
      {placeholders.map((placeholder) => (
        <div key={placeholder} className="flex flex-col gap-2" aria-hidden>
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        </div>
      ))}
    </div>
  );
}
