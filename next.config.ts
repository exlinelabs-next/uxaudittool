import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // @sparticuz/chromium resolves its Brotli binaries at runtime, so file tracing
  // misses them - without this the accessibility check has no browser on Vercel
  outputFileTracingIncludes: {
    '/api/audit': ['./node_modules/@sparticuz/chromium/bin/**/*'],
  },
};

export default nextConfig;
