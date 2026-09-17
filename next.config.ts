import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // @sparticuz/chromium (Brotli binaries) and @axe-core/puppeteer (axe-core source)
  // resolve files at runtime, so file tracing misses them - without these the
  // accessibility check fails on Vercel
  outputFileTracingIncludes: {
    '/api/audit': [
      './node_modules/@sparticuz/chromium/bin/**/*',
      './node_modules/axe-core/package.json',
      './node_modules/axe-core/axe.js',
      './node_modules/axe-core/axe.min.js',
    ],
  },
};

export default nextConfig;
