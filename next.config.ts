import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude native Node.js modules from bundling (server-side only packages)
  serverExternalPackages: ["pdf.js-extract", "canvas"],
  // Empty turbopack config to acknowledge we're using Turbopack
  turbopack: {},
};

export default nextConfig;
