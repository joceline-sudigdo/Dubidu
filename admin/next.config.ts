import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // jangan buat file AGENTS.md otomatis saat `next dev`
  agentRules: false,
  partialPrefetching: true,
  turbopack: {
    // folder admin punya lockfile sendiri, jangan pakai root repo aplikasi
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
