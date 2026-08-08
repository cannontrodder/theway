import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: import.meta.dirname },
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
