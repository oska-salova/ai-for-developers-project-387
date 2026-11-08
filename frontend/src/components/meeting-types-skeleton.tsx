const placeholders = ["first", "second", "third"];

export function MeetingTypesSkeleton() {
  return (
    <div role="status" aria-label="Загрузка типов встреч" className="flex flex-col gap-3">
      <span className="sr-only">Загрузка типов встреч</span>
      {placeholders.map((placeholder) => (
        <div key={placeholder} className="h-24 animate-pulse rounded-xl bg-muted" aria-hidden />
      ))}
    </div>
  );
}
