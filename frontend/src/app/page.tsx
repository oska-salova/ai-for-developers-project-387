import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
      <section className="flex max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Календарь звонков</h1>
        <p className="text-muted-foreground">
          Выберите тип встречи и запишитесь на свободное время в ближайшие две недели
        </p>
        <Button asChild size="lg">
          <Link href="/booking">Записаться</Link>
        </Button>
      </section>

      <section className="flex max-w-md flex-col gap-4">
        <h2 className="text-center text-xl font-semibold">Как это работает</h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Выберите тип встречи</li>
          <li>Выберите свободное время</li>
          <li>Укажите имя и почту и подтвердите запись</li>
        </ol>
      </section>
    </main>
  );
}
