// next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'image.mux.com' },
    ],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
        ],
      },
    ];
  },

  // Rewrites for API proxy in dev (optional)
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [{ source: '/api/backend/:path*', destination: 'http://localhost:8000/api/v1/:path*' }]
      : [];
  },

  // Bundle analyzer (run: ANALYZE=true pnpm build)
  ...(process.env.ANALYZE === 'true' && {
    // @ts-ignore
    ...require('@next/bundle-analyzer')({ enabled: true })(),
  }),
};

export default withNextIntl(nextConfig);
