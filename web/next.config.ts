import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    // Rely exclusively on API_INTERNAL_BASE_URL (injected by Hostinger server.js proxy)
    // Fallback to 127.0.0.1 (not localhost) to avoid IPv6 issues inside Next.js node fetch
    return [{ source: '/api/v1/:path*', destination: `${process.env.API_INTERNAL_BASE_URL ?? 'http://127.0.0.1:3009/api/v1'}/:path*` }];
  },
  turbopack: {
    root: '..',
  },
};
export default nextConfig;
