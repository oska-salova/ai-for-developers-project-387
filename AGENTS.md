# Правила для AI-агентов

## Проект

Сервис бронирования «Календарь звонков»: `backend/` — Express 5 + TypeScript (ESM), `frontend/` — Next.js 16 (App Router) + Tailwind 4 + shadcn/ui. Данные хранятся в памяти процесса, БД нет.

Три независимых пакета (`backend`, `frontend`, `contract`): корневого `package.json` и общего pnpm-workspace нет, у каждого свой lockfile, команды — с `--dir <пакет>`. `backend/pnpm-workspace.yaml` и `contract/pnpm-workspace.yaml` — не workspace, а место, где pnpm 12 читает настройки пакета.

Порты: фронтенд 3000, бэкенд 3001 (`PORT`). CORS разрешает только `http://localhost:3000`; переопределяется `CORS_ORIGIN`.

## Команды

- `mise install`, затем `mise run setup` — инструменты, зависимости и git-хуки `hk`.
- Пакетные скрипты работают только внутри mise: `mise exec -- pnpm --dir backend lint`. Прямой `pnpm lint` даст `command not found`.
- `mise run check` — быстрый гейт перед завершением работы; `mise run verify` — он же плюс Playwright, эту команду запускает джоба Verify в CI.
- `mise run security` — медленная проверка уязвимостей и истории; запускайте её после изменения зависимостей, `check` их не сканирует.
- `mise run e2e` в `check` не входит. Перед первым локальным запуском: `mise exec -- pnpm --dir frontend exec playwright install chromium`.
- Точечно, без полного прогона: `mise exec -- pnpm --dir backend test src/app.test.ts`, `mise exec -- pnpm --dir frontend test -- -t "часть названия"`, `mise exec -- hk run pre-push --all`.
- Хуки: pre-commit — быстрые шаги по изменённым файлам, pre-push — весь набор. Обход `--no-verify` бесполезен: CI запускает `mise run check`.
- Docker: `docker build -t call-calendar .`, затем `docker run --rm -e PORT=8080 -p 8080:8080 call-calendar`; остальное — в README.

## Устройство и ловушки

- Бэкенд — ESM + `moduleResolution: nodenext`: в относительных импортах обязательны `.js` (`import { createApp } from './app.js'`), это нужно собранному `dist/`.
- `backend/src/app.ts` экспортирует `createApp({ store, now })` (middleware + роуты), `backend/src/index.ts` создаёт хранилище, сеет в него тип встречи «Знакомство» и подключает системные часы. Новые роуты — в `app.ts` и в TypeSpec.
- Порт 3001 зашит в `frontend/next.config.ts` (rewrites `/api` и `/health`), `docker-entrypoint.sh` и `DEFAULT_SERVER_API_URL` в `frontend/src/lib/api.ts` — меняйте его в этих местах вместе.
- Тёмная тема — класс `.dark` на `<html>` (shadcn), а не `prefers-color-scheme`.
- Включён `cacheComponents`: `new Date()`, `Math.random()` и `crypto.randomUUID()` в серверных компонентах ломают пререндер при `next build`. Время фиксируйте через `env` в `next.config.ts` (пример — `NEXT_PUBLIC_BUILD_YEAR`) или рендерите участок по запросу в `<Suspense>` с `await connection()`.

## Контракт и генерация

- Источник истины — TypeSpec `contract/main.tsp`; руками правится только `.tsp`.
- Сгенерированное: `contract/openapi/**`, `frontend/src/lib/api/generated/**` (включая `dist/`), `backend/src/generated/**`. Правка руками запрещена: генерация перезапишет файлы, а `contract:check` упадёт.
- Порядок: `main.tsp` → `mise run contract:build` → код бэкенда и фронтенда. `contract:check` ловит дрейф, включая новые файлы.
- Роуты Express 5 пишутся руками по типам из `backend/src/generated/openapi.d.ts`: серверный генератор TypeSpec не подключён (причина — `contract/README.md`).
- Сгенерированное исключено из линтеров и покрытия, но проверяется `tsc`.
- Все запросы к API — через сгенерированный SDK; прямые HTTP-вызовы ловит `mise run sdk:check`. `frontend/src/lib/api.ts` — единственное место с базовым URL (`NEXT_PUBLIC_API_URL`, дефолт `http://localhost:3001`) и маппингом ошибок в `ApiError`.

## Тесты

- Бэкенд: HTTP-контракт через supertest и `createApp` с фиксированными часами и свежим хранилищем; `backend/src/app.contract.test.ts` валидирует реальные ответы (код и тело) по `contract/openapi/openapi.json`.
- Фронтенд: тесты рядом с кодом; маршрутные тесты, проверяющие несколько страниц сразу, — в `src/app/`.
- E2E: `frontend/e2e` (`*.spec.ts`), только Chromium, против production-сборки и бэкенда `dev` на 3001; спеки исключены из Vitest.

## Линтеры и форматтер

- Запускает `hk` (`hk.pkl`): бэкенд — oxlint, фронтенд — ESLint, форматирование — oxfmt для обоих.
- Сгенерированное, `.github/workflows/hexlet-check.yml` и `pnpm-lock.yaml` исключены намеренно — не «исправляйте» это.
- Не отключайте правило, чтобы протолкнуть изменение. Исключение — только узкое (путь + правило), с причиной и датой пересмотра, например `.github/jactionlint.yaml`.

## Зависимости

- Версии фиксируются точно, без `^`: `mise exec -- pnpm --dir <пакет> add -E <пакет>`.
- `save-exact=true` в `.npmrc` pnpm 12 игнорирует; настройки пакета (`overrides`, `onlyBuiltDependencies`) читаются только из `pnpm-workspace.yaml`.

## UI-компоненты

- `frontend/src/components/ui/*` — вендорный shadcn/ui: добавляйте через `mise exec -- pnpm dlx shadcn@latest add <component>`, правьте руками осознанно.
- Пакет `shadcn` в зависимости не добавляйте: он тянет `deepmerge@4.3.1` с advisory, и osv-scanner валит `security`. Нужные варианты добавляйте локально.

## Agent skills

- `.agents/skills/*` — вендорные скиллы, руками не правим: обновление перезапишет файлы. `.agents/` исключён из oxfmt и typos как чужой текст.
- Если в комментарии `/oc` или `/opencode` назван скилл из `.agents/skills` («запусти скил to-spec», «по скиллу triage»), загрузи его через инструмент `skill` по точному ID и следуй его процессу. Пользователю не нужно писать `skill tool (id: ...)`. ID совпадают с именами: `triage`, `to-spec`, `to-tickets`.
- В CI не используй `/tmp` и пути вне репозитория: политика `external_directory` стоит в `ask`, подтверждать её некому, и запуск зависает. Временные файлы создавай в `.scratch/` внутри репозитория и удаляй после.
- Трекер задач — GitHub Issues `oska-salova/ai-for-developers-project-387` через `gh`: `docs/agents/issue-tracker.md`; метки триажа — `docs/agents/triage-labels.md`; доменные доки (`GLOSSARY.md`, `docs/adr/`) — `docs/agents/domain.md`.

## Не трогать

- `.github/workflows/hexlet-check.yml` — генерируется Хекслетом («DO NOT DELETE OR EDIT»); переименование репозитория тоже ломает проверку.
- `frontend/AGENTS.md` создаётся `next dev` и перезаписывается при каждом запуске; `frontend/next-env.d.ts` генерируется Next.js.
- Артефакты `frontend/.next/`, `frontend/coverage/`, `backend/dist/`, `node_modules/` не редактировать и не коммитить.

## Коммиты

- Conventional Commits обязательны: commit-msg хук `hk` и шаг «Lint pull request title» в CI. Заголовок PR — тоже Conventional Commits: при squash-merge он становится коммитом в `main`, а release-please читает именно его.
- Коммит реализации ссылается на тикет: `feat: запись на свободный слот (#12)`. Номер нужен для истории; issue закрывает трекер, механической проверки нет. Релизные коммиты release-please и dependabot — без ссылки.
