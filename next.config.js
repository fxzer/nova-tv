/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa'

const nextConfig = {
  output: 'standalone',
  eslint: {
    dirs: ['src'],
  },

  reactStrictMode: true,

  // 优化热更新
  experimental: {
    turbotrace: {
      logLevel: 'error',
    },
  },

  // 确保正确的重新构建
  swcMinify: true,

  // Uncoment to add domain whitelist
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find(rule =>
      rule.test?.test?.('.svg'),
    )

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: { not: /\.(css|scss|sass)$/ },
        resourceQuery: { not: /url/ }, // exclude if *.svg?url
        loader: '@svgr/webpack',
        options: {
          dimensions: false,
          titleProp: true,
        },
      },
    )

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i

    config.resolve.fallback = {
      ...config.resolve.fallback,
      net: false,
      tls: false,
      crypto: false,
    }

    return config
  },
}

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

export default pwaConfig(nextConfig)
