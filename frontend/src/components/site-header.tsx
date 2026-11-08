import Link from "next/link";

const navigation = [
  { href: "/meeting-types", label: "Типы встреч" },
  { href: "/meetings", label: "Встречи" },
  { href: "/booking", label: "Записаться" },
];

export function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Календарь
        </Link>
        <nav aria-label="Основная навигация">
          <ul className="flex flex-wrap items-center gap-4 text-sm">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
