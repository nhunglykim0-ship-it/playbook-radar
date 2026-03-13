/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // 生产环境优化
  poweredByHeader: false,
  compress: true,
  
  //  standalone 输出 - 减小 Docker 镜像体积
  output: 'standalone',
  
  // 图片优化（如需使用 Next.js Image 组件）
  images: {
    unoptimized: true, // 使用外部图片时禁用优化
  },
  
  // 环境变量
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
    API_KEY: process.env.API_KEY,
    API_BASE_URL: process.env.API_BASE_URL,
  },
  
  // 安全头
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
