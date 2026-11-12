import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    // Trình khách (AI agent) gửi "Accept: text/markdown" thì trả bản Markdown của trang (route /md); trình duyệt thường vẫn nhận HTML.
    const wantsMarkdown = [{ type: 'header' as const, key: 'accept', value: '.*text/markdown.*' }];
    return {
      beforeFiles: [
        { source: '/', has: wantsMarkdown, destination: '/md' },
        { source: '/mua-ban/:path+', has: wantsMarkdown, destination: '/md/mua-ban/:path+' },
        { source: '/products/:id', has: wantsMarkdown, destination: '/md/products/:id' },
        { source: '/categories', has: wantsMarkdown, destination: '/md/categories' },
        { source: '/contact', has: wantsMarkdown, destination: '/md/contact' },
        // MCP Server Card nằm trong thư mục .well-known; dùng route thường rồi rewrite để tránh vấn đề với thư mục bắt đầu bằng dấu chấm.
        { source: '/.well-known/mcp/server-card.json', destination: '/mcp-server-card' },
      ],
      // Rely exclusively on API_INTERNAL_BASE_URL (injected by Hostinger server.js proxy)
      // Fallback to 127.0.0.1 (not localhost) to avoid IPv6 issues inside Next.js node fetch
      afterFiles: [{ source: '/api/v1/:path*', destination: `${process.env.API_INTERNAL_BASE_URL ?? 'http://127.0.0.1:3009/api/v1'}/:path*` }],
      fallback: [],
    };
  },
  // Cho phép tải video lên qua proxy /api/v1 (mặc định Next chỉ cho 10MB)
  experimental: { proxyClientMaxBodySize: '55mb' },
  turbopack: {
    root: '..',
  },
};
export default nextConfig;
