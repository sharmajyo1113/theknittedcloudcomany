import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app lives inside the larger theknittedcloudcompany repo (which has its
  // own top-level package-lock.json from the old Express app) — pin the
  // Turbopack root here so it doesn't try to infer the wrong workspace root.
  turbopack: {
    root: __dirname,
  },
  // Lean, self-contained server build for the Cloud Run container.
  output: "standalone",
};

export default nextConfig;
