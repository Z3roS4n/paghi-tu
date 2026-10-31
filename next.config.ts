import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  outputFileTracingIncludes: {
    "/api/agent": ["./agent/ingest/out/documenti.jsonl", "./agent/ingest/manifest.json"],
  },
  outputFileTracingExcludes: {
    "/api/agent": ["./agent/**/*.test.ts", "./agent/runtime/fixtures/**", "./agent/evals/**"],
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
