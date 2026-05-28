import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production'

// Content-Security-Policy
// - 'self' для скриптов
// - 'unsafe-inline' для стилей (Tailwind) и inline scripts (Next.js hydration)
// - data: и blob: для картинок и Leaflet tiles
// - api.anthropic.com — SDK не используется client-side, но для безопасности оставим
// - tile.openstreetmap.org — Leaflet карты
// - https://lh3.googleusercontent.com — аватарки Google
const cspDirectives = [
  `default-src 'self'`,
  `script-src 'self' 'unsafe-inline' ${isProd ? '' : `'unsafe-eval'`}`.trim(),
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://*.tile.openstreetmap.org https://lh3.googleusercontent.com https://*.googleusercontent.com`,
  `font-src 'self' data:`,
  `connect-src 'self' https://*.tile.openstreetmap.org`,
  `frame-ancestors 'none'`,
  `form-action 'self' https://accounts.google.com`,
  `base-uri 'self'`,
  `object-src 'none'`,
  isProd ? `upgrade-insecure-requests` : '',
].filter(Boolean).join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: cspDirectives },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // X-XSS-Protection устарел (deprecated в современных браузерах), но не помешает legacy:
  { key: 'X-XSS-Protection', value: '0' },
]

const nextConfig: NextConfig = {
  // 'standalone' — для Docker (локалка). На Vercel игнорируется.
  output: process.env.BUILD_STANDALONE === '1' ? 'standalone' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
