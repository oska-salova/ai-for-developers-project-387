import { BookingWizard } from "@/components/booking-wizard";

export default function BookingPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Запись на встречу</h1>
        <p className="text-muted-foreground">
          Выберите формат, день и свободное время — запись займёт пару шагов
        </p>
      </header>
      <BookingWizard />
    </main>
  );
}
