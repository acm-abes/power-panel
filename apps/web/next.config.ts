/** @format */

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb", // 50MB
  },
};

export default nextConfig;
