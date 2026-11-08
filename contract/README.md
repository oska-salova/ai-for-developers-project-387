# Контракт API

Пакет с единственным источником истины для API «Календаря звонков» — TypeSpec. Из него
генерируются OpenAPI 3.0.0, клиентский TypeScript SDK и типы для бэкенда.

## Что здесь лежит

- `main.tsp` — модели и операции. Правки контракта начинаются и заканчиваются здесь.
- `tspconfig.yaml` — эмиттеры и их настройки. **Только он** решает, куда и что пишется.
- `pnpm-workspace.yaml` — настройки пакета для pnpm 12 (не workspace): обязательный
  override `@alloy-js/core`.
- `openapi/openapi.json` — сгенерировано, руками не править.

## Сгенерированные артефакты

| Путь                                 | Что это                                                                 |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `contract/openapi/openapi.json`      | OpenAPI 3.0.0 с запечатанными схемами (`seal-object-schemas: true`)     |
| `frontend/src/lib/api/generated/**`  | клиентский SDK (`@typespec/http-client-js`), `src/` и собранный `dist/` |
| `backend/src/generated/openapi.d.ts` | типы для Express-роутов (`openapi-typescript`)                          |

Все три пути закоммичены. `mise run contract:check` повторяет генерацию и падает, если
рабочее дерево разошлось с контрактом, — включая новые файлы:

```sh
git status --porcelain --untracked-files=all -- contract/openapi frontend/src/lib/api/generated backend/src/generated
```

## Как менять контракт

1. Правка в `main.tsp`.
2. `mise run contract:build` — один вызов `tsp compile` для OpenAPI и SDK, затем `tsc` по
   `generated/tsconfig.json` и `openapi-typescript` для типов бэкенда. Отдельный `tsc`
   нужен потому, что эмиттер пишет ESM-импорты с `.js`, а Turbopack не переписывает их в
   `.ts`; приложение импортирует собранный `generated/dist/`.
3. Только теперь код бэкенда и фронтенда: роуты Express пишутся по типам из
   `backend/src/generated/openapi.d.ts`, страницы — по клиенту из SDK.
4. `mise run check` (в нём `contract:check`) и коммит сгенерированного.

## Версии

Ставятся точно, без диапазонов:

- `@typespec/compiler`, `@typespec/http`, `@typespec/openapi`, `@typespec/openapi3` — 1.17.0;
- `@typespec/http-client-js` — 0.16.3;
- peer-набор `openapi3`: `@typespec/json-schema` 1.17.0, `@typespec/rest`/`versioning`/`events`/`sse`/`streams` 0.87.0;
- `openapi-typescript` 7.13.0.

Обязательный override в `pnpm-workspace.yaml`:

```yaml
overrides:
  "@alloy-js/core": 0.25.0
  "@alloy-js/typescript": 0.25.0
```

Без него компилятор падает с `Multiple versions of Alloy are loaded for this project`:
`@typespec/http-client-js` требует `@alloy-js/core ^0.25.0`, а его `emitter-framework` — 0.24.1,
и Alloy отказывается работать при двух копиях в рантайме. Это не косметика — SDK-эмиттер
не запускается вовсе.

## Решение по серверному генератору

Дата: 2026-11-01. Выбран вариант **C (fallback из спецификации #17)**: серверные роуты
пишутся руками по типам из OpenAPI, `@typespec/http-server-js` не подключается.

Спайк `@typespec/http-server-js@0.58.0-alpha.29` на Express 5.3.0 + ESM + `tsc` показал:

- экспресс-роутер и рамку ошибок (`onRequestNotFound`, `onInvalidRequest`, `onInternalError`)
  удержать можно, статусы из `@statusCode`-моделей работают;
- но `express.json()` перед роутером **вешает запрос навсегда**: генератор сам читает поток
  тела, и промис разбора не резолвится; лимита размера тела у него нет (DoS-поверхность);
- битый JSON **роняет процесс**: после ответа из `onInvalidRequest` промис реджектится,
  `onInternalError` пытается писать в уже отправленный ответ (`ERR_HTTP_HEADERS_SENT`);
- чтобы сгенерированный код проходил `tsc`, нужно выключить `verbatimModuleSyntax`
  и `noUncheckedIndexedAccess` — регресс строгости всего рукописного бэкенда;
- структурной валидации полей в генераторе **нет вообще**, поэтому нормализация, порядок
  проверок и тексты ошибок остаются нашим кодом при любом варианте.

Выигрыш варианта A — только роутинг, чтение тела и сериализация (около 200 строк на пять
маршрутов). Цена — alpha-зависимость, два ослабленных флага `tsconfig` и три обхода выше.
Для первого среза это не оправдано. Расхождение тел и кодов ловит contract compliance
(`backend/src/app.contract.test.ts`), дрейф артефактов — `contract:check`.

Триггер передумать: если ручного роутинга станет заметно больше пяти маршрутов, вернуться
к A и осознанно принять оба ослабления `tsconfig` (с записью в `AGENTS.md` и датой пересмотра).
