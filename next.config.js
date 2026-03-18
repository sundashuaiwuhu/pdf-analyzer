/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages 配置
  output: 'standalone',
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // 允许从 CDN 加载 pdf.js worker
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
};

module.exports = nextConfig;
