import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: '/api/v1/:path*', destination: `${process.env.API_INTERNAL_BASE_URL ?? 'http://localhost:3000/api/v1'}/:path*` }];
  },
  turbopack: {
    root: '..',
  },
};
export default nextConfig;
