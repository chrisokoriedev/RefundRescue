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
        destination: "http://localhost:5000/api/:path*",
      },
      {
        source: "/auth/:path*",
        destination: "http://localhost:5000/auth/:path*",
      },
      {
        source: "/health",
        destination: "http://localhost:5000/health",
      },
    ];
  },
};

export default nextConfig;
