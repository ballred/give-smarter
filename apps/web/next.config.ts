import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@give-smarter/core",
    "@give-smarter/db",
    "@give-smarter/ui",
    "@give-smarter/workflows",
  ],
};

export default nextConfig;
