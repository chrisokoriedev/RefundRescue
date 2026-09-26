import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:3001/auth/:path*",
      },
      {
        source: "/health",
        destination: "http://localhost:3001/health",
      },
    ];
  },
};

export default nextConfig;
