import type { NextConfig } from "next";

const isCapacitorBuild = process.env.CAPACITOR_BUILD === "true";

const nextConfig: NextConfig = {
  // Static export only for Capacitor; web production runs as a standalone Next.js server.
  ...(isCapacitorBuild
    ? {
        output: "export" as const,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        output: "standalone" as const,
      }),
};

export default nextConfig;
