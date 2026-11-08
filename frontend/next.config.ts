import type { NextConfig } from "next";

// `cacheComponents` rejects `new Date()` while prerendering, so the year in the
// footer is pinned when the config is loaded (build time) instead of at render.
const buildYear = new Date().getFullYear();

// The Express API runs next to the Next.js server inside the Docker image.
// These rewrites let the browser use the page origin for API calls: only `PORT`
// is exposed, and `/api` plus `/health` are proxied to the internal backend.
const INTERNAL_API_URL = "http://127.0.0.1:3001";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  output: "standalone",
  env: {
    NEXT_PUBLIC_BUILD_YEAR: String(buildYear),
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${INTERNAL_API_URL}/api/:path*` },
      { source: "/health", destination: `${INTERNAL_API_URL}/health` },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
