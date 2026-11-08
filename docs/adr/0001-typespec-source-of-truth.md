# Контракт API описан на TypeSpec, сгенерированные артефакты коммитятся

Единственный источник истины для API — `contract/main.tsp`: из него одной командой
`mise run contract:build` генерируются OpenAPI 3.0.0, клиентский SDK и типы для бэкенда.
Сгенерированное лежит в репозитории, потому что обе стороны собираются и проверяются без
запуска генератора, а ревью диффа показывает изменение контракта; `mise run contract:check`
повторяет генерацию и падает на расхождении, включая новые файлы.

## Consequences

- Править `contract/openapi/**`, `frontend/src/lib/api/generated/**` и
  `backend/src/generated/**` руками нельзя: генерация перезапишет файлы, а `contract:check`
  упадёт.
- Порядок изменения: `main.tsp` → `mise run contract:build` → код бэкенда и фронтенда.
- Сгенерированное исключено из линтеров, форматтера, knip и покрытия, но проверяется `tsc`.

Источник: [#17](https://github.com/oska-salova/ai-for-developers-project-386/issues/17),
[`contract/README.md`](../../contract/README.md).
