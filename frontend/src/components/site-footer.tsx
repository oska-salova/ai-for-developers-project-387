export function SiteFooter() {
  // Pinned by `next.config.ts` at build time; a runtime `new Date()` is
  // rejected while prerendering with cacheComponents enabled.
  const year = process.env.NEXT_PUBLIC_BUILD_YEAR;

  return (
    <footer className="border-t">
      <p className="mx-auto w-full max-w-5xl px-6 py-4 text-sm text-muted-foreground">
        Календарь звонков, {year}
      </p>
    </footer>
  );
}
