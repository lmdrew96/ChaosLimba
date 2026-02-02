import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  allowedDevOrigins: [
    "*.replit.dev",
    "*.repl.co",
    "*.kirk.replit.dev",
  ],
};

export default nextConfig;
