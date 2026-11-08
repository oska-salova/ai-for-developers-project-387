# One image for the whole app: Next.js serves the UI and proxies `/api` and
# `/health` to the Express backend, so the container exposes a single port.
# The internal backend port (3001) is shared by `frontend/next.config.ts` and
# `docker-entrypoint.sh`; change it in both places.

FROM node:24.14.1-alpine AS base
RUN npm install --global pnpm@12.15.0
WORKDIR /app

# --- Backend: compile TypeScript with the repository tsconfig -----------------
FROM base AS backend-build
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY backend/tsconfig.json backend/tsconfig.build.json ./
COPY backend/src ./src
RUN pnpm build

# --- Backend runtime: only express and cors are needed ------------------------
FROM base AS backend-prod
WORKDIR /app/backend
COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=backend-build /app/backend/dist ./dist

# --- Frontend: Next.js standalone build ---------------------------------------
FROM base AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml frontend/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
# Same-origin by default: the browser calls /api on the page origin and Next
# proxies it. Override only when the API lives on a different public origin.
ARG NEXT_PUBLIC_API_URL=""
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm build

# --- Runtime ------------------------------------------------------------------
FROM node:24.14.1-alpine AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
RUN apk add --no-cache libc6-compat tini
WORKDIR /app/frontend
COPY --from=backend-prod /app/backend /app/backend
# `pnpm build` copies `public` and `.next/static` into the standalone folder.
COPY --from=frontend-build --chown=node:node /app/frontend/.next/standalone ./
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null "http://127.0.0.1:${PORT}/health" || exit 1
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/docker-entrypoint.sh"]
