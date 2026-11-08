/** Shown when the owner has no upcoming meetings at all. */
export function MeetingsEmptyState() {
  return (
    <div className="rounded-xl border border-dashed px-6 py-10 text-center">
      <p className="font-medium">Предстоящих встреч нет</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Записи появятся здесь, когда гость выберет время
      </p>
    </div>
  );
}
